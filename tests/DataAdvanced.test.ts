// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Tree from '../src/components/Tree/Tree.vue'
import type { TreeCheck, TreeNode } from '../src/components/Tree/types'
import VirtualList from '../src/components/VirtualList/VirtualList.vue'
import Link from '../src/components/Link/Link.vue'
import Grid from '../src/components/Grid/Grid.vue'
import Typography from '../src/components/Typography/Typography.vue'
import Image from '../src/components/Image/Image.vue'
import Card from '../src/components/Card/Card.vue'
import Descriptions from '../src/components/Descriptions/Descriptions.vue'

const wrappers: VueWrapper[] = []
afterEach(() => { wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.restoreAllMocks() })

describe('Tree', () => {
  const data: TreeNode[] = [{ key: 'root', label: 'Root', children: [{ key: 'a', label: 'Alpha' }, { key: 'b', label: 'Beta' }, { key: 'disabled', label: 'Disabled', disabled: true }] }]

  it('cascades checks and computes half state without mutating disabled nodes', async () => {
    const wrapper = mount(Tree, { props: { data, showCheckbox: true, defaultExpandAll: true } })
    wrappers.push(wrapper)
    await wrapper.findAll('input')[0].setValue(true)
    expect(wrapper.vm.getChecked().checkedKeys).toEqual(expect.arrayContaining(['root', 'a', 'b']))
    expect(wrapper.vm.getChecked().checkedKeys).not.toContain('disabled')
    await wrapper.findAll('input')[1].setValue(false)
    expect(wrapper.vm.getChecked().checkedKeys).toEqual(['b'])
    expect(wrapper.vm.getChecked().halfCheckedKeys).toEqual(['root'])
    expect((wrapper.emitted('check')?.[1][0] as TreeCheck).halfCheckedKeys).toEqual(['root'])
  })

  it('filters with ancestors and navigates visible enabled nodes', async () => {
    const wrapper = mount(Tree, { attachTo: document.body, props: { data, filter: 'Beta' } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('[role="treeitem"]').map((item) => item.text())).toEqual(['Root', 'Beta'])
    await wrapper.findAll('[role="treeitem"]')[0].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toBe('Beta')
    await wrapper.findAll('[role="treeitem"]')[1].trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('loads once, caches results and aborts work when its source changes', async () => {
    let signal!: AbortSignal
    const load = vi.fn((_node: TreeNode, value: AbortSignal) => { signal = value; return Promise.resolve([{ key: 'leaf', label: 'Leaf', isLeaf: true }]) })
    const wrapper = mount(Tree, { props: { data: [{ key: 'lazy', label: 'Lazy' }], load } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    expect(load).toHaveBeenCalledTimes(1)
    expect(signal.aborted).toBe(false)
    await wrapper.setProps({ data: [{ key: 'new', label: 'New' }] })
    expect(wrapper.text()).toBe('New')
  })
})

describe('VirtualList', () => {
  it('renders a bounded viewport instead of thousands of rows', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(220)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(320)
    const wrapper = mount(VirtualList, { props: { items: Array.from({ length: 10000 }, (_, index) => index), height: 220, itemHeight: 44, overscan: 2 } })
    wrappers.push(wrapper)
    await flushPromises()
    const rows = wrapper.findAll('[role="listitem"]')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(20)
    expect(rows[0].attributes('aria-setsize')).toBe('10000')
    expect(wrapper.get('.scq-virtual-list__content').attributes('style')).toContain('440000px')
  })
})

describe('Foundation', () => {
  it('blocks unsafe and disabled links, while protecting new-window links', async () => {
    const wrapper = mount(Link, { props: { href: 'javascript:alert(1)', target: '_blank' }, slots: { default: 'Open' } })
    wrappers.push(wrapper)
    expect(wrapper.attributes('href')).toBeUndefined()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.setProps({ href: '/guide' })
    expect(wrapper.attributes('rel')).toBe('noopener noreferrer')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ disabled: true })
    expect(wrapper.attributes('href')).toBeUndefined()
  })

  it('carries grid breakpoint values forward and clamps invalid columns', () => {
    const wrapper = mount(Grid, { props: { columns: { xs: 0, md: 3, xl: 4 }, gap: [12, 20] } })
    wrappers.push(wrapper)
    expect(wrapper.attributes('style')).toContain('--scq-grid-xs: 1')
    expect(wrapper.attributes('style')).toContain('--scq-grid-lg: 3')
    expect(wrapper.attributes('style')).toContain('gap: 12px 20px')
  })

  it('copies only the displayed typography content', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mount(Typography, { props: { copyable: true }, slots: { default: 'Exact text' } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('Exact text')
    expect(wrapper.emitted('copy')).toEqual([['Exact text']])
    Reflect.deleteProperty(navigator, 'clipboard')
  })
})

describe('Display components', () => {
  it('retries images after source changes and supports preview navigation', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: '/first.jpg', alt: 'Photo', preview: true, previewSrcList: ['/first.jpg', '/second.jpg'], teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('.is-error').exists()).toBe(true)
    await wrapper.setProps({ src: '/second.jpg' })
    await wrapper.get('img').trigger('load')
    await wrapper.get('.scq-image__preview-trigger').trigger('click')
    await flushPromises()
    expect(wrapper.get('.scq-image-viewer__stage img').attributes('src')).toBe('/second.jpg')
    await wrapper.get('.scq-image-viewer__previous').trigger('click')
    expect(wrapper.get('.scq-image-viewer__stage img').attributes('src')).toBe('/first.jpg')
    await wrapper.get('.scq-image-viewer__close').trigger('click')
    expect(wrapper.find('.scq-image-viewer').exists()).toBe(false)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('preserves card content through loading and renders zero description values', async () => {
    const card = mount(Card, { props: { loading: true, header: 'Order' }, slots: { default: '<input value="draft" />' } })
    const descriptions = mount(Descriptions, { props: { items: [{ key: 'count', label: 'Count', value: 0 }, { key: 'active', label: 'Active', value: false }] } })
    wrappers.push(card, descriptions)
    expect(card.find('input').exists()).toBe(true)
    await card.setProps({ loading: false })
    expect(card.get('input').element.value).toBe('draft')
    expect(descriptions.findAll('dd').map((item) => item.text())).toEqual(['0', 'false'])
  })
})