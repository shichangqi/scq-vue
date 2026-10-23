import type { TableSort } from './types'

export const TABLE_DEFAULTS = {
  minWidth: 480,
  ariaLabel: 'Data table',
  firstPage: 1,
  pageSize: 10,
  columnWidth: 160,
  minColumnWidth: 64,
  maxColumnWidth: 1200,
  selectionWidth: 44,
  resizeStep: 10,
  resizeLargeStep: 50,
  filterPanelWidth: 260,
} as const

export const EMPTY_TABLE_SORT: TableSort = { key: '', order: null }
