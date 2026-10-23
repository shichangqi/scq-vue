import type { VNode } from 'vue'
import type { VirtualListScrollOptions } from '../VirtualList/types'

export type TreeKey = string | number
export interface TreeNode { key: TreeKey; label: string; children?: TreeNode[]; disabled?: boolean; isLeaf?: boolean; [key: string]: unknown }
export interface TreeCheck { checkedKeys: TreeKey[]; halfCheckedKeys: TreeKey[]; checkedNodes: TreeNode[] }
export interface TreeEntry { node: TreeNode; level: number; parent?: TreeKey; ancestors: TreeKey[]; disabled: boolean; size: number; position: number }
export interface TreeSlotProps { node: TreeNode; index: number; level: number; expanded: boolean; checked: boolean; halfChecked: boolean; disabled: boolean }
export interface TreeSlots { default?: (props: TreeSlotProps) => VNode[]; empty?: () => VNode[] }
export interface TreeExpose {
  getChecked: () => TreeCheck
  getNode: (key: TreeKey) => TreeNode | undefined
  setCheckedKeys: (keys: TreeKey[]) => void
  focus: (options?: FocusOptions) => boolean
  focusKey: (key: TreeKey, options?: FocusOptions) => Promise<boolean>
  scrollToKey: (key: TreeKey, options?: VirtualListScrollOptions) => void
}