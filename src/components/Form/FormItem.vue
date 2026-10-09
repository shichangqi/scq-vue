<template>
  <div class="scq-form-item" :class="{ 'is-error': displayedError, 'is-required': isRequired, 'is-validating': validating }" @focusout="validate('blur')">
    <label v-if="label || $slots.label" class="scq-form-item__label" :for="forId || undefined">
      <span v-if="isRequired" class="scq-form-item__required" aria-hidden="true">*</span>
      <slot name="label">{{ label }}</slot>
    </label>
    <div class="scq-form-item__content" :aria-busy="validating || undefined">
      <slot :error="displayedError" :validate="validate" />
      <div v-if="displayedError && showMessage" class="scq-form-item__error" role="alert">
        <slot name="error" :error="displayedError">{{ displayedError }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Schema from 'async-validator'
import { cloneFieldValue, formKey, getFieldValue, setFieldValue, type FormField, type FormRule, type FormTrigger } from './context'

defineOptions({ name: 'FormItem' })

const props = withDefaults(defineProps<{
  prop?: string
  label?: string
  forId?: string
  rules?: FormRule | FormRule[]
  required?: boolean
  error?: string
  showMessage?: boolean
}>(), { prop: '', label: '', forId: '', required: false, error: '', showMessage: true })

const form = inject(formKey, null)
const errorMessage = ref('')
const validating = ref(false)
const displayedError = computed(() => props.error || errorMessage.value)
const fieldValue = computed(() => form && props.prop ? getFieldValue(form.model.value, props.prop) : undefined)
const fieldRules = computed(() => {
  const source = props.rules ?? form?.rules.value[props.prop] ?? []
  const rules = Array.isArray(source) ? [...source] : [source]
  if (props.required && !rules.some((rule) => rule.required)) rules.unshift({ required: true })
  return rules
})
const isRequired = computed(() => fieldRules.value.some((rule) => rule.required))
let initialValue: unknown
let validationSequence = 0
let resetting = false

const validate = async (trigger?: FormTrigger): Promise<boolean> => {
  if (!form || !props.prop) return true
  const rules = fieldRules.value.filter((rule) => !trigger || !rule.trigger || [rule.trigger].flat().includes(trigger))
  if (!rules.length) return true
  const sequence = ++validationSequence
  validating.value = true
  try {
    await new Schema({ [props.prop]: rules }).validate({ [props.prop]: fieldValue.value }, { firstFields: true })
    if (sequence === validationSequence) errorMessage.value = ''
    return true
  } catch (error) {
    if (sequence === validationSequence) {
      const failure = error as { errors?: { message?: string }[]; message?: string }
      errorMessage.value = failure.errors?.[0]?.message || failure.message || 'Validation failed'
    }
    return false
  } finally {
    if (sequence === validationSequence) validating.value = false
  }
}

const clearValidate = () => {
  validationSequence += 1
  errorMessage.value = ''
  validating.value = false
}

const resetField = async () => {
  resetting = true
  clearValidate()
  if (form && props.prop) setFieldValue(form.model.value, props.prop, cloneFieldValue(initialValue))
  await nextTick()
  resetting = false
}

const field: FormField = { get prop() { return props.prop }, validate, clearValidate, resetField }
onMounted(() => {
  initialValue = cloneFieldValue(fieldValue.value)
  form?.addField(field)
})
onBeforeUnmount(() => {
  clearValidate()
  form?.removeField(field)
})
watch(fieldValue, () => {
  if (!resetting) {
    validationSequence += 1
    validating.value = false
    void validate('change')
  }
}, { deep: true })
watch(() => props.prop, () => {
  initialValue = cloneFieldValue(fieldValue.value)
  clearValidate()
})

defineExpose({ validate, clearValidate, resetField })
</script>