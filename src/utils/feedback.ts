import { MAX_TIMEOUT_DELAY } from './async'

export const MESSAGE_DEFAULTS = { duration: 3000, offset: 24, zIndex: 10000 } as const
export const TOAST_DEFAULTS = { duration: 2000, zIndex: 4000 } as const
export const NOTIFICATION_DEFAULTS = { duration: 4500, offset: 16, zIndex: 4000, gap: 12, estimatedHeight: 96 } as const
export const FEEDBACK_CLEANUP_DELAY = 250

export const validateFeedbackOptions = (options: { duration?: number; offset?: number; zIndex?: number }, component: string) => {
  if (options.duration !== undefined && (!Number.isFinite(options.duration) || options.duration > MAX_TIMEOUT_DELAY)) {
    throw new RangeError(`[scq-vue] ${component} duration must be finite and no greater than ${MAX_TIMEOUT_DELAY}; non-positive durations disable auto-close.`)
  }
  if (options.offset !== undefined && !Number.isFinite(options.offset)) throw new RangeError(`[scq-vue] ${component} offset must be finite.`)
  if (options.zIndex !== undefined && !Number.isInteger(options.zIndex)) throw new RangeError(`[scq-vue] ${component} zIndex must be a finite integer.`)
}

export const resolveFeedbackTarget = (selector: string | undefined, component: string) => {
  const target = selector ? document.querySelector(selector) : document.body
  if (!target) throw new Error(`[scq-vue] ${component} teleport target was not found: ${selector}`)
  return target
}
