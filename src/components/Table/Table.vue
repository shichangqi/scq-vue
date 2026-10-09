<template>
  <Loading :loading="loading" class="scq-table-loading">
    <div class="scq-table-wrapper" :class="{ 'is-bordered': border, 'is-striped': stripe }" :style="{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }" role="region" :aria-label="ariaLabel" tabindex="0">
      <table class="scq-table" :style="{ minWidth: `${minWidth}px` }">
        <thead><tr><th v-if="selectable" class="scq-table__selection" scope="col"><input type="checkbox" :checked="allSelected" :indeterminate="someSelected && !allSelected" :disabled="!data.length" :aria-label="text('selectAll')" @change="selectAll" /></th><th v-for="column in columns" :key="column.key" scope="col" :style="columnStyle(column)" :aria-sort="column.sortable ? sortState.key === column.key ? sortState.order === 'ascending' ? 'ascending' : sortState.order === 'descending' ? 'descending' : 'none' : 'none' : undefined"><button v-if="column.sortable" type="button" class="scq-table__sort" @click="sortBy(column)">{{ column.label }}<Icon :name="sortState.key === column.key && sortState.order === 'descending' ? 'chevronDown' : 'chevronUp'" :class="{ 'is-inactive': sortState.key !== column.key || !sortState.order }" /></button><slot v-else :name="`header-${column.key}`" :column="column">{{ column.label }}</slot></th></tr></thead>
        <tbody>
          <tr v-for="(row, index) in sortedRows" :key="getRowKey(row, index)" :class="{ 'is-selected': selection.includes(getRowKey(row, index)) }" @click="emit('row-click', row, $event)"><td v-if="selectable" class="scq-table__selection" @click.stop><input type="checkbox" :checked="selection.includes(getRowKey(row, index))" :aria-label="`${text('selectRow')} ${index + 1}`" @change="selectRow(row, index)" /></td><td v-for="column in columns" :key="column.key" :style="columnStyle(column)"><slot :name="column.key" :row="row" :column="column" :index="index" :value="getFieldValue(row, column.key)">{{ column.formatter ? column.formatter(row, getFieldValue(row, column.key), index) : getFieldValue(row, column.key) ?? '' }}</slot></td></tr>
          <tr v-if="!sortedRows.length"><td :colspan="Math.max(1, columns.length + (selectable ? 1 : 0))"><slot name="empty"><Empty :description="emptyText" /></slot></td></tr>
        </tbody>
      </table>
    </div>
  </Loading>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import Icon from '../Icon/Icon.vue'
import Empty from '../Empty/Empty.vue'
import Loading from '../Loading/Loading.vue'
import { useLocale } from '../ConfigProvider/context'
import { getFieldValue } from '../Form/context'

export type TableRow = Record<string, unknown>
export type TableRowKey = string | number
export interface TableColumn {
  key: string
  label: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  sortMethod?: (left: TableRow, right: TableRow) => number
  formatter?: (row: TableRow, value: unknown, index: number) => string | number
}
export interface TableSort { key: string; order: 'ascending' | 'descending' | null }

defineOptions({ name: 'Table' })
const props = withDefaults(defineProps<{
  data: TableRow[]
  columns: TableColumn[]
  rowKey?: string | ((row: TableRow) => TableRowKey)
  selectedKeys?: TableRowKey[]
  selectable?: boolean
  loading?: boolean
  border?: boolean
  stripe?: boolean
  maxHeight?: number | string
  minWidth?: number
  defaultSort?: TableSort
  emptyText?: string
  ariaLabel?: string
}>(), { rowKey: 'id', selectable: false, loading: false, border: false, stripe: false, minWidth: 480, emptyText: '', ariaLabel: 'Data table' })
const emit = defineEmits<{
  (event: 'update:selectedKeys', keys: TableRowKey[]): void
  (event: 'selection-change', rows: TableRow[], keys: TableRowKey[]): void
  (event: 'sort-change', sort: TableSort): void
  (event: 'row-click', row: TableRow, value: MouseEvent): void
}>()
const text = useLocale()
const localSelection = ref<TableRowKey[]>([])
const selection = computed(() => props.selectedKeys ?? localSelection.value)
const sortState = ref<TableSort>(props.defaultSort ? { ...props.defaultSort } : { key: '', order: null })
const getRowKey = (row: TableRow, index: number): TableRowKey => {
  const value = typeof props.rowKey === 'function' ? props.rowKey(row) : getFieldValue(row, props.rowKey)
  return typeof value === 'number' || typeof value === 'string' ? value : props.data.indexOf(row) >= 0 ? props.data.indexOf(row) : index
}
const columnStyle = (column: TableColumn): CSSProperties => ({ width: typeof column.width === 'number' ? `${column.width}px` : column.width, textAlign: column.align || 'left' })
const sortedRows = computed(() => {
  const { key, order } = sortState.value
  const column = props.columns.find((entry) => entry.key === key)
  if (!column || !order) return props.data
  return [...props.data].sort((left, right) => {
    const leftValue = getFieldValue(left, key)
    const rightValue = getFieldValue(right, key)
    const comparison = column.sortMethod ? column.sortMethod(left, right) : typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true })
    return comparison * (order === 'ascending' ? 1 : -1)
  })
})
const allSelected = computed(() => props.data.length > 0 && props.data.every((row, index) => selection.value.includes(getRowKey(row, index))))
const someSelected = computed(() => props.data.some((row, index) => selection.value.includes(getRowKey(row, index))))
const setSelection = (keys: TableRowKey[]) => {
  localSelection.value = keys
  emit('update:selectedKeys', keys)
  emit('selection-change', props.data.filter((row, index) => keys.includes(getRowKey(row, index))), keys)
}
const selectRow = (row: TableRow, index: number) => {
  const key = getRowKey(row, index)
  setSelection(selection.value.includes(key) ? selection.value.filter((entry) => entry !== key) : [...selection.value, key])
}
const selectAll = () => {
  const keys = props.data.map(getRowKey)
  setSelection(allSelected.value ? selection.value.filter((key) => !keys.includes(key)) : [...new Set([...selection.value, ...keys])])
}
const sortBy = (column: TableColumn) => {
  const order = sortState.value.key === column.key ? sortState.value.order === 'ascending' ? 'descending' : sortState.value.order === 'descending' ? null : 'ascending' : 'ascending'
  sortState.value = { key: column.key, order }
  emit('sort-change', { ...sortState.value })
}
defineExpose({ clearSelection: () => setSelection([]) })
</script>