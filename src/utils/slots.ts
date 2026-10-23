import { Comment, Fragment, isVNode, Text, type VNodeChild } from 'vue'

export const hasSlotContent = (children: VNodeChild[]): boolean => children.some(child => {
  if (Array.isArray(child)) return hasSlotContent(child)
  if (child === null || child === undefined || typeof child === 'boolean') return false
  if (!isVNode(child)) return Boolean(String(child).trim())
  if (child.type === Comment) return false
  if (child.type === Text) return Boolean(String(child.children ?? '').trim())
  if (child.type === Fragment && Array.isArray(child.children)) return hasSlotContent(child.children)
  return true
})
