<template>
  <div ref="rootRef" class="scq-slider" :class="{ 'is-disabled': isDisabled, 'is-vertical': vertical }" :style="{ '--scq-slider-height': `${height}px`, '--scq-slider-start': `${percentage(range ? values[0] : minimum)}%`, '--scq-slider-end': `${percentage(values[range ? 1 : 0])}%` }" :role="field.hasField ? 'group' : undefined" v-bind="field.attrs.value" @focusout="field.touch">
    <div class="scq-slider__track" @click="trackClick"><div class="scq-slider__fill" /><input v-for="(_, index) in (range ? 2 : 1)" :key="index" type="range" :min="minimum" :max="maximum" :step="increment" :value="values[index]" :disabled="isDisabled || invalid" v-bind="controlAttrs" :aria-label="`${ariaLabel || text('slider')}${range ? ` ${index + 1}` : ''}`" :aria-orientation="vertical ? 'vertical' : 'horizontal'" :aria-valuemin="index ? values[0] : minimum" :aria-valuemax="range && !index ? values[1] : maximum" :aria-valuetext="formatValue(values[index])" :title="formatValue(values[index])" @input="input($event, index)" @change="change" /><div v-if="marks" class="scq-slider__marks"><span v-for="(label, mark) in marks" :key="mark" :style="vertical ? { bottom: `${percentage(Number(mark))}%` } : { left: `${percentage(Number(mark))}%` }">{{ label }}</span></div></div>
    <output v-if="showValue" class="scq-slider__value">{{ values.slice(0, range ? 2 : 1).map(formatValue).join(' - ') }}</output>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { focusFirstControl, useFormControl } from '../Form/useFormControl'
import { NUMBER_DEFAULTS, roundNumber } from '../../utils/number'

export type SliderValue = number | [number, number]
defineOptions({ name: 'Slider' })
const props = withDefaults(defineProps<{ modelValue?: SliderValue; min?: number; max?: number; step?: number; range?: boolean; disabled?: boolean; vertical?: boolean; height?: number; showValue?: boolean; format?: (value: number) => string; marks?: Record<number, string>; ariaLabel?: string }>(), { min: 0, max: 100, step: 1, range: false, disabled: undefined, vertical: false, height: 180, showValue: true, ariaLabel: '' })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'input' | 'change', value: SliderValue): void
  (event: 'invalid', value: SliderValue | undefined, reason: 'configuration' | 'number'): void
}>()
const text = useLocale()
const rootRef = ref<HTMLElement>()
const configurationInvalid = computed(() => !Number.isFinite(props.min) || !Number.isFinite(props.max) || props.min > props.max
  || !Number.isFinite(props.step) || props.step <= 0 || !Number.isFinite((props.max - props.min) / props.step))
const modelInvalid = computed(() => props.modelValue !== undefined && (Array.isArray(props.modelValue)
  ? props.modelValue.length !== 2 || props.modelValue.some(value => !Number.isFinite(value)) : !Number.isFinite(props.modelValue)))
const invalid = computed(() => configurationInvalid.value || modelInvalid.value)
const field = useFormControl({ element: () => rootRef.value, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, invalid: () => invalid.value, focus: (options) => focusFirstControl(rootRef.value, options) })
const controlAttrs = computed(() => Object.fromEntries(Object.entries(field.attrs.value).filter(([key]) => ['aria-invalid', 'aria-describedby', 'aria-required', 'aria-busy'].includes(key))))
const isDisabled = field.disabled
const minimum = computed(() => Number.isFinite(props.min) ? props.min : 0)
const maximum = computed(() => configurationInvalid.value ? minimum.value : props.max)
const increment = computed(() => Number.isFinite(props.step) && props.step > 0 ? props.step : NUMBER_DEFAULTS.step)
const internal = ref<SliderValue>(props.range ? [minimum.value, maximum.value] : minimum.value)
const normalize = (value: number) => {
  if (configurationInvalid.value) return minimum.value
  const count = Math.floor((maximum.value - minimum.value) / increment.value + NUMBER_DEFAULTS.stepTolerance)
  const steps = Math.max(0, Math.min(count, Math.round(((Number.isFinite(value) ? value : minimum.value) - minimum.value) / increment.value)))
  return roundNumber(minimum.value + steps * increment.value)
}
const values = computed(() => {
  const current = props.modelValue ?? internal.value
  const result = Array.isArray(current) ? [normalize(current[0]), normalize(current[1])] : [normalize(current), maximum.value]
  return props.range ? result.sort((left, right) => left - right) : result
})
const percentage = (value: number) => Math.max(0, Math.min(100, (value - minimum.value) / (maximum.value - minimum.value || 1) * 100))
const formatValue = (value: number) => props.format?.(value) ?? String(value)
const output = (): SliderValue => props.range ? [values.value[0], values.value[1]] : values.value[0]
let lastInput: SliderValue | undefined
const setValue = (raw: number, index: number) => {
  if (isDisabled.value || invalid.value) return
  const next = [...values.value]
  next[index] = props.range ? index ? Math.max(next[0], normalize(raw)) : Math.min(next[1], normalize(raw)) : normalize(raw)
  const result: SliderValue = props.range ? [next[0], next[1]] : next[0]
  internal.value = result
  emit('update:modelValue', result)
  emit('input', result)
  return result
}
const input = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  lastInput = setValue(Number(target.value), index)
  target.value = String(lastInput === undefined ? values.value[index] : Array.isArray(lastInput) ? lastInput[index] : lastInput)
}
const change = () => { if (!isDisabled.value && !invalid.value) emit('change', lastInput ?? output()); lastInput = undefined }
const trackClick = (event: MouseEvent) => {
  if (isDisabled.value || invalid.value || (event.target as HTMLElement).tagName === 'INPUT') return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const fraction = props.vertical ? (rect.bottom - event.clientY) / rect.height : (event.clientX - rect.left) / rect.width
  if (!Number.isFinite(fraction)) return
  const value = normalize(minimum.value + fraction * (maximum.value - minimum.value))
  const index = props.range && Math.abs(values.value[1] - value) < Math.abs(values.value[0] - value) ? 1 : 0
  const result = setValue(value, index)
  lastInput = undefined
  if (result !== undefined) emit('change', result)
}
watch([() => props.modelValue, () => props.min, () => props.max, () => props.step, () => props.range, isDisabled], () => {
  lastInput = undefined
}, { deep: true, flush: 'sync' })
watch([configurationInvalid, modelInvalid], () => {
  if (configurationInvalid.value) emit('invalid', props.modelValue, 'configuration')
  else if (modelInvalid.value) emit('invalid', props.modelValue, 'number')
}, { immediate: true })
</script>