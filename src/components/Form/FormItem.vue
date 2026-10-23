<template>
  <div :id="fieldId" ref="root" class="scq-form-item" :class="{ 'is-error': displayedError, 'is-required': isRequired, 'is-validating': validating, 'is-dirty': dirty, 'is-touched': touched }" @focusout="touch">
    <label v-if="label || $slots.label" :id="labelId" class="scq-form-item__label" :for="targetId" @click="focus()">
      <span v-if="isRequired" class="scq-form-item__required" aria-hidden="true">*</span>
      <slot name="label">{{ label }}</slot>
    </label>
    <div class="scq-form-item__content" :aria-busy="validating || undefined">
      <slot :error="displayedError" :validate="validate" :state="fieldState" :control-attrs="controlAttrs" :focus="focus" />
      <div v-if="help || $slots.help" :id="helpId" class="scq-form-item__help"><slot name="help">{{ help }}</slot></div>
      <div v-if="displayedError && showMessage" :id="errorId" class="scq-form-item__error" role="alert">
        <slot name="error" :error="displayedError">{{ displayedError }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowReactive, shallowRef, useSlots, watch } from 'vue'
import Schema from 'async-validator'
import { useLocale } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'
import { cloneFieldValue, equalFieldValue, formItemKey, formKey, getFieldValue, setFieldValue, type FormControl, type FormField, type FormFieldState, type FormRule, type FormTrigger } from './context'
import { focusFirstControl } from './useFormControl'

defineOptions({ name: 'FormItem' })
const props = withDefaults(defineProps<{
  prop?: string
  label?: string
  forId?: string
  id?: string
  rules?: FormRule | FormRule[]
  required?: boolean
  error?: string
  showMessage?: boolean
  help?: string
  dependencies?: string[]
  validateDebounce?: number
}>(), { prop: '', label: '', forId: '', required: false, error: '', showMessage: true, help: '', dependencies: () => [], validateDebounce: 0 })
const form = inject(formKey, null)
const text = useLocale()
const slots = useSlots()
const root = ref<HTMLElement>()
const controls = shallowReactive<FormControl[]>([])
const generatedId = useComponentId('scq-form-item')
const fieldId = computed(() => props.id || generatedId)
const labelId = computed(() => props.label || slots.label ? `${fieldId.value}-label` : undefined)
const errorId = computed(() => `${fieldId.value}-error`)
const helpId = computed(() => `${fieldId.value}-help`)
const errorMessage = ref('')
const validating = ref(false)
const touched = ref(false)
const displayedError = computed(() => props.error || errorMessage.value)
const fieldValue = computed(() => form && props.prop ? getFieldValue(form.model.value, props.prop) : undefined)
const initialValue = shallowRef(cloneFieldValue(fieldValue.value))
const dirty = computed(() => !equalFieldValue(fieldValue.value, initialValue.value))
const fieldRules = computed(() => {
  const source = props.rules ?? form?.rules.value[props.prop] ?? []
  const rules = Array.isArray(source) ? [...source] : [source]
  if (props.required && !rules.some((rule) => rule.required)) rules.unshift({ required: true })
  return rules
})
const isRequired = computed(() => fieldRules.value.some((rule) => rule.required))
const descriptionId = computed(() => [props.help || slots.help ? helpId.value : '', props.showMessage && displayedError.value ? errorId.value : ''].filter(Boolean).join(' ') || undefined)
const nativeId = ref<string>()
const targetId = computed(() => props.forId || controls[0]?.id() || nativeId.value || `${fieldId.value}-control-1`)
const controlAttrs = computed(() => ({ id: targetId.value, 'aria-labelledby': labelId.value, 'aria-describedby': descriptionId.value, 'aria-invalid': !!displayedError.value || undefined, 'aria-required': isRequired.value || undefined, 'aria-busy': validating.value || undefined, disabled: form?.disabled.value || undefined }))
const fieldState = computed<FormFieldState>(() => ({ prop: props.prop, label: props.label || props.prop, id: targetId.value, dirty: dirty.value, touched: touched.value, pending: validating.value, error: displayedError.value }))
let validationSequence = 0
let blurSequence = 0
let controlSequence = 0
let resetting = false
let disposed = false
let timer: ReturnType<typeof setTimeout> | undefined
let observer: MutationObserver | undefined

const validate = async (trigger?: FormTrigger): Promise<boolean> => {
  if (disposed) return true
  if (!form || !props.prop) return !props.error
  blurSequence += 1
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
  if (trigger === 'blur') touched.value = true
  const rules = fieldRules.value.filter((rule) => !trigger || !rule.trigger || [rule.trigger].flat().includes(trigger))
  if (!rules.length) return !props.error
  const sequence = ++validationSequence
  validating.value = true
  try {
    await new Schema({ [props.prop]: rules }).validate({ ...form.model.value, [props.prop]: fieldValue.value }, { firstFields: true })
    if (sequence === validationSequence) errorMessage.value = ''
    return !disposed && sequence === validationSequence && !props.error
  } catch (error) {
    if (sequence === validationSequence) {
      const failure = error && typeof error === 'object' ? error as { errors?: { message?: string }[]; message?: string } : undefined
      errorMessage.value = failure?.errors?.[0]?.message || failure?.message || (typeof error === 'string' ? error : text('validationFailed'))
    }
    return false
  } finally {
    if (sequence === validationSequence) validating.value = false
  }
}
const invalidate = () => {
  validationSequence += 1
  blurSequence += 1
  validating.value = false
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}
const clearValidate = () => { invalidate(); errorMessage.value = '' }
const scheduleValidation = () => {
  if (resetting || disposed) return
  invalidate()
  errorMessage.value = ''
  if (props.validateDebounce > 0) timer = setTimeout(() => { timer = undefined; void validate('change') }, props.validateDebounce)
  else void validate('change')
}
const resetField = async () => {
  resetting = true
  clearValidate()
  touched.value = false
  if (form && props.prop) setFieldValue(form.model.value, props.prop, cloneFieldValue(initialValue.value))
  await nextTick()
  resetting = false
}
const nativeControl = () => (props.forId ? root.value?.ownerDocument.getElementById(props.forId) : undefined)
  ?? root.value?.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="file"]), textarea, select, [role="combobox"], [role="slider"], [role="radiogroup"], [role="group"]') ?? undefined
const focus = (settings?: FocusOptions) => {
  const preferred = controls.find((control) => props.forId && control.id() === props.forId)
  if (preferred?.focus(settings)) return true
  for (const control of controls) if (control !== preferred && control.focus(settings)) return true
  if (controls.length) return false
  const target = nativeControl()
  if (!target || target.matches(':disabled')) return false
  const previous = target.ownerDocument.activeElement
  target.focus(settings)
  if (target === target.ownerDocument.activeElement || target.contains(target.ownerDocument.activeElement)) return true
  return target.ownerDocument.activeElement === previous && focusFirstControl(target, settings)
}
const touch = (event?: FocusEvent) => {
  const next = event?.relatedTarget
  if (next instanceof Node && (root.value?.contains(next) || controls.some((control) => control.contains?.(next) || control.element()?.contains(next)))) return
  touched.value = true
  const current = ++blurSequence
  queueMicrotask(() => { if (current === blurSequence && !disposed) void validate('blur') })
}
provide(formItemKey, {
  labelId, descriptionId, invalid: computed(() => !!displayedError.value), required: isRequired,
  pending: computed(() => validating.value), disabled: computed(() => !!form?.disabled.value),
  createControlId: () => {
    const index = ++controlSequence
    return computed(() => index === 1 && props.forId ? props.forId : `${fieldId.value}-control-${index}`)
  },
  addControl: (control) => controls.push(control),
  removeControl: (control) => { const index = controls.indexOf(control); if (index >= 0) controls.splice(index, 1) },
  touch,
})

let fallback: HTMLElement | undefined
let assignedId: string | undefined
const original = new Map<string, string | null>()
const restoreNative = () => {
  if (fallback) for (const [name, value] of original) {
    if (value === null) fallback.removeAttribute(name)
    else fallback.setAttribute(name, value)
  }
  fallback = undefined
  nativeId.value = undefined
  assignedId = undefined
  original.clear()
}
const syncNative = () => {
  if (controls.length) { if (fallback) restoreNative(); return }
  const element = nativeControl()
  if (element !== fallback) {
    restoreNative()
    fallback = element
    if (element) for (const name of ['id', 'aria-labelledby', 'aria-describedby', 'aria-invalid', 'aria-required', 'aria-busy']) original.set(name, element.getAttribute(name))
  }
  if (!element) return
  if (element.id && element.id !== assignedId) { original.set('id', element.id); nativeId.value = element.id }
  const values = {
    ...controlAttrs.value,
    id: original.get('id') || targetId.value,
    'aria-labelledby': original.get('aria-labelledby') || (element.getAttribute('aria-label') ? undefined : labelId.value),
    disabled: undefined,
  }
  for (const [name, value] of Object.entries(values)) {
    if (name === 'disabled') continue
    const previous = original.get(name)
    const merged = name === 'aria-describedby' ? [...new Set(`${previous ?? ''} ${value ?? ''}`.trim().split(/\s+/).filter(Boolean))].join(' ') : value ?? previous
    if (merged === undefined || merged === null || merged === '') { if (element.hasAttribute(name)) element.removeAttribute(name) }
    else if (element.getAttribute(name) !== String(merged)) {
      if (name === 'id') assignedId = String(merged)
      element.setAttribute(name, String(merged))
    }
  }
}
const field: FormField = {
  get prop() { return props.prop }, validate, clearValidate, resetField,
  getState: () => fieldState.value, focus,
  scrollIntoView: (options) => (controls[0]?.element() ?? root.value)?.scrollIntoView?.(options),
  touch: () => { touched.value = true },
}
onMounted(() => {
  initialValue.value = cloneFieldValue(fieldValue.value)
  form?.addField(field)
  syncNative()
  if (typeof MutationObserver !== 'undefined' && root.value) {
    observer = new MutationObserver(syncNative)
    observer.observe(root.value, { childList: true, subtree: true, attributes: true, attributeFilter: ['id'] })
  }
})
onBeforeUnmount(() => { disposed = true; clearValidate(); observer?.disconnect(); restoreNative(); form?.removeField(field) })
watch(() => props.prop, () => { initialValue.value = cloneFieldValue(fieldValue.value); touched.value = false; clearValidate() }, { flush: 'sync' })
watch(fieldValue, scheduleValidation, { deep: true })
const dependencyState = () => ({ paths: props.dependencies, values: props.dependencies.map((path) => form ? getFieldValue(form.model.value, path) : undefined) })
let dependencySnapshot = cloneFieldValue(dependencyState())
watch(dependencyState, (value) => {
  if (equalFieldValue(value, dependencySnapshot)) return
  dependencySnapshot = cloneFieldValue(value)
  scheduleValidation()
}, { deep: true })
watch([controlAttrs, () => controls.length], syncNative, { flush: 'post' })
watch(() => props.validateDebounce, (value) => {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('[scq-vue] validateDebounce must be a non-negative finite number.')
}, { immediate: true })
defineExpose({ validate, clearValidate, resetField, focus, state: fieldState })
</script>
