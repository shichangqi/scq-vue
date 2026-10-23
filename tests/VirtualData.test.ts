// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VirtualList from '../src/components/VirtualList/VirtualList.vue'
import { VIRTUAL_LIST_DEFAULTS } from '../src/components/VirtualList'
import type { VirtualListExpose } from '../src/components/VirtualList'
import Tree from '../src/components/Tree/Tree.vue'
import type { TreeNode } from '../src/components/Tree'
import TreeSelect from '../src/components/TreeSelect/TreeSelect.vue'
import Transfer from '../src/components/Transfer/Transfer.vue'
import AutoComplete from '../src/components/AutoComplete/AutoComplete.vue'
import type { TransferItem } from '../src/components/Transfer'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'

vi.mock('@floating-ui/dom', () => ({
  autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} },
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  offset: vi.fn(), flip: vi.fn(), shift: vi.fn(),
}))

const METRICS = { count: 10_000, runtimeCount: 100, height: 440, itemHeight: 44, overscan: 5, maximumRows: 25, width: 320, inset: 13 } as const
const virtualProps = { height: METRICS.height, itemHeight: METRICS.itemHeight, overscan: METRICS.overscan }
const wrappers: VueWrapper[] = []
const observers: ResizeObserverMock[] = []
const measuredHeights = new Map<Element, number>()
const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
const dispose = (wrapper: VueWrapper) => { wrappers.splice(wrappers.indexOf(wrapper), 1); wrapper.unmount() }
const settle = async () => { await nextTick(); await flushPromises() }
const rows = (count: number = METRICS.count): TransferItem[] => Array.from({ length: count }, (_, index) => ({ key: index, label: `Row ${index}` }))
const treeRows = (count: number = METRICS.count): TreeNode[] => rows(count)
const viewport = (wrapper: VueWrapper) => wrapper.get<HTMLElement>('.scq-virtual-list').element
const bounded = (wrapper: Pick<VueWrapper, 'findAll'>) => {
  const count = wrapper.findAll('.scq-virtual-list__item').length
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThanOrEqual(METRICS.maximumRows)
}

class ResizeObserverMock {
  readonly observed = new Set<Element>()
  constructor(readonly callback: ResizeObserverCallback) { observers.push(this) }
  observe = (element: Element) => { this.observed.add(element) }
  unobserve = (element: Element) => { this.observed.delete(element) }
  disconnect = () => { this.observed.clear() }
  resize(element: Element, height: number) {
    if (!this.observed.has(element)) return
    measuredHeights.set(element, height)
    this.callback([{ target: element, borderBoxSize: [{ blockSize: height, inlineSize: METRICS.width }] } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}

// These geometry shims test the real TanStack range/anchor code, not browser layout.
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
    if (measuredHeights.has(this)) return measuredHeights.get(this)!
    if (this.classList.contains('scq-virtual-list')) return Number.parseFloat(this.style.height) || METRICS.height
    if (this.classList.contains('scq-virtual-list__item')) return Number.parseFloat(this.style.height) || METRICS.itemHeight
    return 0
  })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(METRICS.width)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () { return this.offsetHeight })
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
    return Number.parseFloat(this.querySelector<HTMLElement>('.scq-virtual-list__content')?.style.height ?? '') || 0
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
      const offset = Math.max(0, Math.min(options.top ?? this.scrollTop, Math.max(0, this.scrollHeight - this.clientHeight)))
      if (offset !== this.scrollTop) { this.scrollTop = offset; this.dispatchEvent(new Event('scroll')) }
    }),
  })
})

afterEach(() => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  measuredHeights.clear()
  observers.splice(0)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  document.body.replaceChildren()
})

describe('VirtualList shared contract', () => {
  it('keeps defaults, bounds 10k rows including an offscreen active row, and supports presentation semantics', async () => {
    const wrapper = track(mount(VirtualList, { props: { items: rows(), itemKey: 'key', ...virtualProps, activeIndex: METRICS.count - 1 } }))
    await settle()
    bounded(wrapper)
    expect(wrapper.findAll('.scq-virtual-list__item')).toHaveLength(METRICS.height / METRICS.itemHeight + METRICS.overscan + 1)
    expect(wrapper.attributes('role')).toBe('list')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.get(`[data-index="${METRICS.count - 1}"]`).attributes('aria-setsize')).toBe(String(METRICS.count))
    expect(wrapper.get('.scq-virtual-list__content').attributes('style')).toContain(`${METRICS.count * METRICS.itemHeight}px`)
    expect(viewport(wrapper).scrollTop).toBe(0)
    await wrapper.setProps({ role: 'presentation', itemRole: 'presentation', ariaLabel: 'Ignored presentation label' })
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('[role="listitem"]').exists()).toBe(false)
    expect(wrapper.get('.scq-virtual-list__item').attributes('aria-posinset')).toBeUndefined()
    ;(wrapper.vm as unknown as VirtualListExpose).scrollToOffset(METRICS.count / 2 * METRICS.itemHeight + METRICS.inset)
    await settle()
    bounded(wrapper)
    const partiallyVisibleRows = Math.ceil((METRICS.height + METRICS.inset) / METRICS.itemHeight)
    expect(wrapper.findAll('.scq-virtual-list__item')).toHaveLength(partiallyVisibleRows + METRICS.overscan * 2 + 1)
    await wrapper.setProps({ activeIndex: -1 })
    expect(wrapper.find(`[data-index="${METRICS.count - 1}"]`).exists()).toBe(false)

    const defaults = track(mount(VirtualList, { props: { items: ['one'] }, attrs: { tabindex: -1 } }))
    expect(defaults.attributes('style')).toContain(`${VIRTUAL_LIST_DEFAULTS.height}px`)
    expect(defaults.attributes('tabindex')).toBe('-1')
    expect(VIRTUAL_LIST_DEFAULTS).toEqual({ height: 320, itemHeight: 44, overscan: 5 })
  })

  it('keeps numeric and string keys distinct for DOM identity and keyed scrolling after reorder', async () => {
    const items = rows(200)
    items[1] = { key: 1, label: 'Number one' }
    items[80] = { key: '1', label: 'String one' }
    const wrapper = track(mount(VirtualList, {
      props: { items, itemKey: 'key', ...virtualProps },
      slots: { default: ({ item }) => h('span', item.label) },
    }))
    await settle()
    const api = wrapper.vm as unknown as VirtualListExpose
    api.scrollToKey(1, { align: 'start' })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(METRICS.itemHeight)
    expect(wrapper.get('[data-index="1"]').text()).toBe('Number one')
    api.scrollToKey('1', { align: 'start' })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(80 * METRICS.itemHeight)
    expect(wrapper.get('[data-index="80"]').text()).toBe('String one')
    bounded(wrapper)
    expect((wrapper.emitted('range-change')?.at(-1)?.[0] as { start: number }).start).toBe(80)
    const offset = viewport(wrapper).scrollTop
    api.scrollToKey('missing')
    api.scrollToIndex(Number.NaN)
    api.scrollToOffset(Infinity)
    expect(viewport(wrapper).scrollTop).toBe(offset)
    await wrapper.setProps({ items: [...items].reverse() })
    api.scrollToKey('1', { align: 'start' })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe((items.length - 1 - 80) * METRICS.itemHeight)
    api.scrollToIndex(-1)
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(0)
    api.scrollToOffset(-1)
    api.measure()
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(0)
  })

  it.each([
    { title: 'duplicate property keys', items: [{ key: 1 }, { key: 1 }], itemKey: 'key', message: 'Duplicate itemKey' },
    { title: 'duplicate function keys', items: [{ key: 1 }, { key: 2 }], itemKey: () => 'same', message: 'Duplicate itemKey' },
    { title: 'missing keys', items: [{}], itemKey: 'key', message: 'Invalid itemKey' },
    { title: 'object keys', items: [{ key: {} }], itemKey: 'key', message: 'Invalid itemKey' },
    { title: 'non-finite keys', items: [{ key: Infinity }], itemKey: 'key', message: 'Invalid itemKey' },
  ])('rejects $title rather than corrupting virtual identity', ({ items, itemKey, message }) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(VirtualList, { props: { items, itemKey: itemKey as never } })).toThrow(message)
  })

  it('retains a stable reading key and intra-row offset across prepend and internal reorder', async () => {
    let items = rows(200)
    const wrapper = track(mount(VirtualList, { props: { items, itemKey: 'key', preserveScrollPosition: true, ...virtualProps } }))
    await settle()
    const api = wrapper.vm as unknown as VirtualListExpose
    const anchorIndex = 50
    api.scrollToOffset(anchorIndex * METRICS.itemHeight + METRICS.inset)
    await settle()
    const prepended = Array.from({ length: 20 }, (_, index) => ({ key: `new-${index}`, label: 'New' }))
    items = [...prepended, ...items]
    await wrapper.setProps({ items })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe((anchorIndex + prepended.length) * METRICS.itemHeight + METRICS.inset)
    const anchor = items.find((item) => item.key === anchorIndex)!
    items = items.filter((item) => item !== anchor)
    items.splice(120, 0, anchor)
    await wrapper.setProps({ items })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(120 * METRICS.itemHeight + METRICS.inset)
    await wrapper.setProps({ items: [...items, { key: 'appended', label: 'Appended' }] })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(120 * METRICS.itemHeight + METRICS.inset)
    bounded(wrapper)
    await wrapper.setProps({ items: [] })
    await settle()
    expect(wrapper.findAll('.scq-virtual-list__item')).toHaveLength(0)
    expect(wrapper.get('.scq-virtual-list__empty').exists()).toBe(true)
  })

  it('does not silently enable anchoring by default or promise identity for index keys', async () => {
    const items = rows(200)
    const wrapper = track(mount(VirtualList, { props: { items, itemKey: 'key', ...virtualProps } }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const indexKeys = track(mount(VirtualList, { props: { items, preserveScrollPosition: true, ...virtualProps } }))
    await settle()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('index keys do not preserve item identity'))
    const offset = 50 * METRICS.itemHeight + METRICS.inset
    for (const current of [wrapper, indexKeys]) (current.vm as unknown as VirtualListExpose).scrollToOffset(offset)
    await settle()
    for (const current of [wrapper, indexKeys]) await current.setProps({ items: [{ key: 'new', label: 'New' }, ...items] })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(offset)
    expect(viewport(indexKeys).scrollTop).toBe(offset)
  })

  it('retains dynamic measurement behavior and disconnects observations/scroll handlers on unmount', async () => {
    const wrapper = track(mount(VirtualList, { attachTo: document.body, props: { items: rows(200), itemKey: 'key', dynamic: true, preserveScrollPosition: true, ...virtualProps } }))
    await settle()
    const api = wrapper.vm as unknown as VirtualListExpose
    const element = viewport(wrapper)
    api.scrollToOffset(50 * METRICS.itemHeight)
    await settle()
    const above = wrapper.get<HTMLElement>('[data-index="49"]').element
    const oldOffset = element.scrollTop
    for (const observer of observers) observer.resize(above, METRICS.itemHeight * 2)
    await settle()
    expect(element.scrollTop).toBe(oldOffset + METRICS.itemHeight)
    const remove = vi.spyOn(element, 'removeEventListener')
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    api.scrollToIndex(100, { behavior: 'smooth' })
    await settle()
    expect(vi.mocked(element.scrollTo).mock.calls.at(-1)?.[0]).toMatchObject({ behavior: 'auto' })
    api.scrollToIndex(150)
    dispose(wrapper)
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(observers.every((observer) => observer.observed.size === 0)).toBe(true)
    expect(cancel).toHaveBeenCalled()
  })

  it('recovers focus when a focused row is recycled or removed without stealing external focus', async () => {
    const items = rows(METRICS.runtimeCount)
    const wrapper = track(mount(VirtualList, {
      attachTo: document.body,
      props: { items, itemKey: 'key', ...virtualProps },
      slots: { default: ({ item }) => h('button', item.label) },
    }))
    await settle()
    wrapper.get<HTMLButtonElement>('[data-index="0"] button').element.focus()
    ;(wrapper.vm as unknown as VirtualListExpose).scrollToIndex(METRICS.runtimeCount - 1)
    await settle()
    expect(document.activeElement).toBe(viewport(wrapper))
    wrapper.get<HTMLButtonElement>('.scq-virtual-list__item button').element.focus()
    await wrapper.setProps({ items: [] })
    expect(document.activeElement).toBe(viewport(wrapper))
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    await wrapper.setProps({ items })
    expect(document.activeElement).toBe(outside)
  })

  it('keeps fixed geometry after disabling dynamic measurement, including late resize entries', async () => {
    const wrapper = track(mount(VirtualList, {
      attachTo: document.body,
      props: { items: rows(METRICS.runtimeCount), itemKey: 'key', dynamic: true, ...virtualProps },
    }))
    await settle()
    const row = wrapper.get<HTMLElement>('[data-index="0"]').element
    for (const observer of observers) observer.resize(row, METRICS.itemHeight * 2)
    await settle()
    await wrapper.setProps({ dynamic: false })
    for (const observer of observers) observer.resize(row, METRICS.itemHeight * 2)
    await settle()
    expect(row.style.height).toBe(`${METRICS.itemHeight}px`)
    expect(wrapper.get('.scq-virtual-list__content').attributes('style')).toContain(`${METRICS.runtimeCount * METRICS.itemHeight}px`)
  })

  it('normalizes negative viewport heights and rejects non-finite numeric heights', async () => {
    const wrapper = track(mount(VirtualList, { props: { items: rows(), height: -1 } }))
    expect(viewport(wrapper).style.height).toBe('0px')
    await wrapper.setProps({ height: '50vh' })
    expect(viewport(wrapper).style.height).toBe('50vh')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(VirtualList, { props: { height: Infinity } })).toThrow('finite')
  })
})

describe('Data widget virtualization', () => {
  it('is opt-in and preserves the nonvirtual DOM and typed slot values', async () => {
    const wrapper = track(mount(Tree, {
      props: { data: treeRows(80), ...virtualProps },
      slots: { default: ({ node, index, level, disabled }) => h('span', { class: 'custom-node' }, `${node.label}:${index}:${level}:${disabled}`) },
    }))
    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(80)
    expect(wrapper.find('.scq-virtual-list').exists()).toBe(false)
    expect(wrapper.findAll('.custom-node')[0].text()).toBe('Row 0:0:0:false')
    await wrapper.setProps({ virtual: true })
    await settle()
    expect(wrapper.element.tagName).toBe('DIV')
    bounded(wrapper)
    expect(wrapper.get('.scq-virtual-list').attributes('role')).toBe('presentation')
    expect(wrapper.find('[role="list"]').exists()).toBe(false)
    expect(wrapper.get('[role="treeitem"]').attributes('aria-setsize')).toBe('80')
  })

  describe('TreeSelect virtual forwarding', () => {
    it('opens at an offscreen selected key, forwards geometry/slots and preserves labels through filtering', async () => {
      const wrapper = track(mount(TreeSelect, {
        attachTo: document.body,
        props: { data: treeRows(), modelValue: METRICS.count - 1, virtual: true, filterable: true, teleport: false, ...virtualProps },
        slots: { default: ({ node, checked }) => h('span', { class: 'node-content' }, `${node.label}:${checked}`) },
      }))
      const trigger = wrapper.get<HTMLButtonElement>('.scq-field__trigger')
      expect(trigger.text()).toBe(`Row ${METRICS.count - 1}`)
      expect(wrapper.find('.scq-virtual-list').exists()).toBe(false)
      await trigger.trigger('keydown', { key: 'ArrowDown' })
      await settle()
      bounded(wrapper)
      expect(wrapper.getComponent(VirtualList).props()).toMatchObject(virtualProps)
      expect(document.activeElement?.textContent).toBe(`Row ${METRICS.count - 1}:false`)
      expect(wrapper.get('[role="tree"]').attributes('id')).toBe(trigger.attributes('aria-controls'))
      expect(wrapper.get('.scq-tree-select__options--virtual').exists()).toBe(true)
      const search = wrapper.get<HTMLInputElement>('input[type="search"]')
      search.element.focus()
      await search.setValue('Row 8')
      await settle()
      expect(trigger.text()).toBe(`Row ${METRICS.count - 1}`)
      expect(document.activeElement).toBe(search.element)
      bounded(wrapper)
      await search.setValue(`Row ${METRICS.count - 2}`)
      await search.trigger('keydown', { key: 'ArrowDown' })
      await settle()
      expect(document.activeElement?.textContent).toBe(`Row ${METRICS.count - 2}:false`)
      await wrapper.get('[role="treeitem"]').trigger('keydown', { key: 'Enter' })
      await settle()
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([METRICS.count - 2])
      expect(wrapper.find('.scq-virtual-list').exists()).toBe(false)
      expect(document.activeElement).toBe(trigger.element)
    })

    it('preserves controlled multiple checks and emits forwarded tree events', async () => {
      const wrapper = track(mount(TreeSelect, { props: { data: [{ key: 'root', label: 'Root', children: treeRows(100) }], multiple: true, checkStrictly: true, modelValue: [99], virtual: true, defaultExpandAll: true, filterable: true, teleport: false, ...virtualProps } }))
      await wrapper.get('.scq-field__trigger').trigger('click')
      await settle()
      await wrapper.get('input[type="search"]').setValue('Row 99')
      await settle()
      expect(wrapper.get('[data-tree-index="1"] input').element.checked).toBe(true)
      await wrapper.get('[data-tree-index="1"] input').setValue(false)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
      expect(wrapper.emitted('check')).toHaveLength(1)
      expect(wrapper.get('.scq-field__value').text()).toBe('Row 99')
      await wrapper.setProps({ modelValue: [] })
      await wrapper.get('input[type="search"]').setValue('')
      await wrapper.get('[data-tree-index="0"] button').trigger('click')
      expect(wrapper.emitted('update:expandedKeys')?.at(-1)).toEqual([[]])
      expect(wrapper.emitted('expand')?.at(-1)?.[1]).toBe(false)
    })

    it('retains selected lazy labels after closing/data replacement without selecting leaf-only parents', async () => {
      const wrapper = track(mount(TreeSelect, { props: { data: [{ key: 'parent', label: 'Parent' }], virtual: true, leafOnly: true, teleport: false, load: async () => [{ key: 'leaf', label: 'Loaded leaf', isLeaf: true }], ...virtualProps } }))
      await wrapper.get('.scq-field__trigger').trigger('click')
      await settle()
      await wrapper.get('.scq-tree__toggle').trigger('click')
      await settle()
      expect(wrapper.emitted('load')).toHaveLength(1)
      await wrapper.get('[data-tree-index="0"]').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      await wrapper.get('[data-tree-index="1"]').trigger('click')
      await settle()
      expect(wrapper.get('.scq-field__value').text()).toBe('Loaded leaf')
      await wrapper.setProps({ data: [] })
      await settle()
      expect(wrapper.get('.scq-field__value').text()).toBe('Loaded leaf')
      await wrapper.setProps({ data: [{ key: 'leaf', label: 'Updated leaf', isLeaf: true }] })
      expect(wrapper.get('.scq-field__value').text()).toBe('Updated leaf')
      await wrapper.setProps({ readonly: true })
      wrapper.vm.clear()
      expect(wrapper.emitted('clear')).toBeUndefined()
      expect(wrapper.get('.scq-field__trigger').element.disabled).toBe(true)
    })
  })

  describe('Transfer virtual panes', () => {
    it('keeps legacy rendering opt-in and types item/footer/empty slots', async () => {
      const wrapper = track(mount(Transfer, {
        props: { data: rows(80), ...virtualProps },
        slots: {
          default: ({ item, side, index, checked }) => h('span', `${side}:${item.label}:${index}:${checked}`),
          'left-footer': ({ items }) => h('span', { class: 'footer-count' }, items.length),
          empty: ({ side }) => h('span', `Empty ${side}`),
        },
      }))
      expect(wrapper.findAll('.scq-transfer__item')).toHaveLength(80)
      expect(wrapper.find('.scq-virtual-list').exists()).toBe(false)
      expect(wrapper.get('.scq-transfer__item').text()).toBe('left:Row 0:0:false')
      expect(wrapper.get('.footer-count').text()).toBe('80')
      expect(wrapper.get('.scq-transfer__empty').text()).toBe('Empty right')
      await wrapper.setProps({ virtual: true })
      await settle()
      expect(wrapper.findAll('.scq-virtual-list')).toHaveLength(2)
      bounded(wrapper)
      expect(wrapper.get('.scq-virtual-list__empty').text()).toBe('Empty right')
    })

    it('bounds both 10k-item panes, navigates disabled rows and retains independent active keys', async () => {
      const data = rows(METRICS.count * 2)
      data[METRICS.count - 1].disabled = true
      const wrapper = track(mount(Transfer, { attachTo: document.body, props: { data, modelValue: data.slice(METRICS.count).map((item) => item.key), virtual: true, ...virtualProps } }))
      await settle()
      const panes = wrapper.findAll('.scq-transfer__panel')
      panes.forEach(bounded)
      const first = panes[0].get<HTMLInputElement>('[data-transfer-index="0"] input')
      first.element.focus()
      await first.trigger('keydown', { key: 'End' })
      await settle()
      const last = panes[0].get<HTMLInputElement>(`[data-transfer-index="${METRICS.count - 2}"] input`)
      expect(document.activeElement).toBe(last.element)
      expect(panes[0].get(`[data-transfer-index="${METRICS.count - 2}"]`).attributes('aria-setsize')).toBe(String(METRICS.count))
      await last.setValue(true)
      const leftViewport = panes[0].get<HTMLElement>('.scq-virtual-list').element
      leftViewport.scrollTop = 0
      leftViewport.dispatchEvent(new Event('scroll'))
      await settle()
      expect(document.activeElement).toBe(last.element)
      expect(last.element.isConnected).toBe(true)
      panes.forEach(bounded)
      expect(await wrapper.vm.focusKey(METRICS.count * 2 - 1, 'right')).toBe(true)
      expect(document.activeElement?.closest('.scq-transfer__item')?.textContent).toBe(`Row ${METRICS.count * 2 - 1}`)
      expect(last.element.checked).toBe(true)
      panes.forEach(bounded)
    })

    it('keeps per-pane checks through filtering and moves only enabled selections including hidden checked rows', async () => {
      const data = rows(200)
      data[0].label = 'Alpha'
      data[1].label = 'Alpine'
      data[2].label = 'Hidden selection'
      data[3] = { key: 3, label: 'Albatross', disabled: true }
      data[100].label = 'Right Alpha'
      data[101].label = 'Right Beta'
      const wrapper = track(mount(Transfer, { props: { data, modelValue: [100, 101], virtual: true, filterable: true, ...virtualProps } }))
      await settle()
      const left = wrapper.get('[data-transfer-panel="left"]')
      const right = wrapper.get('[data-transfer-panel="right"]')
      await left.get('[data-transfer-index="2"] input').setValue(true)
      await right.get('[data-transfer-index="0"] input').setValue(true)
      await left.get('input[type="search"]').setValue('Al')
      await right.get('input[type="search"]').setValue('Alpha')
      await settle()
      expect(left.findAll('.scq-transfer__item')).toHaveLength(3)
      await left.get('header input').setValue(true)
      expect(left.get('[data-transfer-index="2"] input').element.checked).toBe(false)
      await wrapper.findAll('.scq-transfer__actions button')[0].trigger('click')
      const moved = [100, 101, 0, 1, 2]
      expect(wrapper.emitted('change')?.at(-1)).toEqual([moved, 'right', [0, 1, 2]])
      expect(wrapper.emitted('check-change')?.at(-1)).toEqual([[100]])
      await wrapper.setProps({ modelValue: moved })
      await settle()
      expect(right.get('[data-transfer-index="1"] input').element.checked).toBe(true)
      wrapper.vm.clearQuery('left')
      await settle()
      expect(left.get<HTMLInputElement>('input[type="search"]').element.value).toBe('')
      expect(right.get<HTMLInputElement>('input[type="search"]').element.value).toBe('Alpha')
      await wrapper.findAll('.scq-transfer__actions button')[1].trigger('click')
      expect(wrapper.emitted('change')?.at(-1)).toEqual([[101, 0, 1, 2], 'left', [100]])
    })

    it('recovers row focus by key, prunes disabled checks and preserves unprovided selected keys', async () => {
      const data = rows(100)
      const wrapper = track(mount(Transfer, { attachTo: document.body, props: { data, modelValue: ['unprovided'], virtual: true, ...virtualProps } }))
      await settle()
      expect(await wrapper.vm.focusKey(50, 'left')).toBe(true)
      await wrapper.get('[data-transfer-index="50"] input').setValue(true)
      await wrapper.setProps({ data: [...data].reverse() })
      await settle()
      expect(document.activeElement?.closest('.scq-transfer__item')?.textContent).toBe('Row 50')
      await wrapper.findAll('.scq-transfer__actions button')[0].trigger('click')
      expect(wrapper.emitted('change')?.at(-1)).toEqual([['unprovided', 50], 'right', [50]])
      await wrapper.get('[data-transfer-index="49"] input').setValue(true)
      const disabledData = [...data].reverse().map((item) => ({ ...item, disabled: item.key === 50 }))
      await wrapper.setProps({ data: disabledData })
      await settle()
      expect(document.activeElement?.closest('.scq-transfer__item')?.textContent).toBe('Row 49')
      expect(wrapper.findAll('.scq-transfer__actions button')[0].element.disabled).toBe(true)
      expect(await wrapper.vm.focusKey(50, 'left')).toBe(false)
    })
  })

  describe('Virtual data widgets inside Form', () => {
    const createForm = () => {
      const model = reactive({ tree: null as number | null, selection: null as number | null, transfer: [] as number[] })
      const blocked = ref(false)
      const showPicker = ref(true)
      const wrapper = track(mount(defineComponent({
        components: { Form, FormItem, Tree, TreeSelect, Transfer },
        setup: () => ({ model, blocked, showPicker, data: treeRows(100), virtualProps }),
        template: `<Form :model="model" :disabled="blocked">
          <FormItem prop="tree" label="Tree field" help="Tree help" required>
            <Tree id="tree-control" v-model="model.tree" :data="data" v-bind="virtualProps" virtual show-checkbox :disabled="false" aria-label="Explicit tree" aria-describedby="external-help" />
          </FormItem>
          <FormItem prop="selection" label="Picker field" help="Picker help" required>
            <TreeSelect v-if="showPicker" id="picker-control" name="selection" v-model="model.selection" :data="data" v-bind="virtualProps" virtual filterable :disabled="false" />
          </FormItem>
          <FormItem prop="transfer" label="Transfer field" help="Transfer help">
            <Transfer id="transfer-control" v-model="model.transfer" :data="data" v-bind="virtualProps" virtual filterable :disabled="false" />
          </FormItem>
        </Form>`,
      }), { attachTo: document.body }))
      return { wrapper, model, blocked, showPicker, form: wrapper.getComponent(Form) }
    }

    it('places field attributes on real groups/triggers, focuses errors, and shadows nested registrations', async () => {
      const { wrapper, model, form } = createForm()
      await settle()
      const tree = wrapper.get('#tree-control')
      const trigger = wrapper.get('#picker-control')
      const transfer = wrapper.get('#transfer-control')
      expect(tree.attributes('role')).toBe('tree')
      expect(tree.attributes('aria-label')).toBe('Explicit tree')
      expect(tree.attributes('aria-describedby')).toContain('external-help')
      expect(tree.attributes('aria-describedby')).toContain('-help')
      expect(trigger.element.tagName).toBe('BUTTON')
      expect(trigger.attributes('aria-labelledby')).toBe(wrapper.findAll('.scq-form-item__label')[1].attributes('id'))
      expect(transfer.attributes('role')).toBe('group')
      expect(transfer.attributes('aria-labelledby')).toBe(wrapper.findAll('.scq-form-item__label')[2].attributes('id'))
      expect(await form.vm.validate()).toBe(false)
      expect(tree.attributes('aria-invalid')).toBe('true')
      expect(trigger.attributes('aria-invalid')).toBe('true')
      expect(form.vm.focusField('tree')).toBe(true)
      await settle()
      expect(document.activeElement?.getAttribute('role')).toBe('treeitem')
      expect(form.vm.focusField('selection')).toBe(true)
      expect(document.activeElement).toBe(trigger.element)
      await trigger.trigger('keydown', { key: 'ArrowDown' })
      await settle()
      expect(form.vm.getFieldState('selection')?.touched).toBe(false)
      expect(wrapper.findAll('.scq-form-item__label')[1].attributes('for')).toBe('picker-control')
      const floatingRow = document.querySelector<HTMLElement>('.scq-floating-panel [role="treeitem"]')!
      floatingRow.click()
      await settle()
      expect(model.selection).toBe(0)
      const hidden = wrapper.get<HTMLInputElement>('input[name="selection"]')
      expect(hidden.element.type).toBe('hidden')
      expect(hidden.attributes('id')).toBeUndefined()
      expect(hidden.attributes('aria-describedby')).toBeUndefined()
      expect(form.vm.focusField('selection')).toBe(true)
      expect(document.activeElement).toBe(trigger.element)
      expect(form.vm.focusField('transfer')).toBe(true)
      expect(transfer.element.contains(document.activeElement)).toBe(true)
    })

    it('treats Form.disabled as a hard constraint and unregisters a teleported composite on removal', async () => {
      const { wrapper, blocked, showPicker, form } = createForm()
      await settle()
      const picker = wrapper.getComponent(TreeSelect)
      const tree = wrapper.getComponent(Tree)
      const transfer = wrapper.getComponent(Transfer)
      await wrapper.get('#picker-control').trigger('click')
      await settle()
      expect(document.querySelector('.scq-floating-panel')).not.toBeNull()
      blocked.value = true
      await settle()
      expect(document.querySelector('.scq-floating-panel')).toBeNull()
      expect(wrapper.get<HTMLButtonElement>('#picker-control').element.disabled).toBe(true)
      expect(tree.attributes('aria-disabled')).toBe('true')
      expect(transfer.attributes('aria-disabled')).toBe('true')
      expect(wrapper.findAll('input:not([type="hidden"]), button').every((input) => (input.element as HTMLInputElement).disabled)).toBe(true)
      expect(await tree.vm.focusKey(0)).toBe(false)
      expect(await transfer.vm.focusKey(0, 'left')).toBe(false)
      expect(picker.vm.focus()).toBe(false)
      picker.vm.clear()
      expect(picker.emitted('clear')).toBeUndefined()
      blocked.value = false
      await settle()
      await wrapper.get('#picker-control').trigger('keydown', { key: 'ArrowDown' })
      await settle()
      showPicker.value = false
      await settle()
      expect(document.querySelector('.scq-floating-panel')).toBeNull()
      expect(form.vm.focusField('selection')).toBe(false)
      dispose(wrapper)
      expect(observers.every((observer) => observer.observed.size === 0)).toBe(true)
    })
  })

  it('navigates 10k children, reports real sibling positions and pins the keyboard-focused node', async () => {
    const children = treeRows()
    children[METRICS.count - 1].disabled = true
    const wrapper = track(mount(Tree, { attachTo: document.body, props: { virtual: true, data: [{ key: 'root', label: 'Root', children }], defaultExpandAll: true, ...virtualProps } }))
    await settle()
    bounded(wrapper)
    const root = wrapper.get<HTMLElement>('[data-tree-index="0"]')
    root.element.focus()
    await root.trigger('keydown', { key: 'End' })
    await settle()
    const target = wrapper.get<HTMLElement>(`[data-tree-index="${METRICS.count - 1}"]`)
    expect(document.activeElement).toBe(target.element)
    expect(target.attributes('aria-level')).toBe('2')
    expect(target.attributes('aria-setsize')).toBe(String(METRICS.count))
    expect(target.attributes('aria-posinset')).toBe(String(METRICS.count - 1))
    expect(viewport(wrapper).scrollTop).toBeGreaterThan(0)
    bounded(wrapper)
    await target.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([METRICS.count - 2])
    viewport(wrapper).scrollTop = 0
    viewport(wrapper).dispatchEvent(new Event('scroll'))
    await settle()
    expect(document.activeElement).toBe(target.element)
    expect(target.element.isConnected).toBe(true)
    bounded(wrapper)
    await target.trigger('keydown', { key: 'ArrowLeft' })
    await settle()
    expect(document.activeElement?.textContent).toBe('Root')
    await wrapper.get('[data-tree-index="0"]').trigger('keydown', { key: 'ArrowRight' })
    await settle()
    expect(document.activeElement?.textContent).toBe('Row 0')
  })

  it('cascades over unmounted nodes while respecting disabled descendants, strict mode and filtering', async () => {
    const children = treeRows()
    children[1].disabled = true
    const wrapper = track(mount(Tree, { props: { data: [{ key: 'root', label: 'Root', children }], virtual: true, showCheckbox: true, defaultExpandAll: true, ...virtualProps } }))
    await settle()
    await wrapper.get('[data-tree-index="0"] input').setValue(true)
    expect(wrapper.vm.getChecked().checkedKeys).toContain(METRICS.count - 1)
    expect(wrapper.vm.getChecked().checkedKeys).not.toContain(1)
    expect(wrapper.vm.getChecked().checkedKeys).toHaveLength(METRICS.count)
    await wrapper.setProps({ filter: `Row ${METRICS.count - 1}` })
    await settle()
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
    const child = wrapper.get('[data-tree-index="1"]')
    expect(child.attributes('aria-setsize')).toBe('1')
    expect(child.attributes('aria-posinset')).toBe('1')
    await child.get('input').setValue(false)
    expect(wrapper.vm.getChecked().halfCheckedKeys).toEqual(['root'])
    await wrapper.setProps({ checkStrictly: true, checkedKeys: [] })
    await wrapper.get('[data-tree-index="0"] input').setValue(true)
    expect(wrapper.emitted('update:checkedKeys')?.at(-1)).toEqual([['root']])
    await wrapper.setProps({ disabled: true })
    expect(wrapper.findAll('input').every((input) => input.element.disabled)).toBe(true)
    expect(await wrapper.vm.focusKey(METRICS.count - 1)).toBe(false)
  })

  it('retains focus by key on reorder, recovers focus on filtering/collapse and does not steal external focus', async () => {
    const data = treeRows(100)
    const wrapper = track(mount(Tree, { attachTo: document.body, props: { data, virtual: true, ...virtualProps } }))
    await settle()
    expect(await wrapper.vm.focusKey(50)).toBe(true)
    await wrapper.setProps({ data: [...data].reverse() })
    await settle()
    expect(document.activeElement?.textContent).toBe('Row 50')
    await wrapper.setProps({ filter: 'Row 51' })
    await settle()
    expect(document.activeElement?.textContent).toBe('Row 51')
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    await wrapper.setProps({ filter: 'Row 52' })
    await settle()
    expect(document.activeElement).toBe(outside)
    await wrapper.setProps({ data: [{ key: 'root', label: 'Root', children: [{ key: 'leaf', label: 'Leaf' }] }], filter: '', expandedKeys: ['root'] })
    await settle()
    expect(await wrapper.vm.focusKey('leaf')).toBe(true)
    await wrapper.setProps({ expandedKeys: [] })
    await settle()
    expect(document.activeElement?.textContent).toBe('Root')
  })

  it('keeps lazy-load retry/cache semantics and aborts stale requests after replacement and unmount', async () => {
    let finish!: (nodes: TreeNode[]) => void
    const signals: AbortSignal[] = []
    const load = vi.fn((_node: TreeNode, signal: AbortSignal) => {
      signals.push(signal)
      return new Promise<TreeNode[]>((resolve) => { finish = resolve })
    })
    const wrapper = track(mount(Tree, { props: { virtual: true, data: [{ key: 'parent', label: 'Parent' }], load, ...virtualProps } }))
    await settle()
    await wrapper.get('button').trigger('click')
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.setProps({ data: [{ key: 'new', label: 'New' }] })
    expect(signals[0].aborted).toBe(true)
    finish([{ key: 'stale', label: 'Stale' }])
    await settle()
    expect(wrapper.text()).not.toContain('Stale')
    expect(wrapper.emitted('load')).toBeUndefined()
    await wrapper.get('button').trigger('click')
    dispose(wrapper)
    expect(signals[1].aborted).toBe(true)
    finish([{ key: 'late', label: 'Late' }])
    await settle()
    expect(wrapper.emitted('load')).toBeUndefined()

    const retry = vi.fn().mockRejectedValueOnce(new Error('retry')).mockResolvedValue([{ key: 'leaf', label: 'Leaf', isLeaf: true }])
    const cached = track(mount(Tree, { props: { virtual: true, data: [{ key: 'lazy', label: 'Lazy' }], load: retry, ...virtualProps } }))
    await settle()
    await cached.get('button').trigger('click')
    await settle()
    expect(cached.emitted('error')).toHaveLength(1)
    await cached.get('button').trigger('click')
    await settle()
    expect(cached.findAll('[role="treeitem"]')).toHaveLength(2)
    await cached.get('button').trigger('click')
    await cached.get('button').trigger('click')
    expect(retry).toHaveBeenCalledTimes(2)
  })
})

describe('AutoComplete virtual suggestions', () => {
  const options = (count: number = METRICS.count) => Array.from({ length: count }, (_, index) => ({ value: String(index), label: `Suggestion ${index}` }))

  it('bounds 10k options and scrolls the last keyboard target into view before committing its value', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: options(), virtual: true, teleport: false, ...virtualProps } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await settle()
    bounded(wrapper)
    expect(wrapper.findAll('[role="option"]').length).toBeLessThanOrEqual(METRICS.maximumRows)
    expect(wrapper.get('.scq-virtual-list').attributes('role')).toBe('presentation')
    expect(wrapper.get('.scq-virtual-list').attributes('tabindex')).toBe('-1')
    await input.trigger('keydown', { key: 'End' })
    await settle()
    const active = wrapper.get('[aria-selected="true"]')
    expect(active.text()).toBe(`Suggestion ${METRICS.count - 1}`)
    expect(active.attributes('aria-posinset')).toBe(String(METRICS.count))
    expect(active.attributes('aria-setsize')).toBe(String(METRICS.count))
    expect(input.attributes('aria-activedescendant')).toBe(active.attributes('id'))
    expect(viewport(wrapper).scrollTop).toBeGreaterThan(0)
    bounded(wrapper)
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('change')).toEqual([[String(METRICS.count - 1)]])
  })

  it('virtualizes group headings with options and preserves slot and keyboard semantics', async () => {
    const groupSize = METRICS.height / METRICS.itemHeight
    const wrapper = track(mount(AutoComplete, {
      props: {
        options: options(), virtual: true, teleport: false, ...virtualProps,
        groupBy: (option) => `Group ${Math.floor(Number(option.value) / groupSize)}`,
      },
      slots: { default: ({ option }) => h('strong', option.label), group: ({ group }) => h('em', group) },
    }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await settle()
    expect(wrapper.find('.scq-auto-complete__group em').exists()).toBe(true)
    await input.trigger('keydown', { key: 'End' })
    await settle()
    bounded(wrapper)
    expect(wrapper.get('[aria-selected="true"] strong').text()).toBe(`Suggestion ${METRICS.count - 1}`)
    expect(wrapper.get('[aria-selected="true"]').attributes('aria-label')).toContain('Group ')
    expect(wrapper.get('[aria-selected="true"]').attributes('aria-posinset')).toBe(String(METRICS.count))
    expect(viewport(wrapper).scrollTop).toBeGreaterThan(0)
  })

  it('reveals an existing active option after virtualization is enabled at runtime', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: options(METRICS.runtimeCount), teleport: false, ...virtualProps } }))
    await wrapper.get('input').trigger('focus')
    await wrapper.get('input').trigger('keydown', { key: 'End' })
    await wrapper.setProps({ virtual: true })
    await settle()
    bounded(wrapper)
    expect(wrapper.get('[aria-selected="true"]').text()).toBe(`Suggestion ${METRICS.runtimeCount - 1}`)
    expect(viewport(wrapper).scrollTop).toBeGreaterThan(0)
  })
})

describe('Virtual key and lifecycle regressions', () => {
  it('keeps anchors when an inline key getter is recreated and when data mutates in place', async () => {
    const items = ref(rows(200))
    const wrapper = track(mount(defineComponent({
      components: { VirtualList },
      setup: () => ({ items, virtualProps }),
      template: '<VirtualList :items="items" :item-key="(item) => item.key" v-bind="virtualProps" preserve-scroll-position />',
    })))
    await settle()
    const list = wrapper.getComponent(VirtualList)
    const api = list.vm as unknown as VirtualListExpose
    const offset = 50 * METRICS.itemHeight + METRICS.inset
    api.scrollToOffset(offset)
    await settle()
    items.value = [{ key: 'replaced', label: 'Replaced' }, ...items.value]
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(offset + METRICS.itemHeight)
    items.value.unshift({ key: 'in-place', label: 'In place' })
    await settle()
    expect(viewport(wrapper).scrollTop).toBe(offset + METRICS.itemHeight * 2)
  })

  it('rejects bigint keys and duplicate widget keys, including collapsed descendants', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(VirtualList, { props: { items: [{ key: BigInt(1) }], itemKey: 'key' } })).toThrow('Invalid itemKey')
    const data: TreeNode[] = [{ key: 'same', label: 'Root', children: [{ key: 'same', label: 'Hidden duplicate' }] }]
    expect(() => mount(Tree, { props: { data } })).toThrow('Duplicate itemKey')
    expect(() => mount(TreeSelect, { props: { data } })).toThrow('Duplicate itemKey')
    expect(() => mount(Transfer, { props: { data: [{ key: 1, label: 'One' }, { key: 1, label: 'Duplicate' }], filterable: true } })).toThrow('Duplicate itemKey')
  })

  it('cancels pending anchor work when removed without leaving observers or scroll callbacks', async () => {
    const wrapper = track(mount(VirtualList, { props: { items: rows(100), itemKey: 'key', preserveScrollPosition: true, ...virtualProps } }))
    await settle()
    const element = viewport(wrapper)
    ;(wrapper.vm as unknown as VirtualListExpose).scrollToOffset(30 * METRICS.itemHeight)
    await settle()
    const update = wrapper.setProps({ items: [{ key: 'prepend', label: 'Prepend' }, ...rows(100)] })
    dispose(wrapper)
    const calls = vi.mocked(element.scrollTo).mock.calls.length
    await update
    await settle()
    expect(vi.mocked(element.scrollTo)).toHaveBeenCalledTimes(calls)
    expect(observers.every((observer) => observer.observed.size === 0)).toBe(true)
  })

  it('recovers Transfer focus when a selected item becomes disabled in place', async () => {
    const data = reactive(rows(100))
    const wrapper = track(mount(Transfer, { attachTo: document.body, props: { data, virtual: true, ...virtualProps } }))
    await settle()
    expect(await wrapper.vm.focusKey(50, 'left')).toBe(true)
    await wrapper.get('[data-transfer-index="50"] input').setValue(true)
    data[50].disabled = true
    await settle()
    expect(document.activeElement?.closest('.scq-transfer__item')?.textContent).toBe('Row 51')
    expect(wrapper.findAll('.scq-transfer__actions button')[0].element.disabled).toBe(true)
  })
})
