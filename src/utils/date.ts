import { format, isValid, parseISO, startOfDay } from 'date-fns'

export const parseDate = (value?: string): Date | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return
  const date = parseISO(value)
  return isValid(date) && format(date, 'yyyy-MM-dd') === value ? date : undefined
}
export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd')
export const dateDisabled = (date: Date, min?: string, max?: string, disabledDate?: (date: Date) => boolean) => {
  const value = startOfDay(date).getTime()
  const minimum = parseDate(min)?.getTime()
  const maximum = parseDate(max)?.getTime()
  return (minimum !== undefined && value < minimum) || (maximum !== undefined && value > maximum) || Boolean(disabledDate?.(date))
}