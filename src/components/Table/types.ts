import type { SelectOption } from '../Select/Select.vue'

export type TableRow = Record<string, unknown>
export type TableRowKey = string | number
export type TableFilterValue = SelectOption['value']
export type TableFilterOption = SelectOption
export type TableFilters = Record<string, TableFilterValue[]>
export type TableColumnWidths = Record<string, number>

export interface TableColumn {
  key: string
  label: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  sortMethod?: (left: TableRow, right: TableRow) => number
  formatter?: (row: TableRow, value: unknown, index: number) => string | number
  filters?: TableFilterOption[]
  filterMultiple?: boolean
  /** Values within a column are ORed; different columns are ANDed. */
  filterMethod?: (value: TableFilterValue, row: TableRow) => boolean
  fixed?: 'left' | 'right'
  resizable?: boolean
  minWidth?: number
  maxWidth?: number
}

export interface TableSort {
  key: string
  order: 'ascending' | 'descending' | null
}

/** Presentation options forwarded to the existing Pagination component. */
export interface TablePaginationOptions {
  pageSizes?: number[]
  pagerCount?: number
  simple?: boolean
  showTotal?: boolean
  hideOnSinglePage?: boolean
  disabled?: boolean
}

export interface TableQuery {
  sort: TableSort
  filters: TableFilters
  page: number
  pageSize: number
}

export type TableQueryAction = 'sort' | 'filter' | 'page' | 'page-size'

export interface TableColumnResize {
  key: string
  width: number
}

export interface TableProps {
  data: readonly TableRow[]
  columns: readonly TableColumn[]
  rowKey?: string | ((row: TableRow) => TableRowKey)
  selectedKeys?: readonly TableRowKey[]
  selectable?: boolean
  /** The index is in data, before any local filtering, sorting, or pagination. */
  rowSelectable?: (row: TableRow, index: number) => boolean
  loading?: boolean
  border?: boolean
  stripe?: boolean
  maxHeight?: number | string
  minWidth?: number
  defaultSort?: TableSort
  /** undefined is uncontrolled; null explicitly clears the sort. */
  sort?: TableSort | null
  filters?: TableFilters
  defaultFilters?: TableFilters
  /** data is the already-queried page; no local filtering, sorting, or slicing occurs. */
  remote?: boolean
  pagination?: boolean | TablePaginationOptions
  page?: number
  defaultPage?: number
  pageSize?: number
  defaultPageSize?: number
  /** Remote total only. Local pagination derives its total after filtering. */
  total?: number
  resizable?: boolean
  columnWidths?: TableColumnWidths
  defaultColumnWidths?: TableColumnWidths
  columnSettings?: boolean
  /** Visibility never changes query state. Order always follows columns. */
  visibleColumnKeys?: string[]
  defaultVisibleColumnKeys?: string[]
  emptyText?: string
  ariaLabel?: string
}
