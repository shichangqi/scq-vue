<template><section class="scq-descriptions" :class="{ 'is-bordered': border, 'is-vertical': direction === 'vertical' }"><header v-if="title || $slots.title || $slots.extra" class="scq-descriptions__header"><strong><slot name="title">{{ title }}</slot></strong><slot name="extra" /></header><dl class="scq-descriptions__list" :style="{ '--scq-descriptions-columns': Math.max(1, columns), '--scq-descriptions-label-width': typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth }"><div v-for="(item, index) in items" :key="item.key ?? index" class="scq-descriptions__item" :style="{ '--scq-descriptions-span': Math.max(1, Math.min(columns, item.span || 1)) }"><dt><slot :name="`label-${item.key ?? index}`" :item="item">{{ item.label }}</slot></dt><dd><slot :name="String(item.key ?? index)" :item="item">{{ item.value ?? '-' }}</slot></dd></div></dl><div v-if="!items.length" class="scq-descriptions__empty"><slot name="empty">{{ text('empty') }}</slot></div></section></template>

<script setup lang="ts">
import { useLocale } from '../ConfigProvider/context'
export interface DescriptionItem { key?: string | number; label: string; value?: string | number | boolean | null; span?: number }
defineOptions({ name: 'Descriptions' })
withDefaults(defineProps<{ items?: DescriptionItem[]; title?: string; columns?: number; border?: boolean; direction?: 'horizontal' | 'vertical'; labelWidth?: number | string }>(), { items: () => [], title: '', columns: 3, border: false, direction: 'horizontal', labelWidth: 100 })
const text = useLocale()
</script>