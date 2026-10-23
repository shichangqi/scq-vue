// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Tooltip from '../src/components/Tooltip/Tooltip.vue'
import Popover from '../src/components/Popover/Popover.vue'
import Drawer from '../src/components/Drawer/Drawer.vue'
import ActionSheet from '../src/components/ActionSheet/ActionSheet.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import Popconfirm from '../src/components/Popconfirm/Popconfirm.vue'
import Notification from '../src/components/Notification/Notification.vue'
import NotificationApi from '../src/components/Notification'
import Result from '../src/components/Result/Result.vue'
import { h, nextTick, ref } from 'vue'
import { shift } from '@floating-ui/dom'

vi.mock('@floating-ui/dom', () => ({
  computePosition: async () => ({ x: 12, y: 20, strategy: 'fixed' }),
  autoUpdate: (_reference: Element, _floating: Element, update: () => void) => { update(); return () => {} },
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}))

const wrappers: VueWrapper[] = []
afterEach(() => { NotificationApi.destroyAll(); wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.useRealTimers(); vi.restoreAllMocks() })

describe('Popover reference lifecycle', () => {
  it('opens text-only references with Enter/Space and restores the wrapper from panel Escape', async () => {
    const wrapper = mount(Popover, { attachTo: document.body, props: { teleport: false }, slots: { reference: 'Open', default: '<input />' } })
    wrappers.push(wrapper)
    const reference = wrapper.get<HTMLElement>('.scq-floating-reference')
    reference.element.focus()
    await reference.trigger('keydown', { key: 'Enter', ctrlKey: true })
    expect(wrapper.find('.scq-floating-panel').exists()).toBe(false)
    await reference.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    wrapper.get<HTMLInputElement>('input').element.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.activeElement).toBe(reference.element)
    await reference.trigger('keydown', { key: ' ' })
    expect(wrapper.find('.scq-floating-panel').exists()).toBe(true)
  })

  describe('Tooltip hover and description lifecycle', () => {
    it('stays open while either focus or hover remains and closes after both leave', async () => {
      vi.useFakeTimers()
      const wrapper = mount(Tooltip, { attachTo: document.body, props: { teleport: false, showDelay: 0, hideDelay: 100 }, slots: { default: '<button>Help</button>' } })
      wrappers.push(wrapper)
      const button = wrapper.get<HTMLButtonElement>('button')
      button.element.focus()
      await flushPromises()
      await wrapper.trigger('mouseenter')
      await wrapper.trigger('mouseleave')
      await vi.advanceTimersByTimeAsync(100)
      expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
      await wrapper.trigger('mouseenter')
      button.element.blur()
      await nextTick()
      expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
      await wrapper.trigger('mouseleave')
      await vi.advanceTimersByTimeAsync(100)
      expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    })

    it('moves owned description IDs to replacement triggers and preserves external edits', async () => {
      const key = ref(0)
      const wrapper = mount(Tooltip, { attachTo: document.body, props: { modelValue: true, teleport: false }, slots: {
        default: () => h('button', { key: key.value, 'aria-describedby': 'original' }, 'Help'),
      } })
      wrappers.push(wrapper)
      await flushPromises()
      const original = wrapper.get('button').element
      const id = wrapper.get('[role="tooltip"]').attributes('id')
      key.value++
      await nextTick()
      expect(original.getAttribute('aria-describedby')).toBe('original')
      const current = wrapper.get('button').element
      expect(current.getAttribute('aria-describedby')).toBe(`original ${id}`)
      current.setAttribute('aria-describedby', `original ${id} added`)
      await wrapper.setProps({ modelValue: false })
      expect(current.getAttribute('aria-describedby')).toBe('original added')
    })
  })

  it('updates fallback tab stops when reference content changes without counting panel controls', async () => {
    const button = ref(true)
    const wrapper = mount(Popover, { props: { teleport: false }, slots: { reference: () => button.value ? h('button', 'Open') : 'Open', default: '<button>Inside</button>' } })
    wrappers.push(wrapper)
    await nextTick()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    button.value = false
    await nextTick()
    await nextTick()
    expect(wrapper.attributes('tabindex')).toBe('0')
    await wrapper.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.attributes('tabindex')).toBe('0')
  })

  it('cancels delayed opens on trigger changes and does not reopen uncontrolled content after disabling', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Popover, { props: { trigger: 'hover', teleport: false, showDelay: 100 }, slots: { reference: 'Open' } })
    wrappers.push(wrapper)
    await wrapper.trigger('mouseenter')
    await wrapper.setProps({ trigger: 'click' })
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.find('.scq-floating-panel').exists()).toBe(false)
    await wrapper.trigger('click')
    expect(wrapper.find('.scq-floating-panel').exists()).toBe(true)
    await wrapper.setProps({ disabled: true })
    await wrapper.setProps({ disabled: false })
    expect(wrapper.find('.scq-floating-panel').exists()).toBe(false)
  })
})

describe('Result', () => {
  it.each([
    ['success', 'Success'], ['warning', 'Review required'], ['error', 'Operation failed'], ['info', 'Pending'],
    ['403', 'Access denied'], ['404', 'Not found'], ['500', 'Service unavailable'],
  ] as const)('renders the localized %s preset and preserves action content', (status, title) => {
    const wrapper = mount(ConfigProvider, { props: { locale: 'en-US' }, slots: {
      default: () => h(Result, { status, preset: true }, { extra: () => h('button', { type: 'button' }, 'Continue') }),
    } })
    wrappers.push(wrapper)
    expect(wrapper.get('h2').text()).toBe(title)
    expect(wrapper.get('.scq-result__subtitle').text()).not.toBe('')
    expect(wrapper.get('.scq-result__extra button').text()).toBe('Continue')
    if (['403', '404', '500'].includes(status)) expect(wrapper.get('.scq-result__code').text()).toBe(status)
    else expect(wrapper.find('.scq-result__code').exists()).toBe(false)
  })

  it.each(['constructor', 'unknown'])('reports unsupported result states instead of malformed preset text: %s', status => {
    expect(() => mount(Result, { attrs: { status }, props: { preset: true } })).toThrow('Unknown Result status')
    expect(() => mount(Result, { attrs: { status } })).toThrow('Unknown Result status')
  })
})

describe('Extended feedback', () => {
  it('restores ActionSheet focus after a veto and after deleting a focused action', async () => {
    let finish!: (value: boolean) => void
    const actions = [{ name: 'Save', value: 'save' }] as const
    const wrapper = mount(ActionSheet, { attachTo: document.body, props: {
      actions, modelValue: true, teleport: false, beforeSelect: () => new Promise<boolean>(resolve => { finish = resolve }),
    } })
    wrappers.push(wrapper)
    await flushPromises()
    const action = wrapper.get<HTMLButtonElement>('.scq-action-sheet__action')
    action.element.focus()
    await action.trigger('click')
    document.body.setAttribute('tabindex', '-1')
    document.body.focus()
    finish(false)
    await flushPromises()
    expect(document.activeElement).toBe(action.element)
    await wrapper.setProps({ actions: [] })
    expect(wrapper.get('.scq-drawer').element.contains(document.activeElement)).toBe(true)
    expect(wrapper.emitted('select')).toBeUndefined()
    document.body.removeAttribute('tabindex')
  })

  it.each([Infinity, NaN])('reports non-finite ActionSheet columns: %s', columns => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(ActionSheet, { props: { columns } })).toThrow('columns must be finite')
  })

  it('cancels replaced Popconfirm guards and restores focus after a veto', async () => {
    let finish!: (value: boolean) => void
    let signal!: AbortSignal
    const beforeConfirm = (current: AbortSignal) => { signal = current; return new Promise<boolean>(resolve => { finish = resolve }) }
    const wrapper = mount(Popconfirm, { attachTo: document.body, props: { modelValue: true, teleport: false, beforeConfirm }, slots: { default: '<button>Open</button>' } })
    wrappers.push(wrapper)
    await flushPromises()
    const confirm = wrapper.get<HTMLButtonElement>('.scq-popconfirm__confirm')
    confirm.element.focus()
    await confirm.trigger('click')
    await wrapper.setProps({ beforeConfirm: () => false })
    expect(signal.aborted).toBe(true)
    finish(true)
    await flushPromises()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    await confirm.trigger('click')
    document.body.setAttribute('tabindex', '-1')
    document.body.focus()
    await flushPromises()
    expect(document.activeElement).toBe(confirm.element)
    expect(confirm.element.disabled).toBe(false)
    document.body.removeAttribute('tabindex')
  })

  it('logs an unhandled Popconfirm error while preserving the retry UI', async () => {
    const error = new Error('Failed confirmation')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(Popconfirm, { props: { modelValue: true, teleport: false, beforeConfirm: () => { throw error } } })
    wrappers.push(wrapper)
    await flushPromises()
    await wrapper.get('.scq-popconfirm__confirm').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('error')).toEqual([[error]])
    expect(log).toHaveBeenCalledWith('[scq-vue] Async guard failed', error)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('guards action-sheet selections, keeps failures retryable and cancels external closes', async () => {
    let done!: (value: boolean) => void
    let signal!: AbortSignal
    const actions = [{ name: 'Save', value: 'save', group: 'Files' }]
    const beforeSelect = vi.fn((_action, _index, value: AbortSignal) => { signal = value; return new Promise<boolean>(resolve => { done = resolve }) })
    const wrapper = mount(ActionSheet, { props: { modelValue: true, teleport: false, actions, beforeSelect, columns: 2 }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.get('.scq-action-sheet__group').text()).toBe('Files')
    await wrapper.get('.scq-action-sheet__action').trigger('click')
    await wrapper.get('.scq-action-sheet__action').trigger('click')
    expect(beforeSelect).toHaveBeenCalledTimes(1)
    done(false)
    await flushPromises()
    expect(wrapper.emitted('select')).toBeUndefined()
    await wrapper.get('.scq-action-sheet__action').trigger('click')
    await wrapper.setProps({ modelValue: false })
    expect(signal.aborted).toBe(true)
    done(true)
    await flushPromises()
    expect(wrapper.emitted('select')).toBeUndefined()
    await wrapper.setProps({ modelValue: true, beforeSelect: () => { throw new Error('Private') }, onError: () => {} })
    await flushPromises()
    await wrapper.get('.scq-action-sheet__action').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Private')
    await wrapper.setProps({ beforeSelect: () => true })
    await wrapper.get('.scq-action-sheet__action').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('select')).toEqual([[actions[0], 0]])
  })
  it('only enables result presets explicitly and preserves explicit empty text across locales', async () => {
    const wrapper = mount(Result)
    wrappers.push(wrapper)
    expect(wrapper.find('h2').exists()).toBe(false)
    await wrapper.setProps({ preset: true, status: '404', size: 'small' })
    expect(wrapper.find('h2').exists()).toBe(true)
    expect(wrapper.classes()).toContain('scq-result--small')
    await wrapper.setProps({ title: '', subtitle: 'Custom' })
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.get('p').text()).toBe('Custom')
    const provider = mount(ConfigProvider, { props: { locale: 'en-US' }, slots: { default: () => h(Result, { status: '403', preset: true }) } })
    wrappers.push(provider)
    expect(provider.get('h2').text()).toBe('Access denied')
    await provider.setProps({ locale: 'zh-CN' })
    expect(provider.get('h2').text()).not.toBe('Access denied')
  })
  it.each([true, false])('applies pending cancellation policy to passive exits (allow=%s)', async (allowCancelWhilePending) => {
    let done!: () => void
    let signal!: AbortSignal
    const wrapper = mount(Popconfirm, { attachTo: document.body, props: { modelValue: true, teleport: false, allowCancelWhilePending, beforeConfirm: (value) => { signal = value; return new Promise<void>(resolve => { done = resolve }) } }, slots: { default: '<button>Open</button>' } })
    wrappers.push(wrapper)
    await flushPromises()
    await wrapper.get('.scq-popconfirm__confirm').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(signal.aborted).toBe(allowCancelWhilePending)
    if (!allowCancelWhilePending) expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ modelValue: false })
    expect(signal.aborted).toBe(true)
    done()
    await flushPromises()
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('keeps confirmation failures visible without exposing raw errors and supports retry', async () => {
    const error = new Error('Private response')
    const wrapper = mount(Popconfirm, { props: { teleport: false, danger: true, errorText: 'Try again', beforeConfirm: () => { throw error } }, slots: { default: '<button>Open</button>' } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await wrapper.get('.scq-popconfirm__confirm').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Try again')
    expect(wrapper.text()).not.toContain('Private response')
    expect(wrapper.emitted('error')).toEqual([[error]])
    await wrapper.setProps({ beforeConfirm: () => true })
    await wrapper.get('.scq-popconfirm__confirm').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })
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

  it('keeps pending popconfirm indicators compact and inherits the button color', async () => {
    const style = document.createElement('style')
    style.textContent = ['loading', 'popconfirm']
      .map((name) => readFileSync(resolve(__dirname, `../styles/${name}.css`), 'utf8'))
      .join('\n')
    document.head.append(style)
    try {
      const wrapper = mount(Popconfirm, {
        props: { beforeConfirm: () => new Promise<void>(() => {}), teleport: false },
        slots: { default: '<button>Delete</button>' },
        attachTo: document.body,
      })
      wrappers.push(wrapper)
      await wrapper.get('button').trigger('click')
      const confirm = wrapper.get('.scq-popconfirm__confirm')
      await confirm.trigger('click')
      expect(confirm.attributes('aria-busy')).toBe('true')
      const loading = confirm.get('.scq-loading')
      const indicator = loading.get('.scq-loading__indicator')
      expect(parseFloat(getComputedStyle(indicator.element).minHeight)).toBe(0)
      expect(getComputedStyle(loading.element).color).toBe('inherit')
      await wrapper.get('.scq-popconfirm__actions button').trigger('click')
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    } finally {
      style.remove()
    }
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
  it('only shifts across the placement axis when explicitly enabled', async () => {
    const wrapper = mount(Popover, { props: { teleport: false }, slots: { reference: '<button>Open</button>', default: 'Content' } })
    wrappers.push(wrapper)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(vi.mocked(shift)).toHaveBeenLastCalledWith(expect.objectContaining({ crossAxis: false }))
    await wrapper.setProps({ shiftCrossAxis: true })
    await flushPromises()
    expect(vi.mocked(shift)).toHaveBeenLastCalledWith(expect.objectContaining({ crossAxis: true }))
  })

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