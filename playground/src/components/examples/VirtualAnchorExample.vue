<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqVirtualList, { VIRTUAL_LIST_DEFAULTS } from '../../../../src/components/VirtualList'
import type { VirtualListExpose } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const SETTINGS = { count: 10_000, height: 440, itemHeight: VIRTUAL_LIST_DEFAULTS.itemHeight, overscan: VIRTUAL_LIST_DEFAULTS.overscan, batchSize: 20, targetIndex: 5_000, detailedEvery: 7 }
const COPY = {
  title: '稳定 key 的滚动锚点', preserve: '保持阅读锚点', dynamic: '动态行高', prepend: '向前插入二十条',
  remove: '删除本条记录',
  reorder: '反转数据顺序', locate: '按 key 定位中间项', row: '记录', earlier: '更早记录', range: '当前可视范围',
  details: '这条记录包含附加说明。开启动态行高后，每条记录会按内容高度展示。',
  hint: '先滚动到某条记录的中间，再插入或重排。开启保持位置后，同一 key 和行内像素偏移应留在原位。必须使用唯一且稳定的 string / number key，不能用数组下标代替身份。',
  limit: '删除当前记录或到达滚动边界时，阅读位置可能调整；新增底部内容不会自动滚动到底部。可切换“保持阅读锚点”比较两种效果。',
}
interface RecordItem { id: string; label: string; detailed: boolean }
const items = ref<RecordItem[]>(Array.from({ length: SETTINGS.count }, (_, index) => ({
  id: `record-${index}`, label: `${COPY.row} ${index}`, detailed: index % SETTINGS.detailedEvery === 0,
})))
const list = ref<VirtualListExpose>()
const preserve = ref(true)
const dynamic = ref(false)
const range = ref({ start: 0, end: 0 })
let batch = 0
const prepend = () => {
  batch += 1
  items.value = [
    ...Array.from({ length: SETTINGS.batchSize }, (_, index) => ({ id: `earlier-${batch}-${index}`, label: `${COPY.earlier} ${batch}-${index}`, detailed: false })),
    ...items.value,
  ]
}
const reorder = () => { items.value = [...items.value].reverse() }
const remove = (id: string) => { items.value = items.value.filter(item => item.id !== id) }
</script>

<template>
  <ExampleSection class="virtual-anchor-example" :title="COPY.title" subtitle="Stable scroll anchoring">
    <template #controls><ScqCheckbox v-model="preserve">{{ COPY.preserve }}</ScqCheckbox><ScqCheckbox v-model="dynamic">{{ COPY.dynamic }}</ScqCheckbox></template>
    <div class="virtual-anchor-example__tools">
      <ScqButton @click="prepend">{{ COPY.prepend }}</ScqButton>
      <ScqButton @click="reorder">{{ COPY.reorder }}</ScqButton>
      <ScqButton @click="list?.scrollToKey(`record-${SETTINGS.targetIndex}`, { align: 'start' })">{{ COPY.locate }}</ScqButton>
    </div>
    <ScqVirtualList
      ref="list"
      :items="items"
      item-key="id"
      :height="SETTINGS.height"
      :item-height="SETTINGS.itemHeight"
      :overscan="SETTINGS.overscan"
      :dynamic="dynamic"
      :preserve-scroll-position="preserve"
      :aria-label="COPY.title"
      @range-change="range = $event"
    >
      <template #default="{ item }">
        <article class="virtual-anchor-example__row" :data-record-key="item.id" :style="{ minHeight: `${SETTINGS.itemHeight}px` }">
          <strong>{{ item.label }}</strong>
          <ScqButton type="primary" text size="small" :aria-label="`${COPY.remove} ${item.label}`" @click="remove(item.id)">{{ COPY.remove }}</ScqButton>
          <p v-if="dynamic && item.detailed">{{ COPY.details }}</p>
        </article>
      </template>
    </ScqVirtualList>
    <output>{{ COPY.range }}: {{ range.start + 1 }}–{{ range.end + 1 }} / {{ items.length }}</output>
    <p>{{ COPY.hint }}</p>
    <p>{{ COPY.limit }}</p>
  </ExampleSection>
</template>

<style scoped>
.virtual-anchor-example__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--example-space-md); }
.virtual-anchor-example__row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; box-sizing: border-box; padding: var(--example-space-xs) var(--example-space-md); border-bottom: var(--scq-control-border-width) solid var(--scq-border); }
.virtual-anchor-example__row strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.virtual-anchor-example__row p { flex-basis: 100%; margin: var(--example-space-sm) 0 0; color: var(--scq-muted); }
</style>
