// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Tooltip from '../src/components/Tooltip/Tooltip.vue'
import Popover from '../src/components/Popover/Popover.vue'
import Drawer from '../src/components/Drawer/Drawer.vue'
import ActionSheet from '../src/components/ActionSheet/ActionSheet.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import Popconfirm from '../src/components/Popconfirm/Popconfirm.vue'
import Notification from '../src/components/Notification/Notification.vue'
import NotificationApi from '../src/components/Notification'
import Result from '../src/components/Result/Result.vue'
import { h } from 'vue'

vi.mock('@floating-ui/dom', () => ({
  computePosition: async () => ({ x: 12, y: 20, strategy: 'fixed' }),
  autoUpdate: (_reference: Element, _floating: Element, update: () => void) => { update(); return () => {} },
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}))

const wrappers: VueWrapper[] = []
afterEach(() => { NotificationApi.destroyAll(); wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.useRealTimers(); vi.restoreAllMocks() })

describe('Extended feedback', () => {
  it('keeps notification timers paused while either hover or focus remains', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Notification, { props: { modelValue: true, duration: 500, teleport: false } })
    wrappers.push(wrapper)
    await flushPromises()
    const notice = wrapper.get('.scq-notification')
    await notice.trigger('mouseenter')
    await notice.trigger('focusin')
    await notice.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.emitted('close')).toBeUndefined()
    await notice.trigger('focusout', { relatedTarget: document.body })
    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('can replace an ID while its previous notification is closing', async () => {
    const first = NotificationApi.show({ id: 'reopen', message: 'Old', duration: 0 })
    await flushPromises()
    first.close()
    const second = NotificationApi.show({ id: 'reopen', message: 'New', duration: 0 })
    expect(second).not.toBe(first)
    await flushPromises()
    expect(document.body.textContent).toContain('New')
  })

  it('pauses notification dismissal on hover and emits close once', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Notification, { props: { modelValue: true, duration: 1000, teleport: false, message: 'Saved' } })
    wrappers.push(wrapper)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(400)
    await wrapper.get('.scq-notification').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.emitted('close')).toBeUndefined()
    await wrapper.get('.scq-notification').trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.vm.close()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('stacks method notifications, deduplicates IDs and clears detached targets', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const target = document.createElement('div')
    target.id = 'notification-test-target'
    document.body.append(target)
    const onClosed = vi.fn()
    const first = NotificationApi.show({ id: 'first', message: 'First', duration: 0, teleport: '#notification-test-target', onClosed })
    NotificationApi.success({ message: 'Second', duration: 0, teleport: '#notification-test-target' })
    await flushPromises()
    const notices = target.querySelectorAll<HTMLElement>('.scq-notification')
    expect(notices.length).toBe(2)
    expect(parseFloat(notices[1].style.top)).toBeGreaterThan(parseFloat(notices[0].style.top))
    expect(NotificationApi.show({ id: 'first', message: 'Updated', teleport: '#notification-test-target' })).toBe(first)
    await flushPromises()
    expect(target.textContent).toContain('Updated')
    target.remove()
    NotificationApi.closeAll('#notification-test-target')
    expect(target.children.length).toBe(0)
    expect(onClosed).toHaveBeenCalledTimes(1)
    expect(warn).not.toHaveBeenCalled()
  })

  it('prevents duplicate confirmations and ignores completion after cancellation', async () => {
    let resolve!: () => void
    let signal!: AbortSignal
    const beforeConfirm = vi.fn((value: AbortSignal) => { signal = value; return new Promise<void>((done) => { resolve = done }) })
    const wrapper = mount(Popconfirm, { props: { title: 'Delete?', beforeConfirm, teleport: false }, slots: { default: '<button>Delete</button>' } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await wrapper.get('.scq-popconfirm__confirm').trigger('click')
    await wrapper.get('.scq-popconfirm__confirm').trigger('click')
    expect(beforeConfirm).toHaveBeenCalledTimes(1)
    await wrapper.get('.scq-popconfirm__actions button').trigger('click')
    expect(signal.aborted).toBe(true)
    resolve()
    await flushPromises()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('supports blocked confirmation and result actions', async () => {
    const wrapper = mount(Popconfirm, { props: { beforeConfirm: () => false, teleport: false }, slots: { default: '<button>Confirm</button>' } })
    const result = mount(Result, { props: { status: '404', title: 'Not found' }, slots: { extra: '<button>Back</button>' } })
    wrappers.push(wrapper, result)
    await wrapper.get('button').trigger('click')
    await wrapper.get('.scq-popconfirm__confirm').trigger('click')
    await flushPromises()
    expect(wrapper.find('.scq-popconfirm__confirm').exists()).toBe(true)
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(result.get('.scq-result__code').text()).toBe('404')
    expect(result.get('button').text()).toBe('Back')
  })
})

describe('Anchored overlays', () => {
  it('opens tooltips on focus and restores existing descriptions', async () => {
    const wrapper = mount(Tooltip, { props: { content: 'Details', teleport: false }, slots: { default: '<button aria-describedby="original">Help</button>' }, attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('focusin')
    await flushPromises()
    expect(wrapper.get('[role="tooltip"]').text()).toBe('Details')
    expect(wrapper.get('button').attributes('aria-describedby')).toContain('original scq-floating-')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    expect(wrapper.get('button').attributes('aria-describedby')).toBe('original')
  })

  it('opens popovers on click and closes outside without reacting to content clicks', async () => {
    const wrapper = mount(Popover, { props: { teleport: false, title: 'Options' }, slots: { reference: '<button>Open</button>', default: '<button class="inside">Action</button>' }, attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('.scq-floating-reference > button').trigger('click')
    await flushPromises()
    await wrapper.get('.inside').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('respects controlled visibility and disabled state', async () => {
    const wrapper = mount(Popover, { props: { modelValue: false, teleport: false }, slots: { reference: '<button>Open</button>' } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})

describe('Modal layers', () => {
  it('locks scrolling until the last open drawer closes and only closes the top layer on Escape', async () => {
    document.body.style.overflow = 'auto'
    const first = mount(Drawer, { props: { modelValue: true, teleport: false, title: 'First' }, attachTo: document.body })
    const second = mount(Drawer, { props: { modelValue: true, teleport: false, title: 'Second' }, attachTo: document.body })
    wrappers.push(first, second)
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(first.emitted('close')).toBeUndefined()
    expect(second.emitted('close')).toEqual([['esc']])
    await second.setProps({ modelValue: false })
    expect(document.body.style.overflow).toBe('hidden')
    await first.setProps({ modelValue: false })
    expect(document.body.style.overflow).toBe('auto')
  })

  it('preserves drawer content unless destruction is requested', async () => {
    const wrapper = mount(Drawer, { props: { modelValue: true, teleport: false }, slots: { default: '<input value="draft" />' }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('input').exists()).toBe(true)
    await wrapper.setProps({ destroyOnClose: true })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('supports mobile action selection, disabled actions and cancel', async () => {
    const wrapper = mount(ActionSheet, { props: { modelValue: true, teleport: false, actions: [{ name: 'Edit', value: 'edit' }, { name: 'Unavailable', disabled: true }] }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    const actions = wrapper.findAll('.scq-action-sheet__action')
    await actions[1].trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    await actions[0].trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([{ name: 'Edit', value: 'edit' }, 0])
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    await wrapper.get('.scq-action-sheet__cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('carries provider tokens into a teleported drawer', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: 'dark', tokens: { primary: '#00875a' } },
      slots: { default: () => h(Drawer, { modelValue: true, title: 'Theme' }) },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    await flushPromises()
    const layer = document.querySelector<HTMLElement>('.scq-drawer-layer')!
    expect(layer.style.getPropertyValue('--scq-primary')).toBe('#00875a')
    expect(layer.style.getPropertyValue('--scq-surface')).toBe('#1d1e1f')
  })
})