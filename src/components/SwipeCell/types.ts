import type { AsyncGuard } from '../../utils/async'

export type SwipeCellPosition = '' | 'left' | 'right'
export type SwipeCellGroup = string | number
export type SwipeCellCloseReason = 'cell' | 'action' | 'keyboard' | 'method' | 'group' | 'outside'

export interface SwipeCellClose {
  position: SwipeCellPosition
  reason: SwipeCellCloseReason
}

export interface SwipeCellGroupConflict {
  group: SwipeCellGroup
  cells: { id: string; position: Exclude<SwipeCellPosition, ''> }[]
}

export interface SwipeCellProps {
  modelValue?: SwipeCellPosition
  disabled?: boolean
  leftWidth?: number
  rightWidth?: number
  ariaLabel?: string
  beforeClose?: AsyncGuard<SwipeCellClose>
  group?: SwipeCellGroup
  closeOnClickOutside?: boolean
}
