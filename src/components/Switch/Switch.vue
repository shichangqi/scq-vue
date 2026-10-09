<template>
  <label class="scq-switch" :class="[`scq-switch--${resolvedSize}`, { 'is-checked': modelValue, 'is-disabled': isDisabled || loading }]">
    <input
      ref="inputRef"
      class="scq-switch__input"
      type="checkbox"
      role="switch"
      :name="name"
      :checked="modelValue"
      :aria-checked="modelValue"
      :aria-label="ariaLabel || undefined"
      :aria-busy="loading || undefined"
      :disabled="isDisabled || loading"
      @change="handleChange"
    />
    <span class="scq-switch__track" aria-hidden="true">
      <span class="scq-switch__thumb" :class="{ 'is-loading': loading }"></span>
    </span>
    <span v-if="$slots.default || activeText || inactiveText" class="scq-switch__label">
      <slot>{{ modelValue ? activeText : inactiveText }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConfig } from '../ConfigProvider/context'

defineOptions({ name: 'Switch' })

const props = withDefaults(defineProps<{
  modelValue?: boolean
  disabled?: boolean
  loading?: boolean
  size?: 'small' | 'default' | 'large'
  activeText?: string
  inactiveText?: string
  name?: string
  ariaLabel?: string
}>(), {
  modelValue: false,
  disabled: undefined,
  loading: false,
  activeText: '',
  inactiveText: '',
  name: '',
  ariaLabel: '',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'change', value: boolean): void
}>()

const inputRef = ref<HTMLInputElement>()
const config = useConfig()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const resolvedSize = computed(() => props.size ?? config.value.size)

const handleChange = () => {
  if (isDisabled.value || props.loading) return
  emit('update:modelValue', !props.modelValue)
  emit('change', !props.modelValue)
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>