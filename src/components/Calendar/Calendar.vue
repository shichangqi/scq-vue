<template>
  <section ref="rootRef" class="scq-calendar" :aria-label="ariaLabel || text('chooseDate')">
    <header class="scq-calendar__header">
      <button type="button" :disabled="isDisabled || previousDisabled" :aria-label="text('previousMonth')" @click="moveMonth(-1)"><Icon name="chevronLeft" :size="18" /></button>
      <strong aria-live="polite">{{ monthLabel }}</strong>
      <button type="button" :disabled="isDisabled || nextDisabled" :aria-label="text('nextMonth')" @click="moveMonth(1)"><Icon name="chevronRight" :size="18" /></button>
    </header>
    <div role="grid" :aria-label="monthLabel" :aria-multiselectable="type !== 'single'">
      <div class="scq-calendar__week" role="row"><span v-for="weekday in weekdays" :key="weekday" role="columnheader">{{ weekday }}</span></div>
      <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="scq-calendar__week" role="row">
        <div v-for="day in week" :key="day.key" role="gridcell" :aria-selected="selected.includes(day.key)" class="scq-calendar__cell" :class="{ 'is-selected': selected.includes(day.key), 'is-range': inRange(day.key), 'is-other': day.date.getMonth() !== visibleMonth.getMonth(), 'is-today': day.key === today }">
          <button type="button" :data-date="day.key" :disabled="isDisabled || blocked(day.date)" :tabindex="day.key === focusKey ? 0 : -1" :aria-label="day.label" :aria-current="day.key === today ? 'date' : undefined" @click="choose(day.date)" @focus="focusKey = day.key" @keydown="keydown($event, day.date)"><slot name="day" :date="day.date" :selected="selected.includes(day.key)">{{ day.date.getDate() }}</slot></button>
        </div>
      </div>
    </div>
    <footer class="scq-calendar__footer">
      <button type="button" :disabled="isDisabled || blocked(new Date())" @click="goToday">{{ text('today') }}</button>
      <button v-if="showConfirm" type="button" class="scq-calendar__confirm" :disabled="isDisabled || !complete" @click="emit('confirm', value)">{{ confirmText || text('confirm') }}</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, startOfMonth, startOfWeek } from 'date-fns'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { dateDisabled, dateKey, parseDate } from '../../utils/date'

export type CalendarValue = string | string[]
export type CalendarType = 'single' | 'multiple' | 'range'
defineOptions({ name: 'Calendar' })
const props = withDefaults(defineProps<{ modelValue?: CalendarValue; type?: CalendarType; month?: string; minDate?: string; maxDate?: string; disabledDate?: (date: Date) => boolean; disabled?: boolean; firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; maxRange?: number; showConfirm?: boolean; confirmText?: string; ariaLabel?: string }>(), { type: 'single', disabled: undefined, firstDayOfWeek: 1, showConfirm: false, ariaLabel: '' })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change' | 'confirm', value: CalendarValue): void
  (event: 'update:month' | 'panel-change', month: string): void
  (event: 'select', date: string): void
  (event: 'invalid', reason: 'disabled' | 'max-range'): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const rootRef = ref<HTMLElement>()
const localValue = ref<CalendarValue>(props.type === 'single' ? '' : [])
const value = computed(() => props.modelValue ?? localValue.value)
const selected = computed(() => (Array.isArray(value.value) ? value.value : [value.value]).filter((entry) => parseDate(entry)))
const today = dateKey(new Date())
const initialDate = parseDate(selected.value[0]) || (props.minDate && today < props.minDate ? parseDate(props.minDate) : props.maxDate && today > props.maxDate ? parseDate(props.maxDate) : undefined) || new Date()
const localMonth = ref(startOfMonth(initialDate))
const visibleMonth = computed(() => parseDate(props.month ? `${props.month}-01` : '') || localMonth.value)
const focusKey = ref(dateKey(initialDate))
const blocked = (date: Date) => dateDisabled(date, props.minDate, props.maxDate, props.disabledDate)
const monthLabel = computed(() => new Intl.DateTimeFormat(config.value.locale, { year: 'numeric', month: 'long' }).format(visibleMonth.value))
const weekdays = computed(() => Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(config.value.locale, { weekday: 'short' }).format(addDays(startOfWeek(visibleMonth.value, { weekStartsOn: props.firstDayOfWeek }), index))))
const days = computed(() => Array.from({ length: 42 }, (_, index) => {
  const date = addDays(startOfWeek(visibleMonth.value, { weekStartsOn: props.firstDayOfWeek }), index)
  return { date, key: dateKey(date), label: new Intl.DateTimeFormat(config.value.locale, { dateStyle: 'full' }).format(date) }
}))
const weeks = computed(() => Array.from({ length: 6 }, (_, index) => days.value.slice(index * 7, index * 7 + 7)))
const previousDisabled = computed(() => Boolean(props.minDate && dateKey(endOfMonth(addMonths(visibleMonth.value, -1))) < props.minDate))
const nextDisabled = computed(() => Boolean(props.maxDate && dateKey(startOfMonth(addMonths(visibleMonth.value, 1))) > props.maxDate))
const complete = computed(() => selected.value.length > 0 && (props.type !== 'range' || selected.value.length === 2))
const inRange = (key: string) => props.type === 'range' && selected.value.length === 2 && key > selected.value[0] && key < selected.value[1]
const setMonth = (date: Date) => {
  const month = format(date, 'yyyy-MM')
  if (month === format(visibleMonth.value, 'yyyy-MM')) return
  localMonth.value = startOfMonth(date)
  emit('update:month', month)
  emit('panel-change', month)
}
const choose = (date: Date) => {
  if (isDisabled.value || blocked(date)) return
  const key = dateKey(date)
  let next: CalendarValue = key
  if (props.type === 'multiple') next = selected.value.includes(key) ? selected.value.filter((entry) => entry !== key) : [...selected.value, key].sort()
  if (props.type === 'range') {
    next = selected.value.length === 1 ? [selected.value[0], key].sort() : [key]
    if (next.length === 2) {
      const start = parseDate(next[0])!
      const count = differenceInCalendarDays(parseDate(next[1])!, start) + 1
      if (props.maxRange && count > props.maxRange) { emit('invalid', 'max-range'); return }
      for (let index = 0; index < count; index += 1) if (blocked(addDays(start, index))) { emit('invalid', 'disabled'); return }
    }
  }
  focusKey.value = key
  setMonth(date)
  localValue.value = next
  emit('update:modelValue', next)
  emit('change', next)
  emit('select', key)
}
const moveMonth = (amount: number) => {
  if (isDisabled.value || (amount < 0 ? previousDisabled.value : nextDisabled.value)) return
  const date = addMonths(visibleMonth.value, amount)
  setMonth(date)
  focusKey.value = dateKey(date)
}
const goToday = () => { setMonth(new Date()); focusKey.value = today }
const keydown = async (event: KeyboardEvent, date: Date) => {
  let target: Date
  if (event.key === 'ArrowLeft') target = addDays(date, -1)
  else if (event.key === 'ArrowRight') target = addDays(date, 1)
  else if (event.key === 'ArrowUp') target = addDays(date, -7)
  else if (event.key === 'ArrowDown') target = addDays(date, 7)
  else if (event.key === 'Home') target = startOfWeek(date, { weekStartsOn: props.firstDayOfWeek })
  else if (event.key === 'End') target = addDays(startOfWeek(date, { weekStartsOn: props.firstDayOfWeek }), 6)
  else if (event.key === 'PageUp') target = addMonths(date, event.shiftKey ? -12 : -1)
  else if (event.key === 'PageDown') target = addMonths(date, event.shiftKey ? 12 : 1)
  else return
  event.preventDefault()
  const direction = target < date ? -1 : 1
  for (let attempts = 0; attempts < 366 && blocked(target); attempts += 1) target = addDays(target, direction)
  if (isDisabled.value || blocked(target)) return
  setMonth(target)
  focusKey.value = dateKey(target)
  await nextTick()
  rootRef.value?.querySelector<HTMLButtonElement>(`[data-date="${focusKey.value}"]`)?.focus()
}
watch(() => props.modelValue, (next) => {
  const target = parseDate(Array.isArray(next) ? next[next.length - 1] : next)
  if (target) { setMonth(target); focusKey.value = dateKey(target) }
})
watch(days, (entries) => {
  if (!entries.some((entry) => entry.key === focusKey.value && !blocked(entry.date))) focusKey.value = entries.find((entry) => entry.date.getMonth() === visibleMonth.value.getMonth() && !blocked(entry.date))?.key || ''
}, { immediate: true })
defineExpose({ goToday })
</script>