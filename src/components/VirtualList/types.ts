import type { HTMLAttributes, VNode } from 'vue'

export type VirtualListKey = string | number
export interface VirtualListScrollOptions {
  align?: 'start' | 'center' | 'end' | 'auto'
  behavior?: 'auto' | 'smooth'
}
export interface VirtualListExpose {
  scrollToIndex: (index: number, options?: VirtualListScrollOptions) => void
  scrollToKey: (key: VirtualListKey, options?: VirtualListScrollOptions) => void
  scrollToOffset: (offset: number) => void
  measure: () => void
}
export interface VirtualListProps<Item = unknown> {
  items?: readonly Item[]
  height?: number | string
  itemHeight?: number
  itemKey?: keyof Item | ((item: Item, index: number) => VirtualListKey)
  overscan?: number
  dynamic?: boolean
  activeIndex?: number
  preserveScrollPosition?: boolean
  role?: HTMLAttributes['role']
  itemRole?: HTMLAttributes['role']
  ariaLabel?: string
}
export interface VirtualListSlots<Item = unknown> {
  default?: (props: { item: Item; index: number }) => VNode[]
  empty?: () => VNode[]
}
