<template>
  <div class="table-example">
    <div v-if="secondary" class="table-example__toolbar"><scq-input v-model="query" :placeholder="label('搜索姓名', 'Search name')" clearable @input="page = 1" /><span>{{ filteredRows.length }} {{ label('条记录', 'records') }}</span></div>
    <scq-table v-model:selected-keys="selected" :data="visibleRows" :columns="columns" row-key="id" :selectable="!secondary" :stripe="secondary" :aria-label="label('团队成员', 'Team members')"><template #status="{ row }"><scq-tag :type="row.status === 'Active' ? 'success' : 'warning'">{{ row.status === 'Active' ? label('活跃', 'Active') : label('待审核', 'Pending') }}</scq-tag></template></scq-table>
    <scq-pagination v-if="secondary" v-model="page" :total="filteredRows.length" :page-size="5" class="table-example__pagination" />
    <p v-else class="table-example__selection">{{ label('已选择', 'Selected') }}: {{ selected.length }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { locale } from '../../i18n'
import type { TableColumn, TableRowKey } from '../../../../src/components/Table'
const props = defineProps<{ variant?: string }>()
const secondary = computed(() => props.variant === 'states')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const selected = ref<TableRowKey[]>([])
const query = ref('')
const page = ref(1)
const names = ['Ada', 'Grace', 'Lin', 'Alex', 'Jamie', 'Morgan']
const rows = Array.from({ length: 26 }, (_, index) => ({ id: index + 1, name: `${names[index % names.length]} ${index + 1}`, score: 70 + (index * 7) % 30, status: index % 3 ? 'Active' : 'Pending' }))
const filteredRows = computed(() => rows.filter((row) => row.name.toLowerCase().includes(query.value.toLowerCase())))
const visibleRows = computed(() => secondary.value ? filteredRows.value.slice((page.value - 1) * 5, page.value * 5) : rows.slice(0, 4))
const columns = computed<TableColumn[]>(() => [{ key: 'name', label: label('姓名', 'Name') }, { key: 'score', label: label('分数', 'Score'), sortable: true }, { key: 'status', label: label('状态', 'Status') }])
</script>

<style scoped>
.table-example { min-width: 0; padding: 8px; }
.table-example__toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; font-size: 13px; color: #73767a; }
.table-example__toolbar .scq-input { flex: 1; max-width: 300px; min-width: 0; }
.table-example__pagination { margin-top: 16px; }
.table-example__selection { font-size: 13px; color: #73767a; margin-bottom: 0; }
</style>