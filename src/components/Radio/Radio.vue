<template>
  <label
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
        class="scq-radio__original"
        type="radio"
        :name="resolvedName"
        :value="String(value)"
        :checked="isChecked"
        :disabled="isDisabled"
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
import { computed, inject } from 'vue'
import { radioGroupKey, type RadioSize, type RadioValue } from './context'

defineOptions({
  name: 'Radio',
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
    disabled: false,
    size: 'default',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: RadioValue): void
  (e: 'change', value: RadioValue): void
}>()

const radioGroup = inject(radioGroupKey, null)

const isGroup = computed(() => radioGroup !== null)

const resolvedSize = computed(() => {
  return radioGroup?.size.value || props.size
})

const resolvedName = computed(() => {
  return radioGroup?.name.value || props.name
})

const isDisabled = computed(() => {
  return Boolean(radioGroup?.disabled.value || props.disabled)
})

const isChecked = computed(() => {
  const currentValue = isGroup.value ? radioGroup?.modelValue.value : props.modelValue
  return currentValue === props.value
})

const handleChange = () => {
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
