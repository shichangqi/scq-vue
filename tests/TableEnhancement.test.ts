// @vitest-environment jsdom

import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Table from '../src/components/Table/Table.vue'
import TableFilter from '../src/components/Table/TableFilter.vue'
import Pagination from '../src/components/Pagination/Pagination.vue'
import Select from '../src/components/Select/Select.vue'
import { TABLE_DEFAULTS } from '../src/components/Table/constants'
import type { TableColumn, TableFilterValue, TableProps, TableQuery, TableRow } from '../src/components/Table'

vi.mock('@floating-ui/dom', () => ({
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  autoUpdate: (_reference: Element, _floating: Element, update: () => void) => { update(); return () => {} },
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}))

const wrappers: VueWrapper[] = []
const containers: HTMLElement[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  containers.splice(0).forEach((container) => container.remove())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const rows = [
  { id: 1, name: 'Ada', score: 90, status: 'active' },
  { id: 2, name: 'Grace', score: 70, status: 'pending' },
  { id: 3, name: 'Lin', score: 95, status: 'active' },
  { id: 4, name: 'Alex', score: 80, status: 'active' },
  { id: 5, name: 'Jamie', score: 60, status: 'pending' },
]
const columns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'score', label: 'Score', sortable: true },
  { key: 'status', label: 'Status', filters: [{ label: 'Active', value: 'active' }, { label: 'Pending', value: 'pending' }] },
]
const render = (props: Partial<TableProps> = {}) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  containers.push(container)
  const wrapper = mount(Table, { props: { data: rows, columns, ...props }, attachTo: container })
  wrappers.push(wrapper)
  return wrapper
}
const names = (wrapper: VueWrapper) => wrapper.findAll('tbody [data-column-key="name"]').map((cell) => cell.text())
const header = (wrapper: VueWrapper, key: string) => wrapper.get(`thead [data-column-key="${key}"]`)
const checkbox = (wrapper: VueWrapper, index: number) => wrapper.findAll<HTMLInputElement>('tbody input[type="checkbox"]')[index]
const queries = (wrapper: VueWrapper) => wrapper.emitted('query-change') as [TableQuery, string][] | undefined
const filter = (wrapper: VueWrapper, key = 'status') => wrapper.findAllComponents(TableFilter).find((entry) => entry.props('column').key === key)!
const applyFilter = async (wrapper: VueWrapper, values: TableFilterValue[], key = 'status') => {
  filter(wrapper, key).vm.$emit('apply', values)
  await nextTick()
}
const goToPage = async (wrapper: VueWrapper, page: number) => {
  const button = wrapper.findAll('.scq-pagination__pages button').find((entry) => entry.text() === String(page))!
  await button.trigger('click')
}
const pointer = (type: string, clientX: number, pointerId = 1, button = 0) => {
  const event = new MouseEvent(type, { clientX, button, bubbles: true, cancelable: true })
  Object.defineProperties(event, { pointerId: { value: pointerId }, isPrimary: { value: true } })
  return event
}
const startDrag = async (wrapper: VueWrapper, key: string, start = 100) => {
  header(wrapper, key).get('.scq-table__resize').element.dispatchEvent(pointer('pointerdown', start))
  await nextTick()
}
const moveDrag = async (clientX: number, pointerId = 1) => {
  document.dispatchEvent(pointer('pointermove', clientX, pointerId))
  await nextTick()
}
const fixedColumns: TableColumn[] = [
  { key: 'name', label: 'Name', fixed: 'left', width: 100, resizable: true, minWidth: 80, maxWidth: 200 },
  { key: 'score', label: 'Score', fixed: 'left', width: 120 },
  { key: 'status', label: 'Status', width: 200 },
  { key: 'region', label: 'Region', fixed: 'right', width: 110 },
  { key: 'actions', label: 'Actions', fixed: 'right', width: 90 },
]

describe('Table query enhancements', () => {
  it('keeps new modes opt-in and preserves row-click, nested keys, formatters, and slots', async () => {
    const wrapper = render()
    expect(wrapper.findComponent(Pagination).exists()).toBe(false)
    expect(wrapper.find('.scq-table__toolbar').exists()).toBe(false)
    expect(wrapper.find('.scq-table__resize').exists()).toBe(false)
    expect(wrapper.find('.is-managed').exists()).toBe(false)
    expect(names(wrapper)).toEqual(rows.map((row) => row.name))
    await wrapper.get('tbody tr').trigger('click')
    expect(wrapper.emitted('row-click')?.[0][0]).toEqual(rows[0])
    const formatted = render({
      data: [{ person: { key: 'ada', name: 'Ada' } }],
      columns: [{ key: 'person.name', label: 'Name', formatter: (_row, value) => `@${value}` }],
      rowKey: 'person.key', selectable: true,
    })
    expect(formatted.get('tbody').text()).toBe('@Ada')
    await checkbox(formatted, 0).setValue(true)
    expect(formatted.emitted('update:selectedKeys')?.[0]).toEqual([['ada']])
  })

  it('treats controlled null sort as an override and emits requests without optimistic sorting', async () => {
    const wrapper = render({ sort: null, defaultSort: { key: 'score', order: 'descending' } })
    expect(header(wrapper, 'score').attributes('aria-sort')).toBe('none')
    await wrapper.get('.scq-table__sort').trigger('click')
    expect(wrapper.emitted('update:sort')?.[0]).toEqual([{ key: 'score', order: 'ascending' }])
    expect(wrapper.emitted('sort-change')?.[0]).toEqual([{ key: 'score', order: 'ascending' }])
    expect(queries(wrapper)?.[0]).toEqual([{ sort: { key: 'score', order: 'ascending' }, filters: {}, page: 1, pageSize: TABLE_DEFAULTS.pageSize }, 'sort'])
    expect(names(wrapper)).toEqual(rows.map((row) => row.name))
    expect(header(wrapper, 'score').attributes('aria-sort')).toBe('none')
    await wrapper.setProps({ sort: { key: 'score', order: 'descending' } })
    expect(names(wrapper)).toEqual(['Lin', 'Ada', 'Alex', 'Grace', 'Jamie'])
    await wrapper.setProps({ sort: null })
    expect(names(wrapper)).toEqual(rows.map((row) => row.name))
    expect(rows[0].name).toBe('Ada')
  })

  it('composes local filters, custom filter methods, sorting, and pagination in that order', () => {
    const customColumns: TableColumn[] = [
      ...columns,
      { key: 'threshold', label: 'Threshold', filterMethod: (value, row) => Number(row.score) >= Number(value) },
    ]
    const defaultFilters = { status: ['active'], threshold: [85], removed: ['ignored'] }
    const wrapper = render({
      columns: customColumns, defaultFilters, defaultSort: { key: 'score', order: 'ascending' },
      pagination: true, defaultPage: 2, defaultPageSize: 1,
    })
    expect(names(wrapper)).toEqual(['Lin'])
    expect(wrapper.getComponent(Pagination).props('total')).toBe(2)
    expect(defaultFilters).toEqual({ status: ['active'], threshold: [85], removed: ['ignored'] })
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('ORs values within one column, ANDs columns, and compares nested numeric fields without coercion', () => {
    const wrapper = render({
      data: [{ id: 1, name: 'One', nested: { value: 1 }, kind: 'a' }, { id: 2, name: 'Two', nested: { value: '1' }, kind: 'a' }, { id: 3, name: 'Three', nested: { value: 2 }, kind: 'b' }],
      columns: [{ key: 'name', label: 'Name' }, { key: 'nested.value', label: 'Value' }, { key: 'kind', label: 'Kind' }],
      filters: { 'nested.value': [1, 2], kind: ['a'] },
    })
    expect(names(wrapper)).toEqual(['One'])
  })

  it('resets page atomically on filtering and sorting and exposes defensive query snapshots', async () => {
    const wrapper = render({ pagination: true, defaultPage: 3, defaultPageSize: 2 })
    expect(names(wrapper)).toEqual(['Jamie'])
    await applyFilter(wrapper, ['active'])
    expect(names(wrapper)).toEqual(['Ada', 'Lin'])
    expect(wrapper.emitted('update:page')).toEqual([[1]])
    expect(wrapper.emitted('filter-change')).toEqual([[{ status: ['active'] }]])
    expect(queries(wrapper)).toHaveLength(1)
    expect(queries(wrapper)?.[0]).toEqual([{ sort: { key: '', order: null }, filters: { status: ['active'] }, page: 1, pageSize: 2 }, 'filter'])
    queries(wrapper)![0][0].filters.status.push('pending')
    expect(names(wrapper)).toEqual(['Ada', 'Lin'])
    expect(wrapper.vm.getQuery().filters).toEqual({ status: ['active'] })
    await goToPage(wrapper, 2)
    expect(names(wrapper)).toEqual(['Alex'])
    await wrapper.get('.scq-table__sort').trigger('click')
    expect(names(wrapper)).toEqual(['Alex', 'Ada'])
    expect(queries(wrapper)?.at(-1)?.[0]).toEqual({ sort: { key: 'score', order: 'ascending' }, filters: { status: ['active'] }, page: 1, pageSize: 2 })
    wrapper.vm.resetFilters()
    await nextTick()
    expect(wrapper.vm.getQuery().filters).toEqual({})
    expect(wrapper.getComponent(Pagination).props('total')).toBe(rows.length)
  })

  it('honors controlled filters and page even when requests are rejected', async () => {
    const controlled = {}
    const wrapper = render({ filters: controlled, defaultFilters: { status: ['active'] }, pagination: true, page: 3, pageSize: 2 })
    await applyFilter(wrapper, ['active'])
    expect(names(wrapper)).toEqual(['Jamie'])
    expect(wrapper.getComponent(Pagination).props('modelValue')).toBe(3)
    expect(wrapper.emitted('update:filters')?.[0]).toEqual([{ status: ['active'] }])
    expect(wrapper.emitted('update:page')?.[0]).toEqual([1])
    expect(queries(wrapper)?.[0]?.[0].page).toBe(1)
    expect(controlled).toEqual({})
    await wrapper.setProps({ filters: { status: ['active'] }, page: 1 })
    expect(names(wrapper)).toEqual(['Ada', 'Lin'])
    await wrapper.setProps({ filters: {} })
    expect(names(wrapper)).toEqual(['Ada', 'Grace'])
    expect(queries(wrapper)).toHaveLength(1)
  })

  it('keeps filter drafts separate, supports single values, cancel/reset, and restores trigger focus', async () => {
    const wrapper = render({ columns: columns.map((column) => column.key === 'status' ? { ...column, filterMultiple: false } : column) })
    const panel = filter(wrapper)
    await panel.get('.scq-table__filter').trigger('click')
    await flushPromises()
    panel.getComponent(Select).vm.$emit('update:modelValue', 'active')
    await nextTick()
    expect(names(wrapper)).toHaveLength(rows.length)
    expect(queries(wrapper)).toBeUndefined()
    await wrapper.setProps({ stripe: true })
    expect(panel.getComponent(Select).props('modelValue')).toBe('active')
    const buttons = () => [...document.querySelectorAll<HTMLButtonElement>('.scq-table__filter-actions button')]
    buttons()[1].click()
    await nextTick()
    expect(panel.get('.scq-table__filter').attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(panel.get('.scq-table__filter').element)
    await panel.get('.scq-table__filter').trigger('click')
    await flushPromises()
    expect(panel.getComponent(Select).props('modelValue')).toBe(null)
    panel.getComponent(Select).vm.$emit('update:modelValue', ['active', 'pending'])
    await nextTick()
    buttons()[2].click()
    await nextTick()
    expect(names(wrapper)).toEqual(['Ada', 'Lin', 'Alex'])
    expect(wrapper.emitted('filter-change')?.[0]).toEqual([{ status: ['active'] }])
    await panel.get('.scq-table__filter').trigger('click')
    await flushPromises()
    buttons()[0].click()
    await nextTick()
    expect(names(wrapper)).toHaveLength(rows.length)
    expect(wrapper.emitted('filter-change')?.at(-1)).toEqual([{}])
  })

  it('keeps controlled page and size unchanged until accepted', async () => {
    const wrapper = render({ pagination: { pageSizes: [1, 2, 3] }, page: 2, pageSize: 1 })
    await goToPage(wrapper, 3)
    expect(names(wrapper)).toEqual(['Grace'])
    expect(wrapper.emitted('update:page')?.[0]).toEqual([3])
    await wrapper.setProps({ page: 3 })
    expect(names(wrapper)).toEqual(['Lin'])
    const sizeControl = wrapper.get('.scq-pagination__size [role="combobox"]')
    await sizeControl.trigger('click')
    await sizeControl.trigger('keydown', { key: 'Home' })
    await sizeControl.trigger('keydown', { key: 'ArrowDown' })
    await sizeControl.trigger('keydown', { key: 'Enter' })
    expect(names(wrapper)).toEqual(['Lin'])
    expect(wrapper.emitted('update:pageSize')).toEqual([[2]])
    expect(wrapper.emitted('page-change')?.at(-1)).toEqual([1, 2])
    expect(queries(wrapper)?.filter(([, action]) => action === 'page-size')).toHaveLength(1)
    expect(queries(wrapper)).toHaveLength(2)
    expect(queries(wrapper)?.at(-1)).toEqual([{ sort: { key: '', order: null }, filters: {}, page: 1, pageSize: 2 }, 'page-size'])
    await wrapper.setProps({ page: 1, pageSize: 2 })
    expect(names(wrapper)).toEqual(['Ada', 'Grace'])
  })

  it('clamps local pages after data shrink and keeps the pager and rendered page consistent', async () => {
    const wrapper = render({ pagination: true, defaultPage: 3, defaultPageSize: 2 })
    await wrapper.setProps({ data: rows.slice(0, 1) })
    expect(names(wrapper)).toEqual(['Ada'])
    expect(wrapper.getComponent(Pagination).props('modelValue')).toBe(1)
    expect(wrapper.emitted('update:page')).toEqual([[1]])
    expect(queries(wrapper)?.[0]?.[1]).toBe('page')
    await wrapper.setProps({ data: [] })
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.getComponent(Pagination).props('total')).toBe(0)
    const controlled = render({ pagination: true, page: 99, pageSize: 2 })
    expect(names(controlled)).toEqual(['Jamie'])
    expect(controlled.getComponent(Pagination).props('modelValue')).toBe(3)
    expect(controlled.emitted('update:page')).toBeUndefined()
  })

  it('bypasses all local query operations in explicit remote mode', async () => {
    const sortMethod = vi.fn(() => 0)
    const filterMethod = vi.fn(() => false)
    const serverRows = [rows[4], rows[1], rows[0]]
    const wrapper = render({
      data: serverRows,
      columns: columns.map((column) => ({ ...column, sortMethod, filterMethod })),
      remote: true, sort: { key: 'score', order: 'ascending' }, filters: { status: ['active'] },
      pagination: true, page: 4, pageSize: 1, total: 200,
    })
    expect(names(wrapper)).toEqual(['Jamie', 'Grace', 'Ada'])
    expect(wrapper.getComponent(Pagination).props('total')).toBe(200)
    await wrapper.get('.scq-table__sort').trigger('click')
    await applyFilter(wrapper, ['pending'])
    expect(names(wrapper)).toEqual(['Jamie', 'Grace', 'Ada'])
    expect(sortMethod).not.toHaveBeenCalled()
    expect(filterMethod).not.toHaveBeenCalled()
    expect(queries(wrapper)?.map(([query, action]) => [query.page, action])).toEqual([[1, 'sort'], [1, 'filter']])
    expect(serverRows).toEqual([rows[4], rows[1], rows[0]])
  })
})

describe('Table current-page selection', () => {
  it('selects eligible rows on the displayed page only and retains keys through query changes', async () => {
    const rowSelectable = vi.fn((row: TableRow) => row.id !== 2)
    const wrapper = render({ pagination: true, defaultPageSize: 2, selectable: true, rowSelectable })
    expect(checkbox(wrapper, 1).element.disabled).toBe(true)
    await wrapper.get('thead input').setValue(true)
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1]])
    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[rows[0]], [1]])
    await goToPage(wrapper, 2)
    await checkbox(wrapper, 0).setValue(true)
    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[rows[2]], [1, 3]])
    await wrapper.get('.scq-table__sort').trigger('click')
    await wrapper.get('.scq-table__sort').trigger('click')
    expect(names(wrapper)).toEqual(['Lin', 'Ada'])
    expect(wrapper.findAll<HTMLInputElement>('tbody input').every((input) => input.element.checked)).toBe(true)
    expect(rowSelectable).toHaveBeenCalledWith(rows[2], 2)
    await applyFilter(wrapper, ['pending'])
    expect(names(wrapper)).toEqual(['Grace', 'Jamie'])
    await wrapper.get('thead input').setValue(true)
    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[rows[4]], [1, 3, 5]])
    wrapper.vm.clearSelection()
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[]])
  })

  it('does not change disabled or off-page keys during select-all and restores controlled DOM state', async () => {
    const wrapper = render({ pagination: true, pageSize: 2, selectable: true, selectedKeys: [99, 2], rowSelectable: (row) => row.id !== 2 })
    await checkbox(wrapper, 0).setValue(true)
    expect(checkbox(wrapper, 0).element.checked).toBe(false)
    expect(checkbox(wrapper, 1).element.checked).toBe(true)
    expect(wrapper.emitted('update:selectedKeys')?.[0]).toEqual([[99, 2, 1]])
    await wrapper.get('thead input').setValue(true)
    expect(wrapper.get<HTMLInputElement>('thead input').element.checked).toBe(false)
    await wrapper.setProps({ selectedKeys: [99, 2, 1] })
    expect(wrapper.get<HTMLInputElement>('thead input').element.checked).toBe(true)
    await wrapper.get('thead input').setValue(false)
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[99, 2]])
    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[rows[1]], [99, 2]])
    await wrapper.setProps({ rowSelectable: () => false })
    expect(wrapper.get<HTMLInputElement>('thead input').element.disabled).toBe(true)
    expect(wrapper.get<HTMLInputElement>('thead input').element.indeterminate).toBe(false)
  })

  it('retains unloaded remote keys and returns only selected current-page row objects', async () => {
    const wrapper = render({ data: rows.slice(0, 2), selectable: true, remote: true, pagination: true, pageSize: 2, total: rows.length })
    await checkbox(wrapper, 0).setValue(true)
    await wrapper.setProps({ data: rows.slice(2, 4), page: 2 })
    await checkbox(wrapper, 0).setValue(true)
    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[rows[2]], [1, 3]])
    await wrapper.setProps({ data: [rows[0]], page: 1 })
    expect(checkbox(wrapper, 0).element.checked).toBe(true)
    await wrapper.get('thead input').setValue(false)
    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[], [3]])
  })

  it('preserves fallback source-index identity across filtering, sorting, and paging', async () => {
    const wrapper = render({ data: rows.map(({ id: _id, ...row }) => row), selectable: true, pagination: true, defaultPageSize: 2 })
    await checkbox(wrapper, 0).setValue(true)
    await wrapper.get('.scq-table__sort').trigger('click')
    await applyFilter(wrapper, ['active'])
    expect(names(wrapper)).toEqual(['Alex', 'Ada'])
    expect(checkbox(wrapper, 1).element.checked).toBe(true)
    expect(wrapper.emitted('update:selectedKeys')?.[0]).toEqual([[0]])
  })
})

describe('Table column layout and visibility', () => {
  it('computes both fixed sides including selection and updates after resize, visibility, and reorder', async () => {
    const wrapper = render({ columns: fixedColumns, selectable: true })
    expect(header(wrapper, 'name').attributes('style')).toContain('left: 44px')
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 144px')
    expect(header(wrapper, 'region').attributes('style')).toContain('right: 90px')
    expect(header(wrapper, 'actions').attributes('style')).toContain('right: 0px')
    expect(wrapper.get('tbody [data-column-key="score"]').attributes('style')).toContain('left: 144px')
    expect(wrapper.get('thead .scq-table__selection').attributes('style')).toContain('left: 0px')
    await header(wrapper, 'name').get('.scq-table__resize').trigger('keydown', { key: 'ArrowRight' })
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 154px')
    await wrapper.setProps({ visibleColumnKeys: ['score', 'status', 'region'] })
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 44px')
    expect(header(wrapper, 'region').attributes('style')).toContain('right: 0px')
    await wrapper.setProps({ visibleColumnKeys: undefined, columns: [fixedColumns[1], fixedColumns[0], ...fixedColumns.slice(2)] })
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 44px')
    expect(header(wrapper, 'name').attributes('style')).toContain('left: 164px')
  })

  it('uses observed rendered widths for non-pixel columns and disconnects observers', async () => {
    const widths: Record<string, number> = { name: 150, score: 130, region: 120, actions: 95 }
    const callbacks: (() => void)[] = []
    const disconnect = vi.fn()
    const unobserve = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { callbacks.push(callback) }
      observe = vi.fn()
      unobserve = unobserve
      disconnect = disconnect
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { width: this.classList.contains('scq-table__selection') ? 50 : widths[this.dataset.columnKey ?? ''] ?? 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }
    })
    const wrapper = render({ columns: fixedColumns.map((column) => column.key === 'name' ? { ...column, width: '25%' } : column), selectable: true })
    await nextTick()
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 200px')
    expect(header(wrapper, 'region').attributes('style')).toContain('right: 95px')
    widths.name = 180
    callbacks[0]()
    await nextTick()
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 230px')
    await wrapper.setProps({ visibleColumnKeys: ['score'] })
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 50px')
    expect(unobserve).toHaveBeenCalled()
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(disconnect).toHaveBeenCalled()
  })

  it('supports controlled visibility including zero columns without changing query or selection state', async () => {
    const wrapper = render({
      columns, columnSettings: true, visibleColumnKeys: ['name'], selectable: true, selectedKeys: [1],
      filters: { status: ['active'] }, sort: { key: 'score', order: 'descending' },
    })
    expect(names(wrapper)).toEqual(['Lin', 'Ada', 'Alex'])
    const settings = wrapper.getComponent(Select)
    settings.vm.$emit('update:modelValue', ['score'])
    await nextTick()
    expect(wrapper.emitted('update:visibleColumnKeys')).toEqual([[['score']]])
    expect(wrapper.emitted('column-visibility-change')).toEqual([[['score']]])
    expect(names(wrapper)).toEqual(['Lin', 'Ada', 'Alex'])
    expect(queries(wrapper)).toBeUndefined()
    await wrapper.setProps({ visibleColumnKeys: [] })
    expect(wrapper.findAll('thead th')).toHaveLength(1)
    expect(wrapper.findAll('tbody input')).toHaveLength(3)
    expect(checkbox(wrapper, 1).element.checked).toBe(true)
    await wrapper.setProps({ selectable: false })
    expect(wrapper.findAll('thead th')).toHaveLength(1)
    expect(wrapper.findAll('tbody td')).toHaveLength(3)
    await wrapper.setProps({ data: [] })
    expect(wrapper.get('tbody td').attributes('colspan')).toBe('1')
    expect(wrapper.vm.getQuery().filters).toEqual({ status: ['active'] })
  })

  it('supports uncontrolled defaults and follows the supplied column order rather than selection order', async () => {
    const defaults = ['score']
    const wrapper = render({ columnSettings: true, defaultVisibleColumnKeys: defaults })
    expect(wrapper.findAll('thead [data-column-key]').map((cell) => cell.attributes('data-column-key'))).toEqual(['score'])
    wrapper.getComponent(Select).vm.$emit('update:modelValue', ['status', 'name', 'missing', 'name'])
    await nextTick()
    expect(wrapper.findAll('thead [data-column-key]').map((cell) => cell.attributes('data-column-key'))).toEqual(['name', 'status'])
    expect(wrapper.emitted('update:visibleColumnKeys')?.[0]).toEqual([['name', 'status']])
    expect(defaults).toEqual(['score'])
  })
})

describe('Table accessible column resizing', () => {
  it('supports keyboard limits, shift steps, overrides, and controlled widths without mutating columns', async () => {
    const widths = { name: 150 }
    const wrapper = render({ columns: fixedColumns, columnWidths: widths, defaultColumnWidths: { name: 180 } })
    const handle = header(wrapper, 'name').get('.scq-table__resize')
    expect(handle.attributes('role')).toBe('separator')
    expect(handle.attributes('tabindex')).toBe('0')
    expect(handle.attributes('aria-orientation')).toBe('vertical')
    expect(handle.attributes('aria-controls')).toBe(wrapper.get('table').attributes('id'))
    expect(handle.attributes('aria-valuemin')).toBe('80')
    expect(handle.attributes('aria-valuemax')).toBe('200')
    expect(handle.attributes('aria-valuenow')).toBe('150')
    await handle.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:columnWidths')?.at(-1)).toEqual([{ name: 160 }])
    expect(header(wrapper, 'name').attributes('style')).toContain('width: 150px')
    await wrapper.setProps({ columnWidths: { name: 160 } })
    await handle.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    expect(wrapper.emitted('update:columnWidths')?.at(-1)).toEqual([{ name: 110 }])
    await handle.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('column-resize')?.at(-1)).toEqual([{ key: 'name', width: 80 }])
    await handle.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('column-resize')?.at(-1)).toEqual([{ key: 'name', width: 200 }])
    await wrapper.setProps({ columnWidths: { name: 200 } })
    const count = wrapper.emitted('column-resize')!.length
    await handle.trigger('keydown', { key: 'ArrowRight' })
    await handle.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('column-resize')).toHaveLength(count)
    expect(fixedColumns[0].width).toBe(100)
    expect(widths).toEqual({ name: 150 })
  })

  it('allows per-column opt-out from global resizing', () => {
    const wrapper = render({ resizable: true, columns: [{ key: 'name', label: 'Name', resizable: false }, { key: 'score', label: 'Score', width: '120px' }] })
    expect(header(wrapper, 'name').find('.scq-table__resize').exists()).toBe(false)
    expect(header(wrapper, 'score').get('.scq-table__resize').attributes('aria-valuenow')).toBe('120')
  })

  it('keeps initial and fractional widths within the accessible resize bounds', async () => {
    const wrapper = render({ resizable: true, columns: [{ key: 'name', label: 'Name', width: 40, minWidth: 80, maxWidth: 90.5 }] })
    const handle = header(wrapper, 'name').get('.scq-table__resize')
    expect(handle.attributes('aria-valuenow')).toBe('80')
    expect(header(wrapper, 'name').attributes('style')).toContain('width: 80px')
    await handle.trigger('keydown', { key: 'End' })
    expect(handle.attributes('aria-valuenow')).toBe('90.5')
    expect(wrapper.emitted('column-resize')?.[0]).toEqual([{ key: 'name', width: 90.5 }])
  })

  it('uses the active pointer only, clamps widths, commits once, and removes drag listeners', async () => {
    const wrapper = render({ columns: fixedColumns })
    const remove = vi.spyOn(document, 'removeEventListener')
    header(wrapper, 'name').get('.scq-table__resize').element.dispatchEvent(pointer('pointerdown', 100, 1, 2))
    await moveDrag(130)
    expect(wrapper.emitted('update:columnWidths')).toBeUndefined()
    await startDrag(wrapper, 'name')
    expect(document.activeElement).toBe(header(wrapper, 'name').get('.scq-table__resize').element)
    await moveDrag(130, 2)
    expect(wrapper.emitted('update:columnWidths')).toBeUndefined()
    await moveDrag(130)
    expect(wrapper.emitted('update:columnWidths')?.at(-1)).toEqual([{ name: 130 }])
    expect(wrapper.emitted('column-resize')).toBeUndefined()
    expect(header(wrapper, 'score').attributes('style')).toContain('left: 130px')
    await moveDrag(500)
    expect(wrapper.emitted('update:columnWidths')?.at(-1)).toEqual([{ name: 200 }])
    document.dispatchEvent(pointer('pointerup', 500, 2))
    expect(wrapper.emitted('column-resize')).toBeUndefined()
    document.dispatchEvent(pointer('pointerup', 500))
    await nextTick()
    expect(wrapper.emitted('column-resize')).toEqual([[{ key: 'name', width: 200 }]])
    expect(wrapper.get('.scq-table-wrapper').classes()).not.toContain('is-resizing')
    const count = wrapper.emitted('update:columnWidths')!.length
    await moveDrag(120)
    expect(wrapper.emitted('update:columnWidths')).toHaveLength(count)
    expect(remove.mock.calls.some(([type]) => type === 'pointermove')).toBe(true)
    expect(remove.mock.calls.some(([type]) => type === 'pointerup')).toBe(true)
    expect(remove.mock.calls.some(([type]) => type === 'pointercancel')).toBe(true)
    expect(remove.mock.calls.some(([type]) => type === 'keydown')).toBe(true)
  })

  it.each(['escape', 'pointercancel', 'blur', 'lostpointercapture'])('rolls back %s cancellation without a commit', async (reason) => {
    const wrapper = render({ columns: fixedColumns, defaultColumnWidths: { name: 120 } })
    await startDrag(wrapper, 'name')
    await moveDrag(140)
    expect(header(wrapper, 'name').attributes('style')).toContain('width: 160px')
    if (reason === 'escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    if (reason === 'pointercancel') document.dispatchEvent(pointer('pointercancel', 140))
    if (reason === 'blur') window.dispatchEvent(new Event('blur'))
    if (reason === 'lostpointercapture') header(wrapper, 'name').get('.scq-table__resize').element.dispatchEvent(pointer('lostpointercapture', 140))
    await nextTick()
    expect(header(wrapper, 'name').attributes('style')).toContain('width: 120px')
    expect(wrapper.emitted('update:columnWidths')?.at(-1)).toEqual([{ name: 120 }])
    expect(wrapper.emitted('column-resize')).toBeUndefined()
    const count = wrapper.emitted('update:columnWidths')!.length
    await moveDrag(190)
    expect(wrapper.emitted('update:columnWidths')).toHaveLength(count)
  })

  it.each(['hidden', 'removed', 'disabled'])('cancels an active drag when its column becomes %s', async (change) => {
    const wrapper = render({ columns: fixedColumns })
    await startDrag(wrapper, 'name')
    await moveDrag(140)
    if (change === 'hidden') await wrapper.setProps({ visibleColumnKeys: ['score'] })
    if (change === 'removed') await wrapper.setProps({ columns: fixedColumns.slice(1) })
    if (change === 'disabled') await wrapper.setProps({ columns: fixedColumns.map((column) => ({ ...column, resizable: false })) })
    expect(wrapper.emitted('update:columnWidths')?.at(-1)).toEqual([{}])
    expect(wrapper.emitted('column-resize')).toBeUndefined()
    const count = wrapper.emitted('update:columnWidths')!.length
    await moveDrag(150)
    expect(wrapper.emitted('update:columnWidths')).toHaveLength(count)
    expect(wrapper.get('.scq-table-wrapper').classes()).not.toContain('is-resizing')
  })

  it('lets parent width overrides interrupt a controlled drag without rolling them back', async () => {
    const wrapper = render({ columns: fixedColumns, columnWidths: { name: 100 } })
    await startDrag(wrapper, 'name')
    await moveDrag(140)
    expect(header(wrapper, 'name').attributes('style')).toContain('width: 100px')
    await wrapper.setProps({ columnWidths: { name: 140 } })
    expect(wrapper.get('.scq-table-wrapper').classes()).toContain('is-resizing')
    await wrapper.setProps({ columnWidths: { name: 170 } })
    expect(header(wrapper, 'name').attributes('style')).toContain('width: 170px')
    expect(wrapper.get('.scq-table-wrapper').classes()).not.toContain('is-resizing')
    await moveDrag(180)
    expect(wrapper.emitted('update:columnWidths')).toEqual([[{ name: 140 }]])
    expect(wrapper.emitted('column-resize')).toBeUndefined()
  })

  it('accepts a parent width override before the first pointer movement', async () => {
    const wrapper = render({ columns: fixedColumns, columnWidths: { name: 100 } })
    await startDrag(wrapper, 'name')
    await wrapper.setProps({ columnWidths: { name: 180 } })
    await moveDrag(120)
    expect(header(wrapper, 'name').attributes('style')).toContain('width: 180px')
    expect(wrapper.emitted('update:columnWidths')).toBeUndefined()
    expect(wrapper.get('.scq-table-wrapper').classes()).not.toContain('is-resizing')
  })

  it.each(['replacement', 'bounds'])('cancels stale resize geometry after column %s changes', async (change) => {
    const current = reactive(fixedColumns.map(column => ({ ...column })))
    const wrapper = render({ columns: current })
    await startDrag(wrapper, 'name')
    await moveDrag(140)
    if (change === 'replacement') await wrapper.setProps({ columns: current.map(column => ({ ...column })) })
    else { current[0].maxWidth = 110; await nextTick() }
    expect(wrapper.get('.scq-table-wrapper').classes()).not.toContain('is-resizing')
    expect(wrapper.emitted('update:columnWidths')?.at(-1)).toEqual([{}])
    await moveDrag(180)
    document.dispatchEvent(pointer('pointerup', 180))
    expect(wrapper.emitted('column-resize')).toBeUndefined()
  })

  it('leaves composition, browser shortcuts, and consumed resize keys untouched', async () => {
    const wrapper = render({ columns: fixedColumns })
    const handle = header(wrapper, 'name').get('.scq-table__resize')
    for (const options of [{ isComposing: true }, { keyCode: 229 }, { ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      await handle.trigger('keydown', { key: 'ArrowRight', ...options })
    }
    const consumed = new KeyboardEvent('keydown', { key: 'End', cancelable: true, bubbles: true })
    consumed.preventDefault()
    handle.element.dispatchEvent(consumed)
    expect(wrapper.emitted('column-resize')).toBeUndefined()
    await handle.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(wrapper.emitted('column-resize')?.[0]).toEqual([{ key: 'name', width: 100 + TABLE_DEFAULTS.resizeLargeStep }])
  })

  it('restores the table region when a focused selection or column disappears', async () => {
    const wrapper = render({ columns: fixedColumns, selectable: true })
    checkbox(wrapper, 0).element.focus()
    await wrapper.setProps({ data: rows.slice(1) })
    expect(document.activeElement).toBe(wrapper.get('.scq-table-wrapper').element)
    header(wrapper, 'name').get<HTMLElement>('.scq-table__resize').element.focus()
    await wrapper.setProps({ visibleColumnKeys: ['score'] })
    expect(document.activeElement).toBe(wrapper.get('.scq-table-wrapper').element)
  })

  it('releases captured pointers and all active listeners on unmount without extra emissions', async () => {
    const wrapper = render({ columns: fixedColumns })
    const onWidths = vi.fn()
    await wrapper.setProps({ 'onUpdate:columnWidths': onWidths })
    const handle = header(wrapper, 'name').get('.scq-table__resize').element as HTMLElement
    const capture = vi.fn()
    const release = vi.fn()
    handle.setPointerCapture = capture
    handle.hasPointerCapture = () => true
    handle.releasePointerCapture = release
    const removeWindow = vi.spyOn(window, 'removeEventListener')
    const removeDocument = vi.spyOn(document, 'removeEventListener')
    await startDrag(wrapper, 'name')
    await moveDrag(130)
    const count = onWidths.mock.calls.length
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(capture).toHaveBeenCalledWith(1)
    expect(release).toHaveBeenCalledWith(1)
    expect(removeWindow.mock.calls.some(([type]) => type === 'blur')).toBe(true)
    expect(removeWindow.mock.calls.some(([type]) => type === 'resize')).toBe(true)
    expect(removeDocument.mock.calls.some(([type]) => type === 'pointermove')).toBe(true)
    await moveDrag(150)
    document.dispatchEvent(pointer('pointerup', 150))
    expect(onWidths).toHaveBeenCalledTimes(count)
    expect(wrapper.emitted('column-resize')).toBeUndefined()
  })
})
