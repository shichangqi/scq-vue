// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Dialog from '../src/components/Dialog'
import Modal from '../src/components/Modal'
import Popup from '../src/components/Popup'
import Drawer from '../src/components/Drawer'
import Popover from '../src/components/Popover'

vi.mock('@floating-ui/dom', () => ({
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  autoUpdate: (_reference: Element, _panel: Element, update: () => void) => { update(); return () => {} },
  offset: vi.fn(), flip: vi.fn(), shift: vi.fn(),
}))

const wrappers: VueWrapper[] = []
const elements: HTMLElement[] = []
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
afterEach(async () => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  Dialog.destroyAll()
  Modal.destroyAll()
  await flushPromises()
  if (vi.isFakeTimers()) await vi.runOnlyPendingTimersAsync()
  elements.splice(0).forEach((element) => element.remove())
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Shared overlay lifecycle', () => {
  it.each([Dialog, Modal, Drawer, Popup])('preserves composition and modified Escape, case %#', async component => {
    const wrapper = mount(component, { props: { modelValue: true, teleport: false }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    for (const options of [{ isComposing: true }, { keyCode: 229 }, { ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, ...options })
      document.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
    expect(wrapper.emitted('close')).toBeUndefined()
    escape()
    await flushPromises()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it.each([Dialog, Modal])('restores action focus after a rejected close guard, case %#', async component => {
    const gate = deferred<boolean>()
    const wrapper = mount(component, { props: { modelValue: true, teleport: false, beforeClose: () => gate.promise }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    const confirm = wrapper.get<HTMLButtonElement>('footer button')
    confirm.element.focus()
    await confirm.trigger('click')
    document.body.setAttribute('tabindex', '-1')
    document.body.focus()
    gate.resolve(false)
    await flushPromises()
    expect(document.activeElement).toBe(confirm.element)
    expect(wrapper.emitted('close')).toBeUndefined()
    document.body.removeAttribute('tabindex')
  })

  it('normalizes Dialog width and explicitly rejects non-finite values', async () => {
    const wrapper = mount(Dialog, { props: { modelValue: true, teleport: false, width: -1 } })
    wrappers.push(wrapper)
    expect(wrapper.get<HTMLElement>('.scq-dialog').element.style.width).toBe('0px')
    await wrapper.setProps({ width: '70vw' })
    expect(wrapper.get<HTMLElement>('.scq-dialog').element.style.width).toBe('70vw')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Dialog, { props: { modelValue: true, teleport: false, width: Infinity } })).toThrow('finite')
  })

  it('normalizes Modal width without changing CSS length support', async () => {
    const wrapper = mount(Modal, { props: { modelValue: true, teleport: false, width: -1 } })
    wrappers.push(wrapper)
    const panel = wrapper.get<HTMLElement>('.scq-modal')
    expect(panel.element.style.getPropertyValue('--scq-modal-width')).toBe('0px')
    await wrapper.setProps({ width: '70vw' })
    expect(panel.element.style.getPropertyValue('--scq-modal-width')).toBe('70vw')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Modal, { props: { modelValue: true, teleport: false, width: Infinity } })).toThrow('finite')
  })

  it.each([Drawer, Popup])('restores panel focus when active slot content is removed, case %#', async component => {
    const present = ref(true)
    const wrapper = mount(component, { attachTo: document.body, props: { modelValue: true, teleport: false }, slots: {
      default: () => present.value ? h('button', 'Temporary action') : h('p', 'Empty'),
    } })
    wrappers.push(wrapper)
    await flushPromises()
    wrapper.get<HTMLButtonElement>('.scq-drawer__body button, .scq-popup__content button').element.focus()
    present.value = false
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('[role="dialog"]').element)
  })

  it('normalizes Drawer size and preserves auto sizing', async () => {
    const wrapper = mount(Drawer, { props: { modelValue: true, teleport: false, size: -1 } })
    wrappers.push(wrapper)
    const panel = wrapper.get<HTMLElement>('.scq-drawer')
    expect(panel.element.style.getPropertyValue('--scq-drawer-size')).toBe('0px')
    await wrapper.setProps({ size: 'auto' })
    expect(panel.element.style.getPropertyValue('--scq-drawer-size')).toBe('auto')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Drawer, { props: { modelValue: true, teleport: false, size: Infinity } })).toThrow('finite')
  })

  it('normalizes Popup size and radius without disabling CSS sizing', async () => {
    const wrapper = mount(Popup, { props: { modelValue: true, teleport: false, size: -1, roundRadius: -1 } })
    wrappers.push(wrapper)
    const panel = wrapper.get<HTMLElement>('.scq-popup')
    expect(panel.element.style.getPropertyValue('--scq-popup-size')).toBe('0px')
    expect(panel.element.style.borderRadius).toBe('0px')
    await wrapper.setProps({ size: '75vw', roundRadius: '1rem' })
    expect(panel.element.style.getPropertyValue('--scq-popup-size')).toBe('75vw')
    expect(panel.element.style.borderRadius).toBe('1rem')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const props of [{ size: Infinity }, { roundRadius: NaN }]) {
      expect(() => mount(Popup, { props: { modelValue: true, teleport: false, ...props } })).toThrow('finite')
    }
  })

  it('closes only the top of three mixed layers and retains the body lock', async () => {
    document.body.style.overflow = 'auto'
    document.body.style.paddingRight = '7px'
    const first = mount(Dialog, { props: { modelValue: true, teleport: false }, attachTo: document.body })
    wrappers.push(first)
    await flushPromises()
    const second = mount(Modal, { props: { modelValue: true, teleport: false }, attachTo: document.body })
    wrappers.push(second)
    await flushPromises()
    const third = mount(Popup, { props: { modelValue: true, teleport: false }, attachTo: document.body })
    wrappers.push(third)
    await flushPromises()
    const indexes = [
      first.get<HTMLElement>('.scq-dialog__overlay').element.style.zIndex,
      second.get<HTMLElement>('.scq-modal__overlay').element.style.zIndex,
      third.get<HTMLElement>('.scq-popup__overlay').element.style.zIndex,
    ].map(Number)
    expect(indexes[1]).toBeGreaterThan(indexes[0])
    expect(indexes[2]).toBeGreaterThan(indexes[1])
    expect(document.body.style.overflow).toBe('hidden')
    escape()
    await flushPromises()
    expect(third.emitted('close')).toEqual([['esc']])
    expect(second.emitted('close')).toBeUndefined()
    expect(first.emitted('close')).toBeUndefined()
    expect(document.body.style.overflow).toBe('hidden')
    escape()
    await flushPromises()
    expect(second.emitted('close')).toEqual([['esc']])
    expect(document.body.style.overflow).toBe('hidden')
    escape()
    await flushPromises()
    expect(first.emitted('close')).toEqual([['esc']])
    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.paddingRight).toBe('7px')
  })

  it('does not dismiss a lower layer when the top forbids Escape', async () => {
    const first = mount(Drawer, { props: { modelValue: true, teleport: false }, attachTo: document.body })
    const top = mount(Dialog, { props: { modelValue: true, closeOnPressEscape: false, teleport: false }, attachTo: document.body })
    wrappers.push(first, top)
    await flushPromises()
    escape()
    await flushPromises()
    expect(first.emitted('close')).toBeUndefined()
    expect(top.emitted('close')).toBeUndefined()
  })

  it('restores focus after out-of-order teardown without releasing another lock', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    elements.push(trigger)
    trigger.focus()
    const first = mount(Dialog, { props: { modelValue: true, teleport: false }, attachTo: document.body })
    wrappers.push(first)
    await flushPromises()
    const second = mount(Popup, { props: { modelValue: true, teleport: false }, attachTo: document.body })
    wrappers.push(second)
    await flushPromises()
    first.unmount()
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(second.get('.scq-popup').element)
    second.unmount()
    await flushPromises()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
  })

  it.each([Dialog, Modal, Popup])('retains content only when explicitly requested', async (component) => {
    const wrapper = mount(component, {
      props: { modelValue: true, teleport: false, destroyOnClose: false },
      slots: { default: '<input value="draft" />' }, attachTo: document.body,
    })
    wrappers.push(wrapper)
    const input = wrapper.get('input').element
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('input').element).toBe(input)
    await wrapper.setProps({ modelValue: false, destroyOnClose: true })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('supports explicit initial focus and changing the scroll lock', async () => {
    const rect = new DOMRect(0, 0, 100, 20)
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }))
    const wrapper = mount(Dialog, {
      props: { modelValue: true, teleport: false, initialFocus: '#layer-input', lockScroll: false },
      slots: { default: '<input id="layer-input" />' }, attachTo: document.body,
    })
    wrappers.push(wrapper)
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('input').element)
    expect(document.body.style.overflow).toBe('')
    await wrapper.setProps({ lockScroll: true })
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.setProps({ lockScroll: false })
    expect(document.body.style.overflow).toBe('')
  })

  it('allows teleported interactive content inside a modal and gives it first Escape', async () => {
    const opened = ref(true)
    const wrapper = mount(Dialog, {
      props: { modelValue: true, teleport: false },
      slots: { default: () => h(Popover, { modelValue: opened.value, 'onUpdate:modelValue': (value: boolean) => { opened.value = value }, initialFocus: '#popover-input' }, {
        reference: () => h('button', 'Options'),
        default: () => h('input', { id: 'popover-input' }),
      }) },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    await flushPromises()
    expect(document.activeElement?.id).toBe('popover-input')
    escape()
    await flushPromises()
    expect(opened.value).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(document.body.style.overflow).toBe('hidden')
    escape()
    await flushPromises()
    expect(wrapper.emitted('close')).toEqual([['esc']])
  })

  it('does not close a parent popover while interacting with its teleported child', async () => {
    const outer = ref(true)
    const wrapper = mount(Popover, {
      props: { modelValue: outer.value, 'onUpdate:modelValue': (value: boolean) => { outer.value = value } },
      slots: {
        reference: () => h('button', 'Parent'),
        default: () => h(Popover, { modelValue: true }, { reference: () => h('button', 'Child'), default: () => h('button', { id: 'child-action' }, 'Action') }),
      }, attachTo: document.body,
    })
    wrappers.push(wrapper)
    await flushPromises()
    document.querySelector('#child-action')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(outer.value).toBe(true)
  })
})

describe('Close guards', () => {
  it.each([Dialog, Modal, Popup])('isolates pending, rejected and stale close requests', async (component) => {
    const first = deferred<boolean>()
    const guard = vi.fn((_reason: string, _signal: AbortSignal) => first.promise)
    const wrapper = mount(component, { props: { modelValue: true, teleport: false, beforeClose: guard }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    for (let index = 0; index < 10; index += 1) escape()
    await flushPromises()
    expect(guard).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[role="dialog"]').attributes('aria-busy')).toBe('true')
    first.resolve(false)
    await flushPromises()
    expect(wrapper.emitted('close')).toBeUndefined()
    const second = deferred<boolean>()
    guard.mockImplementation(() => second.promise)
    escape()
    await flushPromises()
    const signal = guard.mock.calls.at(-1)?.[1]
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(signal?.aborted).toBe(true)
    second.resolve(true)
    await flushPromises()
    expect(wrapper.get('[role="dialog"]').isVisible()).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('reports a failed method confirmation, permits retry, and aborts on disposal', async () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    const attempt = deferred<boolean>()
    const confirm = vi.fn((_signal: AbortSignal) => attempt.promise)
    const instance = Dialog.confirm({ message: 'Confirm', showFooter: true, showConfirmButton: true, onConfirm: confirm, onError })
    await vi.runOnlyPendingTimersAsync()
    await flushPromises()
    const button = document.querySelector<HTMLButtonElement>('.scq-dialog__footer .my-btn--primary')!
    for (let index = 0; index < 10; index += 1) button.click()
    await flushPromises()
    expect(confirm).toHaveBeenCalledTimes(1)
    attempt.reject(new Error('Unavailable'))
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'confirm')
    expect(document.querySelector('.scq-dialog')).not.toBeNull()
    const pending = deferred<boolean>()
    confirm.mockImplementation(() => pending.promise)
    button.click()
    await flushPromises()
    const signal = confirm.mock.calls.at(-1)![0]
    Dialog.destroyAll()
    await nextTick()
    await vi.runOnlyPendingTimersAsync()
    expect(signal.aborted).toBe(true)
    pending.resolve(true)
    await flushPromises()
    instance.update({ title: 'Must stay closed' })
    expect(document.querySelector('.scq-dialog')).toBeNull()
  })
})
