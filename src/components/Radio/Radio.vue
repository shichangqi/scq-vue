<template>
  <label
    v-bind="field.rootAttrs.value"
    class="scq-radio"
    :class="[
      `scq-radio--${resolvedSize}`,
      {
        'is-checked': isChecked,
        'is-disabled': isDisabled,
      },
    ]"
  >
    <span class="scq-radio__input">
      <input
        ref="inputRef"
        class="scq-radio__original"
        type="radio"
        :name="resolvedName"
        :value="String(value)"
        :checked="isChecked"
        :disabled="isDisabled"
        :tabindex="tabIndex"
        v-bind="field.attrs.value"
        @blur="field.touch"
        @change="handleChange"
      />
      <span class="scq-radio__inner"></span>
    </span>
    <span class="scq-radio__label">
      <slot>{{ text }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { radioGroupKey, useNativeRadioControl, type RadioSize, type RadioValue } from './context'
import { useConfig } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'

defineOptions({
  name: 'Radio',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: RadioValue | null
    value?: RadioValue
    text?: string
    name?: string
    disabled?: boolean
    size?: RadioSize
  }>(),
  {
    modelValue: undefined,
    value: true,
    text: '',
    name: '',
    disabled: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: RadioValue): void
  (e: 'change', value: RadioValue): void
}>()

const radioGroup = inject(radioGroupKey, null)
const config = useConfig()
const inputRef = ref<HTMLInputElement>()
const field = useFormControl({ element: () => inputRef.value, disabled: () => radioGroup?.disabled.value || (props.disabled ?? radioGroup?.disabled.value) })

const isGroup = computed(() => radioGroup !== null)

const resolvedSize = computed(() => {
  return radioGroup?.size.value ?? props.size ?? config.value.size
})

const resolvedName = computed(() => {
  return radioGroup?.name.value || props.name
})

const isDisabled = computed(() => {
  return field.disabled.value
})

const isChecked = computed(() => {
  const currentValue = isGroup.value ? radioGroup?.modelValue.value : props.modelValue
  return currentValue === props.value
})
const control = { element: () => inputRef.value, checked: () => isChecked.value, disabled: () => isDisabled.value }
const restoreNative = useNativeRadioControl(control)
const tabIndex = computed(() => radioGroup?.tabStop?.value ? radioGroup.tabStop.value === control ? 0 : -1 : undefined)
let unregister: (() => void) | undefined
onMounted(() => { unregister = radioGroup?.register?.(control) })
onBeforeUnmount(() => unregister?.())

const handleChange = () => {
  restoreNative()
  if (isDisabled.value || isChecked.value) {
    return
  }

  if (radioGroup) {
    radioGroup.changeEvent(props.value)
    return
  }

  emit('update:modelValue', props.value)
  emit('change', props.value)
}
</script>
