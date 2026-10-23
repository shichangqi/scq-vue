import type { TreeNode } from './types'

export const isTreeBranch = (node: TreeNode, canLoad: boolean, loadedChildren?: readonly TreeNode[]) => {
  const children = loadedChildren ?? node.children
  return Boolean(children?.length || (canLoad && !node.isLeaf && !children))
}
