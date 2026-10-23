// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Message from '../src/components/Message/Message.vue'
import MessageApi from '../src/components/Message'
import Toast from '../src/components/Toast/Toast.vue'
import ToastApi from '../src/components/Toast'
import Notification from '../src/components/Notification/Notification.vue'
import NotificationApi from '../src/components/Notification'
import { MAX_TIMEOUT_DELAY } from '../src/utils/async'

const TIMING = { duration: 100, elapsed: 60 } as const
const wrappers: VueWrapper[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(async () => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  MessageApi.destroyAll()
  ToastApi.clear()
  NotificationApi.destroyAll()
  await flushPromises()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Message lifecycle', () => {
  it('restarts the template timer when content or duration changes and emits close only once', async () => {
    const wrapper = mount(Message, { props: { message: 'First', duration: TIMING.duration, teleport: false, closable: true } })
    wrappers.push(wrapper)
    await vi.advanceTimersByTimeAsync(TIMING.elapsed)
    await wrapper.setProps({ message: 'Second' })
    await vi.advanceTimersByTimeAsync(TIMING.elapsed)
    expect(wrapper.find('.scq-message').exists()).toBe(true)
    await wrapper.setProps({ duration: 0 })
    await vi.advanceTimersByTimeAsync(TIMING.duration)
    const button = wrapper.get<HTMLButtonElement>('button').element
    button.click()
    button.click()
    await flushPromises()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.find('.scq-message').exists()).toBe(false)
  })

  describe('Toast lifecycle', () => {
    it('rejects invalid replacement/update without destroying the current toast', async () => {
      const instance = ToastApi.show({ message: 'Retained', duration: 0 })
      await flushPromises()
      expect(() => ToastApi.show({ message: 'Invalid', duration: Infinity })).toThrow('duration')
      expect(() => instance.update({ duration: MAX_TIMEOUT_DELAY + 1 })).toThrow('duration')
      expect(document.querySelector('.scq-toast')?.textContent).toContain('Retained')
      instance.update({ message: 'Updated', duration: TIMING.duration })
      await flushPromises()
      expect(document.querySelector('.scq-toast')?.textContent).toContain('Updated')
    })

    describe('Notification lifecycle', () => {
      it('rejects invalid updates and same-ID replacements without corrupting stacking state', async () => {
        const first = NotificationApi.show({ id: 'retained', title: 'Retained', duration: 0 })
        NotificationApi.show({ title: 'Next', duration: 0 })
        await flushPromises()
        const offsets = [...document.querySelectorAll<HTMLElement>('.scq-notification')].map(el => el.style.top)
        expect(() => first.update({ offset: NaN })).toThrow('offset')
        expect(() => NotificationApi.show({ id: 'retained', duration: Infinity })).toThrow('duration')
        await flushPromises()
        expect(document.querySelectorAll('.scq-notification')).toHaveLength(2)
        expect(document.querySelector('.scq-notification')?.textContent).toContain('Retained')
        expect([...document.querySelectorAll<HTMLElement>('.scq-notification')].map(el => el.style.top)).toEqual(offsets)
      })

      it('reports missing targets without registering a notification', () => {
        expect(() => NotificationApi.show({ teleport: '#missing-feedback-target' })).toThrow('teleport target was not found')
        expect(document.querySelector('.scq-notification-host')).toBeNull()
      })

      it('keeps a retained close method inert after unmount', async () => {
        const wrapper = mount(Notification, { props: { modelValue: true, duration: 0, teleport: false } })
        await flushPromises()
        const close = wrapper.vm.close
        wrapper.unmount()
        close()
        expect(wrapper.emitted('close')).toBeUndefined()
      })

      it.each([NaN, Infinity, MAX_TIMEOUT_DELAY + 1])('rejects invalid template duration: %s', duration => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(() => mount(Notification, { props: { duration, teleport: false } })).toThrow('duration')
      })
    })

    it('reports a missing target without creating a host', () => {
      expect(() => ToastApi.show({ teleport: '#missing-feedback-target' })).toThrow('teleport target was not found')
      expect(document.querySelector('.scq-toast-host')).toBeNull()
    })

    it('does not emit close from a retained API after unmount', async () => {
      const wrapper = mount(Toast, { props: { modelValue: true, duration: 0, teleport: false } })
      await flushPromises()
      const close = wrapper.vm.close
      wrapper.unmount()
      close()
      expect(wrapper.emitted('close')).toBeUndefined()
    })

    it.each([NaN, Infinity, MAX_TIMEOUT_DELAY + 1])('rejects invalid template duration: %s', duration => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => mount(Toast, { props: { duration, teleport: false } })).toThrow('duration')
    })
  })

  it('does not schedule template timers during server rendering', async () => {
    const timeout = vi.spyOn(globalThis, 'setTimeout')
    vi.stubGlobal('window', undefined)
    const html = await renderToString(createSSRApp({ render: () => h(Message, { message: 'SSR', teleport: false }) }))
    expect(html).toContain('SSR')
    expect(timeout).not.toHaveBeenCalled()
  })

  it.each([NaN, Infinity, MAX_TIMEOUT_DELAY + 1])('rejects invalid template and imperative duration: %s', duration => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Message, { props: { duration, teleport: false } })).toThrow('duration')
    expect(() => MessageApi.open({ duration })).toThrow('duration')
  })
})
