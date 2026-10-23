<template>
  <label
    v-bind="field.rootAttrs.value"
    class="scq-checkbox"
    :class="[
      `scq-checkbox--${resolvedSize}`,
      {
        'is-checked': isChecked,
        'is-disabled': isDisabled,
        'is-indeterminate': isIndeterminate,
      },
    ]"
  >
    <span class="scq-checkbox__input">
      <input
        ref="inputRef"
        class="scq-checkbox__original"
        type="checkbox"
        :name="resolvedName"
        :value="String(value)"
        :checked="isChecked"
        :indeterminate="isIndeterminate"
        :disabled="isDisabled"
        v-bind="field.attrs.value"
        @blur="field.touch"
        @change="handleChange"
      />
      <span class="scq-checkbox__inner">
        <span class="scq-checkbox__mark"></span>
      </span>
    </span>
    <span class="scq-checkbox__label">
      <slot>{{ text }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { checkboxGroupKey, type CheckboxSize, type CheckboxValue } from './context'
import { useConfig } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'

defineOptions({
  name: 'Checkbox',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    value?: CheckboxValue
    text?: string
    name?: string
    disabled?: boolean
    size?: CheckboxSize
    indeterminate?: boolean
  }>(),
  {
    modelValue: false,
    value: true,
    text: '',
    name: '',
    disabled: undefined,
    indeterminate: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const inputRef = ref<HTMLInputElement>()
const checkboxGroup = inject(checkboxGroupKey, null)
const config = useConfig()
const field = useFormControl({ element: () => inputRef.value, disabled: () => checkboxGroup?.disabled.value || (props.disabled ?? checkboxGroup?.disabled.value) })

const isGroup = computed(() => checkboxGroup !== null)

const resolvedSize = computed(() => {
  return checkboxGroup?.size.value ?? props.size ?? config.value.size
})

const resolvedName = computed(() => {
  return checkboxGroup?.name.value || props.name
})

const isDisabled = computed(() => {
  return field.disabled.value
})

const isChecked = computed(() => {
  if (isGroup.value) {
    return checkboxGroup?.modelValue.value.includes(props.value) || false
  }
  return Boolean(props.modelValue)
})

const isIndeterminate = computed(() => {
  return !isGroup.value && props.indeterminate && !isChecked.value
})

const handleChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.checked = isChecked.value
  input.indeterminate = isIndeterminate.value
  if (isDisabled.value) {
    return
  }

  const nextChecked = !isChecked.value

  if (checkboxGroup) {
    checkboxGroup.changeEvent(props.value, nextChecked)
    return
  }

  emit('update:modelValue', nextChecked)
  emit('change', nextChecked)
}
</script>
