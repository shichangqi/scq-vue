import type { VirtualListKey } from './types'

export const getVirtualKeyIndex = <Item>(items: readonly Item[], getKey: (item: Item, index: number) => unknown, component: string) => {
  const indices = new Map<VirtualListKey, number>()
  const keys = items.map((item, index) => {
    const key = getKey(item, index)
    if ((typeof key !== 'string' && typeof key !== 'number') || (typeof key === 'number' && !Number.isFinite(key))) {
      throw new TypeError(`[scq-vue ${component}] Invalid itemKey at index ${index}; expected a string or finite number.`)
    }
    if (indices.has(key)) {
      throw new Error(`[scq-vue ${component}] Duplicate itemKey ${String(key)} (${typeof key}) at indices ${indices.get(key)} and ${index}.`)
    }
    indices.set(key, index)
    return key
  })
  return { keys, indices }
}
