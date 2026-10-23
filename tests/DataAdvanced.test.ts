// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, reactive, ref } from 'vue'
import Tree from '../src/components/Tree/Tree.vue'
import type { TreeCheck, TreeNode } from '../src/components/Tree/types'
import VirtualList from '../src/components/VirtualList/VirtualList.vue'
import Link from '../src/components/Link/Link.vue'
import Grid from '../src/components/Grid/Grid.vue'
import Typography from '../src/components/Typography/Typography.vue'
import Image from '../src/components/Image/Image.vue'
import Card from '../src/components/Card/Card.vue'
import Descriptions from '../src/components/Descriptions/Descriptions.vue'
import { LAYOUT_BREAKPOINTS } from '../src/utils/layout'
import DescriptionsExample from '../playground/src/components/examples/DescriptionsExample.vue'
import { COMPOSITION_KEY_CODE } from '../src/utils/composition'

const wrappers: VueWrapper[] = []
afterEach(() => { wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.restoreAllMocks() })

describe('Tree', () => {
  const data: TreeNode[] = [{ key: 'root', label: 'Root', children: [{ key: 'a', label: 'Alpha' }, { key: 'b', label: 'Beta' }, { key: 'disabled', label: 'Disabled', disabled: true }] }]

  it('restores native checked and mixed state when controlled changes are ignored', async () => {
    const wrapper = mount(Tree, { attachTo: document.body, props: { data, showCheckbox: true, defaultExpandAll: true, checkedKeys: ['a'] } })
    wrappers.push(wrapper)
    const [parent, alpha] = wrapper.findAll<HTMLInputElement>('input')
    expect(parent.element.indeterminate).toBe(true)
    parent.element.click()
    expect(parent.element.checked).toBe(false)
    expect(parent.element.indeterminate).toBe(true)
    await nextTick()
    alpha.element.click()
    expect(alpha.element.checked).toBe(true)
    expect(wrapper.vm.getChecked().checkedKeys).toEqual(['a'])
    expect(wrapper.emitted('update:checkedKeys')).toHaveLength(2)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ disabled: true })
    alpha.element.checked = false
    alpha.element.dispatchEvent(new Event('change', { bubbles: true }))
    expect(alpha.element.checked).toBe(true)
    expect(wrapper.emitted('update:checkedKeys')).toHaveLength(2)
  })

  it('checks current ancestry before accepting queued row or checkbox actions', async () => {
    const parent = reactive<TreeNode>({ key: 'parent', label: 'Parent', children: [{ key: 'leaf', label: 'Leaf' }] })
    const wrapper = mount(Tree, { props: { data: [parent], defaultExpandAll: true, showCheckbox: true } })
    wrappers.push(wrapper)
    const row = wrapper.findAll<HTMLElement>('[role="treeitem"]')[1]
    const input = row.get<HTMLInputElement>('input')
    parent.disabled = true
    row.element.click()
    input.element.checked = true
    input.element.dispatchEvent(new Event('change', { bubbles: true }))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('update:checkedKeys')).toBeUndefined()
  })

  it('protects editor keys while retaining native tree-checkbox Space behavior', async () => {
    const wrapper = mount(Tree, { attachTo: document.body, props: { data: [{ key: 0, label: 'Zero' }, { key: 1, label: 'One' }] }, slots: { default: ({ node }) => h('input', { value: node.label }) } })
    wrappers.push(wrapper)
    const row = wrapper.get<HTMLElement>('[role="treeitem"]')
    row.element.focus()
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await row.trigger('keydown', { key: 'ArrowDown', ...flags })
    }
    const prevented = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    prevented.preventDefault()
    row.element.dispatchEvent(prevented)
    expect(document.activeElement).toBe(row.element)
    const editor = row.get<HTMLInputElement>('input')
    editor.element.focus()
    await editor.trigger('keydown', { key: 'Enter' })
    await editor.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(editor.element)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    const checks = mount(Tree, { attachTo: document.body, props: { data: [{ key: 0, label: 'Zero' }], showCheckbox: true } })
    wrappers.push(checks)
    const checkbox = checks.get<HTMLInputElement>('input')
    checkbox.element.focus()
    await checkbox.trigger('keydown', { key: ' ' })
    await nextTick()
    expect(checks.vm.getChecked().checkedKeys).toEqual([0])
    expect(checks.emitted('update:checkedKeys')).toHaveLength(1)
  })

  it('cancels replaced in-place request nodes without clearing a newer request', async () => {
    const nodes = ref<TreeNode[]>([{ key: 'lazy', label: 'Old root' }])
    const signals: AbortSignal[] = []
    const resolve: ((nodes: TreeNode[]) => void)[] = []
    const load = vi.fn((_node: TreeNode, signal: AbortSignal) => {
      signals.push(signal)
      return new Promise<TreeNode[]>(done => { resolve.push(done) })
    })
    const host = mount({ setup: () => () => h(Tree, { data: nodes.value, load }) })
    wrappers.push(host)
    const wrapper = host.getComponent(Tree)
    await wrapper.get('button').trigger('click')
    nodes.value[0] = { key: 'lazy', label: 'New root' }
    await nextTick()
    expect(signals[0].aborted).toBe(true)
    await wrapper.get('button').trigger('click')
    resolve[0]([{ key: 'old', label: 'Old leaf', isLeaf: true }])
    await flushPromises()
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.emitted('load')).toBeUndefined()
    resolve[1]([{ key: 'new', label: 'New leaf', isLeaf: true }])
    await flushPromises()
    expect(wrapper.text()).toContain('New leaf')
    expect(wrapper.text()).not.toContain('Old leaf')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it.each(['remove', 'disable'] as const)('aborts a pending node when it is changed in place: %s', async operation => {
    const nodes = ref<TreeNode[]>([{ key: 'lazy', label: 'Lazy' }])
    let signal!: AbortSignal
    let finish!: (nodes: TreeNode[]) => void
    const host = mount({ setup: () => () => h(Tree, { data: nodes.value, load: (_node, current) => {
      signal = current
      return new Promise<TreeNode[]>(resolve => { finish = resolve })
    } }) })
    wrappers.push(host)
    const wrapper = host.getComponent(Tree)
    await wrapper.get('button').trigger('click')
    if (operation === 'remove') nodes.value.splice(0, 1)
    else nodes.value[0].disabled = true
    await nextTick()
    expect(signal.aborted).toBe(true)
    finish([{ key: 'late', label: 'Late leaf', isLeaf: true }])
    await flushPromises()
    expect(wrapper.emitted('load')).toBeUndefined()
    expect(wrapper.emitted('expand')).toBeUndefined()
  })

  it.each([null, [{ key: 'duplicate', label: 'A' }, { key: 'duplicate', label: 'B' }]])('keeps invalid lazy responses retryable: %j', async response => {
    const error = vi.fn()
    const load = vi.fn().mockResolvedValueOnce(response).mockResolvedValueOnce([{ key: 'leaf', label: 'Leaf', isLeaf: true }])
    const wrapper = mount(Tree, { props: { data: [{ key: 'lazy', label: 'Lazy' }], load, onError: error } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(error).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('load')).toBeUndefined()
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Leaf')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('reports unhandled lazy-load failures rather than silently collapsing', async () => {
    const failure = new Error('Unavailable')
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(Tree, { props: { data: [{ key: 'lazy', label: 'Lazy' }], load: async () => { throw failure } } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(report).toHaveBeenCalledWith('[scq-vue] Tree node loading failed', failure)
    expect(wrapper.emitted('error')?.[0][0]).toBe(failure)
  })

  it('retains programmatic checked-key updates while disabled but not after disposal', () => {
    const update = vi.fn()
    const wrapper = mount(Tree, { props: { data, disabled: true, showCheckbox: true, 'onUpdate:checkedKeys': update } })
    wrappers.push(wrapper)
    wrapper.vm.setCheckedKeys(['a'])
    expect(wrapper.vm.getChecked().checkedKeys).toEqual(['a'])
    expect(update).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    wrappers.pop()
    wrapper.vm.setCheckedKeys(['b'])
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('accepts a lazy result already written to the same parent by its loader', async () => {
    const parent = reactive<TreeNode>({ key: 'lazy', label: 'Lazy' })
    const error = vi.fn()
    const wrapper = mount(Tree, { props: { data: [parent], onError: error, load: async node => {
      node.children = [{ key: 'leaf', label: 'Leaf', isLeaf: true }]
      return node.children
    } } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(error).not.toHaveBeenCalled()
    expect(wrapper.emitted('load')).toHaveLength(1)
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
  })

  it.each([-1, Infinity, Number.NaN])('rejects invalid indentation: %s', indent => {
    expect(() => mount(Tree, { props: { indent } })).toThrow('finite and non-negative')
  })

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

describe('Descriptions enhancements', () => {
  it('preserves zero keys and slotted control identity when readonly data is reordered', async () => {
    const items = Object.freeze([{ key: 0, label: 'Zero key', value: 0 }, { key: 'other', label: 'Other', value: false }])
    const wrapper = mount(Descriptions, {
      props: { items },
      slots: { '0': ({ index }: { index: number }) => h('input', { 'aria-label': 'Zero key draft', 'data-index': index }) },
    })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.setValue('Preserved')
    await wrapper.setProps({ items: [...items].reverse() })
    expect(wrapper.get('input').element).toBe(input.element)
    expect(input.element.value).toBe('Preserved')
    expect(input.attributes('data-index')).toBe('1')
    expect(items.map(item => item.key)).toEqual([0, 'other'])
  })

  it('surfaces formatter failures rather than rendering a success-shaped empty value', () => {
    const failure = new Error('Formatting failed')
    expect(() => mount(Descriptions, { props: {
      items: [{ label: 'Value', value: 0 }], formatter: () => { throw failure },
    } })).toThrow(failure)
  })
  it('keeps normal and full-span labels aligned in the order example', () => {
    const wrapper = mount(DescriptionsExample)
    wrappers.push(wrapper)
    const descriptions = wrapper.findAllComponents(Descriptions)[0]
    const items = descriptions.props('items')
    const labelWidth = descriptions.props('labelWidth')
    expect(items.find(item => item.key === 'address')?.span).toBeGreaterThan(1)
    for (const item of items) {
      expect(item.labelWidth ?? labelWidth, String(item.key)).toBe(labelWidth)
    }
  })

  it('copies only the masked contact value in the composition example', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    try {
      const wrapper = mount(DescriptionsExample)
      wrappers.push(wrapper)
      const contact = wrapper.get('.descriptions-example__contact')
      await contact.findAll('button.scq-typography__copy')[0].trigger('click')
      await flushPromises()
      expect(writeText).toHaveBeenCalledWith('138****5678')
      await contact.findAll('button.scq-typography__copy')[1].trigger('click')
      await flushPromises()
      expect(writeText).toHaveBeenLastCalledWith('l***@example.com')
    } finally {
      if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('validates edits and separates cancelled drafts from saved description values', async () => {
    const wrapper = mount(DescriptionsExample, { attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('.scq-descriptions__header button').trigger('click')
    await wrapper.get('input').setValue('Cancelled draft')
    await wrapper.get('.descriptions-example__actions button[type="button"]').trigger('click')
    expect(wrapper.text()).not.toContain('Cancelled draft')
    await wrapper.get('.scq-descriptions__header button').trigger('click')
    expect(wrapper.get('input').element.value).not.toBe('Cancelled draft')
    await wrapper.get('input').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[aria-invalid="true"]').exists()).toBe(true)
    await wrapper.get('input').setValue('Saved owner')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Saved owner')
  })

  it('resolves responsive columns at boundaries and clamps spans without replacing slot content', async () => {
    const viewport = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(LAYOUT_BREAKPOINTS.md - 1)
    const wrapper = mount(Descriptions, {
      props: { columns: { xs: 1, md: 3 }, items: [{ key: 'draft', label: 'Draft', span: 8 }] },
      slots: { draft: '<input aria-label="Draft" />' },
    })
    wrappers.push(wrapper)
    await flushPromises()
    const input = wrapper.get('input')
    await input.setValue('Keep draft')
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 1')
    expect(wrapper.get('.scq-descriptions__item').attributes('style')).toContain('--scq-descriptions-span: 1')
    viewport.mockReturnValue(LAYOUT_BREAKPOINTS.md)
    window.dispatchEvent(new Event('resize'))
    await flushPromises()
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 3')
    expect(wrapper.get('.scq-descriptions__item').attributes('style')).toContain('--scq-descriptions-span: 3')
    expect(wrapper.get('input').element).toBe(input.element)
    expect(input.element.value).toBe('Keep draft')
    viewport.mockReturnValue(LAYOUT_BREAKPOINTS.lg)
    window.dispatchEvent(new Event('resize'))
    await flushPromises()
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 3')
  })

  it('keeps numeric defaults and normalizes missing or invalid responsive counts', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(LAYOUT_BREAKPOINTS.xs)
    const wrapper = mount(Descriptions, { props: { items: [{ label: 'Value', span: Infinity }] } })
    wrappers.push(wrapper)
    expect(wrapper.classes()).not.toContain('is-responsive')
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 3')
    expect(wrapper.get('.scq-descriptions__item').attributes('style')).toContain('--scq-descriptions-span: 1')
    await wrapper.setProps({ columns: { md: 3 } })
    expect(wrapper.classes()).toContain('is-responsive')
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 1')
    await wrapper.setProps({ columns: { xs: 2.9 } })
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 2')
    await wrapper.setProps({ columns: NaN })
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 1')
    await wrapper.setProps({ columns: 0 })
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-columns: 1')
  })

  it('inherits label layout and allows per-item overrides in both directions', async () => {
    const wrapper = mount(Descriptions, { props: { labelWidth: 120, labelAlign: 'end', items: [
      { key: 'local', label: 'Local', labelWidth: '6rem', labelAlign: 'center' },
      { key: 'inherited', label: 'Inherited' },
    ] } })
    wrappers.push(wrapper)
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-label-width: 120px')
    expect(wrapper.get('dl').attributes('style')).toContain('--scq-descriptions-label-align: end')
    const items = wrapper.findAll('.scq-descriptions__item')
    expect(items[0].attributes('style')).toContain('--scq-descriptions-label-width: 6rem')
    expect(items[0].attributes('style')).toContain('--scq-descriptions-label-align: center')
    expect(items[1].attributes('style')).not.toContain('--scq-descriptions-label-width')
    await wrapper.setProps({ direction: 'vertical' })
    expect(wrapper.classes()).toContain('is-vertical')
    expect(items[0].attributes('style')).toContain('--scq-descriptions-label-align: center')
  })

  it('only replaces nullish values and applies item formatting before global formatting', async () => {
    const formatter = vi.fn((value) => value)
    const itemFormatter = vi.fn(() => 'Masked')
    const items = [
      { label: 'Zero', value: 0 }, { label: 'False', value: false }, { label: 'Empty string', value: '' },
      { label: 'Null', value: null }, { label: 'Missing' }, { label: 'Private', value: 'Secret', formatter: itemFormatter },
      { label: 'Formatted empty', value: 'Hidden', formatter: () => null },
    ]
    const wrapper = mount(Descriptions, { props: { items, emptyText: 'Not set', formatter } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('dd').map((item) => item.text())).toEqual(['0', 'false', '', 'Not set', 'Not set', 'Masked', 'Not set'])
    expect(formatter).toHaveBeenCalledTimes(5)
    expect(itemFormatter).toHaveBeenCalledWith('Secret', items[5], 5)
    await wrapper.setProps({ formatter: (value) => value === false ? 'Inactive' : value, emptyText: 'Unavailable' })
    expect(wrapper.findAll('dd').map((item) => item.text())).toEqual(['0', 'Inactive', '', 'Unavailable', 'Unavailable', 'Masked', 'Unavailable'])
  })

  it('preserves named slots and provides original and formatted values', () => {
    const wrapper = mount(Descriptions, {
      props: { items: [{ key: 'status', label: 'Status', value: false, formatter: () => 'Inactive' }] },
      slots: {
        'label-status': '<template #label-status="{ item, index }">{{ index }}:{{ item.label }}</template>',
        status: '<template #status="{ item, value, displayValue, index }">{{ item.key }}:{{ value }}:{{ displayValue }}:{{ index }}</template>',
      },
    })
    wrappers.push(wrapper)
    expect(wrapper.get('dt').text()).toBe('0:Status')
    expect(wrapper.get('dd').text()).toBe('status:false:Inactive:0')
  })

  it('removes responsive listeners when returning to numeric columns and on unmount', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(Descriptions)
    wrappers.push(wrapper)
    expect(add.mock.calls.filter(([name]) => name === 'resize')).toHaveLength(0)
    remove.mockClear()
    await wrapper.setProps({ columns: { xs: 1, md: 2 } })
    const listener = add.mock.calls.find(([name]) => name === 'resize')![1]
    await wrapper.setProps({ columns: 3 })
    expect(remove).toHaveBeenCalledWith('resize', listener)
    await wrapper.setProps({ columns: { xs: 1, md: 2 } })
    wrapper.unmount()
    wrappers.pop()
    expect(remove.mock.calls.filter(([name]) => name === 'resize')).toHaveLength(2)
  })
})