import type { VNode } from 'vue'
import type { VirtualListScrollOptions } from '../VirtualList/types'

export type TransferKey = string | number
export type TransferSide = 'left' | 'right'
export interface TransferItem { key: TransferKey; label: string; disabled?: boolean; [key: string]: unknown }
export interface TransferSlotProps { item: TransferItem; index: number; side: TransferSide; checked: boolean; disabled: boolean }
export interface TransferSlots {
  default?: (props: TransferSlotProps) => VNode[]
  empty?: (props: { side: TransferSide }) => VNode[]
  'left-footer'?: (props: { items: TransferItem[]; checkedKeys: TransferKey[] }) => VNode[]
  'right-footer'?: (props: { items: TransferItem[]; checkedKeys: TransferKey[] }) => VNode[]
}
export interface TransferExpose {
  clearQuery: (side: TransferSide) => void
  focus: (options?: FocusOptions) => boolean
  focusKey: (key: TransferKey, side: TransferSide, options?: FocusOptions) => Promise<boolean>
  scrollToKey: (key: TransferKey, side: TransferSide, options?: VirtualListScrollOptions) => void
}
