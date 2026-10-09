<script setup lang="ts">
import { ref } from 'vue'
import { ScqButton, ScqInputNumber, ScqVirtualList } from '../../../../src/index'

const items = Array.from({ length: 10000 }, (_, index) => ({ id: index + 1, title: `工作记录 ${String(index + 1).padStart(5, '0')}`, owner: ['林一', 'Ada', 'Grace'][index % 3] }))
const listRef = ref<{ scrollToIndex: (index: number) => void }>()
const target = ref<number | undefined>(5000)
const range = ref({ start: 0, end: 0 })
const jump = () => listRef.value?.scrollToIndex((target.value ?? 1) - 1)
</script>

<template><div class="virtual-example__toolbar"><label>记录<ScqInputNumber v-model="target" :min="1" :max="items.length" aria-label="跳转记录" /></label><ScqButton @click="jump">定位</ScqButton><output>{{ range.start + 1 }}-{{ range.end + 1 }} / {{ items.length }}</output></div><ScqVirtualList ref="listRef" :items="items" item-key="id" :height="320" :item-height="52" :overscan="4" aria-label="工作记录" @range-change="range = $event"><template #default="{ item }"><div class="virtual-example__row"><span>{{ item.id }}</span><strong>{{ item.title }}</strong><span>{{ item.owner }}</span></div></template></ScqVirtualList></template>

<style scoped>
.virtual-example__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; }
.virtual-example__toolbar label { display: flex; align-items: center; gap: 8px; color: var(--scq-text); font-size: 13px; }
.virtual-example__toolbar output { margin-left: auto; font-size: 12px; color: var(--scq-muted); font-variant-numeric: tabular-nums; }
.virtual-example__row { display: grid; grid-template-columns: 48px minmax(0, 1fr) 56px; align-items: center; gap: 12px; height: 52px; padding: 8px 12px; box-sizing: border-box; border-bottom: 1px solid var(--scq-border); font-size: 13px; }
.virtual-example__row > span { color: var(--scq-muted); font-variant-numeric: tabular-nums; }
.virtual-example__row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.virtual-example__row:hover { background: var(--scq-fill); }
</style>