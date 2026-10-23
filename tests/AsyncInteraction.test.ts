// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Switch from '../src/components/Switch/Switch.vue'
import Drawer from '../src/components/Drawer/Drawer.vue'
import Steps from '../src/components/Steps/Steps.vue'

const wrappers: VueWrapper[] = []
const deferred = () => {
  let resolve!: (value: boolean) => void
  let reject!: (error: Error) => void
  const promise = new Promise<boolean>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
afterEach(async () => { wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount()); await flushPromises(); vi.restoreAllMocks() })

describe('Single-flight async interactions', () => {
  it('cancels a pending switch when its guard is replaced or removed', async () => {
    const request = deferred()
    const guard = vi.fn((_value: boolean, _signal: AbortSignal) => request.promise)
    const wrapper = mount(Switch, { props: { beforeChange: guard } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('change')
    await flushPromises()
    await wrapper.setProps({ beforeChange: () => false })
    expect(guard.mock.calls[0][1].aborted).toBe(true)
    expect(wrapper.vm.pending).toBe(false)
    request.resolve(true)
    await flushPromises()
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.get('input').trigger('change')
    await flushPromises()
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ beforeChange: undefined })
    await wrapper.get('input').trigger('change')
    expect(wrapper.emitted('change')).toEqual([[true]])
  })

  it.each([true, false])('restores keyboard focus after guard settlement without stealing moved focus (move=%s)', async (move) => {
    const request = deferred()
    const wrapper = mount(Switch, { attachTo: document.body, props: { beforeChange: () => request.promise } })
    wrappers.push(wrapper)
    const input = wrapper.get<HTMLInputElement>('input')
    const outside = document.createElement('button')
    document.body.append(outside)
    try {
      input.element.focus()
      await input.trigger('change')
      await flushPromises()
      input.element.blur()
      if (move) outside.focus()
      request.resolve(false)
      await flushPromises()
      expect(document.activeElement).toBe(move ? outside : input.element)
      expect(wrapper.emitted('change')).toBeUndefined()
    } finally {
      outside.remove()
    }
  })
  it('keeps a switch unchanged while waiting, rejects cleanly and permits retry', async () => {
    const first = deferred()
    const guard = vi.fn((_value: boolean, _signal: AbortSignal) => first.promise)
    const wrapper = mount(Switch, { props: { modelValue: false, beforeChange: guard } })
    wrappers.push(wrapper)
    for (let index = 0; index < 10; index += 1) await wrapper.get('input').trigger('change')
    await flushPromises()
    expect(guard).toHaveBeenCalledTimes(1)
    expect(wrapper.get('input').element.checked).toBe(false)
    expect(wrapper.get('input').attributes('aria-busy')).toBe('true')
    first.resolve(false)
    await flushPromises()
    expect(wrapper.emitted('change')).toBeUndefined()
    guard.mockImplementation(() => Promise.resolve(true))
    await wrapper.get('input').trigger('change')
    await flushPromises()
    expect(wrapper.emitted('change')).toEqual([[true]])
  })

  it('isolates newer switch values, reports current errors, and aborts on unmount', async () => {
    const request = deferred()
    const onError = vi.fn()
    const guard = vi.fn((_value: boolean, _signal: AbortSignal) => request.promise)
    const wrapper = mount(Switch, { props: { modelValue: false, beforeChange: guard, onError } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('change')
    await flushPromises()
    await wrapper.setProps({ modelValue: true })
    expect(guard.mock.calls[0][1].aborted).toBe(true)
    request.resolve(true)
    await flushPromises()
    expect(wrapper.emitted('change')).toBeUndefined()
    const failure = new Error('Denied')
    guard.mockImplementation(() => Promise.reject(failure))
    await wrapper.get('input').trigger('change')
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(failure, false)
    expect(wrapper.emitted('change')).toBeUndefined()
    const last = deferred()
    guard.mockImplementation(() => last.promise)
    await wrapper.get('input').trigger('change')
    await flushPromises()
    const signal = guard.mock.calls.at(-1)![1]
    wrapper.unmount()
    expect(signal.aborted).toBe(true)
    last.resolve(true)
    await flushPromises()
  })

  it.each(['overlay', 'close-icon', 'esc', 'api'] as const)('guards the drawer %s entrance', async (reason) => {
    const guard = vi.fn(() => false)
    const wrapper = mount(Drawer, { props: { modelValue: true, teleport: false, beforeClose: guard }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    if (reason === 'api') await wrapper.vm.close()
    else if (reason === 'esc') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    else await wrapper.get(reason === 'overlay' ? '.scq-drawer-layer' : '.scq-drawer__close').trigger('click')
    await flushPromises()
    expect(guard).toHaveBeenCalledWith(reason, expect.any(AbortSignal))
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does not overwrite a newer controlled step or changed step list', async () => {
    const request = deferred()
    const beforeChange = vi.fn((_index: number, _signal: AbortSignal) => request.promise)
    const wrapper = mount(Steps, { props: { active: 0, clickable: true, items: [{ title: 'A' }, { title: 'B' }, { title: 'C' }], beforeChange } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[1].trigger('click')
    await wrapper.findAll('button')[2].trigger('click')
    await flushPromises()
    expect(beforeChange).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ active: 2 })
    expect(beforeChange.mock.calls[0][1].aborted).toBe(true)
    request.resolve(true)
    await flushPromises()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.findAll('li')[2].attributes('aria-current')).toBe('step')
  })

  it('retains synchronous defaults when no guard is provided', async () => {
    const wrapper = mount(Switch)
    wrappers.push(wrapper)
    await wrapper.get('input').setValue(true)
    expect(wrapper.emitted('change')).toEqual([[true]])
    expect(wrapper.vm.pending).toBe(false)
  })
})
