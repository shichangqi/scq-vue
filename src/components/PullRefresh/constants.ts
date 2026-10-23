import { EDITABLE_TARGET_SELECTOR } from '../../utils/focus'

export const PULL_REFRESH_DEFAULTS = {
  headHeight: 56,
  pullDistance: 64,
  resultDuration: 1500,
} as const

export const PULL_REFRESH_DAMPING = 2
export const PULL_REFRESH_MAX_DISTANCE_RATIO = 2
export { MAX_TIMEOUT_DELAY as MAX_RESULT_DURATION } from '../../utils/async'
export const REFRESH_INTERACTIVE_SELECTOR = `button, a, ${EDITABLE_TARGET_SELECTOR}`
