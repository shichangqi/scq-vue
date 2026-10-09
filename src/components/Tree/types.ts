export type TreeKey = string | number
export interface TreeNode { key: TreeKey; label: string; children?: TreeNode[]; disabled?: boolean; isLeaf?: boolean; [key: string]: unknown }
export interface TreeCheck { checkedKeys: TreeKey[]; halfCheckedKeys: TreeKey[]; checkedNodes: TreeNode[] }