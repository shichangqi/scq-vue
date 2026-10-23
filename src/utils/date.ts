import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns'
import { formatTime, parseTime, TIME_FORMATS } from './time'

export const DATE_FORMAT = 'yyyy-MM-dd'
export const MONTH_FORMAT = 'yyyy-MM'
export const DATE_TIME_SEPARATOR = ' '
const DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?)$/

export const dateTimeFormat = (seconds = false) => `${DATE_FORMAT}${DATE_TIME_SEPARATOR}${seconds ? TIME_FORMATS.seconds : TIME_FORMATS.minutes}`
export const dateTimeKey = (date: Date, seconds = false) => format(date, dateTimeFormat(seconds))

export const parseDate = (value?: string): Date | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return
  const date = parseISO(value)
  return isValid(date) && format(date, DATE_FORMAT) === value ? date : undefined
}
export const dateKey = (date: Date) => format(date, DATE_FORMAT)
export const parseDateTime = (value?: string): Date | undefined => {
  const match = value && DATE_TIME_PATTERN.exec(value)
  if (!match) return
  const date = parseDate(match[1])
  const time = parseTime(match[2])
  if (!date || !time) return
  date.setHours(time.hour, time.minute, time.second, 0)
  const seconds = match[2] === formatTime(time, true)
  return dateTimeKey(date, seconds) === value ? date : undefined
}

export const dateDisabled = (date: Date, min?: string, max?: string, disabledDate?: (date: Date) => boolean) => {
  const value = startOfDay(date).getTime()
  const minimum = parseDate(min)?.getTime()
  const maximum = parseDate(max)?.getTime()
  return (minimum !== undefined && value < minimum) || (maximum !== undefined && value > maximum) || Boolean(disabledDate?.(date))
}

export const dateRangeInvalid = (start: Date, end: Date, blocked: (date: Date) => boolean, maxRange?: number): 'disabled' | 'max-range' | undefined => {
  const count = differenceInCalendarDays(end, start) + 1
  if (maxRange && count > maxRange) return 'max-range'
  const first = startOfDay(start)
  for (let index = 0; index < count; index += 1) {
    if (blocked(addDays(first, index))) return 'disabled'
  }
}