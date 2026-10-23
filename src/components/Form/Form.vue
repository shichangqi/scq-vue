<template>
  <form class="scq-form" :class="[`scq-form--${labelPosition}`, { 'is-inline': inline, 'is-disabled': disabled }]" :style="formStyle" novalidate @submit.prevent="handleSubmit">
    <div v-if="(showErrorSummary || $slots['error-summary']) && state.errors.length" class="scq-form__errors" role="alert">
      <slot name="error-summary" :errors="state.errors" :focus-field="focusField" :focus-error="focusError">
        <strong>{{ text('formErrors') }}</strong>
        <ul><li v-for="error in state.errors" :key="error.id"><button type="button" @click="focusError(error)">{{ error.label }}: {{ error.error }}</button></li></ul>
      </slot>
    </div>
    <fieldset class="scq-form__fieldset" :disabled="disabled">
      <slot />
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, provide, shallowReactive, type CSSProperties } from 'vue'
import { formKey, type FormField, type FormFieldState, type FormInstance, type FormLabelPosition, type FormModel, type FormRules, type FormState } from './context'
import { configKey, useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { toCssLength } from '../../utils/layout'

defineOptions({ name: 'Form' })

const props = withDefaults(defineProps<{
  model: FormModel
  rules?: FormRules
  labelPosition?: FormLabelPosition
  labelWidth?: string | number
  inline?: boolean
  disabled?: boolean
  size?: ComponentSize
  showErrorSummary?: boolean
  focusOnError?: boolean
  scrollToError?: boolean
}>(), { rules: () => ({}), labelPosition: 'right', labelWidth: 100, inline: false, disabled: undefined, showErrorSummary: false, focusOnError: false, scrollToError: false })

const emit = defineEmits<{
  (event: 'submit', valid: boolean): void
  (event: 'validate', valid: boolean): void
}>()

const config = useConfig()
const text = useLocale()
const resolvedConfig = computed(() => ({
  ...config.value,
  size: props.size ?? config.value.size,
  disabled: props.disabled ?? config.value.disabled,
}))
const disabled = computed(() => resolvedConfig.value.disabled)
provide(configKey, resolvedConfig)
const fields = shallowReactive(new Set<FormField>())
let disposed = false
onBeforeUnmount(() => { disposed = true })
const getFieldStates: FormInstance['getFieldStates'] = () => [...fields].filter((field) => field.prop).map((field) => ({ ...field.getState() }))
const getFieldState: FormInstance['getFieldState'] = (name) => getFieldStates().find((field) => field.prop === name)
const state = computed<FormState>(() => {
  const values = getFieldStates()
  return { dirty: values.some((field) => field.dirty), touched: values.some((field) => field.touched), pending: values.some((field) => field.pending), errors: values.filter((field) => field.error) }
})
const formStyle = computed<CSSProperties>(() => ({
  '--scq-form-label-width': toCssLength(props.labelWidth),
}))

provide(formKey, {
  model: computed(() => props.model),
  rules: computed(() => props.rules),
  addField: (field) => fields.add(field),
  removeField: (field) => fields.delete(field),
  disabled,
})

const selectFields = (names?: string | string[]) => {
  const selected = typeof names === 'string' ? [names] : names
  return [...fields].filter((field) => field.prop && (!selected || selected.includes(field.prop)))
}

const validateField: FormInstance['validateField'] = async (names) => {
  if (disposed) return false
  const selected = selectFields(names).map((field) => ({ field, prop: field.prop }))
  const results = await Promise.all(selected.map(({ field }) => field.validate()))
  if (disposed) return false
  if (selectFields(names).some((field) => !selected.some((entry) => entry.field === field && entry.prop === field.prop))) return false
  return results.every((valid, index) => !fields.has(selected[index].field) || valid)
}

const validate = async () => {
  const valid = await validateField()
  if (disposed) return false
  emit('validate', valid)
  return valid
}

const clearValidate: FormInstance['clearValidate'] = (names) => selectFields(names).forEach((field) => field.clearValidate())
const resetFields: FormInstance['resetFields'] = async (names) => {
  await Promise.all(selectFields(names).map((field) => field.resetField()))
}
const findFields = (name: string) => {
  const matches = [...fields].filter((entry) => entry.prop === name)
  if (!matches.length) console.warn(`[scq-vue] Form field "${name}" is not registered.`)
  return matches
}
const focusField: FormInstance['focusField'] = (name, options) => findFields(name).some(field => field.focus(options))
const focusError = (error: FormFieldState, options?: FocusOptions) => {
  const field = [...fields].find(entry => entry.prop === error.prop && entry.getState().id === error.id)
  return field?.focus(options) || focusField(error.prop, options)
}
const scrollToField: FormInstance['scrollToField'] = (name, options = { block: 'nearest' }) => {
  const field = findFields(name)[0]
  if (!field) return false
  field.scrollIntoView(options)
  return true
}
const focusFirstError: FormInstance['focusFirstError'] = (options) => {
  for (const error of state.value.errors) if (focusError(error, options)) return true
  return false
}

const handleSubmit = async () => {
  if (disabled.value || disposed) return
  fields.forEach((field) => field.touch())
  const valid = await validate()
  if (disposed) return
  if (!valid) {
    if (props.scrollToError && state.value.errors[0]) scrollToField(state.value.errors[0].prop)
    if (props.focusOnError) focusFirstError()
  }
  emit('submit', valid)
}

defineExpose({ validate, validateField, resetFields, clearValidate, getFieldState, getFieldStates, focusField, focusFirstError, scrollToField, state })
</script>