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
import Form from '../src/components/Form/Form.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import { defineComponent, h, nextTick, ref, Teleport, toRaw } from 'vue'
import { COMPOSITION_KEY_CODE } from '../src/utils/composition'
import * as floating from '@floating-ui/dom'

vi.mock('@floating-ui/dom', () => ({ autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} }, computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }), offset: vi.fn(), flip: vi.fn(), shift: vi.fn() }))

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('Extended navigation', () => {
  it('keeps tabbar action items separate from guarded navigation', async () => {
    let done!: (value: boolean) => void
    const items = [{ name: 'create', label: 'Create', action: true }, { name: 'home', label: 'Home' }, { name: 'profile', label: 'Profile' }]
    const beforeChange = vi.fn(() => new Promise<boolean>(resolve => { done = resolve }))
    const wrapper = mount(Tabbar, { props: { items, beforeChange, showLabels: false } })
    wrappers.push(wrapper)
    expect(wrapper.get('[aria-current="page"]').attributes('aria-label')).toBe('Home')
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('action')).toEqual([[items[0]]])
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.findAll('button')[2].trigger('click')
    await wrapper.findAll('button')[2].trigger('click')
    expect(beforeChange).toHaveBeenCalledTimes(1)
    done(false)
    await flushPromises()
    expect(wrapper.get('[aria-current="page"]').attributes('aria-label')).toBe('Home')
    await wrapper.findAll('button')[2].trigger('click')
    done(true)
    await flushPromises()
    expect(wrapper.emitted('change')).toEqual([['profile']])
    expect(wrapper.get('[aria-current="page"]').attributes('aria-label')).toBe('Profile')
  })
  it('guards navbar return requests and cancels pending work when disabled', async () => {
    let done!: (value: boolean) => void
    let signal!: AbortSignal
    const beforeBack = vi.fn((_event: MouseEvent, current: AbortSignal) => { signal = current; return new Promise<boolean>(resolve => { done = resolve }) })
    const wrapper = mount(NavBar, { props: { leftArrow: true, beforeBack } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    expect(beforeBack).toHaveBeenCalledTimes(1)
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
    done(false)
    await flushPromises()
    expect(wrapper.emitted('click-left')).toBeUndefined()
    await wrapper.get('button').trigger('click')
    await wrapper.setProps({ leftDisabled: true })
    expect(signal.aborted).toBe(true)
    done(true)
    await flushPromises()
    expect(wrapper.emitted('click-left')).toBeUndefined()
  })

  it('measures fixed navbar height and disconnects measurement on unmount', async () => {
    let resize!: () => void
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback }; observe() {}; disconnect = disconnect })
    const bounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 88 } as DOMRect)
    try {
      const wrapper = mount(NavBar, { props: { fixed: true } })
      wrappers.push(wrapper)
      await nextTick()
      expect(wrapper.attributes('style')).toContain('height: 88px')
      bounds.mockReturnValue({ height: 104 } as DOMRect)
      resize()
      await nextTick()
      expect(wrapper.attributes('style')).toContain('height: 104px')
      wrapper.unmount()
      wrappers.pop()
      expect(disconnect).toHaveBeenCalled()
    } finally { bounds.mockRestore(); vi.unstubAllGlobals() }
  })
  it('keeps compressed breadcrumbs compact while exposing every hidden path in a menu', async () => {
    const items = ['Home', 'Team', 'Projects', 'Files', 'Report'].map(label => ({ label }))
    const wrapper = mount(Breadcrumb, { props: { items, maxItems: 3, collapseMode: 'menu' }, attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('.scq-breadcrumb__expand').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="menuitem"]').map(item => item.text())).toEqual(['Team', 'Projects', 'Files'])
    await wrapper.findAll('[role="menuitem"]')[1].trigger('click')
    expect(wrapper.emitted('select')).toEqual([[items[2], 2]])
    expect(wrapper.get('ol').element.children).toHaveLength(3)
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Report')
  })
  it('separates dropdown primary actions from commands and forwards menu item slots', async () => {
    const wrapper = mount(Dropdown, { props: { split: true, label: 'Save', teleport: false, items: [{ key: 'copy', label: 'Copy' }] }, slots: { item: ({ item }) => h('strong', item.label) } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-dropdown__primary').trigger('click')
    expect(wrapper.emitted('primary-click')).toHaveLength(1)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    await wrapper.get('.scq-dropdown__trigger button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="menuitem"] strong').text()).toBe('Copy')
    await wrapper.get('[role="menuitem"]').trigger('click')
    expect(wrapper.emitted('command')?.[0][0]).toBe('copy')
    expect(wrapper.emitted('primary-click')).toHaveLength(1)
    await wrapper.setProps({ disabled: true })
    await wrapper.get('.scq-dropdown__primary').trigger('click')
    expect(wrapper.emitted('primary-click')).toHaveLength(1)
  })
  it('clamps quick jumps without duplicate commits and supports interactive ellipses', async () => {
    const wrapper = mount(Pagination, { props: { total: 1000, showJumper: true } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-pagination__ellipsis').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[6]])
    await wrapper.get('input').setValue('999')
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    await wrapper.get('input').trigger('blur')
    expect(wrapper.emitted('change')).toEqual([[6], [100]])
  })

  it('does not invent last pages in unknown-total pagination and blocks loading actions', async () => {
    const wrapper = mount(Pagination, { props: { modelValue: 4, unknownTotal: true, hasNext: false, showTotal: true, showJumper: true } })
    wrappers.push(wrapper)
    expect(wrapper.find('.scq-pagination__pages').exists()).toBe(false)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.get('.scq-pagination__counter').text()).toBe('4')
    expect(wrapper.findAll('button')[1].element.disabled).toBe(true)
    await wrapper.setProps({ hasNext: true, loading: true })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ loading: false })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('change')).toEqual([[5]])
  })
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

  it('preserves custom breadcrumb content and original identities inside the collapsed menu', async () => {
    const items = [{ label: 'Home' }, { label: 'Blocked', disabled: true }, { label: 'Files' }, { label: 'Current' }] as const
    const slot = vi.fn(({ item, index }) => h('strong', `${index}:${item.label}`))
    const wrapper = mount(Breadcrumb, { props: { items, maxItems: 3, collapseMode: 'menu' }, slots: { default: slot }, attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('.scq-breadcrumb__expand').trigger('click')
    await flushPromises()
    const options = wrapper.findAll('[role="menuitem"]')
    expect(options.map(option => option.text())).toEqual(['1:Blocked', '2:Files'])
    expect(slot.mock.calls.some(([scope]) => toRaw(scope.item) === items[2] && scope.index === 2)).toBe(true)
    await options[0].trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    await options[1].trigger('click')
    expect(wrapper.emitted('select')).toEqual([[items[2], 2]])
    expect(wrapper.get('[aria-current="page"]').element.tagName).toBe('SPAN')
  })

  it('moves expansion focus to the first usable revealed path', async () => {
    const wrapper = mount(Breadcrumb, { props: { maxItems: 3, items: [{ label: 'Home' }, { label: 'Locked', disabled: true }, { label: 'Files', href: '#files' }, { label: 'Current' }] }, attachTo: document.body })
    wrappers.push(wrapper)
    const expand = wrapper.get<HTMLButtonElement>('.scq-breadcrumb__expand')
    expand.element.focus()
    await expand.trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('a').element)
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('lets Escape close a breadcrumb dropdown instead of treating the outer path as a parent menu', async () => {
    const wrapper = mount(Breadcrumb, { props: { maxItems: 3, collapseMode: 'menu', items: ['Home', 'Team', 'Files', 'Current'].map(label => ({ label })) }, attachTo: document.body })
    wrappers.push(wrapper)
    const trigger = wrapper.get<HTMLButtonElement>('.scq-breadcrumb__expand')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowUp' })
    await flushPromises()
    const last = wrapper.findAll('[role="menuitem"]').at(-1)!
    expect(document.activeElement).toBe(last.element)
    await last.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })
})

describe('Dropdown keyboard ownership', () => {
  it('provides a focusable fallback for an all-disabled menu and restores the trigger on Escape', async () => {
    const wrapper = mount(Dropdown, { attachTo: document.body, props: { teleport: false, items: [{ key: 'locked', label: 'Locked', disabled: true }] } })
    wrappers.push(wrapper)
    const trigger = wrapper.get<HTMLButtonElement>('.scq-dropdown__trigger button')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    const focused = document.activeElement
    expect(wrapper.get('.scq-floating-panel').element.contains(focused)).toBe(true)
    expect(focused?.getAttribute('tabindex')).toBe('-1')
    focused?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('keeps controlled visibility authoritative when keyboard opening is rejected', async () => {
    const wrapper = mount(Dropdown, { attachTo: document.body, props: { modelValue: false, teleport: false, items: [{ key: 'item', label: 'Item' }] } })
    wrappers.push(wrapper)
    const trigger = wrapper.get<HTMLButtonElement>('.scq-dropdown__trigger button')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('waits for positioning before focusing the requested menu edge', async () => {
    let finish!: (value: Awaited<ReturnType<typeof floating.computePosition>>) => void
    const position = vi.spyOn(floating, 'computePosition').mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    try {
      const wrapper = mount(Dropdown, { attachTo: document.body, props: { teleport: false, items: [{ key: 'first', label: 'First' }, { key: 'last', label: 'Last' }, { key: 'disabled', label: 'Disabled', disabled: true }] } })
      wrappers.push(wrapper)
      const trigger = wrapper.get<HTMLButtonElement>('.scq-dropdown__trigger button')
      trigger.element.focus()
      await trigger.trigger('keydown', { key: 'ArrowUp' })
      await flushPromises()
      expect(document.activeElement).toBe(trigger.element)
      finish({ x: 0, y: 0, strategy: 'fixed', placement: 'bottom', middlewareData: {} })
      await flushPromises()
      expect(document.activeElement?.textContent).toBe('Last')
    } finally { position.mockRestore() }
  })

  it('does not open from editable triggers, modified shortcuts or prevented keys', async () => {
    const wrapper = mount(Dropdown, { props: { teleport: false }, slots: { default: () => [h('input'), h('button', 'Open')] } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
    const button = wrapper.get('button')
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await button.trigger('keydown', { key: 'ArrowDown', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    event.preventDefault()
    button.element.dispatchEvent(event)
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('Menu', () => {
  it('waits for horizontal submenu positioning and preserves numeric keys in readonly trees', async () => {
    let finish!: (value: Awaited<ReturnType<typeof floating.computePosition>>) => void
    const position = vi.spyOn(floating, 'computePosition').mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    try {
      const items = [{ key: 0, label: 'Group', children: [{ key: 'blocked', label: 'Blocked', disabled: true }, { key: 1, label: 'Child' }] }, { key: '0', label: 'String key' }] as const
      const wrapper = mount(Menu, { props: { items, mode: 'horizontal' }, attachTo: document.body })
      wrappers.push(wrapper)
      const parent = wrapper.get<HTMLElement>('[data-menu-key="number:0"]')
      parent.element.focus()
      await parent.trigger('keydown', { key: 'ArrowDown' })
      await flushPromises()
      expect(document.activeElement).toBe(parent.element)
      finish({ x: 0, y: 0, strategy: 'fixed', placement: 'bottom', middlewareData: {} })
      await flushPromises()
      expect(document.activeElement).toBe(wrapper.get('[data-menu-key="number:1"]').element)
      parent.element.focus()
      await parent.trigger('keydown', { key: 'ArrowDown' })
      expect(wrapper.emitted('open')).toEqual([[0]])
      await wrapper.get('[data-menu-key="number:1"]').trigger('click')
      expect(wrapper.emitted('select')?.[0][1]).toEqual([0, 1])
    } finally { position.mockRestore() }
  })

  it.each(['horizontal', 'vertical'] as const)('focuses an all-disabled %s submenu and returns to its parent on Escape', async mode => {
    const wrapper = mount(Menu, { props: { mode, items: [{ key: 'group', label: 'Group', children: [{ key: 'blocked', label: 'Blocked', disabled: true }] }] }, attachTo: document.body })
    wrappers.push(wrapper)
    const parent = wrapper.get<HTMLElement>('[data-menu-key="string:group"]')
    parent.element.focus()
    await parent.trigger('keydown', { key: mode === 'horizontal' ? 'ArrowDown' : 'ArrowRight' })
    await flushPromises()
    const submenu = wrapper.get('[role="menu"][aria-label="Group"]')
    expect(document.activeElement).toBe(submenu.element)
    await submenu.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(parent.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(parent.element)
  })

  it('does not focus a submenu whose controlled opening is rejected', async () => {
    const wrapper = mount(Menu, { props: { openKeys: [], mode: 'horizontal', items: [{ key: 'group', label: 'Group', children: [{ key: 'child', label: 'Child' }] }] }, attachTo: document.body })
    wrappers.push(wrapper)
    const parent = wrapper.get<HTMLElement>('[role="menuitem"]')
    parent.element.focus()
    await parent.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(wrapper.emitted('update:openKeys')).toEqual([[['group']]])
    expect(wrapper.find('[data-menu-key="string:child"]').exists()).toBe(false)
    expect(document.activeElement).toBe(parent.element)
  })

  it('preserves composing, modified and prevented navigation keys', async () => {
    const wrapper = mount(Menu, { props: { items: [{ key: 'one', label: 'One' }, { key: 'two', label: 'Two' }] }, attachTo: document.body })
    wrappers.push(wrapper)
    const first = wrapper.get<HTMLElement>('[role="menuitem"]')
    first.element.focus()
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await first.trigger('keydown', { key: 'ArrowDown', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    event.preventDefault()
    first.element.dispatchEvent(event)
    expect(document.activeElement).toBe(first.element)
  })

  it('renders descriptions and shortcuts and forwards item slots to nested nodes', async () => {
    const data = [{ key: 'parent', label: 'Parent', children: [{ key: 'leaf', label: 'Leaf', description: 'Details', shortcut: 'Ctrl+K' }] }]
    const wrapper = mount(Menu, { props: { items: data, defaultOpenKeys: ['parent'] } })
    wrappers.push(wrapper)
    expect(wrapper.get('small').text()).toBe('Details')
    expect(wrapper.get('kbd').text()).toBe('Ctrl+K')
    const custom = mount(Menu, { props: { items: data, defaultOpenKeys: ['parent'] }, slots: { item: ({ item, path }) => h('span', { class: 'custom-menu-item' }, `${item.label}:${path.join('/')}`) } })
    wrappers.push(custom)
    expect(custom.findAll('.custom-menu-item').map(node => node.text())).toEqual(['Parent:parent', 'Leaf:parent/leaf'])
    await custom.findAll('[role="menuitem"]')[1].trigger('click')
    expect(custom.emitted('update:modelValue')).toEqual([['leaf']])
  })
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
  it('treats readonly expansion arrays as sets without confusing numeric and string names', async () => {
    const names = [0, 0] as const
    const wrapper = mount(Collapse, { props: { modelValue: names }, slots: { default: () => [
      h(CollapseItem, { name: 0, title: 'Number' }),
      h(CollapseItem, { name: '0', title: 'String' }),
    ] } })
    wrappers.push(wrapper)
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-expanded')).toBe('true')
    expect(buttons[1].attributes('aria-expanded')).toBe('false')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('change')).toEqual([[[0, '0']]])
    expect(names).toEqual([0, 0])
    await wrapper.setProps({ modelValue: [0, '0'], accordion: true })
    expect(buttons[0].attributes('aria-expanded')).toBe('true')
    expect(buttons[1].attributes('aria-expanded')).toBe('false')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('change')?.[1]).toEqual(['0'])
  })

  it('leaves modified, composing and prevented header keys untouched', async () => {
    const wrapper = mount(Collapse, { attachTo: document.body, slots: { default: () => [
      h(CollapseItem, { name: 'first', title: 'First' }), h(CollapseItem, { name: 'last', title: 'Last' }),
    ] } })
    wrappers.push(wrapper)
    const first = wrapper.get<HTMLButtonElement>('button')
    first.element.focus()
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await first.trigger('keydown', { key: 'ArrowDown', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    event.preventDefault()
    first.element.dispatchEvent(event)
    expect(document.activeElement).toBe(first.element)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it.each([false, true])('moves focus out before closing content with header disabled=%s', async disabled => {
    const wrapper = mount(Collapse, { attachTo: document.body, props: { modelValue: ['first'] }, slots: { default: () => h(CollapseItem, { name: 'first', title: 'First' }, () => h('input')) } })
    wrappers.push(wrapper)
    const input = wrapper.get<HTMLInputElement>('input')
    input.element.focus()
    await wrapper.setProps({ modelValue: [], disabled })
    expect(wrapper.get('[role="region"]').attributes('inert')).toBeDefined()
    expect(wrapper.get('[role="region"]').attributes('aria-hidden')).toBe('true')
    expect(document.activeElement).toBe(wrapper.get(disabled ? '.scq-collapse-item' : 'button').element)
    await wrapper.setProps({ modelValue: ['first'], disabled: false })
    expect(wrapper.get('[role="region"]').attributes('inert')).toBeUndefined()
    expect(wrapper.get('[role="region"]').attributes('aria-hidden')).toBeUndefined()
  })

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
  it.each(['disable', 'remove'] as const)('repairs focus when the focused tab is unavailable after %s', async operation => {
    const wrapper = mount(Tabs, { props: { items }, attachTo: document.body })
    wrappers.push(wrapper)
    wrapper.get<HTMLButtonElement>('[role="tab"]').element.focus()
    await wrapper.setProps({ items: operation === 'remove' ? items.slice(1) : items.map(item => ({ ...item, disabled: item.name !== 'last' })) })
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('[aria-selected="true"]').element)
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Last')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ items: [] })
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('[role="tablist"]').element)
  })

  it('does not steal panel focus when the tab list changes', async () => {
    const wrapper = mount(Tabs, { props: { items }, slots: { first: '<input />' }, attachTo: document.body })
    wrappers.push(wrapper)
    const input = wrapper.get<HTMLInputElement>('input').element
    input.focus()
    await wrapper.setProps({ items: [...items, { name: 'new', label: 'New' }] })
    await nextTick()
    expect(document.activeElement).toBe(input)
  })

  it('preserves browser shortcuts, composing keys and cancelled navigation', async () => {
    const wrapper = mount(Tabs, { props: { items }, attachTo: document.body })
    wrappers.push(wrapper)
    const first = wrapper.get<HTMLButtonElement>('[role="tab"]').element
    first.focus()
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, ...flags })
      first.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
    const cancelled = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    cancelled.preventDefault()
    first.dispatchEvent(cancelled)
    await nextTick()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(document.activeElement).toBe(first)
  })

  it('preserves zero-key panel identity through immutable item reordering', async () => {
    const entries = [{ name: 0, label: 'Zero' }, { name: 1, label: 'One' }] as const
    const wrapper = mount(Tabs, { props: { items: entries }, slots: { '0': '<input />' } })
    wrappers.push(wrapper)
    const input = wrapper.get('input').element
    await wrapper.get('input').setValue('Draft')
    await wrapper.setProps({ items: [...entries].reverse() })
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Zero')
    expect(wrapper.get('input').element).toBe(input)
    expect(input.value).toBe('Draft')
  })
  it('guards changes, preserves rejected content and destroys inactive panels only when requested', async () => {
    let allow!: (value: boolean) => void
    const beforeChange = vi.fn(() => new Promise<boolean>((resolve) => { allow = resolve }))
    const wrapper = mount(Tabs, { props: { items, beforeChange, destroyInactive: true }, slots: { first: '<input />', last: 'Last' } })
    wrappers.push(wrapper)
    const input = wrapper.get('input').element
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    expect(beforeChange).toHaveBeenCalledTimes(1)
    expect(wrapper.attributes('aria-busy')).toBe('true')
    allow(false)
    await vi.waitFor(() => expect(wrapper.attributes('aria-busy')).toBeUndefined())
    expect(wrapper.get('input').element).toBe(input)
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    allow(true)
    await vi.waitFor(() => expect(wrapper.find('input').exists()).toBe(false))
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(1)
    expect(wrapper.emitted('change')).toEqual([['last']])
  })

  it('cancels a pending tab switch when the controlled value changes', async () => {
    let allow!: (value: boolean) => void
    let signal!: AbortSignal
    const wrapper = mount(Tabs, { props: { items, modelValue: 'first', beforeChange: (_name, currentSignal) => { signal = currentSignal; return new Promise<boolean>((resolve) => { allow = resolve }) } } })
    wrappers.push(wrapper)
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    await wrapper.setProps({ modelValue: 'last' })
    expect(signal.aborted).toBe(true)
    allow(true)
    await vi.waitFor(() => expect(wrapper.attributes('aria-busy')).toBeUndefined())
    expect(wrapper.emitted('change')).toBeUndefined()
  })
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
  it('shows the normalized size and restores rejected native selections without duplicate requests', async () => {
    const sizes = [10, 20, 20, 0, Number.NaN] as const
    const wrapper = mount(Pagination, { props: { total: 100, pageSize: 10.9, pageSizes: sizes } })
    wrappers.push(wrapper)
    const select = wrapper.get<HTMLSelectElement>('select')
    expect(select.element.value).toBe('10')
    expect(select.findAll('option').map(option => option.attributes('value'))).toEqual(['10', '20'])
    await select.setValue('20')
    expect(wrapper.emitted('size-change')).toEqual([[20]])
    expect(select.element.value).toBe('10')
    await select.trigger('change')
    expect(wrapper.emitted('size-change')).toHaveLength(1)
    await wrapper.setProps({ pageSize: 20 })
    expect(select.element.value).toBe('20')
    await wrapper.setProps({ disabled: true })
    select.element.value = '10'
    select.element.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(select.element.value).toBe('20')
    expect(wrapper.emitted('size-change')).toHaveLength(1)
  })

  it('clears stale page drafts after external changes and locking', async () => {
    const wrapper = mount(Pagination, { props: { total: 100, showJumper: true } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.setValue('8')
    await wrapper.setProps({ modelValue: 3 })
    expect(input.element.value).toBe('')
    await input.trigger('blur')
    expect(wrapper.emitted('change')).toBeUndefined()
    await input.setValue('7')
    await wrapper.setProps({ loading: true })
    await wrapper.setProps({ loading: false })
    await input.trigger('blur')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('reconciles a known total after loading unlocks navigation', async () => {
    const wrapper = mount(Pagination, { props: { modelValue: 9, unknownTotal: true, loading: true } })
    wrappers.push(wrapper)
    await wrapper.setProps({ unknownTotal: false, total: 20 })
    expect(wrapper.get('.scq-pagination__counter').text()).toBe('2 / 2')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ loading: false })
    expect(wrapper.emitted('change')).toEqual([[2]])
  })

  it('does not submit page drafts while composing', async () => {
    const wrapper = mount(Pagination, { props: { total: 100, showJumper: true } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.setValue('4')
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    await input.trigger('keydown', { key: 'Enter', keyCode: COMPOSITION_KEY_CODE })
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(input.element.value).toBe('4')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('change')).toEqual([[4]])
  })
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

describe('Steps boundaries', () => {
  const items = [{ title: 'First' }, { title: 'Second' }] as const
  it.each([Number.NaN, Infinity, 1.5])('rejects invalid active indices: %s', active => {
    expect(() => mount(Steps, { props: { items, active } })).toThrow('finite integer')
  })

  it('retains clamping and all-completed semantics', async () => {
    const wrapper = mount(Steps, { props: { items, active: -1 } })
    wrappers.push(wrapper)
    expect(wrapper.get('[aria-current="step"]').text()).toContain('First')
    await wrapper.setProps({ active: items.length })
    expect(wrapper.find('[aria-current]').exists()).toBe(false)
    expect(wrapper.findAll('.is-finish')).toHaveLength(items.length)
    await wrapper.setProps({ items: [] })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('cancels pending selection when switching back to display-only mode', async () => {
    let complete!: (allowed: boolean) => void
    let signal!: AbortSignal
    const wrapper = mount(Steps, { props: { items, clickable: true, beforeChange: (_index, current) => {
      signal = current
      return new Promise<boolean>(resolve => { complete = resolve })
    } } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[1].trigger('click')
    await wrapper.setProps({ clickable: false })
    expect(signal.aborted).toBe(true)
    complete(true)
    await flushPromises()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.get('[aria-current="step"]').text()).toContain('First')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it.each([true, false])('restores original keyboard focus after the guard returns %s', async allowed => {
    let complete!: (allowed: boolean) => void
    const wrapper = mount(Steps, { attachTo: document.body, props: { items, clickable: true, beforeChange: () => new Promise<boolean>(resolve => { complete = resolve }) } })
    wrappers.push(wrapper)
    const button = wrapper.findAll<HTMLButtonElement>('button')[1]
    button.element.focus()
    await button.trigger('click')
    button.element.blur()
    complete(allowed)
    await flushPromises()
    expect(document.activeElement).toBe(button.element)
    expect(wrapper.get('[aria-current="step"]').text()).toContain(allowed ? 'Second' : 'First')
  })
})

describe('Mobile navigation', () => {
  it('preserves zero-key tabbar defaults through readonly reordering and repairs removed navigation', async () => {
    const items = [{ name: 0, label: 'Home' }, { name: 'action', label: 'Create', action: true }, { name: 'profile', label: 'Profile' }] as const
    const wrapper = mount(Tabbar, { props: { items } })
    wrappers.push(wrapper)
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Home')
    await wrapper.setProps({ items: [...items].reverse() })
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Home')
    await wrapper.setProps({ items: items.slice(1) })
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Profile')
    await wrapper.setProps({ items: [items[1]] })
    expect(wrapper.find('[aria-current]').exists()).toBe(false)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('keeps action icons inactive even when the controlled name matches', () => {
    const wrapper = mount(Tabbar, { props: { modelValue: 'create', items: [{ name: 'create', label: 'Create', action: true, icon: 'plus', activeIcon: 'check' }] } })
    wrappers.push(wrapper)
    expect(wrapper.find('.scq-icon--plus').exists()).toBe(true)
    expect(wrapper.find('.scq-icon--check').exists()).toBe(false)
    expect(wrapper.find('[aria-current]').exists()).toBe(false)
  })

  it.each([true, false])('restores tabbar keyboard focus after a guard resolves %s', async allowed => {
    let complete!: (allowed: boolean) => void
    const wrapper = mount(Tabbar, { attachTo: document.body, props: { items: [{ name: 'home', label: 'Home' }, { name: 'profile', label: 'Profile' }], beforeChange: () => new Promise<boolean>(resolve => { complete = resolve }) } })
    wrappers.push(wrapper)
    const profile = wrapper.findAll<HTMLButtonElement>('button')[1]
    profile.element.focus()
    await profile.trigger('click')
    profile.element.blur()
    complete(allowed)
    await flushPromises()
    expect(document.activeElement).toBe(profile.element)
    expect(wrapper.get('[aria-current="page"]').text()).toBe(allowed ? 'Profile' : 'Home')
    expect(wrapper.findAll('button').every(button => !button.element.disabled)).toBe(true)
  })

  it('localizes the default navbar action name and preserves explicit names', async () => {
    const locale = ref<'zh-CN' | 'en-US'>('zh-CN')
    const wrapper = mount({ setup: () => () => h(ConfigProvider, { locale: locale.value }, () => h(NavBar, { rightIcon: 'settings' })) })
    wrappers.push(wrapper)
    expect(wrapper.get('button').attributes('aria-label')).toBe('\u64cd\u4f5c')
    locale.value = 'en-US'
    await nextTick()
    expect(wrapper.get('button').attributes('aria-label')).toBe('Actions')
    const explicit = mount(NavBar, { props: { rightIcon: 'settings', rightLabel: 'Preferences' } })
    wrappers.push(explicit)
    expect(explicit.get('button').attributes('aria-label')).toBe('Preferences')
    await explicit.setProps({ rightText: 'Save' })
    expect(explicit.get('button').attributes('aria-label')).toBe('Save')
  })

  it('restores navbar action focus after guards and loading without stealing moved focus', async () => {
    let complete!: (allowed: boolean) => void
    const wrapper = mount(NavBar, { attachTo: document.body, props: { leftArrow: true, rightIcon: 'settings', beforeBack: () => new Promise<boolean>(resolve => { complete = resolve }) } })
    wrappers.push(wrapper)
    const [left, right] = wrapper.findAll<HTMLButtonElement>('button')
    left.element.focus()
    await left.trigger('click')
    left.element.blur()
    complete(false)
    await flushPromises()
    expect(document.activeElement).toBe(left.element)
    await left.trigger('click')
    right.element.focus()
    complete(false)
    await flushPromises()
    expect(document.activeElement).toBe(right.element)
    await wrapper.setProps({ rightLoading: true })
    right.element.blur()
    await wrapper.setProps({ rightLoading: false })
    await flushPromises()
    expect(document.activeElement).toBe(right.element)
    expect(wrapper.emitted('click-left')).toBeUndefined()
  })

  it('enforces Form disabling on teleported cells despite an explicit false prop', async () => {
    const disabled = ref(true)
    const wrapper = mount({
      setup: () => () => h(Form, { model: {}, disabled: disabled.value }, {
        default: () => h(Teleport, { to: document.body }, [h(Cell, { title: 'Action', clickable: true, disabled: false })]),
      }),
    }, { attachTo: document.body })
    wrappers.push(wrapper)
    const cell = wrapper.getComponent(Cell)
    expect(cell.attributes('disabled')).toBeDefined()
    ;(cell.element as HTMLButtonElement).click()
    expect(cell.emitted('click')).toBeUndefined()
    disabled.value = false
    await nextTick()
    ;(cell.element as HTMLButtonElement).click()
    expect(cell.emitted('click')).toHaveLength(1)
    expect(cell.attributes('type')).toBe('button')
  })

  it.each(['data:text/html,unsupported', 'http://['])('rejects unsupported cell destinations: %s', href => {
    expect(() => mount(Cell, { props: { title: 'Invalid link', href } })).toThrow('unsupported or invalid URL')
  })

  it('switches between a native link and disabled button without losing content', async () => {
    const wrapper = mount(Cell, { props: { title: 'Files', href: '#files', value: 0 } })
    wrappers.push(wrapper)
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('#files')
    expect(wrapper.get('.scq-cell__value').text()).toBe('0')
    await wrapper.setProps({ disabled: true })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeDefined()
    await wrapper.setProps({ disabled: false, href: '', clickable: false })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.get('.scq-cell__value').text()).toBe('0')
  })

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