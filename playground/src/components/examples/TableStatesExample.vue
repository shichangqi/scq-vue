<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqTable from '../../../../src/components/Table'
import type { TableColumn, TableSort, TableRowKey } from '../../../../src/components/Table'
import ExampleSection from '../ExampleSection.vue'

const DEFAULTS = {
  page: 1, pageSize: 2, maxHeight: 240,
  sort: { key: 'score', order: 'descending' } satisfies TableSort,
  filters: { status: ['active'] },
  widths: { name: 160, score: 120, status: 160 },
  visible: ['name', 'score', 'status'],
}
const COLUMNS: TableColumn[] = [
  { key: 'name', label: '姓名' },
  { key: 'score', label: '分数', sortable: true },
  { key: 'status', label: '状态', filters: [{ label: '可用', value: 'active' }, { label: '归档', value: 'archived' }] },
]
const ROWS = [{ id: 'ada', name: 'Ada', score: 90, status: 'active' }, { id: 'grace', name: 'Grace', score: 95, status: 'active' }, { id: 'lin', name: 'Lin', score: 85, status: 'active' }, { id: 'alex', name: 'Alex', score: 80, status: 'archived' }]
const table = ref<InstanceType<typeof ScqTable>>()
const selected = ref<TableRowKey[]>([])
const loading = ref(false)
const empty = ref(false)
const event = ref('默认按分数降序，只显示可用成员')
</script>

<template>
  <ExampleSection title="默认查询、加载与空状态" description="default* 仅设置内部初始值；需要持续控制状态时使用对应的 v-model。">
    <template #controls><ScqCheckbox v-model="loading">加载中</ScqCheckbox><ScqCheckbox v-model="empty">空数据</ScqCheckbox></template>
    <ScqTable ref="table" v-model:selected-keys="selected" :data="empty ? [] : ROWS" :columns="COLUMNS" row-key="id" selectable border :loading="loading" :max-height="DEFAULTS.maxHeight" :default-sort="DEFAULTS.sort" :default-filters="DEFAULTS.filters" :default-page="DEFAULTS.page" :default-page-size="DEFAULTS.pageSize" :default-column-widths="DEFAULTS.widths" :default-visible-column-keys="DEFAULTS.visible" pagination column-settings resizable aria-label="默认查询表格" @query-change="(query, action) => event = `${action}: ${JSON.stringify(query)}`" @row-click="row => event = `row-click: ${row.name}`" @selection-change="(_rows, keys) => event = `selection-change: ${keys.join(', ')}`">
      <template #header-name="{ column }">{{ column.label }}（可选择）</template>
      <template #empty><p>没有成员数据。</p><ScqButton @click="empty = false">恢复数据</ScqButton></template>
    </ScqTable>
    <ScqButton @click="table?.clearSelection()">清空选择</ScqButton>
    <output role="status">{{ event }}</output>
  </ExampleSection>
</template>
