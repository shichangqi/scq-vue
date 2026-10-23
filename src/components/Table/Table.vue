<template>
  <Loading :loading="loading" class="scq-table-loading">
    <div v-if="columnSettings" class="scq-table__toolbar" role="group" :aria-label="text('columns')">
      <span>{{ text('columns') }}</span>
      <Select class="scq-table__columns" :model-value="visibleKeys" :options="columnOptions" multiple :aria-label="text('columns')" @update:model-value="changeVisibility" />
    </div>
    <div ref="viewportRef" class="scq-table-wrapper" :class="{ 'is-bordered': border, 'is-striped': stripe, 'is-managed': layoutEnabled, 'is-resizing': isResizing }" :style="{ maxHeight: maxHeight === undefined ? undefined : toCssLength(maxHeight) }" role="region" :aria-label="ariaLabel" tabindex="0">
      <table :id="tableId" class="scq-table" :style="{ minWidth: toCssLength(minWidth), ...layoutStyle }">
        <colgroup v-if="layoutEnabled">
          <col v-if="selectable" :style="selectionStyle" />
          <col v-for="column in visibleColumns" :key="column.key" :style="widthStyle(column)" />
        </colgroup>
        <thead>
          <tr>
            <th v-if="selectable" :ref="setSelectionHeader" class="scq-table__selection" :class="{ 'is-fixed': selectionFixed }" :style="selectionStyle" scope="col">
              <input type="checkbox" :checked="allSelected" :indeterminate="someSelected && !allSelected" :disabled="!selectableRows.length" :aria-label="text('selectAll')" @change="selectAll" />
            </th>
            <th v-for="column in visibleColumns" :key="column.key" :ref="(element) => setHeader(column.key, element)" scope="col" :data-column-key="column.key" :class="{ 'is-fixed': column.fixed, 'is-resizable': isResizable(column) }" :style="columnStyle(column)" :aria-sort="column.sortable ? sortState.key === column.key ? sortState.order ?? 'none' : 'none' : undefined">
              <div class="scq-table__header">
                <button v-if="column.sortable" type="button" class="scq-table__sort" :aria-label="sortLabel(column)" @click="sortBy(column)">
                  <slot :name="`header-${column.key}`" :column="column">{{ column.label }}</slot>
                  <Icon :name="sortState.key === column.key && sortState.order === 'descending' ? 'chevronDown' : 'chevronUp'" :class="{ 'is-inactive': sortState.key !== column.key || !sortState.order }" />
                </button>
                <slot v-else :name="`header-${column.key}`" :column="column">{{ column.label }}</slot>
                <TableFilter v-if="column.filters?.length" :column="column" :model-value="filterState[column.key] ?? []" @apply="applyFilter(column, $event)" />
              </div>
              <span v-if="isResizable(column)" class="scq-table__resize" role="separator" tabindex="0" aria-orientation="vertical" :aria-label="`${text('resizeColumn')} ${column.label}`" :aria-controls="tableId" :aria-valuemin="bounds(column).min" :aria-valuemax="bounds(column).max" :aria-valuenow="resizeWidth(column)" @click.stop @pointerdown.stop="startResize(column, $event)" @keydown="resizeWithKeyboard(column, $event)" />
            </th>
            <th v-if="!visibleColumns.length && !selectable" scope="col" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in pageRows" :key="getRowKey(row, index)" :class="{ 'is-selected': selection.includes(getRowKey(row, index)) }" @click="emit('row-click', row, $event)">
            <td v-if="selectable" class="scq-table__selection" :class="{ 'is-fixed': selectionFixed }" :style="selectionStyle" @click.stop>
              <input type="checkbox" :checked="selection.includes(getRowKey(row, index))" :disabled="!canSelectRow(row, index)" :aria-label="`${text('selectRow')} ${index + 1}`" @change="selectRow(row, index, $event)" />
            </td>
            <td v-for="column in visibleColumns" :key="column.key" :data-column-key="column.key" :class="{ 'is-fixed': column.fixed }" :style="columnStyle(column)">
              <slot :name="column.key" :row="row" :column="column" :index="index" :value="getFieldValue(row, column.key)">{{ column.formatter ? column.formatter(row, getFieldValue(row, column.key), index) : getFieldValue(row, column.key) ?? '' }}</slot>
            </td>
            <td v-if="!visibleColumns.length && !selectable" />
          </tr>
          <tr v-if="!pageRows.length"><td :colspan="Math.max(1, visibleColumns.length + (selectable ? 1 : 0))"><slot name="empty"><Empty :description="emptyText" /></slot></td></tr>
        </tbody>
      </table>
    </div>
    <Pagination v-if="paginationEnabled" class="scq-table__pagination" v-bind="paginationOptions" :model-value="currentPage" :page-size="currentPageSize" :total="rowTotal" @change="changePage" @size-change="changePageSize" />
  </Loading>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Empty from '../Empty/Empty.vue'
import Loading from '../Loading/Loading.vue'
import Pagination from '../Pagination/Pagination.vue'
import Select from '../Select/Select.vue'
import { useLocale } from '../ConfigProvider/context'
import { getFieldValue } from '../Form/context'
import { useComponentId } from '../../utils/id'
import { useUpdateFocus } from '../../utils/focus'
import { toCssLength } from '../../utils/layout'
import TableFilter from './TableFilter.vue'
import { EMPTY_TABLE_SORT, TABLE_DEFAULTS } from './constants'
import { useTableColumns } from './useColumns'
import type { TableColumn, TableColumnResize, TableColumnWidths, TableFilters, TableFilterValue, TableProps, TableQuery, TableQueryAction, TableRow, TableRowKey, TableSort } from './types'

export type { TableColumn, TableColumnResize, TableColumnWidths, TableFilterOption, TableFilters, TableFilterValue, TablePaginationOptions, TableProps, TableQuery, TableQueryAction, TableRow, TableRowKey, TableSort } from './types'

defineOptions({ name: 'Table' })
const props = withDefaults(defineProps<TableProps>(), {
  rowKey: 'id', selectable: false, loading: false, border: false, stripe: false,
  minWidth: TABLE_DEFAULTS.minWidth, emptyText: '', ariaLabel: TABLE_DEFAULTS.ariaLabel,
  remote: false, pagination: false, resizable: false, columnSettings: false,
})
const emit = defineEmits<{
  (event: 'update:selectedKeys', keys: TableRowKey[]): void
  /** rows contains selected current-page rows in source order; keys includes unloaded/other-page keys. */
  (event: 'selection-change', rows: TableRow[], keys: TableRowKey[]): void
  (event: 'update:sort' | 'sort-change', sort: TableSort): void
  (event: 'update:filters' | 'filter-change', filters: TableFilters): void
  (event: 'update:page' | 'update:pageSize', value: number): void
  (event: 'page-change', page: number, pageSize: number): void
  /** One request snapshot per interaction, even when controlled props have not been accepted. */
  (event: 'query-change', query: TableQuery, action: TableQueryAction): void
  (event: 'update:visibleColumnKeys' | 'column-visibility-change', keys: string[]): void
  (event: 'update:columnWidths', widths: TableColumnWidths): void
  /** Committed pointer resize or one keyboard adjustment; cancelled drags do not emit this event. */
  (event: 'column-resize', change: TableColumnResize): void
  (event: 'row-click', row: TableRow, value: MouseEvent): void
}>()
const text = useLocale()
const tableId = useComponentId('scq-table')
const viewportRef = ref<HTMLElement>()
useUpdateFocus(() => viewportRef.value)
const {
  visibleColumns, visibleKeys, changeVisibility, isResizable, layoutEnabled, layoutStyle,
  columnStyle, widthStyle, selectionStyle, selectionFixed, setHeader, setSelectionHeader,
  bounds, resizeWidth, startResize, resizeWithKeyboard, isResizing,
} = useTableColumns(props, {
  widths: (widths) => emit('update:columnWidths', widths),
  resize: (change) => emit('column-resize', change),
  visibility: (keys) => {
    emit('update:visibleColumnKeys', [...keys])
    emit('column-visibility-change', [...keys])
  },
})
const columnOptions = computed(() => props.columns.map((column) => ({ label: column.label, value: column.key })))
const copyFilters = (filters: TableFilters): TableFilters => Object.fromEntries(Object.entries(filters).filter(([, values]) => values.length).map(([key, values]) => [key, [...new Set(values)]]))
const localSelection = ref<TableRowKey[]>([])
const selection = computed(() => props.selectedKeys ?? localSelection.value)
const localSort = ref<TableSort>({ ...props.defaultSort ?? EMPTY_TABLE_SORT })
const sortState = computed(() => props.sort === undefined ? localSort.value : props.sort ?? EMPTY_TABLE_SORT)
const localFilters = ref<TableFilters>(copyFilters(props.defaultFilters ?? {}))
const filterState = computed(() => props.filters ?? localFilters.value)
const positiveInteger = (value: number | undefined, fallback: number) => Number.isFinite(value) ? Math.max(TABLE_DEFAULTS.firstPage, Math.floor(value!)) : fallback
const localPage = ref(positiveInteger(props.defaultPage, TABLE_DEFAULTS.firstPage))
const localPageSize = ref(positiveInteger(props.defaultPageSize, TABLE_DEFAULTS.pageSize))
const currentPageSize = computed(() => positiveInteger(props.pageSize ?? localPageSize.value, TABLE_DEFAULTS.pageSize))
const paginationEnabled = computed(() => Boolean(props.pagination))
const paginationOptions = computed(() => typeof props.pagination === 'object' ? props.pagination : {})
const sourceIndex = (row: TableRow, fallback: number) => {
  const index = props.data.indexOf(row)
  return index >= 0 ? index : fallback
}
const getRowKey = (row: TableRow, index: number): TableRowKey => {
  const value = typeof props.rowKey === 'function' ? props.rowKey(row) : getFieldValue(row, props.rowKey)
  return typeof value === 'number' || typeof value === 'string' ? value : sourceIndex(row, index)
}
const filteredRows = computed(() => {
  if (props.remote) return props.data
  const active = props.columns.filter((column) => filterState.value[column.key]?.length)
  if (!active.length) return props.data
  return props.data.filter((row) => active.every((column) => filterState.value[column.key].some((value) => column.filterMethod ? column.filterMethod(value, row) : Object.is(getFieldValue(row, column.key), value))))
})
const sortedRows = computed(() => {
  if (props.remote) return props.data
  const { key, order } = sortState.value
  const column = props.columns.find((entry) => entry.key === key)
  if (!column || !order) return filteredRows.value
  return [...filteredRows.value].sort((left, right) => {
    const leftValue = getFieldValue(left, key)
    const rightValue = getFieldValue(right, key)
    const comparison = column.sortMethod ? column.sortMethod(left, right) : typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true })
    return comparison * (order === 'ascending' ? 1 : -1)
  })
})
const rowTotal = computed(() => props.remote ? Math.max(0, Number.isFinite(props.total) ? Math.floor(props.total!) : props.data.length) : filteredRows.value.length)
const pageCount = computed(() => Math.max(TABLE_DEFAULTS.firstPage, Math.ceil(rowTotal.value / currentPageSize.value)))
const currentPage = computed(() => paginationEnabled.value ? Math.min(pageCount.value, positiveInteger(props.page ?? localPage.value, TABLE_DEFAULTS.firstPage)) : TABLE_DEFAULTS.firstPage)
const pageRows = computed(() => {
  if (props.remote || !paginationEnabled.value) return sortedRows.value
  const offset = (currentPage.value - TABLE_DEFAULTS.firstPage) * currentPageSize.value
  return sortedRows.value.slice(offset, offset + currentPageSize.value)
})

const canSelectRow = (row: TableRow, index: number) => props.rowSelectable?.(row, sourceIndex(row, index)) !== false
const pageKeys = computed(() => new Set(pageRows.value.map(getRowKey)))
const selectableRows = computed(() => props.data.filter((row, index) => pageKeys.value.has(getRowKey(row, index)) && canSelectRow(row, index)))
const allSelected = computed(() => selectableRows.value.length > 0 && selectableRows.value.every((row, index) => selection.value.includes(getRowKey(row, index))))
const someSelected = computed(() => selectableRows.value.some((row, index) => selection.value.includes(getRowKey(row, index))))
const setSelection = (keys: TableRowKey[]) => {
  localSelection.value = [...keys]
  emit('update:selectedKeys', [...keys])
  emit('selection-change', props.data.filter((row, index) => pageKeys.value.has(getRowKey(row, index)) && keys.includes(getRowKey(row, index))), [...keys])
}
const selectRow = (row: TableRow, index: number, event: Event) => {
  const key = getRowKey(row, index)
  if (canSelectRow(row, index)) setSelection(selection.value.includes(key) ? selection.value.filter((entry) => entry !== key) : [...selection.value, key])
  ;(event.target as HTMLInputElement).checked = selection.value.includes(key)
}
const selectAll = (event: Event) => {
  const keys = selectableRows.value.map(getRowKey)
  if (keys.length) setSelection(allSelected.value ? selection.value.filter((key) => !keys.includes(key)) : [...new Set([...selection.value, ...keys])])
  const input = event.target as HTMLInputElement
  input.checked = allSelected.value
  input.indeterminate = someSelected.value && !allSelected.value
}

const getQuery = (overrides: Partial<TableQuery> = {}): TableQuery => ({
  sort: { ...overrides.sort ?? sortState.value },
  filters: copyFilters(overrides.filters ?? filterState.value),
  page: overrides.page ?? currentPage.value,
  pageSize: overrides.pageSize ?? currentPageSize.value,
})
const emitQuery = (action: TableQueryAction, overrides?: Partial<TableQuery>) => emit('query-change', getQuery(overrides), action)
const resetPage = () => {
  const changed = paginationEnabled.value && currentPage.value !== TABLE_DEFAULTS.firstPage
  if (props.page === undefined) localPage.value = TABLE_DEFAULTS.firstPage
  if (changed) {
    emit('update:page', TABLE_DEFAULTS.firstPage)
    emit('page-change', TABLE_DEFAULTS.firstPage, currentPageSize.value)
  }
  return TABLE_DEFAULTS.firstPage
}
const nextSort = (column: TableColumn): TableSort => ({
  key: column.key,
  order: sortState.value.key === column.key ? sortState.value.order === 'ascending' ? 'descending' : sortState.value.order === 'descending' ? null : 'ascending' : 'ascending',
})
const sortLabel = (column: TableColumn) => `${column.label} ${text(nextSort(column).order === 'ascending' ? 'sortAscending' : nextSort(column).order === 'descending' ? 'sortDescending' : 'sortNone')}`
const sortBy = (column: TableColumn) => {
  const sort = nextSort(column)
  const page = resetPage()
  if (props.sort === undefined) localSort.value = sort
  emit('update:sort', { ...sort })
  emit('sort-change', { ...sort })
  emitQuery('sort', { sort, page })
}
const setFilters = (value: TableFilters) => {
  const filters = copyFilters(value)
  const page = resetPage()
  if (props.filters === undefined) localFilters.value = filters
  emit('update:filters', copyFilters(filters))
  emit('filter-change', copyFilters(filters))
  emitQuery('filter', { filters, page })
}
const applyFilter = (column: TableColumn, values: TableFilterValue[]) => setFilters({ ...filterState.value, [column.key]: values })
let ignorePageResetFromSizeChange = false
const changePage = (value: number) => {
  const page = Math.min(pageCount.value, positiveInteger(value, TABLE_DEFAULTS.firstPage))
  if ((ignorePageResetFromSizeChange && page === TABLE_DEFAULTS.firstPage) || page === currentPage.value) return
  if (props.page === undefined) localPage.value = page
  emit('update:page', page)
  emit('page-change', page, currentPageSize.value)
  emitQuery('page', { page })
}
const changePageSize = (value: number) => {
  const pageSize = positiveInteger(value, TABLE_DEFAULTS.pageSize)
  if (pageSize === currentPageSize.value) return
  // Pagination emits size-change followed by a page reset in the same turn.
  ignorePageResetFromSizeChange = true
  void nextTick(() => { ignorePageResetFromSizeChange = false })
  const changed = currentPage.value !== TABLE_DEFAULTS.firstPage
  if (props.pageSize === undefined) localPageSize.value = pageSize
  if (props.page === undefined) localPage.value = TABLE_DEFAULTS.firstPage
  emit('update:pageSize', pageSize)
  if (changed) emit('update:page', TABLE_DEFAULTS.firstPage)
  emit('page-change', TABLE_DEFAULTS.firstPage, pageSize)
  emitQuery('page-size', { page: TABLE_DEFAULTS.firstPage, pageSize })
}
if (props.page === undefined) localPage.value = currentPage.value
watch([pageCount, paginationEnabled], () => {
  if (!paginationEnabled.value || props.page !== undefined || localPage.value <= pageCount.value) return
  localPage.value = currentPage.value
  emit('update:page', localPage.value)
  emit('page-change', localPage.value, currentPageSize.value)
  emitQuery('page')
})

defineExpose({ clearSelection: () => setSelection([]), resetFilters: () => setFilters({}), getQuery: () => getQuery() })
</script>
