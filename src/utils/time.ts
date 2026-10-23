export type TimePart = 'hour' | 'minute' | 'second'
export type TimeParts = Record<TimePart, number>

export const TIME_PARTS: readonly TimePart[] = ['hour', 'minute', 'second']
export const TIME_LIMITS: TimeParts = { hour: 24, minute: 60, second: 60 }
export const DEFAULT_TIME_PARTS: TimeParts = { hour: 0, minute: 0, second: 0 }
export const DEFAULT_TIME_STEP = 1
export const TIME_FORMATS = { minutes: 'HH:mm', seconds: 'HH:mm:ss' } as const
const TIME_PAD_LENGTH = 2
const TIME_PATTERN = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/

export const padTimePart = (value: number) => String(value).padStart(TIME_PAD_LENGTH, '0')
export const timeOptions = (limit: number, step = DEFAULT_TIME_STEP) =>
  Array.from({ length: Math.ceil(limit / step) }, (_, index) => index * step)
export const TIME_HOURS = timeOptions(TIME_LIMITS.hour)
export const TIME_MINUTES = timeOptions(TIME_LIMITS.minute)
export const TIME_SECONDS = timeOptions(TIME_LIMITS.second)

export const parseTime = (value?: string | null): TimeParts | null => {
  if (!value || typeof value !== 'string') return null
  const match = TIME_PATTERN.exec(value.trim())
  if (!match) return null
  const parts = { hour: Number(match[1]), minute: Number(match[2]), second: Number(match[3] || 0) }
  return TIME_PARTS.every((part) => parts[part] >= 0 && parts[part] < TIME_LIMITS[part]) ? parts : null
}

export const formatTime = (parts: TimeParts, seconds = false) =>
  (seconds ? TIME_PARTS : TIME_PARTS.slice(0, -1)).map((part) => padTimePart(parts[part])).join(':')

export const validTimeStep = (step: number, part: TimePart) =>
  Number.isInteger(step) && step > 0 && step < TIME_LIMITS[part]

export const timeValue = (parts: TimeParts) => (parts.hour * TIME_LIMITS.minute + parts.minute) * TIME_LIMITS.second + parts.second

export const createTimeResolver = (options: {
  values: Record<TimePart, readonly number[]>
  min?: TimeParts
  max?: TimeParts
  disabled?: (parts: TimeParts) => boolean
}) => {
  const cache = new Map<number, boolean>()
  return (preferred: TimeParts, fixed: Partial<TimeParts> = {}): TimeParts | undefined => {
    const target = timeValue(preferred)
    const nearest = options.min && target < timeValue(options.min) ? options.min
      : options.max && target > timeValue(options.max) ? options.max : preferred
    const ordered = (part: TimePart) => fixed[part] !== undefined
      ? options.values[part].filter((value) => value === fixed[part])
      : [...options.values[part]].sort((a, b) => Math.abs(a - nearest[part]) - Math.abs(b - nearest[part]))
    const minutes = ordered('minute')
    const seconds = ordered('second')
    for (const hour of ordered('hour')) {
      if (options.min && hour < options.min.hour || options.max && hour > options.max.hour) continue
      for (const minute of minutes) {
        if (options.min && hour === options.min.hour && minute < options.min.minute) continue
        if (options.max && hour === options.max.hour && minute > options.max.minute) continue
        for (const second of seconds) {
          const parts = { hour, minute, second }
          const value = timeValue(parts)
          if (options.min && value < timeValue(options.min) || options.max && value > timeValue(options.max)) continue
          if (!cache.has(value)) cache.set(value, !options.disabled?.(parts))
          if (cache.get(value)) return parts
        }
      }
    }
  }
}
