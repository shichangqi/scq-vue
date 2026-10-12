// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Tabs from '../src/components/Tabs/Tabs.vue'
import Pagination from '../src/components/Pagination/Pagination.vue'
import Cell from '../src/components/Cell/Cell.vue'
import NavBar from '../src/components/NavBar/NavBar.vue'
import Tabbar from '../src/components/Tabbar/Tabbar.vue'
import Collapse from '../src/components/Collapse/Collapse.vue'
import CollapseItem from '../src/components/Collapse/CollapseItem.vue'
import Menu from '../src/components/Menu/Menu.vue'
import Dropdown from '../src/components/Dropdown/Dropdown.vue'
import Breadcrumb from '../src/components/Breadcrumb/Breadcrumb.vue'
import Steps from '../src/components/Steps/Steps.vue'
import { defineComponent, h, nextTick, ref } from 'vue'

vi.mock('@floating-ui/dom', () => ({ autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} }, computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }), offset: vi.fn(), flip: vi.fn(), shift: vi.fn() }))

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('Extended navigation', () => {
  it('expands menus and navigates around disabled sibling entries', async () => {
    const wrapper = mount(Menu, { attachTo: document.body, props: { items: [{ key: 'first', label: 'First' }, { key: 'blocked', label: 'Blocked', disabled: true }, { key: 'group', label: 'Group', children: [{ key: 'child', label: 'Child' }] }] } })
    wrappers.push(wrapper)
    await wrapper.findAll('[role="menuitem"]')[0].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toContain('Group')
    await wrapper.findAll('[role="menuitem"]')[2].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement?.textContent).toBe('Child')
    await wrapper.findAll('[role="menuitem"]')[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['child']])
    expect(wrapper.emitted('select')?.[0][1]).toEqual(['group', 'child'])
  })

  it('opens dropdown by keyboard and closes after a valid command', async () => {
    const wrapper = mount(Dropdown, { attachTo: document.body, props: { teleport: false, items: [{ key: 'save', label: 'Save' }, { key: 'blocked', label: 'Blocked', disabled: true }] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-dropdown__trigger button').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement?.textContent).toBe('Save')
    await wrapper.get('[role="menuitem"]').trigger('click')
    expect(wrapper.emitted('command')?.[0][0]).toBe('save')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('expands compressed breadcrumbs and identifies the current page', async () => {
    const wrapper = mount(Breadcrumb, { props: { maxItems: 3, items: ['Home', 'Team', 'Projects', 'Files', 'Report'].map((label) => ({ label })) } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('li')).toHaveLength(3)
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Report')
    await wrapper.get('.scq-breadcrumb__expand').trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(5)
  })

  it('keeps controlled steps fixed until the owner updates active', async () => {
    const wrapper = mount(Steps, { props: { active: 0, clickable: true, items: [{ title: 'One' }, { title: 'Two' }, { title: 'Locked', disabled: true }] } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:active')).toEqual([[1]])
    expect(wrapper.get('[aria-current="step"]').text()).toContain('One')
    await wrapper.setProps({ active: 1 })
    expect(wrapper.findAll('li')[0].classes()).toContain('is-finish')
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.emitted('change')).toHaveLength(1)
  })
})

describe('Menu', () => {
  const items = [
    { key: 'first', label: 'First', children: [{ key: 'child', label: 'Child' }] },
    { key: 'last', label: 'Last', children: [{ key: 'other', label: 'Other' }] },
  ]

  it('animates submenus on entry and keeps them mounted until exit finishes', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(Menu, { props: { items }, global: { stubs: { transition: false } }, attachTo: document.body })
      wrappers.push(wrapper)
      const button = wrapper.get('[data-menu-key="string:first"]')
      expect(wrapper.find('.scq-menu__submenu').exists()).toBe(false)

      await button.trigger('click')
      const submenu = wrapper.get<HTMLElement>('.scq-menu__submenu')
      submenu.element.style.transitionDuration = '0.25s'
      expect(button.attributes('aria-expanded')).toBe('true')
      expect(submenu.classes()).toContain('scq-menu-submenu-enter-active')
      await vi.runAllTimersAsync()
      expect(submenu.classes()).not.toContain('scq-menu-submenu-enter-active')

      await button.trigger('click')
      expect(button.attributes('aria-expanded')).toBe('false')
      expect(submenu.classes()).toContain('scq-menu-submenu-leave-active')
      await vi.advanceTimersByTimeAsync(100)
      expect(submenu.element.isConnected).toBe(true)
      expect(submenu.isVisible()).toBe(true)
      await vi.runAllTimersAsync()
      expect(wrapper.find('.scq-menu__submenu').exists()).toBe(false)

      await button.trigger('click')
      await vi.runAllTimersAsync()
      expect(wrapper.get('.scq-menu__submenu').isVisible()).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('settles interrupted submenu transitions without leaving duplicate content', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(Menu, { props: { items, defaultOpenKeys: ['first'] }, global: { stubs: { transition: false } }, attachTo: document.body })
      wrappers.push(wrapper)
      const button = wrapper.get('[data-menu-key="string:first"]')
      const submenu = wrapper.get<HTMLElement>('.scq-menu__submenu')
      submenu.element.style.transitionDuration = '0.25s'
      expect(submenu.classes()).not.toContain('scq-menu-submenu-enter-active')

      for (const expectedOpen of [false, true, false, true]) {
        await button.trigger('click')
        await vi.advanceTimersByTimeAsync(50)
        await button.trigger('click')
        await vi.advanceTimersByTimeAsync(50)
        await button.trigger('click')
        await vi.runAllTimersAsync()
        expect(button.attributes('aria-expanded')).toBe(String(expectedOpen))
        expect(wrapper.findAll('.scq-menu__submenu')).toHaveLength(expectedOpen ? 1 : 0)
        expect(wrapper.find('[class*="scq-menu-submenu-"]').exists()).toBe(false)
        if (expectedOpen) wrapper.get<HTMLElement>('.scq-menu__submenu').element.style.transitionDuration = '0.25s'
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('animates accordion submenus only when controlled open keys change', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(Menu, { props: { items, openKeys: ['first'], uniqueOpened: true }, global: { stubs: { transition: false } }, attachTo: document.body })
      wrappers.push(wrapper)
      const previous = wrapper.get<HTMLElement>('.scq-menu__submenu')
      previous.element.style.transitionDuration = '0.25s'
      await wrapper.get('[data-menu-key="string:last"]').trigger('click')
      expect(wrapper.emitted('update:openKeys')).toEqual([[['last']]])
      expect(wrapper.findAll('.scq-menu__submenu')).toHaveLength(1)
      expect(previous.classes()).not.toContain('scq-menu-submenu-leave-active')

      await wrapper.setProps({ openKeys: ['last'] })
      expect(previous.classes()).toContain('scq-menu-submenu-leave-active')
      expect(wrapper.findAll('.scq-menu__submenu')).toHaveLength(2)
      expect(wrapper.get('.scq-menu-submenu-enter-active').text()).toBe('Other')
      await vi.runAllTimersAsync()
      expect(wrapper.findAll('.scq-menu__submenu')).toHaveLength(1)
      expect(wrapper.get('.scq-menu__submenu').text()).toBe('Other')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('Collapse', () => {
  const DraftInput = defineComponent({
    setup() {
      const value = ref('draft')
      return () => h('input', { value: value.value, onInput: (event: Event) => { value.value = (event.target as HTMLInputElement).value } })
    },
  })
  const items = () => [
    h(CollapseItem, { name: 'first', title: 'First', lazy: true }, () => h(DraftInput)),
    h(CollapseItem, { name: 'disabled', title: 'Disabled', disabled: true }, () => 'Locked'),
    h(CollapseItem, { name: 'last', title: 'Last' }, () => 'Details'),
  ]

  it('toggles multiple panels and preserves lazy content', async () => {
    const wrapper = mount(Collapse, { slots: { default: items } })
    wrappers.push(wrapper)
    expect(wrapper.find('input').exists()).toBe(false)
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await wrapper.get('input').setValue('edited')
    await buttons[2].trigger('click')
    expect(wrapper.emitted('change')?.[1]).toEqual([['first', 'last']])
    await buttons[0].trigger('click')
    expect(wrapper.get('input').element.value).toBe('edited')
    expect(buttons[0].attributes('aria-expanded')).toBe('false')
  })

  it('keeps panels visible until the leave transition finishes', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(CollapseItem, { props: { title: 'Animated', lazy: true }, slots: { default: () => h(DraftInput) }, global: { stubs: { transition: false } }, attachTo: document.body })
      wrappers.push(wrapper)
      const panel = wrapper.get<HTMLElement>('.scq-collapse-item__panel')
      panel.element.style.transitionDuration = '0.25s'
      expect(panel.isVisible()).toBe(false)
      expect(wrapper.find('input').exists()).toBe(false)

      await wrapper.get('button').trigger('click')
      expect(panel.classes()).toContain('scq-collapse-item-enter-active')
      expect(panel.isVisible()).toBe(true)
      await vi.runAllTimersAsync()
      expect(panel.classes()).not.toContain('scq-collapse-item-enter-active')
      await wrapper.get('input').setValue('edited')

      await wrapper.get('button').trigger('click')
      expect(panel.classes()).toContain('scq-collapse-item-leave-active')
      expect(panel.isVisible()).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      expect(panel.isVisible()).toBe(true)
      await vi.runAllTimersAsync()
      expect(panel.isVisible()).toBe(false)
      expect(panel.classes()).not.toContain('scq-collapse-item-leave-active')

      await wrapper.get('button').trigger('click')
      await vi.runAllTimersAsync()
      expect(panel.isVisible()).toBe(true)
      expect(wrapper.get('input').element.value).toBe('edited')
    } finally {
      vi.useRealTimers()
    }
  })

  it('settles correctly when the transition is interrupted by rapid toggles', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(CollapseItem, { props: { title: 'Animated' }, slots: { default: 'Details' }, global: { stubs: { transition: false } }, attachTo: document.body })
      wrappers.push(wrapper)
      const button = wrapper.get('button')
      const panel = wrapper.get<HTMLElement>('.scq-collapse-item__panel')
      panel.element.style.transitionDuration = '0.25s'
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')
      await vi.runAllTimersAsync()
      expect(button.attributes('aria-expanded')).toBe('true')
      expect(panel.isVisible()).toBe(true)
      expect(panel.classes()).not.toContain('scq-collapse-item-enter-active')
      expect(panel.classes()).not.toContain('scq-collapse-item-leave-active')

      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')
      await vi.runAllTimersAsync()
      expect(button.attributes('aria-expanded')).toBe('false')
      expect(panel.isVisible()).toBe(false)
      expect(panel.classes()).not.toContain('scq-collapse-item-enter-active')
      expect(panel.classes()).not.toContain('scq-collapse-item-leave-active')
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses scalar values in accordion mode and respects controlled state', async () => {
    const wrapper = mount(Collapse, { props: { modelValue: 'first', accordion: true }, slots: { default: items } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['last']])
    expect(wrapper.findAll('button')[0].attributes('aria-expanded')).toBe('true')
    await wrapper.setProps({ modelValue: 'last' })
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([''])
  })

  it('skips disabled headers in keyboard navigation and does not toggle them', async () => {
    const wrapper = mount(Collapse, { slots: { default: items }, attachTo: document.body })
    wrappers.push(wrapper)
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[2].element)
    await buttons[1].trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ disabled: true })
    await buttons[0].trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})

describe('Tabs', () => {
  const items = [{ name: 'first', label: 'First' }, { name: 'locked', label: 'Locked', disabled: true }, { name: 'last', label: 'Last' }]
  it('supports keyboard navigation and skips disabled tabs', async () => {
    const wrapper = mount(Tabs, { props: { items }, attachTo: document.body })
    wrappers.push(wrapper)
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['last']])
    expect(tabs[2].attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs[2].element)
    await tabs[2].trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('change')?.[1]).toEqual(['first'])
  })

  it('lazily mounts panels and preserves previously visited content', async () => {
    const wrapper = mount(Tabs, { props: { items, lazy: true }, slots: { first: '<input />', last: 'Last panel' } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(1)
    const input = wrapper.get('input').element
    await wrapper.get('input').setValue('edited')
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(2)
    expect(wrapper.get('input').element.value).toBe('edited')
    const active = wrapper.findAll('[role="tab"]')[2]
    expect(wrapper.get(`#${active.attributes('aria-controls')}`).attributes('aria-labelledby')).toBe(active.attributes('id'))
    await wrapper.findAll('[role="tab"]')[0].trigger('click')
    expect(wrapper.get('input').element).toBe(input)
    expect(wrapper.get('input').element.value).toBe('edited')
    expect(wrapper.get('.scq-tabs__panel.is-active').find('input').exists()).toBe(true)
  })

  it('only animates the current panel during repeated switches', async () => {
    const wrapper = mount(Tabs, { props: { items }, attachTo: document.body })
    wrappers.push(wrapper)
    const panels = wrapper.findAll('[role="tabpanel"]')
    const tabs = wrapper.findAll('[role="tab"]')
    for (const index of [2, 0, 2, 0]) {
      await tabs[index].trigger('click')
      expect(wrapper.findAll('.scq-tabs__panel.is-active')).toHaveLength(1)
      expect(panels[index].classes()).toContain('is-active')
      expect(panels.filter((panel) => panel.isVisible()).map((panel) => panel.element)).toEqual([panels[index].element])
    }
    await tabs[1].trigger('click')
    expect(panels[0].classes()).toContain('is-active')
    expect(wrapper.emitted('change')).toHaveLength(4)
  })

  it('updates the animated panel only when the controlled value changes', async () => {
    const wrapper = mount(Tabs, { props: { items, modelValue: 'first' } })
    wrappers.push(wrapper)
    const panels = wrapper.findAll('[role="tabpanel"]')
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    expect(panels[0].classes()).toContain('is-active')
    expect(panels[2].classes()).not.toContain('is-active')
    await wrapper.setProps({ modelValue: 'last' })
    expect(panels[0].classes()).not.toContain('is-active')
    expect(panels[2].classes()).toContain('is-active')
  })

  it.each(['horizontal', 'vertical'] as const)('keeps the %s indicator aligned through selection, resizing and item changes', async (direction) => {
    let notifyResize = () => {}
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { notifyResize = callback }
      observe = observe
      disconnect = disconnect
    })
    try {
      const wrapper = mount(Tabs, { props: { items, direction } })
      wrappers.push(wrapper)
      const tabs = wrapper.findAll<HTMLElement>('[role="tab"]')
      const widths = [72, 80, 96]
      const positions = [0, 100, 200]
      tabs.forEach((tab, index) => {
        Object.defineProperties(tab.element, {
          offsetWidth: { configurable: true, get: () => widths[index] },
          offsetHeight: { configurable: true, get: () => 44 },
          offsetLeft: { configurable: true, get: () => direction === 'horizontal' ? positions[index] : 0 },
          offsetTop: { configurable: true, get: () => direction === 'vertical' ? positions[index] : 0 },
        })
      })
      notifyResize()
      await nextTick()
      const indicator = wrapper.get<HTMLElement>('.scq-tabs__indicator')
      expect(indicator.attributes('aria-hidden')).toBe('true')
      expect(indicator.element.style.width).toBe('72px')
      expect(indicator.element.style.height).toBe(direction === 'vertical' ? '44px' : '2px')
      expect(indicator.element.style.transform).toBe('translate3d(0px, 0px, 0)')

      await tabs[2].trigger('click')
      expect(indicator.element.style.width).toBe('96px')
      expect(indicator.element.style.transform).toBe(direction === 'vertical' ? 'translate3d(0px, 200px, 0)' : 'translate3d(200px, 0px, 0)')

      widths[2] = 128
      positions[2] = 240
      notifyResize()
      await nextTick()
      expect(indicator.element.style.width).toBe('128px')
      expect(indicator.element.style.transform).toBe(direction === 'vertical' ? 'translate3d(0px, 240px, 0)' : 'translate3d(240px, 0px, 0)')

      await wrapper.setProps({ items: [...items, { name: 'added', label: 'Added' }] })
      expect(observe).toHaveBeenCalledWith(wrapper.findAll('[role="tab"]')[3].element)
      await wrapper.setProps({ items: items.slice(0, 1) })
      expect(indicator.element.style.transform).toBe('translate3d(0px, 0px, 0)')
      await wrapper.setProps({ items: [] })
      expect(wrapper.find('.scq-tabs__indicator').exists()).toBe(false)
      expect(wrapper.get('.scq-tabs__nav').classes()).not.toContain('has-indicator')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('Pagination', () => {
  it('bounds page navigation and compresses large page ranges', async () => {
    const wrapper = mount(Pagination, { props: { modelValue: 50, total: 1000, pagerCount: 7 } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('.scq-pagination__pages > *')).toHaveLength(7)
    expect(wrapper.get('[aria-current="page"]').text()).toBe('50')
    await wrapper.findAll('button').at(-1)!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[51]])
    await wrapper.setProps({ total: 20 })
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([2])
  })

  it('resets page on size changes and disables controls', async () => {
    const wrapper = mount(Pagination, { props: { modelValue: 3, total: 100, pageSizes: [10, 20] } })
    wrappers.push(wrapper)
    await wrapper.get('select').setValue('20')
    expect(wrapper.emitted('update:pageSize')).toEqual([[20]])
    expect(wrapper.emitted('update:modelValue')).toEqual([[1]])
    await wrapper.setProps({ disabled: true })
    expect(wrapper.findAll('button').every((button) => button.element.disabled)).toBe(true)
  })

  it('handles empty totals and optional single-page hiding', async () => {
    const wrapper = mount(Pagination, { props: { total: 0 } })
    wrappers.push(wrapper)
    expect(wrapper.get('[aria-current="page"]').text()).toBe('1')
    await wrapper.setProps({ hideOnSinglePage: true })
    expect(wrapper.find('nav').exists()).toBe(false)
  })
})

describe('Mobile navigation', () => {
  it('gives clickable cells native button behavior and respects disabled', async () => {
    const wrapper = mount(Cell, { props: { title: 'Settings', isLink: true } })
    wrappers.push(wrapper)
    expect(wrapper.element.tagName).toBe('BUTTON')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ disabled: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('exposes separate navbar actions with accessible labels', async () => {
    const wrapper = mount(NavBar, { props: { title: 'Account', leftArrow: true, rightIcon: 'settings', rightLabel: 'Settings' } })
    wrappers.push(wrapper)
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('click-left')).toHaveLength(1)
    expect(wrapper.emitted('click-right')).toHaveLength(1)
    expect(buttons[1].attributes('aria-label')).toBe('Settings')
  })

  it('switches tabbar items while preserving controlled state and disabled items', async () => {
    const wrapper = mount(Tabbar, { props: { modelValue: 'home', items: [{ name: 'home', label: 'Home', icon: 'home' }, { name: 'profile', label: 'Profile', icon: 'user' }, { name: 'locked', label: 'Locked', disabled: true }] } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['profile']])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Home')
    await wrapper.setProps({ modelValue: 'profile' })
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Profile')
  })
})