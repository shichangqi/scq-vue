<template>
  <form class="scq-form" :class="[`scq-form--${labelPosition}`, { 'is-inline': inline, 'is-disabled': disabled }]" :style="formStyle" novalidate @submit.prevent="handleSubmit">
    <fieldset class="scq-form__fieldset" :disabled="disabled">
      <slot />
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import { computed, provide, type CSSProperties } from 'vue'
import { formKey, type FormField, type FormInstance, type FormLabelPosition, type FormModel, type FormRules } from './context'

defineOptions({ name: 'Form' })

const props = withDefaults(defineProps<{
  model: FormModel
  rules?: FormRules
  labelPosition?: FormLabelPosition
  labelWidth?: string | number
  inline?: boolean
  disabled?: boolean
}>(), { rules: () => ({}), labelPosition: 'right', labelWidth: 100, inline: false, disabled: false })

const emit = defineEmits<{
  (event: 'submit', valid: boolean): void
  (event: 'validate', valid: boolean): void
}>()

const fields = new Set<FormField>()
const formStyle = computed(() => ({
  '--scq-form-label-width': typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth,
}) as CSSProperties)

provide(formKey, {
  model: computed(() => props.model),
  rules: computed(() => props.rules),
  addField: (field) => fields.add(field),
  removeField: (field) => fields.delete(field),
})

const selectFields = (names?: string | string[]) => {
  const selected = typeof names === 'string' ? [names] : names
  return [...fields].filter((field) => !selected || selected.includes(field.prop))
}

const validateField: FormInstance['validateField'] = async (names) => {
  const results = await Promise.all(selectFields(names).map((field) => field.validate()))
  return results.every(Boolean)
}

const validate = async () => {
  const valid = await validateField()
  emit('validate', valid)
  return valid
}

const clearValidate: FormInstance['clearValidate'] = (names) => selectFields(names).forEach((field) => field.clearValidate())
const resetFields: FormInstance['resetFields'] = async (names) => {
  await Promise.all(selectFields(names).map((field) => field.resetField()))
}

const handleSubmit = async () => {
  if (!props.disabled) emit('submit', await validate())
}

defineExpose({ validate, validateField, resetFields, clearValidate })
</script>