<template>
  <div v-bind="field.rootAttrs.value" class="scq-date-picker">
    <Popover v-model="opened" :disabled="isDisabled || readonly" :teleport="teleport" placement="bottom-start" shift-cross-axis width="min(var(--scq-picker-calendar-width), calc(100vw - var(--scq-picker-viewport-gap) * 2))" :initial-focus="initialFocus" :aria-label="ariaLabel || text('chooseDate')" @show="emit('visible-change', true)" @hide="emit('visible-change', false)">
      <template #reference><span class="scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]"><button :id="id || undefined" ref="triggerRef" class="scq-field__trigger" type="button" :disabled="isDisabled || readonly" :aria-label="ariaLabel || placeholder || text('chooseDate')" aria-haspopup="dialog" :aria-expanded="opened" v-bind="field.attrs.value" @blur="field.touch" @keydown.down.prevent="!isDisabled && !readonly && (opened = true)"><Icon name="calendar" :size="18" /><span class="scq-field__value" :class="{ 'scq-field__placeholder': !displayValue }">{{ displayValue || placeholder || text('chooseDate') }}</span></button><button v-if="clearable && hasValue && !isDisabled && !readonly" class="scq-field__clear" type="button" :aria-label="text('clear')" @click.stop="clear"><Icon name="close" :size="14" /></button></span></template>
      <Calendar ref="calendarRef" class="scq-date-picker__calendar scq-calendar--compact" :model-value="value" v-model:month="month" :type="type === 'daterange' ? 'range' : 'single'" :min-date="minDate" :max-date="maxDate" :disabled="isDisabled || readonly" :disabled-date="disabledDate" :first-day-of-week="firstDayOfWeek" :max-range="maxRange" :show-today="false" @update:model-value="update" @invalid="($event === 'disabled' || $event === 'max-range') && emit('invalid', $event)" @focusout="field.touch" />
    </Popover>
    <template v-if="name"><input v-for="(entry, index) in (Array.isArray(value) ? value : [value])" :key="index" type="hidden" :name="type === 'daterange' ? `${name}[${index}]` : name" :value="entry" :disabled="isDisabled" /></template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { format as formatDate } from 'date-fns'
import Calendar, { type CalendarValue } from '../Calendar/Calendar.vue'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { parseDate } from '../../utils/date'
import { useFormControl } from '../Form/useFormControl'

export type DatePickerValue = CalendarValue
defineOptions({ name: 'DatePicker', inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue?: DatePickerValue; type?: 'date' | 'daterange'; format?: string; minDate?: string; maxDate?: string; disabledDate?: (date: Date) => boolean; maxRange?: number; firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; disabled?: boolean; readonly?: boolean; clearable?: boolean; placeholder?: string; ariaLabel?: string; id?: string; name?: string; size?: ComponentSize; teleport?: boolean | string }>(), { type: 'date', format: 'yyyy-MM-dd', disabled: undefined, readonly: false, clearable: true, placeholder: '', ariaLabel: '', id: '', name: '', teleport: true })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change', value: DatePickerValue): void
  (event: 'clear'): void
  (event: 'visible-change', opened: boolean): void
  (event: 'invalid', reason: 'disabled' | 'max-range'): void
}>()
const config = useConfig()
const text = useLocale()
const internal = ref<DatePickerValue>(props.type === 'daterange' ? [] : '')
const value = computed(() => props.modelValue ?? internal.value)
const displayValue = computed(() => (Array.isArray(value.value) ? value.value : [value.value]).map((entry) => { const date = parseDate(entry); return date ? formatDate(date, props.format) : '' }).filter(Boolean).join(' ~ '))
const hasValue = computed(() => Array.isArray(value.value) ? value.value.length > 0 : Boolean(value.value))
const opened = ref(false)
const triggerRef = ref<HTMLButtonElement>()
const calendarRef = ref<InstanceType<typeof Calendar>>()
const initialFocus = () => {
  const calendar = calendarRef.value?.$el
  return calendar instanceof HTMLElement ? calendar.querySelector<HTMLButtonElement>('[data-date][tabindex="0"]:not(:disabled)') : null
}
const field = useFormControl({
  element: () => triggerRef.value, id: () => props.id, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, composite: true,
  contains: (target) => Boolean(triggerRef.value?.contains(target) || (calendarRef.value?.$el instanceof HTMLElement && calendarRef.value.$el.contains(target))),
})
const isDisabled = field.disabled
const month = ref('')
const update = (next: DatePickerValue) => {
  if (isDisabled.value || props.readonly) return
  internal.value = next
  emit('update:modelValue', next)
  emit('change', next)
  if (props.type === 'date' || (Array.isArray(next) && next.length === 2)) { opened.value = false; triggerRef.value?.focus() }
}
const clear = () => {
  if (isDisabled.value || props.readonly) return
  update(props.type === 'daterange' ? [] : '')
  opened.value = false
  triggerRef.value?.focus()
  emit('clear')
}
watch(opened, (value) => {
  if (value) {
    const current = props.modelValue ?? internal.value
    const initial = Array.isArray(current) ? current[0] : current
    month.value = (parseDate(initial) ? initial : props.minDate && formatDate(new Date(), 'yyyy-MM-dd') < props.minDate ? props.minDate : props.maxDate && formatDate(new Date(), 'yyyy-MM-dd') > props.maxDate ? props.maxDate : formatDate(new Date(), 'yyyy-MM-dd')).slice(0, 7)
  }
})
watch([isDisabled, () => props.readonly], () => { opened.value = false })
defineExpose({ focus: () => triggerRef.value?.focus(), show: () => { if (!isDisabled.value && !props.readonly) opened.value = true }, hide: () => { opened.value = false } })
</script>