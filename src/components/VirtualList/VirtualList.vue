<template>
  <div ref="viewportRef" class="scq-virtual-list" :role="role" :aria-label="isPresentation(role) ? undefined : ariaLabel || text('list')" :style="{ height: toCssLength(height) }" tabindex="0" @scroll="emit('scroll', $event)">
    <div class="scq-virtual-list__content" :style="{ height: `${virtualizer.getTotalSize()}px` }">
      <div v-for="virtualRow in virtualizer.getVirtualItems()" :key="virtualRow.key as VirtualListKey" :ref="measureElement" class="scq-virtual-list__item" :data-index="virtualRow.index" :role="itemRole" :aria-posinset="isPresentation(itemRole) ? undefined : virtualRow.index + 1" :aria-setsize="isPresentation(itemRole) ? undefined : items.length" :style="{ transform: `translateY(${virtualRow.start}px)`, height: dynamic ? undefined : `${virtualRow.size}px` }"><slot :item="items[virtualRow.index]" :index="virtualRow.index">{{ items[virtualRow.index] }}</slot></div>
    </div>
    <div v-if="!items.length" class="scq-virtual-list__empty"><slot name="empty">{{ text('empty') }}</slot></div>
  </div>
</template>

<script setup lang="ts" generic="Item = unknown">
import { computed, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue'
import { defaultRangeExtractor, measureElement as measureRow, useVirtualizer } from '@tanstack/vue-virtual'
import { useLocale } from '../ConfigProvider/context'
import { toCssLength } from '../../utils/layout'
import { useUpdateFocus } from '../../utils/focus'
import { VIRTUAL_LIST_DEFAULTS } from './constants'
import { getVirtualKeyIndex } from './keys'
import type { VirtualListExpose, VirtualListKey, VirtualListProps, VirtualListScrollOptions, VirtualListSlots } from './types'

defineOptions({ name: 'VirtualList' })
const props = withDefaults(defineProps<VirtualListProps<Item>>(), { items: () => [], ...VIRTUAL_LIST_DEFAULTS, dynamic: false, preserveScrollPosition: false, role: 'list', itemRole: 'listitem', ariaLabel: '' })
defineSlots<VirtualListSlots<Item>>()
const emit = defineEmits<{ (event: 'scroll', value: Event): void; (event: 'range-change', value: { start: number; end: number }): void }>()
const text = useLocale()
const viewportRef = ref<HTMLElement>()
useUpdateFocus(() => viewportRef.value)
const isPresentation = (role: string | undefined) => role === 'presentation' || role === 'none'
const keyState = computed(() => getVirtualKeyIndex(props.items, (item, index) => typeof props.itemKey === 'function'
  ? props.itemKey(item, index) : props.itemKey !== undefined ? item?.[props.itemKey] : index, 'VirtualList'))
let pendingAnchor: { key: VirtualListKey; offset: number } | undefined
let revision = 0
let disposed = false
const cancelAnchor = () => { revision += 1; pendingAnchor = undefined }

// Capture against the old key snapshot before the adapter replaces its options.
watch(keyState, (next, previous) => {
  if (!props.preserveScrollPosition || props.itemKey === undefined || !viewportRef.value) return
  if (next.keys.length === previous.keys.length && next.keys.every((key, index) => key === previous.keys[index])) return
  const offset = viewportRef.value.scrollTop
  const item = virtualizer.value.getVirtualItemForOffset(offset)
  if (!pendingAnchor && item) pendingAnchor = { key: previous.keys[item.index], offset: offset - item.start }
  const anchor = pendingAnchor
  const current = ++revision
  void nextTick(() => {
    if (disposed || current !== revision) return
    pendingAnchor = undefined
    if (!anchor || !props.preserveScrollPosition || props.itemKey === undefined) return
    const index = keyState.value.indices.get(anchor.key)
    if (index === undefined) return
    virtualizer.value.getTotalSize()
    const measurement = virtualizer.value.measurementsCache[index]
    if (measurement) virtualizer.value.scrollToOffset(Math.max(0, measurement.start + anchor.offset))
  })
}, { flush: 'sync' })
watch([() => props.preserveScrollPosition, () => props.itemKey !== undefined], () => {
  cancelAnchor()
  if (props.preserveScrollPosition && props.itemKey === undefined) {
    console.warn('[scq-vue VirtualList] preserveScrollPosition requires a stable itemKey; index keys do not preserve item identity.')
  }
}, { immediate: true })

const virtualizer = useVirtualizer(computed(() => {
  const keys = keyState.value.keys
  const activeIndex = props.activeIndex
  const itemHeight = Number.isFinite(props.itemHeight) && props.itemHeight > 0 ? props.itemHeight : VIRTUAL_LIST_DEFAULTS.itemHeight
  return {
    count: keys.length,
    getScrollElement: () => viewportRef.value || null,
    estimateSize: () => itemHeight,
    measureElement: props.dynamic ? measureRow : () => itemHeight,
    getItemKey: (index: number) => keys[index],
    overscan: Number.isFinite(props.overscan) ? Math.max(0, Math.trunc(props.overscan)) : VIRTUAL_LIST_DEFAULTS.overscan,
    initialRect: { width: 0, height: typeof props.height === 'number' && Number.isFinite(props.height) ? Math.max(0, props.height) : VIRTUAL_LIST_DEFAULTS.height },
    rangeExtractor: (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const indices = defaultRangeExtractor(range)
      if (activeIndex !== undefined && Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < keys.length && !indices.includes(activeIndex)) {
        indices.push(activeIndex)
        indices.sort((left, right) => left - right)
      }
      return indices
    },
  }
}))
const measureElement = (element: Element | ComponentPublicInstance | null) => {
  if (element === null || (props.dynamic && element instanceof HTMLElement)) virtualizer.value.measureElement(element)
}
watch(() => virtualizer.value.range, (range) => { if (range) emit('range-change', { start: range.startIndex, end: range.endIndex }) })
watch(() => [props.itemHeight, props.dynamic], () => virtualizer.value.measure())
const scrollToIndex = (index: number, options?: VirtualListScrollOptions) => {
  cancelAnchor()
  if (props.items.length && Number.isFinite(index)) {
    virtualizer.value.scrollToIndex(Math.max(0, Math.min(props.items.length - 1, Math.trunc(index))), { ...options, behavior: props.dynamic ? 'auto' : options?.behavior })
  }
}
const scrollToKey = (key: VirtualListKey, options?: VirtualListScrollOptions) => {
  const index = keyState.value.indices.get(key)
  if (index !== undefined) scrollToIndex(index, options)
}
const scrollToOffset = (offset: number) => {
  cancelAnchor()
  if (Number.isFinite(offset)) virtualizer.value.scrollToOffset(Math.max(0, offset))
}
onBeforeUnmount(() => { disposed = true; cancelAnchor() })
defineExpose<VirtualListExpose>({ scrollToIndex, scrollToKey, scrollToOffset, measure: () => virtualizer.value.measure() })
</script>