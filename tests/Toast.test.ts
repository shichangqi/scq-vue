// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Toast from '../src/components/Toast/Toast.vue'
import ToastApi from '../src/components/Toast'
import ToastLoadingExample from '../playground/src/components/examples/ToastLoadingExample.vue'

const wrappers: VueWrapper[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.unstubAllGlobals()
  ToastApi.clear()
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.querySelectorAll('[data-toast-target]').forEach((element) => element.remove())
  vi.clearAllTimers()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Toast', () => {
  it('starts closed and automatically closes after the default duration', async () => {
    const wrapper = mount(Toast, { props: { message: 'Saved', teleport: false } })
    wrappers.push(wrapper)
    expect(wrapper.find('.scq-toast').exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('[role="status"]').text()).toBe('Saved')
    await vi.advanceTimersByTimeAsync(1999)
    expect(wrapper.find('.scq-toast').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.find('.scq-toast').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('keeps loading visible until closed and cleans its timer on unmount', async () => {
    const wrapper = mount(Toast, { props: { modelValue: true, type: 'loading', teleport: false } })
    wrappers.push(wrapper)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.get('.scq-toast').attributes('aria-busy')).toBe('true')
    await wrapper.setProps({ type: 'success', message: 'Finished', duration: 1000 })
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('restarts the timer when the content changes and closes only once', async () => {
    const wrapper = mount(Toast, { props: { modelValue: true, message: 'First', duration: 1000, closeOnClick: true, teleport: false } })
    wrappers.push(wrapper)
    await vi.advanceTimersByTimeAsync(700)
    await wrapper.setProps({ message: 'Second' })
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.get('.scq-toast').text()).toBe('Second')
    await wrapper.get('.scq-toast').trigger('click')
    wrapper.vm.close()
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('respects a zero duration, overlay dismissal and touch blocking', async () => {
    const wrapper = mount(Toast, { props: { modelValue: true, duration: 0, overlay: true, forbidClick: true, closeOnClickOverlay: true, teleport: false } })
    wrappers.push(wrapper)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.get('.scq-toast-layer').classes()).toContain('is-blocking')
    await wrapper.get('.scq-toast-layer').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('updates an imperative loading toast and cleans up after completion', async () => {
    const onClose = vi.fn()
    const onClosed = vi.fn()
    const instance = ToastApi.loading({ message: 'Uploading', onClose, onClosed })
    await flushPromises()
    expect(document.querySelector('.scq-toast--loading')?.textContent).toBe('Uploading')
    await vi.advanceTimersByTimeAsync(5000)
    instance.update({ type: 'success', message: 'Uploaded', duration: 500 })
    await flushPromises()
    expect(document.querySelector('.scq-toast--success')?.textContent).toBe('Uploaded')
    await vi.advanceTimersByTimeAsync(800)
    expect(document.querySelector('.scq-toast-host')).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClosed).toHaveBeenCalledTimes(1)
    instance.close()
    instance.update({ message: 'Obsolete' })
    expect(document.querySelector('.scq-toast')).toBeNull()
  })

  it('replaces a toast only in the same container and clears targets independently', async () => {
    for (const name of ['first', 'second']) {
      const target = document.createElement('div')
      target.id = `toast-${name}`
      target.dataset.toastTarget = name
      document.body.appendChild(target)
    }
    const onClose = vi.fn()
    ToastApi.show({ message: 'Old', teleport: '#toast-first', duration: 0, onClose })
    ToastApi.success({ message: 'Second', teleport: '#toast-second', duration: 0 })
    ToastApi.fail({ message: 'New', teleport: '#toast-first', duration: 0 })
    await flushPromises()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(document.querySelectorAll('.scq-toast')).toHaveLength(2)
    expect(document.querySelector('#toast-first [role="alert"]')?.textContent).toBe('New')
    ToastApi.clear('#toast-first')
    expect(document.querySelector('#toast-first .scq-toast')).toBeNull()
    expect(document.querySelector('#toast-second .scq-toast')).not.toBeNull()
  })

  it('is safe to invoke without a browser document', () => {
    vi.stubGlobal('document', undefined)
    const instance = ToastApi.show('Server')
    expect(() => { instance.update({ message: 'Ignored' }); instance.close(); ToastApi.clear() }).not.toThrow()
  })

  it('disposes a target-specific instance after its target leaves the document', async () => {
    const target = document.createElement('div')
    target.id = 'toast-detached-target'
    document.body.appendChild(target)
    const onClosed = vi.fn()
    ToastApi.show({ message: 'Temporary', teleport: '#toast-detached-target', duration: 1000, onClosed })
    await flushPromises()
    target.remove()
    ToastApi.clear('#toast-detached-target')
    expect(target.querySelector('.scq-toast-host')).toBeNull()
    expect(onClosed).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2000)
    expect(onClosed).toHaveBeenCalledTimes(1)
  })

  it('runs the documented loading workflow inside its phone and cleans up on unmount', async () => {
    const scheduleTimeout = vi.spyOn(globalThis, 'setTimeout')
    const cancelTimeout = vi.spyOn(globalThis, 'clearTimeout')
    const scheduleInterval = vi.spyOn(globalThis, 'setInterval')
    const cancelInterval = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mount(ToastLoadingExample, { attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('.toast-loading-example__actions button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.phone-preview__screen .scq-toast--loading').text()).toContain('0%')
    expect(wrapper.get('.scq-toast-layer').classes()).toContain('is-blocking')
    await vi.advanceTimersByTimeAsync(1750)
    expect(wrapper.get('.scq-toast--success').text()).toBe('\u5907\u4efd\u5b8c\u6210')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    const completionTimerIndex = scheduleTimeout.mock.calls.findIndex((call) => call[1] === 1800)
    expect(completionTimerIndex).toBeGreaterThanOrEqual(0)
    wrapper.unmount()
    expect(document.querySelector('.scq-toast-host')).toBeNull()
    expect(cancelTimeout).toHaveBeenCalledWith(scheduleTimeout.mock.results[completionTimerIndex].value)
    expect(cancelInterval).toHaveBeenCalledWith(scheduleInterval.mock.results[0].value)
  })

  it('cancels an unfinished backup when its phone example unmounts', async () => {
    const scheduleInterval = vi.spyOn(globalThis, 'setInterval')
    const cancelInterval = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mount(ToastLoadingExample, { attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('.toast-loading-example__actions button').trigger('click')
    await flushPromises()
    wrapper.unmount()
    expect(cancelInterval).toHaveBeenCalledWith(scheduleInterval.mock.results[0].value)
    expect(document.querySelector('.scq-toast-host')).toBeNull()
  })
})