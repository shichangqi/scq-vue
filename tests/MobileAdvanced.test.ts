// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import List from '../src/components/List/List.vue'
import Picker from '../src/components/Picker/Picker.vue'
import PullRefresh from '../src/components/PullRefresh/PullRefresh.vue'
import SwipeCell from '../src/components/SwipeCell/SwipeCell.vue'
import Calendar from '../src/components/Calendar/Calendar.vue'
import ActionBar from '../src/components/ActionBar/ActionBar.vue'
import { parseDate } from '../src/utils/date'

const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('List', () => {
  it('allows another load after a synchronous cached response', async () => {
    const loading = ref(false)
    const load = vi.fn(() => { loading.value = false })
    const wrapper = mount({ setup: () => () => h(List, { loading: loading.value, immediateCheck: false, 'onUpdate:loading': (value: boolean) => { loading.value = value }, onLoad: load }) })
    wrappers.push(wrapper)
    const list = wrapper.getComponent(List)
    vi.spyOn(list.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockReturnValue({ top: 100, width: 300, height: 1 } as DOMRect)
    list.vm.check()
    await nextTick()
    list.vm.check()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('loads once until the controlled loading cycle finishes', async () => {
    const wrapper = mount(List, { props: { immediateCheck: false } })
    wrappers.push(wrapper)
    vi.spyOn(wrapper.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockReturnValue({ top: 100, width: 300, height: 1 } as DOMRect)
    wrapper.vm.check()
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toHaveLength(1)
    expect(wrapper.emitted('update:loading')).toEqual([[true]])
    await wrapper.setProps({ loading: true })
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toHaveLength(1)
    await wrapper.setProps({ loading: false })
    await nextTick()
    expect(wrapper.emitted('load')).toHaveLength(2)
  })

  it('blocks loading for finished, error and disabled states', async () => {
    const wrapper = mount(List, { props: { finished: true, immediateCheck: false } })
    wrappers.push(wrapper)
    vi.spyOn(wrapper.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockReturnValue({ top: 100, width: 300, height: 1 } as DOMRect)
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toBeUndefined()
    await wrapper.setProps({ finished: false, error: true })
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toBeUndefined()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:error')).toEqual([[false]])
    await wrapper.setProps({ error: false, disabled: true })
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toBeUndefined()
  })
})

describe('Picker', () => {
  it('skips disabled options and resets invalid cascading descendants', async () => {
    const wrapper = mount(Picker, { props: { modelValue: ['a', 'a1'], columns: [
      { label: 'A', value: 'a', children: [{ label: 'A1', value: 'a1' }] },
      { label: 'Disabled', value: 'disabled', disabled: true },
      { label: 'B', value: 'b', children: [{ label: 'B1', value: 'b1' }] },
    ] } })
    wrappers.push(wrapper)
    await wrapper.findAll('[role="listbox"]')[0].trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['b', 'b1']])
    await wrapper.setProps({ modelValue: ['b', 'b1'] })
    await wrapper.get('.scq-picker__confirm').trigger('click')
    expect(wrapper.emitted('confirm')?.[0][0]).toMatchObject({ values: ['b', 'b1'] })
  })

  it('supports independent columns and prevents empty confirmation', async () => {
    const wrapper = mount(Picker, { props: { columns: [[{ label: 'One', value: 1 }], [{ label: 'Two', value: 2 }]] } })
    wrappers.push(wrapper)
    expect(wrapper.vm.getSelected().values).toEqual([1, 2])
    await wrapper.setProps({ columns: [[]] })
    wrapper.vm.confirm()
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })
})

describe('PullRefresh', () => {
  it('refreshes only after a downward pull crosses the threshold', async () => {
    const wrapper = mount(PullRefresh, { props: { pullDistance: 60 } })
    wrappers.push(wrapper)
    await wrapper.trigger('touchstart', { touches: [{ clientX: 30, clientY: 10 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 30, clientY: 80 }] })
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.trigger('touchstart', { touches: [{ clientX: 30, clientY: 10 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 30, clientY: 150 }] })
    await wrapper.trigger('touchend')
    wrapper.vm.refresh()
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toContain('translateY(0px)')
  })

  it('does not intercept horizontal, cancelled or disabled gestures', async () => {
    const wrapper = mount(PullRefresh)
    wrappers.push(wrapper)
    await wrapper.trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 200, clientY: 160 }] })
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.setProps({ disabled: true })
    wrapper.vm.refresh()
    expect(wrapper.emitted('refresh')).toBeUndefined()
  })
})

describe('SwipeCell', () => {
  it('supports keyboard opening and asynchronous close cancellation', async () => {
    const beforeClose = vi.fn().mockResolvedValue(false)
    const wrapper = mount(SwipeCell, { props: { rightWidth: 80, beforeClose }, slots: { default: 'Row', right: '<button>Delete</button>' } })
    wrappers.push(wrapper)
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('open')).toEqual([['right']])
    expect(wrapper.get('.scq-swipe-cell__actions--right').attributes('aria-hidden')).toBe('false')
    await wrapper.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.emitted('close')).toBeUndefined()
    beforeClose.mockResolvedValue(true)
    await wrapper.vm.close()
    expect(wrapper.emitted('close')?.[0][0]).toEqual({ position: 'right', reason: 'method' })
  })
})

describe('Calendar', () => {
  it('handles leap days without accepting invalid dates or out-of-bounds selection', async () => {
    expect(parseDate('2025-02-29')).toBeUndefined()
    expect(parseDate('2024-02-29')).toBeInstanceOf(Date)
    const wrapper = mount(Calendar, { props: { month: '2024-02', minDate: '2024-02-10', maxDate: '2024-02-29' } })
    wrappers.push(wrapper)
    expect(wrapper.get('[data-date="2024-02-09"]').element.disabled).toBe(true)
    await wrapper.get('[data-date="2024-02-29"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['2024-02-29']])
    expect(wrapper.findAll('.scq-calendar__header button').every((button) => button.element.disabled)).toBe(true)
  })

  it('rejects ranges through disabled days and maximum-range violations', async () => {
    const wrapper = mount(Calendar, { props: { type: 'range', month: '2026-10', modelValue: ['2026-10-10'], disabledDate: (date: Date) => date.getDate() === 12 } })
    wrappers.push(wrapper)
    await wrapper.get('[data-date="2026-10-14"]').trigger('click')
    expect(wrapper.emitted('invalid')).toEqual([['disabled']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ maxRange: 2 })
    await wrapper.get('[data-date="2026-10-14"]').trigger('click')
    expect(wrapper.emitted('invalid')?.[1]).toEqual(['max-range'])
    await wrapper.get('[data-date="2026-10-11"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['2026-10-10', '2026-10-11']])
  })

  it('moves keyboard focus across month boundaries', async () => {
    const wrapper = mount(Calendar, { attachTo: document.body, props: { modelValue: '2026-10-31' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-date="2026-10-31"]').trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(wrapper.emitted('update:month')).toEqual([['2026-11']])
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-11-01')
  })
})

describe('ActionBar', () => {
  it('emits actions while preventing disabled and pending actions', async () => {
    const wrapper = mount(ActionBar, { props: { actions: [{ key: 'save', label: 'Save', type: 'primary' }, { key: 'pending', label: 'Pending', loading: true }, { key: 'blocked', label: 'Blocked', disabled: true }] } })
    wrappers.push(wrapper)
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    await buttons[2].trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('click')?.[0][0]).toMatchObject({ key: 'save' })
  })
})