<template>
  <label
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
        :disabled="isDisabled"
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
import { computed, inject, ref, watch } from 'vue'
import { checkboxGroupKey, type CheckboxSize, type CheckboxValue } from './context'

defineOptions({
  name: 'Checkbox',
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
    disabled: false,
    size: 'default',
    indeterminate: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const inputRef = ref<HTMLInputElement>()
const checkboxGroup = inject(checkboxGroupKey, null)

const isGroup = computed(() => checkboxGroup !== null)

const resolvedSize = computed(() => {
  return checkboxGroup?.size.value || props.size
})

const resolvedName = computed(() => {
  return checkboxGroup?.name.value || props.name
})

const isDisabled = computed(() => {
  return Boolean(checkboxGroup?.disabled.value || props.disabled)
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

watch(
  () => isIndeterminate.value,
  (next: boolean) => {
    if (inputRef.value) {
      inputRef.value.indeterminate = next
    }
  },
  { immediate: true },
)

const handleChange = () => {
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
