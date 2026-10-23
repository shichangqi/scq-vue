import { getCurrentInstance } from 'vue'

const counterKey = Symbol.for('scq-vue.component-ids')
const shared = globalThis as typeof globalThis & { [counterKey]?: WeakMap<object, number> }
const counters = shared[counterKey] ?? (shared[counterKey] = new WeakMap<object, number>())

export const useComponentId = (prefix: string): string => {
  const context = getCurrentInstance()?.appContext
  if (!context) return prefix
  const owner = context.app ?? context
  const next = (counters.get(owner) || 0) + 1
  counters.set(owner, next)
  return `${prefix}-${next}`
}