// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { Comment, createSSRApp, defineComponent, Fragment, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Space from '../src/components/Space/Space.vue'
import Divider from '../src/components/Divider/Divider.vue'
import Grid from '../src/components/Grid/Grid.vue'
import Layout from '../src/components/Layout/Layout.vue'
import Container from '../src/components/Container/Container.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import LayoutFoundationExample from '../playground/src/components/examples/LayoutFoundationExample.vue'
import { LAYOUT_BREAKPOINTS, SPACING_TOKENS } from '../src/utils/layout'

const VIEWPORT = { small: 375, large: 1280, customMedium: 900 } as const
const originalWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth')!
const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
const resize = async (width: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
  await nextTick()
  await flushPromises()
}
beforeEach(() => Object.defineProperty(window, 'innerWidth', { configurable: true, value: VIEWPORT.small }))
afterEach(async () => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  await flushPromises()
  Object.defineProperty(window, 'innerWidth', originalWidth)
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('Layout foundation documentation example', () => {
  it('uses library controls and preserves the draft when optional content changes', async () => {
    const wrapper = track(mount(LayoutFoundationExample))
    const space = wrapper.getComponent(Space)
    const draft = space.get<HTMLInputElement>('input[aria-label="Layout draft"]')
    const toggle = wrapper.get<HTMLInputElement>('.scq-checkbox__original')
    expect(space.findAll('.my-btn')).toHaveLength(2)
    expect(wrapper.findAll('.scq-input')).toHaveLength(2)
    expect(wrapper.findAll('.scq-checkbox')).toHaveLength(2)
    expect(space.findAll('.scq-space__separator')).toHaveLength(2)
    await draft.setValue('Keep this draft')
    await toggle.setValue(false)
    expect(space.findAll('.my-btn')).toHaveLength(1)
    expect(space.findAll('.scq-space__separator')).toHaveLength(1)
    expect(space.get('input').element).toBe(draft.element)
    expect(draft.element.value).toBe('Keep this draft')
    expect(wrapper.get('[role="region"]').text()).toContain('Keep this draft')
    await toggle.setValue(true)
    expect(space.findAll('.scq-space__separator')).toHaveLength(2)
    expect(space.get('input').element).toBe(draft.element)
  })

  it('retains input state and grid placement across the example breakpoints', async () => {
    const wrapper = track(mount(LayoutFoundationExample))
    const layout = wrapper.getComponent(Layout)
    const grid = wrapper.getComponent(Grid)
    const input = layout.get<HTMLInputElement>('input')
    const medium = layout.props('breakpoints')!.md!
    await input.setValue('Responsive draft')
    await resize(medium - 1)
    expect(layout.element.style.flexDirection).toBe('column')
    await resize(medium)
    expect(layout.element.style.flexDirection).toBe('row')
    await resize(VIEWPORT.large)
    expect(grid.element.style.getPropertyValue('--scq-grid-columns')).toBe('4')
    await resize(VIEWPORT.small)
    expect(grid.element.style.getPropertyValue('--scq-grid-columns')).toBe('1')
    expect(layout.element.style.flexDirection).toBe('column')
    expect(layout.get('input').element).toBe(input.element)
    expect(input.element.value).toBe('Responsive draft')
    expect(layout.text()).toContain('Responsive draft')
    expect(wrapper.get('.layout-foundation-example__card--offset').attributes('style')).toContain('--scq-grid-column-start: 3')
    expect(wrapper.findAllComponents(Grid)[1].props('minItemWidth')).toBeGreaterThan(0)
  })

  it('toggles logical divider direction and keeps the scroll region accessible', async () => {
    const wrapper = track(mount(LayoutFoundationExample))
    const preview = wrapper.get('.layout-foundation-example__dividers')
    const rtl = wrapper.findAll<HTMLInputElement>('.scq-checkbox__original')[1]
    expect(preview.attributes('dir')).toBe('ltr')
    await rtl.setValue(true)
    expect(preview.attributes('dir')).toBe('rtl')
    expect(preview.findAllComponents(Divider).map(divider => divider.props('contentPosition'))).toEqual(['start', 'end', 'center'])
    await rtl.setValue(false)
    expect(preview.attributes('dir')).toBe('ltr')
    const scroll = wrapper.get('[role="region"]')
    expect(scroll.attributes('tabindex')).toBe('0')
    expect(scroll.attributes('aria-label')).toBe('Scrollable layout content')
    expect(wrapper.findAll('.layout-foundation-example__fixed')).toHaveLength(2)
  })
})

describe('Responsive layout primitives', () => {
  it('preserves semantic layout tags and child state through wrap and reverse changes', async () => {
    const wrapper = track(mount(Layout, {
      props: { as: 'nav', direction: { xs: 'vertical', md: 'horizontal' }, wrap: true, reverse: true },
      attrs: { 'aria-label': 'Workspace actions' }, slots: { default: () => h('input') },
    }))
    const input = wrapper.get('input')
    await input.setValue('Layout draft')
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Workspace actions')
    expect(wrapper.classes()).toContain('is-wrap')
    expect(wrapper.attributes('style')).toContain('column-reverse')
    await resize(LAYOUT_BREAKPOINTS.md)
    expect(wrapper.attributes('style')).toContain('row-reverse')
    await wrapper.setProps({ wrap: false, reverse: false, align: 'baseline', justify: 'space-evenly' })
    expect(wrapper.classes()).not.toContain('is-wrap')
    expect(wrapper.attributes('style')).toContain('flex-direction: row')
    expect(wrapper.attributes('style')).toContain('align-items: baseline')
    expect(wrapper.attributes('style')).toContain('justify-content: space-evenly')
    expect(wrapper.get('input').element).toBe(input.element)
    expect(input.element.value).toBe('Layout draft')
  })

  it.each([Number.NaN, Infinity])('rejects non-finite layout gaps explicitly: %s', gap => {
    expect(() => mount(Layout, { props: { gap } })).toThrow('Layout lengths must be finite')
  })
  it.each([Number.NaN, Infinity, -Infinity])('rejects non-finite grid counts in both numeric and breakpoint forms: %s', (value) => {
    expect(() => mount(Grid, { props: { columns: value } })).toThrow('column counts must be finite')
    expect(() => mount(Grid, { props: { columns: { md: value } } })).toThrow('column counts must be finite')
  })

  it('normalizes finite grid counts and preserves content while toggling auto-fill', async () => {
    const wrapper = track(mount(Grid, {
      props: { as: 'ul', columns: { xs: 0, sm: 2.8 } },
      slots: { default: () => h('li', [h('input', { key: 'draft' })]) },
    }))
    expect(wrapper.attributes('style')).toContain('--scq-grid-xs: 1')
    expect(wrapper.attributes('style')).toContain('--scq-grid-sm: 2')
    expect(wrapper.attributes('style')).toContain('--scq-grid-md: 2')
    const input = wrapper.get('input')
    await input.setValue('Preserved grid draft')
    await wrapper.setProps({ minItemWidth: 180 })
    expect(wrapper.classes()).toContain('is-auto-fill')
    await wrapper.setProps({ minItemWidth: undefined, columns: 4 })
    expect(wrapper.classes()).not.toContain('is-auto-fill')
    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.get('input').element).toBe(input.element)
    expect(input.element.value).toBe('Preserved grid draft')
  })
  it('preserves static defaults and row/column gap order', () => {
    const space = track(mount(Space))
    const layout = track(mount(Layout))
    const grid = track(mount(Grid, { props: { gap: [12, 20] } }))
    expect(space.attributes('style')).toContain('gap: 12px')
    expect(layout.attributes('style')).toContain('flex-direction: column')
    expect(layout.attributes('style')).toContain('gap: 0px')
    expect(grid.attributes('style')).toContain('--scq-grid-xs: 3')
    expect(grid.attributes('style')).toContain('gap: 12px 20px')
    expect(grid.element.style.gridTemplateColumns).toBe('')
  })

  it('resolves named and responsive spacing at exact breakpoint boundaries', async () => {
    const wrapper = track(mount(Space, { props: { size: { xs: 'sm', md: ['md', 'xl'] } } }))
    expect(wrapper.attributes('style')).toContain(`var(--scq-space-sm, ${SPACING_TOKENS.sm}px)`)
    await resize(LAYOUT_BREAKPOINTS.md - 1)
    expect(wrapper.attributes('style')).toContain('var(--scq-space-sm, 8px)')
    await resize(LAYOUT_BREAKPOINTS.md)
    expect(wrapper.attributes('style')).toContain('var(--scq-space-md, 12px) var(--scq-space-xl, 24px)')
    await resize(VIEWPORT.large)
    expect(wrapper.attributes('style')).toContain('var(--scq-space-md, 12px) var(--scq-space-xl, 24px)')
  })

  it('carries responsive direction and alignment forward without remounting content', async () => {
    const wrapper = track(mount(Layout, { props: {
      direction: { xs: 'vertical', md: 'horizontal' }, gap: { sm: 8, md: 24 },
      align: { xs: 'stretch', md: 'center' }, justify: { md: 'space-between' }, reverse: true,
    }, slots: { default: () => h('input', { 'aria-label': 'Draft' }) } }))
    const input = wrapper.get('input')
    await input.setValue('Keep this value')
    expect(wrapper.attributes('style')).toContain('column-reverse')
    expect(wrapper.attributes('style')).toContain('gap: 0px')
    await resize(LAYOUT_BREAKPOINTS.md)
    expect(wrapper.attributes('style')).toContain('row-reverse')
    expect(wrapper.attributes('style')).toContain('align-items: center')
    expect(wrapper.attributes('style')).toContain('justify-content: space-between')
    expect(wrapper.get('input').element).toBe(input.element)
    expect(input.element.value).toBe('Keep this value')
  })

  it('shares custom breakpoints between spacing, layout and grid columns', async () => {
    const breakpoints = { md: VIEWPORT.customMedium }
    const space = track(mount(Space, { props: { size: { xs: 8, md: 24 }, breakpoints } }))
    const layout = track(mount(Layout, { props: { direction: { xs: 'vertical', md: 'horizontal' }, breakpoints } }))
    const grid = track(mount(Grid, { props: { columns: { xs: 1, md: 3 }, breakpoints } }))
    await resize(VIEWPORT.customMedium - 1)
    expect(space.attributes('style')).toContain('gap: 8px')
    expect(layout.attributes('style')).toContain('flex-direction: column')
    expect(grid.attributes('style')).toContain('--scq-grid-columns: 1')
    await resize(VIEWPORT.customMedium)
    expect(space.attributes('style')).toContain('gap: 24px')
    expect(layout.attributes('style')).toContain('flex-direction: row')
    expect(grid.attributes('style')).toContain('--scq-grid-columns: 3')
    await grid.setProps({ breakpoints: { md: LAYOUT_BREAKPOINTS.md } })
    expect(grid.attributes('style')).toContain('--scq-grid-columns: 3')
  })

  it('keeps auto-fill opt-in and limits the minimum track to the container width', () => {
    const grid = track(mount(Grid, { props: { minItemWidth: 240, gap: '1rem' } }))
    expect(grid.classes()).toContain('is-auto-fill')
    expect(grid.attributes('style')).toContain('repeat(auto-fill, minmax(min(100%, 240px), 1fr))')
    expect(grid.attributes('style')).toContain('gap: 1rem')
  })

  it('does not subscribe static layouts and removes responsive subscriptions', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    track(mount(Layout))
    track(mount(Space))
    track(mount(Grid))
    expect(add.mock.calls.filter(([name]) => name === 'resize')).toHaveLength(0)
    const wrapper = track(mount(Space, { props: { size: { xs: 8, md: 16 } } }))
    const listener = add.mock.calls.find(([name]) => name === 'resize')![1]
    await wrapper.setProps({ size: 12 })
    expect(remove).toHaveBeenCalledWith('resize', listener)
    await wrapper.setProps({ size: { xs: 8, md: 16 } })
    wrapper.unmount()
    expect(remove.mock.calls.filter(([name, callback]) => name === 'resize' && callback === listener)).toHaveLength(2)
  })

  it('renders deterministic xs fallbacks during SSR without browser listeners', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const html = await renderToString(createSSRApp({ render: () => h(Layout, { direction: { xs: 'vertical', md: 'horizontal' }, gap: { xs: 8, md: 24 } }) }))
    expect(html).toContain('flex-direction:column')
    expect(html).toContain('gap:8px')
    expect(add.mock.calls.filter(([name]) => name === 'resize')).toHaveLength(0)
  })

  it('reports invalid custom breakpoints instead of silently reordering them', () => {
    expect(() => mount(Space, { props: { size: { xs: 8 }, breakpoints: { sm: 1000 } } })).toThrow('strictly increasing')
    const shiftedBase = { xs: 1, sm: LAYOUT_BREAKPOINTS.sm }
    expect(() => mount(Space, { props: { size: { xs: 8 }, breakpoints: shiftedBase } })).toThrow('must remain zero')
    expect(() => mount(Grid, { props: { minItemWidth: 0 } })).toThrow('must be positive')
  })
})

describe('Space separators and Divider semantics', () => {
  it('omits empty divider labels but retains zero and dynamically supplied text', async () => {
    const text = ref<string | number>(' ')
    const wrapper = track(mount(Divider, { slots: { default: () => [h(Comment), text.value] } }))
    expect(wrapper.find('.scq-divider__text').exists()).toBe(false)
    text.value = 0
    await nextTick()
    expect(wrapper.get('.scq-divider__text').text()).toBe('0')
    text.value = 'Section'
    await nextTick()
    expect(wrapper.get('.scq-divider__text').text()).toBe('Section')
    text.value = ''
    await nextTick()
    expect(wrapper.find('.scq-divider__text').exists()).toBe(false)
  })
  it('keeps numeric zero while omitting booleans and whitespace from separator counts', () => {
    const wrapper = track(mount(Space, { slots: {
      default: () => [false, null, 0, h('span', 'Value'), ' '],
      separator: () => '|',
    } }))
    expect(wrapper.text()).toBe('0|Value')
    expect(wrapper.findAll('.scq-space__separator')).toHaveLength(1)
  })

  it('keeps distinct symbol keys, element refs and listeners when items reorder', async () => {
    const first = Symbol('item')
    const second = Symbol('item')
    const reverse = ref(false)
    const inputRef = ref<HTMLInputElement>()
    const onInput = vi.fn()
    const wrapper = track(mount(Space, { slots: {
      default: () => {
        const children = [h('input', { key: first, ref: inputRef, onInput }), h('button', { key: second }, 'Second')]
        return reverse.value ? children.reverse() : children
      },
      separator: () => '|',
    } }))
    const input = wrapper.get('input')
    await input.setValue('Preserved')
    reverse.value = true
    await nextTick()
    expect(wrapper.get('input').element).toBe(input.element)
    expect(inputRef.value).toBe(input.element)
    expect(input.element.value).toBe('Preserved')
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(wrapper.element.children[0].tagName).toBe('BUTTON')
  })
  it('ignores empty text, comments and empty fragments between separators', async () => {
    const show = ref(false)
    const wrapper = track(mount(Space, { slots: {
      default: () => [h(Comment), ' ', h(Fragment, null, []), h('button', { key: 'first' }, 'First'), show.value ? h('button', { key: 'second' }, 'Second') : h(Comment), h(Fragment, { key: 'nested' }, [h('button', { key: 'last' }, 'Last')])],
      separator: ({ index }) => h('span', `/${index}/`),
    } }))
    expect(wrapper.findAll('.scq-space__separator').map((node) => node.text())).toEqual(['/0/'])
    expect(wrapper.get('.scq-space__separator').attributes('aria-hidden')).toBe('true')
    show.value = true
    await nextTick()
    expect(wrapper.findAll('.scq-space__separator').map((node) => node.text())).toEqual(['/0/', '/1/'])
    await wrapper.setProps({ direction: 'vertical' })
    expect(wrapper.classes()).toContain('is-vertical')
  })

  it('preserves keyed inputs when keyed fragments are reordered', async () => {
    const reverse = ref(false)
    const groups = () => ['first', 'second'].map((key) => h(Fragment, { key }, [h('input', { key: 'draft', 'aria-label': key })]))
    const wrapper = track(mount(Space, { slots: {
      default: () => reverse.value ? groups().reverse() : groups(),
      separator: () => '|',
    } }))
    const input = wrapper.get<HTMLInputElement>('input[aria-label="first"]')
    await input.setValue('Saved draft')
    reverse.value = true
    await nextTick()
    expect(wrapper.get('input[aria-label="first"]').element).toBe(input.element)
    expect(input.element.value).toBe('Saved draft')
  })

  it('keeps separators out of the default DOM when no separator slot is supplied', () => {
    const wrapper = track(mount(Space, { slots: { default: () => [h('button', 'First'), h('button', 'Second')] } }))
    expect(wrapper.element.children).toHaveLength(2)
    expect(wrapper.find('.scq-space__separator').exists()).toBe(false)
  })

  it('preserves content when the optional separator slot is toggled', async () => {
    const separated = ref(false)
    const wrapper = track(mount(defineComponent({
      setup: () => () => h(Space, {}, {
        default: () => [h('input', { key: 'draft' }), h('button', { key: 'save' }, 'Save')],
        ...(separated.value ? { separator: () => '|' } : {}),
      }),
    })))
    const input = wrapper.get('input')
    await input.setValue('Stable')
    separated.value = true
    await nextTick()
    expect(wrapper.get('input').element).toBe(input.element)
    expect(wrapper.get('.scq-space__separator').text()).toBe('|')
    separated.value = false
    await nextTick()
    expect(wrapper.get('input').element).toBe(input.element)
    expect(input.element.value).toBe('Stable')
  })

  it('retains separator roles, native labels and logical text-position classes', async () => {
    const wrapper = track(mount(Divider, { props: { contentPosition: 'start' }, attrs: { dir: 'rtl', 'aria-label': 'Section boundary' }, slots: { default: () => h('span', { 'aria-hidden': 'true' }, 'Next section') } }))
    expect(wrapper.attributes('role')).toBe('separator')
    expect(wrapper.attributes('aria-label')).toBe('Section boundary')
    expect(wrapper.classes()).toContain('scq-divider--start')
    await wrapper.setProps({ direction: 'vertical', dashed: true })
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
    expect(wrapper.find('.scq-divider__text').exists()).toBe(false)
  })
})

describe('Container sidebar composition', () => {
  it('skips hidden main inputs when recovering focus without an available sidebar toggle', async () => {
    const wrapper = track(mount(Container, {
      attachTo: document.body,
      slots: {
        aside: () => h('input', { id: 'focusable-sidebar' }),
        default: () => [h('input', { type: 'hidden', value: 'metadata' }), h('button', { id: 'main-action' }, 'Continue')],
      },
    }))
    wrapper.get<HTMLInputElement>('#focusable-sidebar').element.focus()
    wrapper.vm.collapseAside()
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('#main-action').element)
    expect(wrapper.get('aside').element.style.display).toBe('none')
  })
  const slots = {
    header: () => h('h2', 'Workspace'),
    aside: () => h('label', ['Sidebar draft', h('input', { id: 'sidebar-draft' })]),
    default: () => h('label', ['Main draft', h('input', { id: 'main-draft' })]),
    footer: () => h('p', 'Footer'),
  }

  it('preserves the default static structure and controlled width without adding controls', async () => {
    const wrapper = track(mount(Container, { slots }))
    expect(wrapper.classes()).toContain('has-aside')
    expect(wrapper.attributes('style')).toContain('--scq-container-aside: 220px')
    expect(wrapper.find('.scq-container__tools').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'Drawer' }).exists()).toBe(false)
    const input = wrapper.get<HTMLInputElement>('#sidebar-draft')
    await input.setValue('Retain on width changes')
    await wrapper.setProps({ asideWidth: 320, asidePosition: 'right' })
    expect(wrapper.attributes('style')).toContain('--scq-container-aside: 320px')
    expect(wrapper.get('#sidebar-draft').element).toBe(input.element)
    expect(input.element.value).toBe('Retain on width changes')
  })

  it('collapses without unmounting content and returns focus to an available control', async () => {
    const wrapper = track(mount(Container, { props: { collapsible: true }, slots, attachTo: document.body }))
    const input = wrapper.get<HTMLInputElement>('#sidebar-draft')
    await input.setValue('Retain when hidden')
    input.element.focus()
    wrapper.vm.collapseAside()
    await flushPromises()
    expect(wrapper.get('aside').element.style.display).toBe('none')
    expect(wrapper.classes()).not.toContain('has-aside')
    expect(document.activeElement).toBe(wrapper.get('.scq-container__toggle').element)
    await wrapper.get('.scq-container__toggle').trigger('click')
    expect(wrapper.get('#sidebar-draft').element).toBe(input.element)
    expect(input.element.value).toBe('Retain when hidden')
    expect(wrapper.emitted('update:collapsed')).toEqual([[true], [false]])
  })

  it('keeps externally controlled collapse state authoritative', async () => {
    const wrapper = track(mount(Container, { props: { collapsible: true, collapsed: false }, slots }))
    await wrapper.get('.scq-container__toggle').trigger('click')
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
    expect(wrapper.get('aside').element.style.display).not.toBe('none')
    await wrapper.setProps({ collapsed: true })
    expect(wrapper.get('aside').element.style.display).toBe('none')
  })

  it('moves a single sidebar instance into the shared Drawer and back at the breakpoint', async () => {
    const wrapper = track(mount(Container, { props: { asideMode: 'drawer', collapsible: true }, slots, attachTo: document.body }))
    const side = wrapper.get<HTMLInputElement>('#sidebar-draft').element
    const main = wrapper.get<HTMLInputElement>('#main-draft').element
    side.value = 'Sidebar state'
    main.value = 'Main state'
    await wrapper.get('.scq-container__toggle').trigger('click')
    await flushPromises()
    expect(document.querySelectorAll('#sidebar-draft')).toHaveLength(1)
    expect(document.querySelector('.scq-drawer #sidebar-draft')).toBe(side)
    expect(document.body.style.overflow).toBe('hidden')
    await resize(LAYOUT_BREAKPOINTS.md)
    expect(document.querySelector('.scq-container__body #sidebar-draft')).toBe(side)
    expect(side.value).toBe('Sidebar state')
    expect(main.value).toBe('Main state')
    expect(document.body.style.overflow).toBe('')
    expect(wrapper.vm.mobile).toBe(false)
    expect(wrapper.emitted('update:asideOpen')).toEqual([[true], [false]])
  })

  it('closes the drawer on Escape without resetting the main content or leaving scroll locked', async () => {
    const wrapper = track(mount(Container, { props: { asideMode: 'drawer' }, slots, attachTo: document.body }))
    const trigger = wrapper.get<HTMLButtonElement>('.scq-container__toggle')
    const main = wrapper.get<HTMLInputElement>('#main-draft')
    await main.setValue('Main remains')
    trigger.element.focus()
    await trigger.trigger('click')
    await flushPromises()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(wrapper.vm.asideOpen).toBe(false)
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger.element)
    expect(main.element.value).toBe('Main remains')
  })

  it('respects inherited disabled state and explicit overrides for new controls', async () => {
    const disabled = ref<boolean | undefined>(undefined)
    const wrapper = track(mount(ConfigProvider, { props: { disabled: true, locale: 'en-US' }, slots: {
      default: () => h(Container, { collapsible: true, disabled: disabled.value }, slots),
    } }))
    expect(wrapper.get<HTMLButtonElement>('button').element.disabled).toBe(true)
    disabled.value = false
    await nextTick()
    expect(wrapper.get<HTMLButtonElement>('button').element.disabled).toBe(false)
    expect(wrapper.get('button').attributes('aria-label')).toBe('Collapse sidebar')
  })

  it('supports custom toggle content and opt-in independent scrolling', async () => {
    const wrapper = track(mount(Container, { props: { collapsible: true, height: 400, scrollable: true }, slots: {
      ...slots, 'aside-toggle': ({ toggle, collapsed }) => h('button', { onClick: toggle }, collapsed ? 'Open' : 'Hide'),
    } }))
    expect(wrapper.classes()).toContain('is-scrollable')
    expect(wrapper.attributes('style')).toContain('height: 400px')
    expect(wrapper.find('.scq-container__toggle').exists()).toBe(false)
    await wrapper.get('.scq-container__tools button').trigger('click')
    expect(wrapper.vm.collapsed).toBe(true)
  })

  it('releases viewport listeners and modal resources when unmounted while open', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = track(mount(Container, { props: { asideMode: 'drawer' }, slots, attachTo: document.body }))
    const listener = add.mock.calls.find(([name]) => name === 'resize')![1]
    wrapper.vm.openAside()
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
    await flushPromises()
    expect(remove).toHaveBeenCalledWith('resize', listener)
    expect(document.querySelector('.scq-drawer-layer')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})
