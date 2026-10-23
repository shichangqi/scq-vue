<template>
  <section ref="rootRef" class="scq-calendar" :aria-label="ariaLabel || text('chooseDate')" :style="{ '--scq-calendar-week-rows': CALENDAR.weekRows, '--scq-calendar-period-columns': CALENDAR.periodColumns }" @keydown="panelKeydown">
    <header class="scq-calendar__header">
      <button type="button" class="scq-calendar__nav" :disabled="isDisabled || previousDisabled" :aria-label="text(CALENDAR.navigation[panel][0])" @click="movePanel(-1)"><Icon name="chevronLeft" :size="CALENDAR.iconSize" /></button>
      <div class="scq-calendar__title" aria-live="polite">
        <template v-if="panel === 'date'">
          <button v-for="part in titleParts" :key="part.panel" type="button" class="scq-calendar__title-button" :data-panel="part.panel" :disabled="isDisabled" :aria-label="`${text(part.panel === 'year' ? 'chooseYear' : 'chooseMonth')}: ${part.label}`" @click="openPanel(part.panel)">
            {{ part.label }}
          </button>
        </template>
        <button v-else-if="panel === 'month'" type="button" class="scq-calendar__title-button" data-panel="year" :disabled="isDisabled" :aria-label="`${text('chooseYear')}: ${yearFormatter.format(panelDate)}`" @click="openPanel('year')">
          {{ yearFormatter.format(panelDate) }}
        </button>
        <strong v-else>{{ yearRangeLabel }}</strong>
      </div>
      <button type="button" class="scq-calendar__nav" :disabled="isDisabled || nextDisabled" :aria-label="text(CALENDAR.navigation[panel][1])" @click="movePanel(1)"><Icon name="chevronRight" :size="CALENDAR.iconSize" /></button>
    </header>
    <div v-if="panel === 'date'" class="scq-calendar__body" role="grid" :aria-label="monthLabel" :aria-multiselectable="type !== 'single'" @mouseleave="hoverKey = ''">
      <div class="scq-calendar__week" role="row"><span v-for="weekday in weekdays" :key="weekday" role="columnheader">{{ weekday }}</span></div>
      <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="scq-calendar__week" role="row">
        <div v-for="day in week" :key="day.key" role="gridcell" :aria-selected="selected.includes(day.key)" class="scq-calendar__cell" :class="{ 'is-selected': selected.includes(day.key), 'is-range': inRange(day.key), 'is-preview': inPreview(day.key), 'is-other': day.date.getMonth() !== visibleMonth.getMonth(), 'is-today': day.key === today }">
          <button type="button" :data-date="day.key" :disabled="isDisabled || blocked(day.date)" :tabindex="day.key === focusKey ? 0 : -1" :aria-label="day.label" :aria-current="day.key === today ? 'date' : undefined" @click="choose(day.date)" @mouseenter="hoverKey = day.key" @focus="focusKey = day.key; hoverKey = day.key" @keydown="keydown($event, day.date)"><slot name="day" :date="day.date" :selected="selected.includes(day.key)" :in-range="inRange(day.key)" :preview="inPreview(day.key)">{{ day.date.getDate() }}</slot></button>
        </div>
      </div>
    </div>
    <div v-else class="scq-calendar__body scq-calendar__periods" role="grid" :aria-label="`${text(panel === 'year' ? 'chooseYear' : 'chooseMonth')}: ${panel === 'year' ? yearRangeLabel : yearFormatter.format(panelDate)}`">
      <div v-for="(row, index) in periodRows" :key="index" class="scq-calendar__period-row" role="row">
        <div v-for="period in row" :key="period.key" class="scq-calendar__period-cell" :class="{ 'is-selected': period.selected, 'is-current': period.current }" role="gridcell" :aria-selected="period.selected">
          <button type="button" :data-period="period.key" :disabled="isDisabled || period.disabled" :tabindex="period.key === periodFocusKey ? 0 : -1" :aria-label="period.label" @click="selectPeriod(period.date)" @focus="periodFocusKey = period.key" @keydown="periodKeydown($event, period.key)">
            {{ period.label }}
          </button>
        </div>
      </div>
    </div>
    <footer v-if="panel !== 'date' || showToday || showConfirm" class="scq-calendar__footer">
      <button v-if="panel !== 'date'" type="button" class="scq-calendar__back" :aria-label="text('backToDates')" @click="closePanel"><Icon name="chevronLeft" :size="CALENDAR.indicatorSize" />{{ text('back') }}</button>
      <button v-if="showToday" type="button" :disabled="isDisabled || blocked(new Date())" @click="selectToday">{{ text('today') }}</button>
      <button v-if="showConfirm" type="button" class="scq-calendar__confirm" :disabled="isDisabled || !complete" @click="emit('confirm', value)">{{ confirmText || text('confirm') }}</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { addDays, addMonths, addYears, differenceInCalendarDays, endOfMonth, endOfYear, format, setYear, startOfMonth, startOfWeek, startOfYear } from 'date-fns'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { dateDisabled, dateKey, dateRangeInvalid, MONTH_FORMAT, parseDate } from '../../utils/date'

export type CalendarValue = string | string[]
export type CalendarType = 'single' | 'multiple' | 'range'
export interface CalendarProps { modelValue?: CalendarValue; type?: CalendarType; month?: string; minDate?: string; maxDate?: string; disabledDate?: (date: Date) => boolean; disabled?: boolean; firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; maxRange?: number; minRange?: number; maxSelected?: number; rangePreview?: boolean; showToday?: boolean; showConfirm?: boolean; confirmText?: string; ariaLabel?: string }
type PeriodPanel = 'month' | 'year'
const CALENDAR = {
  daysPerWeek: 7,
  weekRows: 6,
  monthsPerYear: 12,
  yearsPerPage: 12,
  periodColumns: 3,
  minimumYear: 1,
  maximumYear: 9999,
  keyboardSearchLimit: 366,
  iconSize: 18,
  indicatorSize: 12,
  monthFormats: {
    'zh-CN': 'numeric',
    'en-US': 'long',
  },
  navigation: {
    date: ['previousMonth', 'nextMonth'],
    month: ['previousYear', 'nextYear'],
    year: ['previousYears', 'nextYears'],
  },
} as const
defineOptions({ name: 'Calendar' })
const props = withDefaults(defineProps<CalendarProps>(), { type: 'single', disabled: undefined, firstDayOfWeek: 1, showToday: true, showConfirm: false, ariaLabel: '', rangePreview: false })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change' | 'confirm', value: CalendarValue): void
  (event: 'update:month' | 'panel-change', month: string): void
  (event: 'select', date: string): void
  (event: 'invalid', reason: 'disabled' | 'max-range' | 'min-range' | 'max-selected'): void
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
const hoverKey = ref('')
const panel = ref<'date' | PeriodPanel>('date')
const panelDate = ref(startOfMonth(initialDate))
const periodFocusKey = ref('')
const minimumDate = computed(() => parseDate(props.minDate))
const maximumDate = computed(() => parseDate(props.maxDate))
const blocked = (date: Date) => date.getFullYear() < CALENDAR.minimumYear || date.getFullYear() > CALENDAR.maximumYear
  || dateDisabled(date, props.minDate, props.maxDate, props.disabledDate)
const minimumRange = computed(() => props.minRange !== undefined && Number.isFinite(props.minRange) ? Math.max(1, Math.floor(props.minRange)) : 1)
const selectionLimit = computed(() => props.maxSelected !== undefined && Number.isFinite(props.maxSelected) && props.maxSelected >= 0 ? Math.floor(props.maxSelected) : Infinity)
const rangeInvalid = (start: Date, end: Date) => dateRangeInvalid(start, end, blocked, props.maxRange) || (differenceInCalendarDays(end, start) + 1 < minimumRange.value ? 'min-range' as const : undefined)
const preview = computed(() => {
  if (!props.rangePreview || props.type !== 'range' || selected.value.length !== 1 || isDisabled.value || !parseDate(hoverKey.value)) return
  const range = [selected.value[0], hoverKey.value].sort()
  return rangeInvalid(parseDate(range[0])!, parseDate(range[1])!) ? undefined : range
})
const inPreview = (key: string) => Boolean(preview.value && key >= preview.value[0] && key <= preview.value[1])
const monthFormatter = computed(() => new Intl.DateTimeFormat(config.value.locale, { year: 'numeric', month: 'long' }))
const yearFormatter = computed(() => new Intl.DateTimeFormat(config.value.locale, { year: 'numeric' }))
const monthNameFormatter = computed(() => new Intl.DateTimeFormat(config.value.locale, { month: CALENDAR.monthFormats[config.value.locale] }))
const monthLabel = computed(() => monthFormatter.value.format(visibleMonth.value))
const titleParts = computed(() => {
  const parts: { panel: PeriodPanel; label: string }[] = []
  for (const part of monthFormatter.value.formatToParts(visibleMonth.value)) {
    if (part.type === 'year' || part.type === 'month') {
      parts.push({ panel: part.type, label: (part.type === 'year' ? yearFormatter.value : monthNameFormatter.value).format(visibleMonth.value) })
    }
  }
  return parts
})
const weekdays = computed(() => Array.from({ length: CALENDAR.daysPerWeek }, (_, index) => new Intl.DateTimeFormat(config.value.locale, { weekday: 'short' }).format(addDays(startOfWeek(visibleMonth.value, { weekStartsOn: props.firstDayOfWeek }), index))))
const days = computed(() => Array.from({ length: CALENDAR.daysPerWeek * CALENDAR.weekRows }, (_, index) => {
  const date = addDays(startOfWeek(visibleMonth.value, { weekStartsOn: props.firstDayOfWeek }), index)
  return { date, key: dateKey(date), label: new Intl.DateTimeFormat(config.value.locale, { dateStyle: 'full' }).format(date) }
}))
const weeks = computed(() => Array.from({ length: CALENDAR.weekRows }, (_, index) => days.value.slice(index * CALENDAR.daysPerWeek, (index + 1) * CALENDAR.daysPerWeek)))
const availableDays = computed(() => isDisabled.value ? [] : days.value.filter((day) => !blocked(day.date)))
const yearPageStart = computed(() => setYear(startOfYear(panelDate.value), Math.floor((panelDate.value.getFullYear() - CALENDAR.minimumYear) / CALENDAR.yearsPerPage) * CALENDAR.yearsPerPage + CALENDAR.minimumYear))
const yearRangeLabel = computed(() => [yearPageStart.value, addYears(yearPageStart.value, CALENDAR.yearsPerPage - 1)].map((date) => yearFormatter.value.format(date)).join(' \u2013 '))
const outsideBounds = (start: Date, end: Date) =>
  end.getFullYear() < CALENDAR.minimumYear || start.getFullYear() > CALENDAR.maximumYear
  || Boolean(minimumDate.value && end < minimumDate.value) || Boolean(maximumDate.value && start > maximumDate.value)
const navigationDisabled = (direction: number) => {
  if (panel.value === 'date') {
    const date = addMonths(visibleMonth.value, direction)
    return outsideBounds(startOfMonth(date), endOfMonth(date))
  }
  if (panel.value === 'month') {
    const date = addYears(panelDate.value, direction)
    return outsideBounds(startOfYear(date), endOfYear(date))
  }
  const start = addYears(yearPageStart.value, direction * CALENDAR.yearsPerPage)
  return outsideBounds(start, endOfYear(addYears(start, CALENDAR.yearsPerPage - 1)))
}
const previousDisabled = computed(() => navigationDisabled(-1))
const nextDisabled = computed(() => navigationDisabled(1))
const periodOptions = computed(() => {
  if (panel.value === 'date') return []
  const isYear = panel.value === 'year'
  return Array.from({ length: isYear ? CALENDAR.yearsPerPage : CALENDAR.monthsPerYear }, (_, index) => {
    const date = isYear ? addYears(yearPageStart.value, index) : addMonths(startOfYear(panelDate.value), index)
    const matches = (target: Date) => date.getFullYear() === target.getFullYear() && (isYear || date.getMonth() === target.getMonth())
    return {
      date,
      key: isYear ? String(date.getFullYear()) : format(date, MONTH_FORMAT),
      label: (isYear ? yearFormatter.value : monthNameFormatter.value).format(date),
      selected: matches(visibleMonth.value),
      current: matches(parseDate(today)!),
      disabled: outsideBounds(date, isYear ? endOfYear(date) : endOfMonth(date)),
    }
  })
})
const periodRows = computed(() => Array.from({ length: Math.ceil(periodOptions.value.length / CALENDAR.periodColumns) }, (_, index) => periodOptions.value.slice(index * CALENDAR.periodColumns, (index + 1) * CALENDAR.periodColumns)))
const complete = computed(() => selected.value.length > 0 && selected.value.every(key => !blocked(parseDate(key)!)) && (props.type === 'range' ? selected.value.length === 2 && !rangeInvalid(parseDate(selected.value[0])!, parseDate(selected.value[1])!) : props.type !== 'multiple' || selected.value.length <= selectionLimit.value))
const inRange = (key: string) => props.type === 'range' && selected.value.length === 2 && key > selected.value[0] && key < selected.value[1]
const setMonth = (date: Date) => {
  const month = format(date, MONTH_FORMAT)
  if (month === format(visibleMonth.value, MONTH_FORMAT)) return
  localMonth.value = startOfMonth(date)
  emit('update:month', month)
  emit('panel-change', month)
}
const choose = (date: Date) => {
  if (isDisabled.value || blocked(date)) return
  const key = dateKey(date)
  let next: CalendarValue = key
  if (props.type === 'multiple') {
    if (!selected.value.includes(key) && selected.value.length >= selectionLimit.value) { emit('invalid', 'max-selected'); return }
    next = selected.value.includes(key) ? selected.value.filter((entry) => entry !== key) : [...selected.value, key].sort()
  }
  if (props.type === 'range') {
    next = selected.value.length === 1 && !blocked(parseDate(selected.value[0])!) ? [selected.value[0], key].sort() : [key]
    if (next.length === 2) {
      const reason = rangeInvalid(parseDate(next[0])!, parseDate(next[1])!)
      if (reason) { emit('invalid', reason); return }
    }
  }
  panel.value = 'date'
  focusKey.value = key
  hoverKey.value = ''
  setMonth(date)
  localValue.value = next
  emit('update:modelValue', next)
  emit('change', next)
  emit('select', key)
}
const movePanel = (amount: number) => {
  if (isDisabled.value || (amount < 0 ? previousDisabled.value : nextDisabled.value)) return false
  if (panel.value === 'date') {
    const date = addMonths(visibleMonth.value, amount)
    setMonth(date)
    focusKey.value = dateKey(date)
  } else {
    panelDate.value = addYears(panelDate.value, amount * (panel.value === 'year' ? CALENDAR.yearsPerPage : 1))
  }
  return true
}
const focusPeriod = async () => {
  await nextTick()
  rootRef.value?.querySelector<HTMLButtonElement>(`[data-period="${periodFocusKey.value}"]:not(:disabled)`)?.focus()
}
const openPanel = async (next: PeriodPanel) => {
  if (isDisabled.value) return
  if (panel.value === 'date') panelDate.value = visibleMonth.value
  panel.value = next
  periodFocusKey.value = ''
  await focusPeriod()
}
const focusDate = async () => {
  await nextTick()
  const target = rootRef.value?.querySelector<HTMLButtonElement>(`[data-date="${focusKey.value}"]:not(:disabled)`)
    || rootRef.value?.querySelector<HTMLButtonElement>('.scq-calendar__title-button:not(:disabled)')
  target?.focus()
}
const closePanel = async () => {
  panel.value = 'date'
  await focusDate()
}
const selectPeriod = async (date: Date) => {
  if (isDisabled.value || outsideBounds(date, panel.value === 'year' ? endOfYear(date) : endOfMonth(date))) return
  if (panel.value === 'year') {
    panelDate.value = setYear(panelDate.value, date.getFullYear())
    panel.value = 'month'
    periodFocusKey.value = ''
    await focusPeriod()
    return
  }
  if (format(date, MONTH_FORMAT) !== format(visibleMonth.value, MONTH_FORMAT)) focusKey.value = dateKey(date)
  setMonth(date)
  await closePanel()
}
const panelKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || panel.value === 'date') return
  event.preventDefault()
  event.stopPropagation()
  closePanel()
}
const periodKeydown = async (event: KeyboardEvent, key: string) => {
  if (isDisabled.value) return
  const index = periodOptions.value.findIndex((option) => option.key === key)
  let target = index
  if (event.key === 'ArrowLeft') target -= 1
  else if (event.key === 'ArrowRight') target += 1
  else if (event.key === 'ArrowUp') target -= CALENDAR.periodColumns
  else if (event.key === 'ArrowDown') target += CALENDAR.periodColumns
  else if (event.key === 'Home') target -= index % CALENDAR.periodColumns
  else if (event.key === 'End') target += CALENDAR.periodColumns - index % CALENDAR.periodColumns - 1
  else if (event.key !== 'PageUp' && event.key !== 'PageDown') return
  event.preventDefault()
  const direction = event.key === 'PageUp' || target < index ? -1 : 1
  if (event.key === 'PageUp' || event.key === 'PageDown' || target < 0 || target >= periodOptions.value.length) {
    if (!movePanel(direction)) return
    target = (target + periodOptions.value.length) % periodOptions.value.length
  }
  while (periodOptions.value[target]?.disabled) target += direction
  const option = periodOptions.value[target]
  if (!option) return
  periodFocusKey.value = option.key
  await focusPeriod()
}
const selectToday = () => {
  if (isDisabled.value || blocked(new Date())) return
  choose(new Date())
}
const goToday = async (select = false) => {
  if (isDisabled.value) return
  if (select) {
    selectToday()
    return
  }
  const date = new Date()
  if (outsideBounds(startOfMonth(date), endOfMonth(date))) { emit('invalid', 'disabled'); return }
  panel.value = 'date'
  setMonth(date)
  focusKey.value = dateKey(date)
  await focusDate()
}
const keydown = async (event: KeyboardEvent, date: Date) => {
  let target: Date
  if (event.key === 'ArrowLeft') target = addDays(date, -1)
  else if (event.key === 'ArrowRight') target = addDays(date, 1)
  else if (event.key === 'ArrowUp') target = addDays(date, -CALENDAR.daysPerWeek)
  else if (event.key === 'ArrowDown') target = addDays(date, CALENDAR.daysPerWeek)
  else if (event.key === 'Home') target = startOfWeek(date, { weekStartsOn: props.firstDayOfWeek })
  else if (event.key === 'End') target = addDays(startOfWeek(date, { weekStartsOn: props.firstDayOfWeek }), CALENDAR.daysPerWeek - 1)
  else if (event.key === 'PageUp') target = addMonths(date, event.shiftKey ? -CALENDAR.monthsPerYear : -1)
  else if (event.key === 'PageDown') target = addMonths(date, event.shiftKey ? CALENDAR.monthsPerYear : 1)
  else return
  event.preventDefault()
  const direction = target < date ? -1 : 1
  for (let attempts = 0; attempts < CALENDAR.keyboardSearchLimit && blocked(target); attempts += 1) target = addDays(target, direction)
  if (isDisabled.value || blocked(target)) return
  setMonth(target)
  focusKey.value = dateKey(target)
  await nextTick()
  rootRef.value?.querySelector<HTMLButtonElement>(`[data-date="${focusKey.value}"]`)?.focus()
}
watch(() => props.modelValue, (next) => {
  const target = parseDate(Array.isArray(next) ? next[next.length - 1] : next)
  if (target) { panel.value = 'date'; setMonth(target); focusKey.value = dateKey(target) }
})
watch(() => props.month, () => { panel.value = 'date' })
watch([value, visibleMonth, () => props.type, () => props.rangePreview, isDisabled], () => { hoverKey.value = '' })
watch(periodOptions, (options) => {
  if (!options.some((option) => option.key === periodFocusKey.value && !option.disabled)) {
    periodFocusKey.value = (options.find((option) => option.selected && !option.disabled) || options.find((option) => !option.disabled))?.key || ''
  }
})
watch([availableDays, focusKey], ([entries]) => {
  if (entries.some((entry) => entry.key === focusKey.value)) return
  const active = rootRef.value?.ownerDocument.activeElement
  const restoreFocus = active instanceof HTMLElement && rootRef.value?.contains(active) && active.hasAttribute('data-date')
  focusKey.value = (entries.find((entry) => entry.date.getMonth() === visibleMonth.value.getMonth()) || entries[0])?.key || ''
  if (restoreFocus) void focusDate()
}, { immediate: true })
defineExpose({ goToday, selectToday })
</script>
