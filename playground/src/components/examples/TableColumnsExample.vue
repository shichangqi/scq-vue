<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqTable from '../../../../src/components/Table'
import type { TableColumn, TableColumnWidths, TableRowKey } from '../../../../src/index'

const SIZES = { name: 140, city: 160, email: 260, score: 120, status: 140, min: 100, max: 360, table: 820 }
const COPY = {
  title: '可配置成员列', name: '姓名', city: '城市', email: '邮箱', score: '分数', status: '状态',
  active: '可用', reorder: '交换城市 / 邮箱顺序', reset: '恢复列配置',
  hint: '姓名固定在左侧，分数和状态固定在右侧。拖动表头边缘，或聚焦分隔条后使用方向键调整；Shift 加速，Home / End 到边界，Escape 取消拖动。显隐、顺序和宽度按列 key 保存。',
}
const INITIAL_COLUMNS: TableColumn[] = [
  { key: 'name', label: COPY.name, width: SIZES.name, fixed: 'left' },
  { key: 'city', label: COPY.city, width: SIZES.city },
  { key: 'email', label: COPY.email, width: SIZES.email },
  { key: 'score', label: COPY.score, width: SIZES.score, fixed: 'right', sortable: true },
  { key: 'status', label: COPY.status, width: SIZES.status, fixed: 'right', resizable: false },
].map((column) => ({ ...column, minWidth: SIZES.min, maxWidth: SIZES.max })) as TableColumn[]
const ROWS = [
  { id: 'ada', name: 'Ada', city: 'London', email: 'ada@example.com', score: 90, status: COPY.active },
  { id: 'grace', name: 'Grace', city: 'New York', email: 'grace@example.com', score: 95, status: COPY.active },
  { id: 'lin', name: 'Lin', city: 'Shanghai', email: 'lin@example.com', score: 85, status: COPY.active },
]
const columns = ref<TableColumn[]>([...INITIAL_COLUMNS])
const visible = ref(INITIAL_COLUMNS.map((column) => column.key))
const widths = ref<TableColumnWidths>({})
const selected = ref<TableRowKey[]>([])
const reorder = () => {
  const middle = columns.value.filter((column) => !column.fixed).reverse()
  columns.value = [...columns.value.filter((column) => column.fixed === 'left'), ...middle, ...columns.value.filter((column) => column.fixed === 'right')]
}
const reset = () => {
  columns.value = [...INITIAL_COLUMNS]
  visible.value = INITIAL_COLUMNS.map((column) => column.key)
  widths.value = {}
}
</script>

<template>
  <div class="table-columns-example">
    <div class="table-columns-example__actions">
      <ScqButton @click="reorder">{{ COPY.reorder }}</ScqButton>
      <ScqButton @click="reset">{{ COPY.reset }}</ScqButton>
    </div>
    <ScqTable
      v-model:visible-column-keys="visible"
      v-model:column-widths="widths"
      v-model:selected-keys="selected"
      :data="ROWS"
      :columns="columns"
      :min-width="SIZES.table"
      :aria-label="COPY.title"
      row-key="id"
      column-settings
      resizable
      selectable
      stripe
    />
    <p>{{ COPY.hint }}</p>
  </div>
</template>

<style scoped>
.table-columns-example { min-width: 0; }
.table-columns-example__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.table-columns-example p { margin: 12px 0 0; color: var(--scq-muted); font-size: 13px; line-height: 1.7; }
</style>
