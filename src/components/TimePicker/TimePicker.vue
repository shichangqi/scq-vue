<template>
  <div class="scq-time-picker scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]">
    <Icon name="clock" :size="18" />
    <template v-for="(_, index) in (isRange ? 2 : 1)" :key="index"><span v-if="index" class="scq-time-picker__separator">~</span><input :id="index ? undefined : id || undefined" ref="inputs" type="time" :value="values[index] || ''" :name="name ? (isRange ? `${name}[${index}]` : name) : undefined" :min="min || undefined" :max="max || undefined" :step="seconds ? (step || 1) : (step || 60)" :disabled="isDisabled" :readonly="readonly" :aria-label="`${ariaLabel || text('chooseTime')}${isRange ? ` ${index + 1}` : ''}`" :aria-invalid="invalid || undefined" @change="change($event, index)" @focus="emit('focus', $event)" @blur="emit('blur', $event)" /></template>
    <button v-if="clearable && values.some(Boolean) && !isDisabled && !readonly" class="scq-field__clear" type="button" :aria-label="text('clear')" @click="clear"><Icon name="close" :size="14" /></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isMatch } from 'date-fns'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'

export type TimePickerValue = string | string[]
defineOptions({ name: 'TimePicker' })
const props = withDefaults(defineProps<{ modelValue?: TimePickerValue; isRange?: boolean; seconds?: boolean; step?: number; min?: string; max?: string; allowOvernight?: boolean; disabledTime?: (value: string) => boolean; disabled?: boolean; readonly?: boolean; clearable?: boolean; size?: ComponentSize; ariaLabel?: string; id?: string; name?: string }>(), { isRange: false, seconds: false, min: '', max: '', allowOvernight: false, disabled: undefined, readonly: false, clearable: true, ariaLabel: '', id: '', name: '' })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change', value: TimePickerValue): void
  (event: 'clear'): void
  (event: 'invalid', value: string): void
  (event: 'focus' | 'blur', value: FocusEvent): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref<TimePickerValue>(props.isRange ? ['', ''] : '')
const value = computed(() => props.modelValue ?? internal.value)
const values = computed(() => Array.isArray(value.value) ? value.value : [value.value])
const inputs = ref<HTMLInputElement[]>([])
const invalid = ref(false)
const update = (next: TimePickerValue) => { internal.value = next; emit('update:modelValue', next); emit('change', next) }
const change = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  if (isDisabled.value || props.readonly) { input.value = values.value[index] || ''; return }
  const next = props.isRange ? [values.value[0] || '', values.value[1] || ''] : [...values.value]
  next[index] = input.value
  const validFormat = !input.value || isMatch(input.value, 'HH:mm') || isMatch(input.value, 'HH:mm:ss')
  invalid.value = !validFormat || !input.validity.valid || Boolean(input.value && props.disabledTime?.(input.value)) || Boolean(props.isRange && !props.allowOvernight && next[0] && next[1] && next[0] > next[1])
  if (invalid.value) { emit('invalid', input.value); input.value = values.value[index] || ''; return }
  update(props.isRange ? next : next[0])
}
const clear = () => { if (!isDisabled.value && !props.readonly) { invalid.value = false; update(props.isRange ? ['', ''] : ''); emit('clear') } }
watch(() => props.modelValue, () => { invalid.value = false })
defineExpose({ focus: (index = 0) => inputs.value[index]?.focus(), blur: () => inputs.value.forEach((input) => input.blur()), clear })
</script>