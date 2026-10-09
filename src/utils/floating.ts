import type { Placement } from '@floating-ui/dom'

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
}

export type FloatingPlacement = Placement