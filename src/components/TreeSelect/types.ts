import type { TreeKey, TreeSlots } from '../Tree/types'
import type { VirtualListScrollOptions } from '../VirtualList/types'

export type TreeSelectValue = TreeKey | TreeKey[] | null
export type TreeSelectSlots = TreeSlots
export interface TreeSelectExpose {
  focus: (options?: FocusOptions) => boolean
  clear: () => void
  scrollToKey: (key: TreeKey, options?: VirtualListScrollOptions) => void
}
