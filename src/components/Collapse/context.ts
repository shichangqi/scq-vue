import type { ComputedRef, InjectionKey } from 'vue'

export type CollapseName = string | number
export type CollapseValue = CollapseName | CollapseName[]
export interface CollapseContext {
  disabled: ComputedRef<boolean>
  isExpanded: (name: CollapseName) => boolean
  toggle: (name: CollapseName) => void
}
export const collapseKey: InjectionKey<CollapseContext> = Symbol('scq-collapse')