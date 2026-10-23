import type { Placement } from '@floating-ui/dom'
import type { InitialFocus } from './modal'

export const FLOATING_DEFAULTS = { gap: 8, viewportPadding: 8, zIndex: 3000, showDelay: 80, hideDelay: 100 } as const
export const FLOATING_FOCUSABLE_SELECTOR = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export interface FloatingProps {
  modelValue?: boolean
  content?: string
  placement?: Placement
  trigger?: 'hover' | 'click' | 'focus'
  disabled?: boolean
  showDelay?: number
  hideDelay?: number
  width?: number | string
  teleport?: boolean | string
  ariaLabel?: string
  shiftCrossAxis?: boolean
  zIndex?: number
  initialFocus?: InitialFocus
}

export type FloatingPlacement = Placement