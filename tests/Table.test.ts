// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Table from '../src/components/Table/Table.vue'

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
const data = [{ id: 1, name: 'Ada', score: 90 }, { id: 2, name: 'Grace', score: 70 }]
const columns = [{ key: 'name', label: 'Name' }, { key: 'score', label: 'Score', sortable: true }]

describe('Table', () => {
  it('cycles sorting without mutating caller data', async () => {
    const wrapper = mount(Table, { props: { data, columns } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-table__sort').trigger('click')
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Grace')
    expect(data[0].name).toBe('Ada')
    expect(wrapper.findAll('th')[1].attributes('aria-sort')).toBe('ascending')
    await wrapper.get('.scq-table__sort').trigger('click')
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Ada')
    await wrapper.get('.scq-table__sort').trigger('click')
    expect(wrapper.emitted('sort-change')?.[2]).toEqual([{ key: 'score', order: null }])
  })

  it('retains row identity across sorting and supports select-all', async () => {
    const wrapper = mount(Table, { props: { data, columns, selectable: true } })
    wrappers.push(wrapper)
    await wrapper.findAll('tbody input')[0].setValue(true)
    expect(wrapper.emitted('update:selectedKeys')).toEqual([[ [1] ]])
    await wrapper.get('.scq-table__sort').trigger('click')
    expect(wrapper.findAll('tbody input')[1].element.checked).toBe(true)
    await wrapper.get('thead input').setValue(true)
    expect(wrapper.emitted('update:selectedKeys')?.[1]).toEqual([[1, 2]])
    wrapper.vm.clearSelection()
    expect(wrapper.emitted('update:selectedKeys')?.[2]).toEqual([[]])
  })

  it('supports custom cells and empty content', async () => {
    const wrapper = mount(Table, { props: { data, columns }, slots: { name: '<template #name="{ row }"><strong>{{ row.name }}</strong></template>', empty: 'Nothing found' } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('strong')).toHaveLength(2)
    await wrapper.setProps({ data: [] })
    expect(wrapper.get('tbody').text()).toBe('Nothing found')
  })
})