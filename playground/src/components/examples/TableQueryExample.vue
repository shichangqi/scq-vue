<script setup lang="ts">
import { computed, ref } from 'vue'
import ScqTable from '../../../../src/components/Table'
import ScqCheckbox from '../../../../src/components/Checkbox'
import type { TableColumn, TableFilters, TableQuery, TableRowKey, TableSort } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const SETTINGS = { firstPage: 1, pageSize: 2, pageSizes: [2, 4], jsonIndent: 2 }
const COPY = {
  title: '成员查询', remote: '远程模式', name: '姓名', score: '分数', status: '状态',
  active: '可选择', pending: '不可选择', selected: '跨页已选 key',
  hint: '筛选和排序会请求第一页；全选只处理当前页的可选行，其他页的 key 保留。远程模式接收已处理的当前页，不会再次筛选、排序或分页。',
  remoteHint: '此处用内存数据模拟服务端。实际项目可在 query-change 中请求接口，并将返回的当前页和总数交给 Table。',
}
const MEMBERS = [
  { id: 'ada', name: 'Ada', score: 90, status: 'active' },
  { id: 'grace', name: 'Grace', score: 70, status: 'pending' },
  { id: 'lin', name: 'Lin', score: 95, status: 'active' },
  { id: 'alex', name: 'Alex', score: 80, status: 'active' },
  { id: 'jamie', name: 'Jamie', score: 60, status: 'pending' },
  { id: 'morgan', name: 'Morgan', score: 85, status: 'active' },
]
const columns: TableColumn[] = [
  { key: 'name', label: COPY.name },
  { key: 'score', label: COPY.score, sortable: true },
  {
    key: 'status', label: COPY.status,
    filters: [{ label: COPY.active, value: 'active' }, { label: COPY.pending, value: 'pending' }],
    formatter: (row) => row.status === 'active' ? COPY.active : COPY.pending,
  },
]
const remote = ref(false)
const selected = ref<TableRowKey[]>([])
const sort = ref<TableSort | null>(null)
const filters = ref<TableFilters>({})
const page = ref(SETTINGS.firstPage)
const pageSize = ref(SETTINGS.pageSize)
const lastQuery = ref<TableQuery>({ sort: { key: '', order: null }, filters: {}, page: page.value, pageSize: pageSize.value })

// This stands in for the server: Table itself must not reapply these operations in remote mode.
const getServerPage = (query: TableQuery) => {
  const statuses = query.filters.status ?? []
  let matches = MEMBERS.filter((row) => !statuses.length || statuses.includes(row.status))
  if (query.sort.key === 'score' && query.sort.order) {
    const direction = query.sort.order === 'ascending' ? 1 : -1
    matches = [...matches].sort((left, right) => (left.score - right.score) * direction)
  }
  const start = (query.page - SETTINGS.firstPage) * query.pageSize
  return { data: matches.slice(start, start + query.pageSize), total: matches.length }
}
const serverPage = computed(() => getServerPage(lastQuery.value))
const queryText = computed(() => JSON.stringify(lastQuery.value, null, SETTINGS.jsonIndent))
</script>

<template>
  <ExampleSection class="table-query-example" :title="COPY.title" subtitle="Query, filters &amp; selection">
    <template #controls><ScqCheckbox v-model="remote">{{ COPY.remote }}</ScqCheckbox></template>
    <ScqTable
      v-model:sort="sort"
      v-model:filters="filters"
      v-model:page="page"
      v-model:page-size="pageSize"
      v-model:selected-keys="selected"
      :data="remote ? serverPage.data : MEMBERS"
      :columns="columns"
      :remote="remote"
      :total="serverPage.total"
      :pagination="{ pageSizes: SETTINGS.pageSizes, showTotal: true }"
      :row-selectable="(row) => row.status === 'active'"
      :aria-label="COPY.title"
      row-key="id"
      selectable
      @query-change="(query) => lastQuery = query"
    />
    <output>{{ COPY.selected }}: {{ selected.join(', ') }}</output>
    <pre>{{ queryText }}</pre>
    <p>{{ COPY.hint }}</p>
    <p v-if="remote">{{ COPY.remoteHint }}</p>
  </ExampleSection>
</template>

<style scoped>
.table-query-example output, .table-query-example p { margin: 0; color: var(--scq-muted); font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }
</style>
