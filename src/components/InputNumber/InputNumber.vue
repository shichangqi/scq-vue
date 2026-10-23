<template>
  <div v-bind="field.rootAttrs.value" class="scq-input-number" :class="[`scq-input-number--${resolvedSize}`, { 'is-disabled': isDisabled, 'is-invalid': invalid }]">
    <button v-if="controls" type="button" class="scq-input-number__control" :aria-label="text('decrease')" :disabled="isDisabled || readonly || configurationInvalid || modelInvalid || (modelValue != null && modelValue <= min)" @click="stepBy(-1)"><Icon name="minus" /></button>
    <input ref="inputRef" class="scq-input-number__input" type="number" inputmode="decimal" :id="id || undefined" :name="name || undefined" :aria-label="ariaLabel || undefined" :value="modelValue ?? ''" :min="Number.isFinite(min) ? min : undefined" :max="Number.isFinite(max) ? max : undefined" :step="safeStep" :disabled="isDisabled" :readonly="readonly" :placeholder="placeholder" v-bind="field.attrs.value" @change="handleChange" @keydown.up.prevent="stepBy(1)" @keydown.down.prevent="stepBy(-1)" @blur="field.touch($event); emit('blur', $event)" @focus="emit('focus', $event)" />
    <button v-if="controls" type="button" class="scq-input-number__control" :aria-label="text('increase')" :disabled="isDisabled || readonly || configurationInvalid || modelInvalid || (modelValue != null && modelValue >= max)" @click="stepBy(1)"><Icon name="plus" /></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import { NUMBER_DEFAULTS, roundNumber } from '../../utils/number'

defineOptions({ name: 'InputNumber', inheritAttrs: false })
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
}>(), { min: -Infinity, max: Infinity, step: NUMBER_DEFAULTS.step, disabled: undefined, readonly: false, controls: true, placeholder: '', id: '', name: '', ariaLabel: '' })
const emit = defineEmits<{
  (event: 'update:modelValue', value: number | undefined): void
  (event: 'change', value: number | undefined): void
  (event: 'focus' | 'blur', value: FocusEvent): void
  (event: 'invalid', value: number | undefined, reason: 'configuration' | 'number'): void
}>()
const config = useConfig()
const text = useLocale()
const inputRef = ref<HTMLInputElement>()
const inputInvalid = ref(false)
const configurationInvalid = computed(() => Number.isNaN(props.min) || Number.isNaN(props.max) || props.min === Infinity || props.max === -Infinity || props.min > props.max
  || !Number.isFinite(props.step) || props.step <= 0
  || (props.precision !== undefined && (!Number.isInteger(props.precision) || props.precision < 0 || props.precision > NUMBER_DEFAULTS.maximumPrecision)))
const modelInvalid = computed(() => props.modelValue !== undefined && !Number.isFinite(props.modelValue))
const invalid = computed(() => inputInvalid.value || configurationInvalid.value || modelInvalid.value)
const field = useFormControl({ element: () => inputRef.value, id: () => props.id, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, invalid: () => invalid.value })
const isDisabled = field.disabled
const resolvedSize = computed(() => props.size ?? config.value.size)
const safeStep = computed(() => Number.isFinite(props.step) && props.step > 0 ? props.step : NUMBER_DEFAULTS.step)
const normalize = (value: number) => Math.min(props.max, Math.max(props.min, roundNumber(value, props.precision)))
const reject = (value: number | undefined, reason: 'configuration' | 'number') => { inputInvalid.value = true; emit('invalid', value, reason); return false }
const update = (value: number | undefined) => {
  if (isDisabled.value || props.readonly || configurationInvalid.value) return false
  if (value !== undefined && !Number.isFinite(value)) return reject(value, 'number')
  inputInvalid.value = false
  if (Object.is(value, props.modelValue)) return true
  emit('update:modelValue', value)
  emit('change', value)
  return true
}
const stepBy = (direction: number) => {
  if (isDisabled.value || props.readonly || configurationInvalid.value || modelInvalid.value) return
  update(normalize((props.modelValue ?? 0) + direction * safeStep.value))
}
const handleChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  let next = props.modelValue
  if (!isDisabled.value && !props.readonly && !configurationInvalid.value) {
    if (input.validity.badInput) reject(input.valueAsNumber, 'number')
    else {
      const value = input.value === '' ? undefined : normalize(input.valueAsNumber)
      if (update(value)) next = value
    }
  }
  input.value = next == null || !Number.isFinite(next) ? '' : String(next)
}
watch(() => [props.modelValue, props.min, props.max, props.step, props.precision], () => {
  inputInvalid.value = false
  if (configurationInvalid.value) emit('invalid', props.modelValue, 'configuration')
  else if (modelInvalid.value) emit('invalid', props.modelValue, 'number')
}, { immediate: true })
defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur() })
</script>