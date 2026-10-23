<template>
  <div ref="rootRef" v-bind="field.rootAttrs.value" class="scq-date-time-picker" :class="{ 'is-range': isRange }" @focusout="field.touch">
    <Popover
      v-model="opened"
      :disabled="isLocked"
      :teleport="teleport"
      placement="bottom-start"
      shift-cross-axis
      :width="DATE_TIME_PICKER_LAYOUT.panelWidth"
      :aria-label="label"
      :initial-focus="initialFocus"
    >
      <template #reference>
        <span
          class="scq-field"
          :class="[
            `scq-field--${size || config.size}`,
            { 'is-disabled': isDisabled, 'is-readonly': readonly, 'is-open': opened, 'is-invalid': errorReason },
          ]"
        >
          <button
            ref="triggerRef"
            type="button"
            class="scq-field__trigger"
            :disabled="isDisabled"
            :aria-disabled="readonly || undefined"
            :aria-label="label"
            v-bind="field.attrs.value"
            :aria-expanded="opened"
            aria-haspopup="dialog"
            :title="displayValue"
            @keydown.down.prevent="show"
            @focus="emit('focus', $event)"
            @blur="emit('blur', $event)"
          >
            <Icon name="calendar" :size="DATE_TIME_PICKER_LAYOUT.iconSize" />
            <span class="scq-field__value" :class="{ 'scq-field__placeholder': !hasValue }">
              {{ displayValue || placeholder || label }}
            </span>
          </button>
          <button
            v-if="clearable && hasValue && !isLocked"
            type="button"
            class="scq-field__clear"
            :aria-label="text('clear')"
            @click.stop="clear"
          >
            <Icon name="close" :size="DATE_TIME_PICKER_LAYOUT.clearIconSize" />
          </button>
        </span>
      </template>

      <div ref="panelRef" class="scq-date-time-picker__panel" :style="{ colorScheme: config.theme }" @focusout="field.touch">
        <div v-if="shortcuts.length" class="scq-date-time-picker__shortcuts" role="group" :aria-label="text('shortcuts')">
          <button
            v-for="(shortcut, index) in shortcuts"
            :key="index"
            type="button"
            :disabled="shortcut.disabled || Boolean(configurationError)"
            @click="selectShortcut(shortcut)"
          >
            {{ shortcut.label }}
          </button>
        </div>
        <div v-if="isRange" class="scq-date-time-picker__endpoints" role="tablist" :aria-label="label">
          <button
            v-for="(endpoint, index) in endpointLabels"
            :id="`${pickerId}-tab-${index}`"
            :key="endpoint"
            type="button"
            role="tab"
            :aria-selected="activeIndex === index"
            :aria-controls="`${pickerId}-content`"
            :tabindex="activeIndex === index ? 0 : -1"
            @click="activate(index)"
            @keydown="endpointKeydown($event)"
          >
            <span>{{ endpoint }}</span>
            <strong>{{ formatDisplay(draft[index]) || text('chooseDateTime') }}</strong>
          </button>
        </div>
        <div
          :id="`${pickerId}-content`"
          class="scq-date-time-picker__body"
          :role="isRange ? 'tabpanel' : undefined"
          :aria-labelledby="isRange ? `${pickerId}-tab-${activeIndex}` : undefined"
        >
          <div class="scq-date-time-picker__date">
            <Calendar
              class="scq-calendar--compact"
              :model-value="activeDay"
              v-model:month="month"
              :min-date="minimumDay"
              :max-date="maximumDay"
              :disabled-date="disabledDate"
              :disabled="isLocked || Boolean(configurationError)"
              :first-day-of-week="firstDayOfWeek"
              :show-today="false"
              @select="selectDate"
            >
              <template #day="{ date, selected }">
                <span class="scq-date-time-picker__day" :class="{ 'is-in-range': inDraftRange(date) }">
                  <slot name="day" :date="date" :selected="selected" :in-range="inDraftRange(date)">{{ date.getDate() }}</slot>
                </span>
              </template>
            </Calendar>
          </div>
          <div class="scq-date-time-picker__time">
            <div class="scq-date-time-picker__time-title">
              <Icon name="clock" :size="DATE_TIME_PICKER_LAYOUT.clearIconSize" />
              <span>{{ text(activeDay ? 'chooseTime' : 'selectDateFirst') }}</span>
              <strong>{{ activeTime }}</strong>
            </div>
            <TimePickerPanel
              :model-value="activeTime"
              :seconds="seconds"
              :minutes="minutes"
              :second-values="secondValues"
              :disabled="!activeDay || Boolean(configurationError)"
              :disabled-part="(part, value) => !timeChoices[part].has(value)"
              @select="selectTimePart"
            />
          </div>
        </div>
        <p
          v-if="statusMessage"
          :id="`${pickerId}-status`"
          class="scq-date-time-picker__status is-error"
          role="alert"
        >
          {{ statusMessage }}
        </p>
        <div v-if="$slots.footer" class="scq-date-time-picker__extra">
          <slot name="footer" :value="draftValue" />
        </div>
        <div class="scq-date-time-picker__footer">
          <button v-if="showNow" type="button" class="scq-date-time-picker__now" :disabled="Boolean(configurationError)" @click="selectNow">
            {{ text('now') }}
          </button>
          <span class="scq-date-time-picker__actions">
            <button type="button" class="scq-date-time-picker__cancel" @click="cancel">{{ cancelText || text('cancel') }}</button>
            <button type="button" class="scq-date-time-picker__confirm" :disabled="Boolean(draftError)" @click="confirm">
              {{ confirmText || text('confirm') }}
            </button>
          </span>
        </div>
      </div>
    </Popover>
    <template v-if="name">
      <input
        v-for="(entry, index) in submittedValues"
        :key="index"
        type="hidden"
        :name="isRange ? `${name}[${index}]` : name"
        :value="entry"
        :disabled="isDisabled"
      />
    </template>
    <p v-if="!opened && errorReason" :id="`${pickerId}-status`" class="scq-date-time-picker__status is-error" role="alert">{{ statusMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { format as formatDate } from 'date-fns'
import Calendar from '../Calendar/Calendar.vue'
import Icon from '../Icon/Icon.vue'
import Popover from '../Popover/Popover.vue'
import TimePickerPanel from '../TimePicker/TimePickerPanel.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import { dateKey, dateTimeFormat, dateTimeKey, MONTH_FORMAT, parseDateTime } from '../../utils/date'
import { useComponentId } from '../../utils/id'
import { DEFAULT_TIME_PARTS, formatTime, parseTime, TIME_HOURS, TIME_LIMITS, timeOptions, type TimePart } from '../../utils/time'
import {
  createDateTimeResolver, DATE_TIME_INVALID_MESSAGES, DATE_TIME_PICKER_DEFAULTS, DATE_TIME_PICKER_LAYOUT, DATE_TIME_PICKER_FOCUS_SELECTOR,
  dateTimeParts, dateTimeValueInvalid, isEmptyDateTimeValue, validDateTimeConfiguration,
  type DateTimePickerInvalidReason, type DateTimePickerRole, type DateTimePickerShortcut, type DateTimePickerType, type DateTimePickerValue,
} from './shared'

defineOptions({ name: 'DateTimePicker', inheritAttrs: false })
const props = withDefaults(defineProps<{
  modelValue?: DateTimePickerValue
  type?: DateTimePickerType
  seconds?: boolean
  format?: string
  min?: string
  max?: string
  disabledDate?: (date: Date) => boolean
  disabledTime?: (date: Date, role: DateTimePickerRole) => boolean
  maxRange?: number
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  minuteStep?: number
  secondStep?: number
  defaultTime?: string | [string, string]
  shortcuts?: DateTimePickerShortcut[]
  showNow?: boolean
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  placeholder?: string
  rangeSeparator?: string
  confirmText?: string
  cancelText?: string
  ariaLabel?: string
  id?: string
  name?: string
  size?: ComponentSize
  teleport?: boolean | string
}>(), { ...DATE_TIME_PICKER_DEFAULTS, disabled: undefined, shortcuts: () => [] })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change' | 'confirm' | 'draft-change', value: DateTimePickerValue): void
  (event: 'clear' | 'cancel'): void
  (event: 'visible-change', opened: boolean): void
  (event: 'invalid', reason: DateTimePickerInvalidReason, value: DateTimePickerValue): void
  (event: 'focus' | 'blur', value: FocusEvent): void
}>()

const config = useConfig()
const text = useLocale()
const pickerId = useComponentId('scq-date-time-picker')
const rootRef = ref<HTMLElement>()
const field = useFormControl({
  element: () => triggerRef.value, id: () => props.id, disabled: () => props.disabled,
  ariaLabel: () => props.ariaLabel, composite: true,
  describedBy: () => statusMessage.value ? `${pickerId}-status` : undefined,
  invalid: () => Boolean(errorReason.value),
  contains: (target) => Boolean(rootRef.value?.contains(target) || panelRef.value?.contains(target)),
})
const isDisabled = field.disabled
const isLocked = computed(() => isDisabled.value || props.readonly)
const isRange = computed(() => props.type === 'datetimerange')
const emptyValue = (): DateTimePickerValue => isRange.value ? [] : ''
const internal = ref<DateTimePickerValue>(emptyValue())
const value = computed(() => props.modelValue ?? internal.value)
const hasValue = computed(() => !isEmptyDateTimeValue(value.value))
const opened = ref(false)
const triggerRef = ref<HTMLButtonElement>()
const panelRef = ref<HTMLElement>()
const initialFocus = () => panelRef.value?.querySelector<HTMLButtonElement>(DATE_TIME_PICKER_FOCUS_SELECTOR) ?? null
const activeIndex = ref(0)
const draft = ref<[string, string]>(['', ''])
const month = ref('')
const actionError = ref<DateTimePickerInvalidReason>()
const displayFormat = computed(() => props.format || dateTimeFormat(props.seconds))
const configurationError = computed<DateTimePickerInvalidReason | undefined>(() =>
  validDateTimeConfiguration(props, displayFormat.value) ? undefined : 'configuration')
const draftValue = computed<DateTimePickerValue>(() => isRange.value ? [draft.value[0], draft.value[1]] : draft.value[0])
const draftError = computed(() => configurationError.value || dateTimeValueInvalid(draftValue.value, isRange.value, props))
const modelError = computed(() => configurationError.value || (hasValue.value ? dateTimeValueInvalid(value.value, isRange.value, props) : undefined))
const errorReason = computed(() => {
  const reason = configurationError.value || actionError.value || (opened.value ? draftError.value : modelError.value)
  return reason === 'incomplete' ? undefined : reason
})
const label = computed(() => props.ariaLabel || text(isRange.value ? 'chooseDateTimeRange' : 'chooseDateTime'))
const endpointLabels = computed(() => [text('startDateTime'), text('endDateTime')])
const activeDate = computed(() => parseDateTime(draft.value[activeIndex.value]))
const activeDay = computed(() => activeDate.value ? dateKey(activeDate.value) : '')
const activeTime = computed(() => activeDate.value ? formatTime(dateTimeParts(activeDate.value), props.seconds) : '')
const statusMessage = computed(() => errorReason.value ? text(DATE_TIME_INVALID_MESSAGES[errorReason.value]) : '')
const minimumDay = computed(() => { const date = parseDateTime(props.min); return date ? dateKey(date) : undefined })
const maximumDay = computed(() => { const date = parseDateTime(props.max); return date ? dateKey(date) : undefined })
const minutes = computed(() => configurationError.value ? [] : timeOptions(TIME_LIMITS.minute, props.minuteStep))
const secondValues = computed(() => configurationError.value ? [] : timeOptions(TIME_LIMITS.second, props.secondStep))
const role = computed<DateTimePickerRole>(() => isRange.value ? (activeIndex.value ? 'end' : 'start') : 'single')
const submittedValues = computed(() => {
  const entries = Array.isArray(value.value) ? value.value : [value.value]
  return isRange.value ? [entries[0] || '', entries[1] || ''] : [entries[0] || '']
})

const formatDisplay = (entry?: string) => {
  if (!entry) return ''
  const date = parseDateTime(entry)
  return date && !configurationError.value ? formatDate(date, displayFormat.value) : entry
}
const displayValue = computed(() => submittedValues.value.map(formatDisplay).filter(Boolean).join(props.rangeSeparator))
const snapshot = (next: DateTimePickerValue): DateTimePickerValue => Array.isArray(next) ? next.length ? [next[0], next[1]] : [] : next
const reportInvalid = (reason: DateTimePickerInvalidReason, attempted = draftValue.value) => {
  actionError.value = reason
  emit('invalid', reason, snapshot(attempted))
}
const updateMonth = () => {
  const current = activeDate.value || parseDateTime(draft.value[activeIndex.value ? 0 : 1])
  const min = parseDateTime(props.min)
  const max = parseDateTime(props.max)
  const today = new Date()
  month.value = formatDate(current || (min && today < min ? min : max && today > max ? max : today), MONTH_FORMAT)
}
const syncDraft = () => {
  if (!hasValue.value) activeIndex.value = 0
  const entries = Array.isArray(value.value) ? value.value : [value.value]
  draft.value = [entries[0] || '', isRange.value ? entries[1] || '' : '']
  actionError.value = undefined
  updateMonth()
}
const updateDraft = (next: [string, string]) => {
  draft.value = next
  actionError.value = undefined
  emit('draft-change', snapshot(draftValue.value))
  const reason = draftError.value
  if (reason && reason !== 'incomplete') emit('invalid', reason, snapshot(draftValue.value))
}
const updateEntry = (next: string) => {
  const entries: [string, string] = [draft.value[0], draft.value[1]]
  entries[activeIndex.value] = next
  updateDraft(entries)
}

const timeChoices = computed(() => {
  const choices: Record<TimePart, Map<number, string>> = { hour: new Map(), minute: new Map(), second: new Map() }
  if (!activeDate.value || configurationError.value) return choices
  const preferred = dateTimeParts(activeDate.value)
  const resolve = createDateTimeResolver(activeDay.value, role.value, props)
  for (const hour of TIME_HOURS) {
    const candidate = resolve(preferred, { hour })
    if (candidate) choices.hour.set(hour, candidate)
  }
  for (const minute of minutes.value) {
    const candidate = resolve(preferred, { hour: preferred.hour, minute })
    if (candidate) choices.minute.set(minute, candidate)
  }
  if (props.seconds) {
    for (const second of secondValues.value) {
      const candidate = resolve(preferred, { ...preferred, second })
      if (candidate) choices.second.set(second, candidate)
    }
  }
  return choices
})
const selectDate = (day: string) => {
  if (isLocked.value || configurationError.value) return
  const defaultTime = Array.isArray(props.defaultTime) ? props.defaultTime[activeIndex.value] : props.defaultTime
  const preferred = activeDate.value ? dateTimeParts(activeDate.value) : parseTime(defaultTime) || DEFAULT_TIME_PARTS
  const candidate = createDateTimeResolver(day, role.value, props)(preferred)
  if (!candidate) { reportInvalid('disabled-time'); return }
  updateEntry(candidate)
}
const selectTimePart = (part: TimePart, option: number) => {
  if (isLocked.value || configurationError.value) return
  const candidate = timeChoices.value[part].get(option)
  if (!candidate) { reportInvalid('disabled-time'); return }
  updateEntry(candidate)
}
const selectNow = () => {
  if (isLocked.value || configurationError.value) return
  const now = new Date()
  now.setMinutes(Math.floor(now.getMinutes() / props.minuteStep) * props.minuteStep)
  now.setSeconds(props.seconds ? Math.floor(now.getSeconds() / props.secondStep) * props.secondStep : 0, 0)
  const candidate = dateTimeKey(now, props.seconds)
  const invalid = dateTimeValueInvalid(candidate, false, {
    ...props,
    disabledTime: (date) => Boolean(props.disabledTime?.(date, role.value)),
  })
  if (invalid) { reportInvalid(invalid, candidate); return }
  updateEntry(candidate)
  updateMonth()
}
const selectShortcut = (shortcut: DateTimePickerShortcut) => {
  if (isLocked.value || configurationError.value || shortcut.disabled) return
  const next = typeof shortcut.value === 'function' ? shortcut.value() : shortcut.value
  const invalid = dateTimeValueInvalid(next, isRange.value, props)
  if (invalid) { reportInvalid(invalid, next); return }
  if (typeof next === 'string') updateDraft([next, ''])
  else if (next.length === 2) updateDraft([next[0], next[1]])
  else { reportInvalid('incomplete', next); return }
  updateMonth()
}
const activate = (index: number) => {
  activeIndex.value = index
  actionError.value = undefined
  updateMonth()
}
const endpointKeydown = async (event: KeyboardEvent) => {
  let index = activeIndex.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') index = index ? 0 : 1
  else if (event.key === 'Home') index = 0
  else if (event.key === 'End') index = 1
  else return
  event.preventDefault()
  activate(index)
  await nextTick()
  panelRef.value?.querySelector<HTMLButtonElement>(`[id="${pickerId}-tab-${index}"]`)?.focus()
}
const inDraftRange = (date: Date) => {
  if (!isRange.value) return false
  const start = parseDateTime(draft.value[0])
  const end = parseDateTime(draft.value[1])
  const day = dateKey(date)
  return Boolean(start && end && start <= end && day >= dateKey(start) && day <= dateKey(end))
}
const focus = () => triggerRef.value?.focus()
const show = () => { if (!isLocked.value) opened.value = true }
const hide = () => { opened.value = false }
const clear = () => {
  if (isLocked.value) return
  const next = emptyValue()
  internal.value = next
  draft.value = ['', '']
  actionError.value = undefined
  emit('update:modelValue', snapshot(next))
  emit('change', snapshot(next))
  emit('clear')
  hide()
  focus()
}
const confirm = () => {
  if (isLocked.value || !opened.value) return
  if (draftError.value) { reportInvalid(draftError.value); return }
  internal.value = snapshot(draftValue.value)
  emit('update:modelValue', snapshot(draftValue.value))
  emit('change', snapshot(draftValue.value))
  emit('confirm', snapshot(draftValue.value))
  hide()
  focus()
}
const cancel = () => {
  hide()
  emit('cancel')
  focus()
}

watch(opened, (visible) => {
  emit('visible-change', visible)
  if (visible) {
    syncDraft()
  } else {
    actionError.value = undefined
  }
})
watch(isLocked, (locked) => { if (locked) hide() })
watch(() => props.modelValue, () => { if (opened.value) syncDraft() }, { deep: true })
watch(() => props.type, () => {
  if (props.modelValue === undefined) internal.value = emptyValue()
  activeIndex.value = 0
  syncDraft()
})
watch(modelError, (reason) => {
  if (reason) emit('invalid', reason, snapshot(value.value))
}, { immediate: true })

defineExpose({ focus, show, hide, clear, confirm })
</script>
