import { getCurrentInstance } from 'vue'

const counters = new WeakMap<object, number>()

export const useComponentId = (prefix: string): string => {
  const context = getCurrentInstance()?.appContext
  if (!context) return prefix
  const next = (counters.get(context) || 0) + 1
  counters.set(context, next)
  return `${prefix}-${next}`
}