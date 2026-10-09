<template>
  <div class="scq-input-number" :class="[`scq-input-number--${resolvedSize}`, { 'is-disabled': isDisabled }]">
    <button v-if="controls" type="button" class="scq-input-number__control" :aria-label="text('decrease')" :disabled="isDisabled || readonly || (modelValue != null && modelValue <= min)" @click="stepBy(-1)"><Icon name="minus" /></button>
    <input ref="inputRef" class="scq-input-number__input" type="number" inputmode="decimal" :id="id || undefined" :name="name || undefined" :aria-label="ariaLabel || undefined" :value="modelValue ?? ''" :min="Number.isFinite(min) ? min : undefined" :max="Number.isFinite(max) ? max : undefined" :step="safeStep" :disabled="isDisabled" :readonly="readonly" :placeholder="placeholder" @change="handleChange" @keydown.up.prevent="stepBy(1)" @keydown.down.prevent="stepBy(-1)" @blur="emit('blur', $event)" @focus="emit('focus', $event)" />
    <button v-if="controls" type="button" class="scq-input-number__control" :aria-label="text('increase')" :disabled="isDisabled || readonly || (modelValue != null && modelValue >= max)" @click="stepBy(1)"><Icon name="plus" /></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'

defineOptions({ name: 'InputNumber' })
const props = withDefaults(defineProps<{
  modelValue?: number
  min?: number
  max?: number
  step?: number
  precision?: number
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
  controls?: boolean
  placeholder?: string
  id?: string
  name?: string
  ariaLabel?: string
}>(), { min: -Infinity, max: Infinity, step: 1, disabled: undefined, readonly: false, controls: true, placeholder: '', id: '', name: '', ariaLabel: '' })
const emit = defineEmits<{
  (event: 'update:modelValue', value: number | undefined): void
  (event: 'change', value: number | undefined): void
  (event: 'focus' | 'blur', value: FocusEvent): void
}>()
const config = useConfig()
const text = useLocale()
const inputRef = ref<HTMLInputElement>()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const resolvedSize = computed(() => props.size ?? config.value.size)
const safeStep = computed(() => Number.isFinite(props.step) && props.step > 0 ? props.step : 1)
const normalize = (value: number) => {
  const precision = Math.min(15, Math.max(0, Math.trunc(props.precision ?? 12)))
  return Math.min(props.max, Math.max(props.min, Number(value.toFixed(precision))))
}
const update = (value: number | undefined) => {
  if (isDisabled.value || props.readonly || props.min > props.max) return
  if (Object.is(value, props.modelValue)) return
  emit('update:modelValue', value)
  emit('change', value)
}
const stepBy = (direction: number) => update(normalize((props.modelValue ?? 0) + direction * safeStep.value))
const handleChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value === '' || !Number.isFinite(input.valueAsNumber) ? undefined : normalize(input.valueAsNumber)
  update(value)
  input.value = value == null ? '' : String(value)
}
defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur() })
</script>