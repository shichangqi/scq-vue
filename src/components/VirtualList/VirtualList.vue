<template>
  <div ref="viewportRef" class="scq-virtual-list" role="list" :aria-label="ariaLabel || text('list')" :style="{ height: typeof height === 'number' ? `${height}px` : height }" tabindex="0" @scroll="emit('scroll', $event)">
    <div class="scq-virtual-list__content" :style="{ height: `${virtualizer.getTotalSize()}px` }">
      <div v-for="virtualRow in virtualizer.getVirtualItems()" :key="String(virtualRow.key)" :ref="measure" class="scq-virtual-list__item" :data-index="virtualRow.index" role="listitem" :aria-posinset="virtualRow.index + 1" :aria-setsize="items.length" :style="{ transform: `translateY(${virtualRow.start}px)`, height: dynamic ? undefined : `${virtualRow.size}px` }"><slot :item="items[virtualRow.index]" :index="virtualRow.index">{{ items[virtualRow.index] }}</slot></div>
    </div>
    <div v-if="!items.length" class="scq-virtual-list__empty"><slot name="empty">{{ text('empty') }}</slot></div>
  </div>
</template>

<script setup lang="ts" generic="Item = unknown">
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useLocale } from '../ConfigProvider/context'

defineOptions({ name: 'VirtualList' })
const props = withDefaults(defineProps<{ items?: Item[]; height?: number | string; itemHeight?: number; itemKey?: keyof Item | ((item: Item, index: number) => string | number); overscan?: number; dynamic?: boolean; ariaLabel?: string }>(), { items: () => [], height: 320, itemHeight: 44, overscan: 5, dynamic: false, ariaLabel: '' })
const emit = defineEmits<{ (event: 'scroll', value: Event): void; (event: 'range-change', value: { start: number; end: number }): void }>()
const text = useLocale()
const viewportRef = ref<HTMLElement>()
const getKey = (index: number) => {
  const item = props.items[index]
  if (typeof props.itemKey === 'function') return props.itemKey(item, index)
  if (props.itemKey !== undefined && item != null) return String(item[props.itemKey])
  return index
}
const virtualizer = useVirtualizer(computed(() => ({ count: props.items.length, getScrollElement: () => viewportRef.value || null, estimateSize: () => Math.max(1, props.itemHeight), getItemKey: getKey, overscan: Math.max(0, props.overscan), initialRect: { width: 0, height: typeof props.height === 'number' ? props.height : 320 } })))
const measure = (element: Element | ComponentPublicInstance | null) => { if (props.dynamic && element instanceof HTMLElement) virtualizer.value.measureElement(element) }
watch(() => virtualizer.value.range, (range) => { if (range) emit('range-change', { start: range.startIndex, end: range.endIndex }) })
watch(() => [props.itemHeight, props.dynamic], () => virtualizer.value.measure())
defineExpose({ scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) => { if (props.items.length) virtualizer.value.scrollToIndex(Math.max(0, Math.min(props.items.length - 1, Math.trunc(index))), { ...options, behavior: props.dynamic ? 'auto' : options?.behavior }) }, scrollToOffset: (offset: number) => virtualizer.value.scrollToOffset(Math.max(0, offset)), measure: () => virtualizer.value.measure() })
</script>