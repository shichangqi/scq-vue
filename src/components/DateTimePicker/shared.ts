import { format, startOfDay } from 'date-fns'
import { DATE_TIME_SEPARATOR, dateKey, dateRangeInvalid, dateTimeKey, parseDate, parseDateTime } from '../../utils/date'
import { createTimeResolver, DEFAULT_TIME_STEP, formatTime, parseTime, TIME_HOURS, TIME_LIMITS, timeOptions, validTimeStep, type TimeParts } from '../../utils/time'

export type DateTimePickerType = 'datetime' | 'datetimerange'
export type DateTimePickerValue = string | [] | [string, string]
export type DateTimePickerRole = 'single' | 'start' | 'end'
export type DateTimePickerInvalidReason = 'format' | 'incomplete' | 'out-of-range' | 'disabled-date' | 'disabled-time' | 'range-order' | 'max-range' | 'step' | 'configuration'
export interface DateTimePickerShortcut {
  label: string
  value: DateTimePickerValue | (() => DateTimePickerValue)
  disabled?: boolean
}
export interface DateTimePickerConstraints {
  seconds: boolean
  minuteStep: number
  secondStep: number
  min?: string
  max?: string
  maxRange?: number
  defaultTime?: string | [string, string]
  disabledDate?: (date: Date) => boolean
  disabledTime?: (date: Date, role: DateTimePickerRole) => boolean
}

export const DATE_TIME_PICKER_DEFAULTS = {
  type: 'datetime',
  seconds: false,
  minuteStep: DEFAULT_TIME_STEP,
  secondStep: DEFAULT_TIME_STEP,
  firstDayOfWeek: 1,
  readonly: false,
  clearable: true,
  showNow: true,
  teleport: true,
  rangeSeparator: ' ~ ',
} as const
export const DATE_TIME_PICKER_LAYOUT = {
  panelWidth: 'min(calc(var(--scq-picker-calendar-width) + var(--scq-picker-time-width)), calc(100vw - var(--scq-picker-viewport-gap) * 2))',
  iconSize: 18,
  clearIconSize: 14,
} as const
export const DATE_TIME_PICKER_FOCUS_SELECTOR = '.scq-calendar button[data-date][tabindex="0"]:not(:disabled)'
export const DATE_TIME_INVALID_MESSAGES = {
  format: 'dateTimeFormatError',
  incomplete: 'dateTimeIncomplete',
  'out-of-range': 'dateTimeBoundsError',
  'disabled-date': 'dateTimeDateError',
  'disabled-time': 'dateTimeTimeError',
  'range-order': 'dateTimeOrderError',
  'max-range': 'dateTimeRangeError',
  step: 'dateTimeStepError',
  configuration: 'dateTimeConfigError',
} as const satisfies Record<DateTimePickerInvalidReason, string>

export const dateTimeParts = (date: Date): TimeParts => ({ hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() })
export const isEmptyDateTimeValue = (value: DateTimePickerValue) => Array.isArray(value) ? value.every((entry) => !entry) : !value

export const validDateTimeConfiguration = (options: DateTimePickerConstraints, displayFormat: string) => {
  if (!validTimeStep(options.minuteStep, 'minute') || !validTimeStep(options.secondStep, 'second')) return false
  const min = parseDateTime(options.min)
  const max = parseDateTime(options.max)
  if ((options.min && !min) || (options.max && !max) || (min && max && min > max)) return false
  if (options.maxRange !== undefined && (!Number.isInteger(options.maxRange) || options.maxRange < 1)) return false
  if (options.defaultTime !== undefined) {
    const defaults = Array.isArray(options.defaultTime) ? options.defaultTime : [options.defaultTime]
    if (Array.isArray(options.defaultTime) && defaults.length !== 2) return false
    if (defaults.some((value) => {
      const parts = parseTime(value)
      return !parts || (!options.seconds && parts.second !== 0) || (value !== formatTime(parts) && value !== formatTime(parts, true))
    })) return false
  }
  try {
    format(new Date(0), displayFormat)
    return true
  } catch (error) {
    if (error instanceof RangeError) return false
    throw error
  }
}

const timeInvalid = (
  date: Date,
  role: DateTimePickerRole,
  options: DateTimePickerConstraints,
  min = parseDateTime(options.min),
  max = parseDateTime(options.max),
): DateTimePickerInvalidReason | undefined => {
  if ((min && date < min) || (max && date > max)) return 'out-of-range'
  if (date.getMinutes() % options.minuteStep || (options.seconds && date.getSeconds() % options.secondStep)) return 'step'
  if (options.disabledTime?.(date, role)) return 'disabled-time'
}

export const dateTimeValueInvalid = (value: DateTimePickerValue, isRange: boolean, options: DateTimePickerConstraints): DateTimePickerInvalidReason | undefined => {
  if (isRange !== Array.isArray(value)) return 'format'
  const values = Array.isArray(value) ? value : [value]
  if (isRange && values.length !== 0 && values.length !== 2) return 'format'
  if (!values.length || values.some((entry) => !entry)) return 'incomplete'
  const dates: Date[] = []
  for (const [index, entry] of values.entries()) {
    const date = parseDateTime(entry)
    if (!date || dateTimeKey(date, options.seconds) !== entry) return 'format'
    if (options.disabledDate?.(startOfDay(date))) return 'disabled-date'
    const reason = timeInvalid(date, isRange ? (index ? 'end' : 'start') : 'single', options)
    if (reason) return reason
    dates.push(date)
  }
  if (isRange) {
    if (dates[0] > dates[1]) return 'range-order'
    if (options.disabledDate || options.maxRange) {
      const reason = dateRangeInvalid(dates[0], dates[1], (date) => Boolean(options.disabledDate?.(date)), options.maxRange)
      if (reason) return reason === 'disabled' ? 'disabled-date' : reason
    }
  }
}

// Reuse candidate results across the hour, minute and second columns.
export const createDateTimeResolver = (day: string, role: DateTimePickerRole, options: DateTimePickerConstraints) => {
  const base = parseDate(day)
  const min = parseDateTime(options.min)
  const max = parseDateTime(options.max)
  const minimumDay = min && dateKey(min)
  const maximumDay = max && dateKey(max)
  const minimumTime = minimumDay === day && min ? dateTimeParts(min) : undefined
  const maximumTime = maximumDay === day && max ? dateTimeParts(max) : undefined
  const blocked = !base || (minimumDay && day < minimumDay) || (maximumDay && day > maximumDay) || Boolean(options.disabledDate?.(base))
  const values = {
    hour: TIME_HOURS.filter((hour) => (!minimumTime || hour >= minimumTime.hour) && (!maximumTime || hour <= maximumTime.hour)),
    minute: timeOptions(TIME_LIMITS.minute, options.minuteStep),
    second: options.seconds ? timeOptions(TIME_LIMITS.second, options.secondStep) : [0],
  }
  const resolve = createTimeResolver({
    values, min: minimumTime || undefined, max: maximumTime || undefined,
    disabled: (parts) => {
      if (!base) return true
      const date = new Date(base)
      date.setHours(parts.hour, parts.minute, parts.second, 0)
      const exists = date.getDate() === base.getDate() && date.getHours() === parts.hour && date.getMinutes() === parts.minute && date.getSeconds() === parts.second
      return !exists || Boolean(timeInvalid(date, role, options, min, max))
    },
  })
  return (preferred: TimeParts, fixed: Partial<TimeParts> = {}): string | undefined => {
    if (!base || blocked) return
    const parts = resolve(preferred, fixed)
    return parts ? `${day}${DATE_TIME_SEPARATOR}${formatTime(parts, options.seconds)}` : undefined
  }
}
