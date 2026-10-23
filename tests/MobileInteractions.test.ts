// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, reactive, ref } from 'vue'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import Picker from '../src/components/Picker/Picker.vue'
import PullRefresh from '../src/components/PullRefresh/PullRefresh.vue'
import SwipeCell from '../src/components/SwipeCell/SwipeCell.vue'
import { PICKER_DEFAULTS, PICKER_SCROLL_IDLE_MS } from '../src/components/Picker/constants'
import { MAX_RESULT_DURATION, PULL_REFRESH_DEFAULTS } from '../src/components/PullRefresh/constants'
import type { PickerOption, PickerProps } from '../src/components/Picker'
import type { PullRefreshProps } from '../src/components/PullRefresh'
import type { SwipeCellClose, SwipeCellPosition, SwipeCellProps } from '../src/components/SwipeCell'
import { COMPOSITION_KEY_CODE } from '../src/utils/composition'

const wrappers: VueWrapper[] = []
const keep = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
const ACTION_WIDTH = 80
const options: PickerOption[] = [
  { label: 'First', value: 'first' },
  { label: 'Unavailable', value: 'disabled', disabled: true },
  { label: 'Middle', value: 'middle' },
  { label: 'Also unavailable', value: 'disabled-too', disabled: true },
  { label: 'Last', value: 'last' },
]
const deferred = <T = boolean>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}
const column = (wrapper: VueWrapper, index = 0) => wrapper.findAll<HTMLElement>('[role="listbox"]')[index]
const scrollTo = async (wrapper: VueWrapper, top: number, index = 0, end = true) => {
  const target = column(wrapper, index)
  await target.trigger('wheel')
  target.element.scrollTop = top
  await target.trigger('scroll')
  if (end) await target.trigger('scrollend')
  await nextTick()
}
const cells = (getProps: () => SwipeCellProps[], attachTo?: HTMLElement) => {
  const host = keep(mount({
    setup: () => () => h('div', getProps().map((props, index) => h(SwipeCell, {
      key: index, leftWidth: ACTION_WIDTH, rightWidth: ACTION_WIDTH, ...props,
    }, { default: () => `Row ${index}`, right: () => h('button', 'Action'), left: () => h('button', 'Left action') }))),
  }, { attachTo }))
  return { host, entries: host.findAllComponents(SwipeCell) }
}
const expanded = (wrapper: VueWrapper) => wrapper.get('.scq-swipe-cell__content').attributes('aria-expanded') === 'true'

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('Picker native wheel', () => {
  it('does not shift independent column values across an unavailable column', async () => {
    const second = [{ label: 'B', value: 'b' }, { label: 'C', value: 'c' }] as const
    const model = ['missing', 'c'] as const
    const wrapper = keep(mount(Picker, { props: { columns: [[], second], modelValue: model } }))
    expect(wrapper.vm.getSelected()).toEqual({ values: [], options: [] })
    expect(column(wrapper, 1).attributes('aria-disabled')).toBe('true')
    expect(column(wrapper, 1).findAll<HTMLButtonElement>('button').every(button => button.element.disabled)).toBe(true)
    await column(wrapper, 1).findAll('button')[0].trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ columns: [[{ label: 'A', value: 'a' }], second] })
    expect(wrapper.vm.getSelected().values).toEqual(['a', 'c'])
    await column(wrapper, 1).findAll('button')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['a', 'b']]])
    expect(model).toEqual(['missing', 'c'])
  })

  it('allows a readonly cascade to recover from an empty branch without blocking its parent', async () => {
    const columns = [{ label: 'Empty', value: 'empty', children: [] }, { label: 'B', value: 'b', children: [{ label: 'B1', value: 'b1' }] }] as const
    const wrapper = keep(mount(Picker, { props: { columns } }))
    expect(wrapper.vm.getSelected().values).toEqual(['empty'])
    const parent = column(wrapper).findAll<HTMLButtonElement>('button')[1]
    expect(parent.element.disabled).toBe(false)
    await parent.trigger('click')
    expect(wrapper.emitted('change')).toEqual([[{ values: ['b', 'b1'], options: [columns[1], columns[1].children[0]] }]])
    expect(columns[0].children).toHaveLength(0)
  })

  it.each(['list', 'wheel'] as const)('restores %s selection focus after loading replaces the columns', async mode => {
    const wrapper = keep(mount(Picker, { attachTo: document.body, props: { mode, columns: options } }))
    const target = mode === 'wheel' ? column(wrapper) : wrapper.get<HTMLElement>('[aria-selected="true"]')
    target.element.focus()
    await wrapper.setProps({ loading: true })
    await wrapper.setProps({ loading: false })
    await flushPromises()
    expect(document.activeElement).toBe(mode === 'wheel' ? column(wrapper).element : wrapper.get('[aria-selected="true"]').element)
  })

  it('falls back to cancellation when loading finishes without an available selection', async () => {
    const wrapper = keep(mount(Picker, { attachTo: document.body, props: { columns: options } }))
    wrapper.get<HTMLElement>('[aria-selected="true"]').element.focus()
    await wrapper.setProps({ loading: true })
    await wrapper.setProps({ loading: false, columns: [] })
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('.scq-picker__cancel').element)
  })

  it('does not change or confirm from modified, composing or prevented keys', async () => {
    const wrapper = keep(mount(Picker, { props: { columns: options, mode: 'wheel' } }))
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await column(wrapper).trigger('keydown', { key: 'ArrowDown', ...flags })
      await column(wrapper).trigger('keydown', { key: 'Enter', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    event.preventDefault()
    column(wrapper).element.dispatchEvent(event)
    await flushPromises()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('ignores clicks on options removed by a data update', async () => {
    const wrapper = keep(mount(Picker, { props: { columns: options } }))
    const stale = wrapper.get('[role="option"]')
    await wrapper.setProps({ columns: [{ label: 'New', value: 'new' }] })
    await stale.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not confirm a disposed wheel or schedule new work from retained nodes', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(Picker, { props: { mode: 'wheel', columns: options } }))
    const stale = column(wrapper)
    const confirmation = wrapper.vm.confirm()
    wrapper.unmount()
    wrappers.pop()
    await confirmation
    await stale.trigger('wheel')
    stale.element.scrollTop = PICKER_DEFAULTS.optionHeight
    await stale.trigger('scroll')
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['list', 'wheel'] as const)('integrates %s focus, field attributes and non-overridable form disabling without changing selection', async (mode) => {
    const model = reactive({ destination: ['middle'] })
    const disabled = ref(false)
    const loading = ref(false)
    const host = keep(mount({
      setup: () => () => h(Form, { model, disabled: disabled.value }, {
        default: () => h(FormItem, {
          id: 'picker-field', prop: 'destination', label: 'Delivery', help: 'Choose a destination', error: 'Unavailable destination', required: true,
        }, {
          default: () => h(Picker, {
            mode, columns: options, modelValue: model.destination, disabled: false, loading: loading.value,
            'aria-describedby': 'picker-extra-description',
            'onUpdate:modelValue': (value) => { model.destination = value as string[] },
          }),
        }),
      }),
    }, { attachTo: document.body }))
    const wrapper = host.getComponent(Picker)
    const form = host.getComponent(Form)
    const outside = document.createElement('button')
    outside.id = 'picker-extra-description'
    outside.textContent = 'Additional description'
    document.body.append(outside)
    await nextTick()
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('id')).toBe('picker-field-control-1')
    expect(wrapper.attributes('aria-labelledby')).toBe('picker-field-label')
    expect(wrapper.attributes('aria-describedby')?.split(' ')).toEqual(['picker-extra-description', 'picker-field-help', 'picker-field-error'])
    expect(wrapper.attributes('aria-invalid')).toBe('true')
    expect(wrapper.attributes('aria-required')).toBe('true')
    expect(host.get('label').attributes('for')).toBe(wrapper.attributes('id'))
    const selected = wrapper.get('[role="option"][aria-selected="true"]').element
    const focusTarget = mode === 'wheel' ? column(wrapper).element : selected
    expect(form.vm.focusField('destination')).toBe(true)
    expect(document.activeElement).toBe(focusTarget)
    outside.focus()
    await host.get('label').trigger('click')
    expect(document.activeElement).toBe(focusTarget)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.trigger('focusout', { relatedTarget: outside })
    await flushPromises()
    expect(form.vm.getFieldState('destination')?.touched).toBe(true)
    loading.value = true
    await nextTick()
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(form.vm.focusField('destination')).toBe(false)
    await wrapper.vm.confirm()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    loading.value = false
    disabled.value = true
    await nextTick()
    outside.focus()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(column(wrapper).attributes('tabindex')).toBe('-1')
    expect(wrapper.findAll<HTMLButtonElement>('[role="option"]').every((option) => option.element.disabled)).toBe(true)
    expect(form.vm.focusField('destination')).toBe(false)
    await column(wrapper).trigger('keydown', { key: 'ArrowDown' })
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4)
    await wrapper.findAll('[role="option"]')[4].trigger('click')
    await wrapper.vm.confirm()
    expect(model.destination).toEqual(['middle'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    disabled.value = false
    await nextTick()
    expect(form.vm.focusField('destination')).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps list mode and its click/change payloads as the default', async () => {
    const wrapper = keep(mount(Picker, { props: { columns: options } }))
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4)
    expect(wrapper.classes()).not.toContain('scq-picker--wheel')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.findAll('[role="option"]')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['middle']]])
    expect(wrapper.emitted('change')).toEqual([[{ values: ['middle'], options: [options[2]] }]])
  })

  it('centers initial/external selections and exposes one active enabled option', async () => {
    const wrapper = keep(mount(Picker, { props: { columns: options, mode: 'wheel', modelValue: ['last'] } }))
    await nextTick()
    expect(wrapper.classes()).toContain('scq-picker--wheel')
    expect(column(wrapper).element.scrollTop).toBe(PICKER_DEFAULTS.optionHeight * 4)
    expect(wrapper.attributes('style')).toContain('--scq-picker-wheel-padding: 88px')
    expect(wrapper.get('.scq-picker__indicator').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('[role="option"][aria-selected="true"]')).toHaveLength(1)
    const selected = wrapper.get('[role="option"][aria-selected="true"]')
    expect(column(wrapper).attributes('aria-activedescendant')).toBe(selected.attributes('id'))
    await wrapper.setProps({ modelValue: ['first'], optionHeight: 48, visibleOptionCount: 3 })
    await nextTick()
    expect(column(wrapper).element.scrollTop).toBe(0)
    expect(wrapper.attributes('style')).toContain('--scq-picker-wheel-height: 144px')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('selects only after native scroll settles and skips disabled centers in either direction', async () => {
    const wrapper = keep(mount(Picker, { props: { columns: options, mode: 'wheel' } }))
    await nextTick()
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight, 0, false)
    expect(wrapper.emitted('change')).toBeUndefined()
    await column(wrapper).trigger('scrollend')
    await nextTick()
    expect(wrapper.vm.getSelected().values).toEqual(['middle'])
    expect(column(wrapper).element.scrollTop).toBe(PICKER_DEFAULTS.optionHeight * 2)
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight)
    expect(wrapper.vm.getSelected().values).toEqual(['first'])
    expect(column(wrapper).element.scrollTop).toBe(0)
    await column(wrapper).trigger('scrollend')
    expect(wrapper.emitted('change')).toHaveLength(2)
  })

  it('uses an idle fallback but does not commit while a touch is still held', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(Picker, { props: { columns: options, mode: 'wheel' } }))
    await nextTick()
    const target = column(wrapper)
    await target.trigger('touchstart', { touches: [{ clientY: 100 }] })
    target.element.scrollTop = PICKER_DEFAULTS.optionHeight * 4
    await target.trigger('scroll')
    await vi.advanceTimersByTimeAsync(PICKER_SCROLL_IDLE_MS)
    expect(wrapper.emitted('change')).toBeUndefined()
    await target.trigger('touchend', { touches: [] })
    await vi.advanceTimersByTimeAsync(PICKER_SCROLL_IDLE_MS)
    expect(wrapper.vm.getSelected().values).toEqual(['last'])
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('restores the authoritative center when a controlled proposal is ignored', async () => {
    const wrapper = keep(mount(Picker, { props: { columns: options, mode: 'wheel', modelValue: ['first'] } }))
    await nextTick()
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4)
    expect(wrapper.emitted('update:modelValue')).toEqual([[['last']]])
    expect(wrapper.vm.getSelected().values).toEqual(['first'])
    expect(column(wrapper).element.scrollTop).toBe(0)
    await wrapper.setProps({ modelValue: ['last'] })
    await nextTick()
    expect(column(wrapper).element.scrollTop).toBe(PICKER_DEFAULTS.optionHeight * 4)
  })

  it('ignores old scroll events after an external update or cancellation', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(Picker, { props: { columns: options, mode: 'wheel', modelValue: ['first'] } }))
    await nextTick()
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4, 0, false)
    await wrapper.setProps({ modelValue: ['middle'] })
    await nextTick()
    await column(wrapper).trigger('scrollend')
    await vi.advanceTimersByTimeAsync(PICKER_SCROLL_IDLE_MS)
    expect(column(wrapper).element.scrollTop).toBe(PICKER_DEFAULTS.optionHeight * 2)
    expect(wrapper.emitted('change')).toBeUndefined()
    await scrollTo(wrapper, 0, 0, false)
    await wrapper.get('.scq-picker__toolbar button').trigger('click')
    await vi.advanceTimersByTimeAsync(PICKER_SCROLL_IDLE_MS)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('synchronizes native cascade columns and removes obsolete child scroll work', async () => {
    vi.useFakeTimers()
    const columns: PickerOption[] = [
      { label: 'A', value: 'a', children: [{ label: 'A1', value: 'a1' }, { label: 'A2', value: 'a2' }] },
      { label: 'B', value: 'b', children: [{ label: 'Disabled', value: 'b0', disabled: true }, { label: 'B1', value: 'b1' }] },
    ]
    const wrapper = keep(mount(Picker, { props: { mode: 'wheel', columns } }))
    await nextTick()
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight, 1, false)
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight)
    await vi.advanceTimersByTimeAsync(PICKER_SCROLL_IDLE_MS)
    expect(wrapper.vm.getSelected().values).toEqual(['b', 'b1'])
    expect(column(wrapper, 1).element.scrollTop).toBe(PICKER_DEFAULTS.optionHeight)
    expect(wrapper.emitted('change')).toHaveLength(1)
    await wrapper.setProps({ columns: [{ label: 'Only', value: 'only' }] })
    await nextTick()
    expect(wrapper.findAll('[role="listbox"]')).toHaveLength(1)
    expect(wrapper.vm.getSelected().values).toEqual(['only'])
    expect(column(wrapper).element.scrollTop).toBe(0)
  })

  it('keeps keyboard selection and confirmation aligned in independent columns', async () => {
    const wrapper = keep(mount(Picker, { props: { mode: 'wheel', columns: [options, options] } }))
    await column(wrapper).trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(wrapper.vm.getSelected().values).toEqual(['middle', 'first'])
    expect(column(wrapper).element.scrollTop).toBe(PICKER_DEFAULTS.optionHeight * 2)
    await column(wrapper, 1).trigger('keydown', { key: 'End' })
    await column(wrapper).trigger('keydown', { key: 'Home' })
    await column(wrapper).trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.emitted('confirm')?.[0][0]).toMatchObject({ values: ['first', 'last'] })
  })

  it('settles an unfinished wheel before confirming an uncontrolled value', async () => {
    const wrapper = keep(mount(Picker, { props: { mode: 'wheel', columns: options } }))
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4, 0, false)
    await wrapper.get('.scq-picker__confirm').trigger('click')
    await nextTick()
    expect(wrapper.emitted('confirm')?.[0][0]).toMatchObject({ values: ['last'] })
  })

  it('handles page keys without leaving the wheel at a different value and prevents Space scrolling', async () => {
    const wrapper = keep(mount(Picker, { props: { mode: 'wheel', columns: options } }))
    await column(wrapper).trigger('keydown', { key: 'PageDown' })
    await nextTick()
    expect(wrapper.vm.getSelected().values).toEqual(['last'])
    expect(column(wrapper).element.scrollTop).toBe(PICKER_DEFAULTS.optionHeight * 4)
    await column(wrapper).trigger('keydown', { key: 'PageUp' })
    await nextTick()
    expect(wrapper.vm.getSelected().values).toEqual(['first'])
    expect(column(wrapper).element.scrollTop).toBe(0)
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    column(wrapper).element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('change')).toHaveLength(2)
  })

  it('never selects disabled/empty columns and clears pending work when disabled, loading or unmounted', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(Picker, { props: { mode: 'wheel', columns: options } }))
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4, 0, false)
    await wrapper.setProps({ disabled: true })
    await vi.advanceTimersByTimeAsync(PICKER_SCROLL_IDLE_MS)
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ disabled: false, loading: true })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    await wrapper.setProps({ loading: false, columns: options.map((option) => ({ ...option, disabled: true })) })
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4)
    await wrapper.vm.confirm()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.vm.getSelected().values).toEqual([])
    await wrapper.setProps({ columns: [[]] })
    expect(wrapper.get('.scq-picker__empty').exists()).toBe(true)
    await wrapper.setProps({ columns: options })
    await scrollTo(wrapper, PICKER_DEFAULTS.optionHeight * 4, 0, false)
    wrapper.unmount()
    wrappers.pop()
    await vi.advanceTimersByTimeAsync(PICKER_SCROLL_IDLE_MS)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it.each([
    { optionHeight: 0 }, { optionHeight: NaN }, { optionHeight: Infinity }, { optionHeight: Number.MAX_VALUE },
    { visibleOptionCount: 0 }, { visibleOptionCount: 4 }, { visibleOptionCount: 2.5 },
    { mode: 'invalid' },
  ])('rejects invalid wheel configuration %j', (props) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Picker, { props: props as PickerProps })).toThrow(/scq-vue\/Picker/)
  })
})

describe('PullRefresh completion feedback', () => {
  it('captures only a claimed vertical mouse drag and releases its pointer on disabling and unmount', async () => {
    const wrapper = keep(mount(PullRefresh, { slots: { default: '<span class="pointer-child">Child</span>' } }))
    const captured = new Set<number>()
    const capture = vi.fn((id: number) => { captured.add(id) })
    const release = vi.fn((id: number) => { captured.delete(id) })
    Object.assign(wrapper.element, { setPointerCapture: capture, hasPointerCapture: (id: number) => captured.has(id), releasePointerCapture: release })
    await wrapper.trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 })
    expect(capture).not.toHaveBeenCalled()
    await wrapper.trigger('pointermove', { pointerId: 1, clientX: 200, clientY: 50 })
    expect(capture).not.toHaveBeenCalled()
    await wrapper.trigger('pointerdown', { pointerId: 2, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 })
    await wrapper.trigger('pointermove', { pointerId: 2, clientX: 0, clientY: 200 })
    expect(capture).toHaveBeenCalledWith(2)
    await wrapper.get('.pointer-child').trigger('lostpointercapture', { pointerId: 2 })
    expect(captured.has(2)).toBe(true)
    const position = wrapper.get('.scq-pull-refresh__track').attributes('style')
    await wrapper.trigger('pointermove', { pointerId: 3, clientX: 0, clientY: 0 })
    await wrapper.trigger('pointerup', { pointerId: 3 })
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toBe(position)
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.setProps({ disabled: true })
    expect(release).toHaveBeenCalledWith(2)
    await wrapper.trigger('pointerup', { pointerId: 2 })
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.setProps({ disabled: false })
    await wrapper.trigger('pointerdown', { pointerId: 4, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 })
    await wrapper.trigger('pointermove', { pointerId: 4, clientX: 0, clientY: 200 })
    wrapper.unmount()
    wrappers.pop()
    expect(release).toHaveBeenCalledWith(4)
    expect(captured.size).toBe(0)
  })

  it('leaves child-owned pointer and touch gestures alone', async () => {
    const wrapper = keep(mount(PullRefresh, { slots: { default: () => h('div', {
      class: 'gesture-owner', onPointermove: (event: PointerEvent) => event.preventDefault(), onTouchmove: (event: TouchEvent) => event.preventDefault(),
    }, 'Child gesture') } }))
    const child = wrapper.get('.gesture-owner')
    await child.trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 })
    await child.trigger('pointermove', { pointerId: 1, clientX: 0, clientY: 200 })
    await child.trigger('pointerup', { pointerId: 1 })
    await child.trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    await child.trigger('touchmove', { touches: [{ clientX: 0, clientY: 200 }] })
    await child.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toContain('translateY(0px)')
  })

  it.each([{ pullDistance: 80 }, { headHeight: 80 }])('discards an old gesture after geometry changes: %j', async props => {
    const wrapper = keep(mount(PullRefresh))
    await wrapper.trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 0, clientY: 200 }] })
    await wrapper.setProps(props)
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
  })

  it('cancels a gesture when its scroll container leaves the top', async () => {
    const host = keep(mount({ setup: () => () => h('div', { style: 'overflow-y: auto' }, h(PullRefresh)) }, { attachTo: document.body }))
    const wrapper = host.getComponent(PullRefresh)
    await wrapper.trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    host.element.scrollTop = 10
    await wrapper.trigger('touchmove', { touches: [{ clientX: 0, clientY: 200 }] })
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
  })

  it('restores keyboard refresh focus and makes hidden head content inert', async () => {
    const wrapper = keep(mount(PullRefresh, { attachTo: document.body }))
    const button = wrapper.get<HTMLButtonElement>('.scq-pull-refresh__keyboard')
    expect(wrapper.get('.scq-pull-refresh__head').attributes('inert')).toBeDefined()
    button.element.focus()
    await button.trigger('click')
    button.element.blur()
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('.scq-pull-refresh__head').attributes('inert')).toBeUndefined()
    await wrapper.setProps({ modelValue: false })
    await flushPromises()
    expect(document.activeElement).toBe(button.element)
    expect(wrapper.get('.scq-pull-refresh__head').attributes('inert')).toBeDefined()
  })

  it('moves focus out of result content when its hold expires', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(PullRefresh, { attachTo: document.body, props: { result: 'error', resultDuration: 100 } }))
    wrapper.get<HTMLButtonElement>('.scq-pull-refresh__head button').element.focus()
    await vi.advanceTimersByTimeAsync(100)
    expect(document.activeElement).toBe(wrapper.get('.scq-pull-refresh__keyboard').element)
    expect(wrapper.get('.scq-pull-refresh__head').attributes('inert')).toBeDefined()
    expect(wrapper.find('.scq-pull-refresh__feedback button').exists()).toBe(true)
  })

  it('preserves immediate normal completion when result is omitted', async () => {
    const wrapper = keep(mount(PullRefresh))
    wrapper.vm.refresh()
    wrapper.vm.refresh()
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toContain('translateY(0px)')
    expect(wrapper.emitted('complete')).toBeUndefined()
    expect(wrapper.find('.scq-pull-refresh__retry').exists()).toBe(false)
  })

  it('holds success only after the controlled loading value finishes', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(PullRefresh, { props: { modelValue: true, successText: 'Updated' } }))
    await wrapper.setProps({ result: 'success' })
    expect(wrapper.get('.scq-pull-refresh__head').classes()).toContain('is-loading')
    expect(wrapper.emitted('complete')).toBeUndefined()
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.get('.scq-pull-refresh__head').text()).toBe('Updated')
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toContain(`translateY(${PULL_REFRESH_DEFAULTS.headHeight}px)`)
    expect(wrapper.emitted('complete')).toEqual([['success']])
    await vi.advanceTimersByTimeAsync(PULL_REFRESH_DEFAULTS.resultDuration - 1)
    expect(wrapper.get('.scq-pull-refresh__head').classes()).toContain('is-success')
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toContain('translateY(0px)')
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ status: 'normal', distance: 0 }])
  })

  it('keeps an actionable error after the hold and retries exactly once', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(PullRefresh, { props: { modelValue: true, resultDuration: 100, errorText: 'Offline', retryText: 'Try again' } }))
    await wrapper.setProps({ modelValue: false, result: 'error' })
    expect(wrapper.get('.scq-pull-refresh__head').text()).toContain('Offline')
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.get('.scq-pull-refresh__feedback').text()).toContain('Offline')
    const retry = wrapper.get('.scq-pull-refresh__retry')
    expect(retry.text()).toBe('Try again')
    await retry.trigger('click')
    await retry.trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.setProps({ result: undefined })
    wrapper.vm.refresh()
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false, result: 'success' })
    expect(wrapper.emitted('complete')).toEqual([['error'], ['success']])
    expect(wrapper.find('.scq-pull-refresh__feedback').exists()).toBe(false)
  })

  it('supports retry during an error hold and respects disabled state and head slots', async () => {
    const wrapper = keep(mount(PullRefresh, {
      props: { result: 'error', disabled: true },
      slots: { head: ({ status, retry }: { status: string; retry: () => void }) => h('button', { class: 'custom-retry', onClick: retry }, status) },
    }))
    expect(wrapper.get('.custom-retry').text()).toBe('error')
    await wrapper.get('.custom-retry').trigger('click')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.setProps({ disabled: false })
    await wrapper.get('.custom-retry').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.get('.custom-retry').text()).toBe('loading')
  })

  it('accepts explicit completion of a synchronous request without an intermediate true render', async () => {
    const wrapper = keep(mount(PullRefresh))
    wrapper.vm.refresh()
    await wrapper.setProps({ result: 'error' })
    expect(wrapper.attributes('aria-busy')).toBe('false')
    expect(wrapper.get('.scq-pull-refresh__head').classes()).toContain('is-error')
    expect(wrapper.emitted('complete')).toEqual([['error']])
  })

  it('cancels previous completion timers on refresh, replacement, configuration changes and unmount', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const wrapper = keep(mount(PullRefresh, { props: { result: 'success', resultDuration: 100, onChange } }))
    await vi.advanceTimersByTimeAsync(50)
    wrapper.vm.refresh()
    await wrapper.setProps({ modelValue: true })
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.get('.scq-pull-refresh__head').classes()).toContain('is-loading')
    await wrapper.setProps({ modelValue: false, result: 'error' })
    await wrapper.setProps({ resultDuration: 200 })
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.get('.scq-pull-refresh__head').classes()).toContain('is-error')
    await wrapper.setProps({ result: 'success' })
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.get('.scq-pull-refresh__head').classes()).toContain('is-success')
    const changes = onChange.mock.calls.length
    wrapper.unmount()
    wrappers.pop()
    await vi.advanceTimersByTimeAsync(200)
    expect(onChange).toHaveBeenCalledTimes(changes)
  })

  it('permits zero-duration feedback without losing the persistent retry control', async () => {
    vi.useFakeTimers()
    const wrapper = keep(mount(PullRefresh, { props: { result: 'error', resultDuration: 0 } }))
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toContain('translateY(0px)')
    expect(wrapper.find('.scq-pull-refresh__retry').exists()).toBe(true)
    await wrapper.setProps({ result: undefined })
    expect(wrapper.find('.scq-pull-refresh__feedback').exists()).toBe(false)
  })

  it('ignores non-top, horizontal, cancelled and multi-touch gestures', async () => {
    const host = keep(mount({ setup: () => () => h('div', { style: 'overflow-y: auto' }, h(PullRefresh)) }, { attachTo: document.body }))
    const wrapper = host.getComponent(PullRefresh)
    host.element.scrollTop = 10
    const start = { touches: [{ clientX: 0, clientY: 0 }] }
    const downward = { touches: [{ clientX: 0, clientY: 200 }] }
    await wrapper.trigger('touchstart', start)
    await wrapper.trigger('touchmove', downward)
    await wrapper.trigger('touchend')
    host.element.scrollTop = 0
    await wrapper.trigger('touchstart', start)
    await wrapper.trigger('touchmove', { touches: [{ clientX: 250, clientY: 200 }] })
    await wrapper.trigger('touchend')
    await wrapper.trigger('touchstart', start)
    await wrapper.trigger('touchmove', downward)
    await wrapper.trigger('touchcancel')
    await wrapper.trigger('touchend')
    await wrapper.trigger('touchstart', start)
    await wrapper.trigger('touchmove', { touches: [{ clientX: 0, clientY: 200 }, { clientX: 10, clientY: 200 }] })
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.trigger('touchstart', start)
    await wrapper.trigger('touchmove', downward)
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it.each([
    { headHeight: 0 }, { pullDistance: -1 }, { resultDuration: -1 },
    { resultDuration: NaN }, { resultDuration: Infinity }, { resultDuration: MAX_RESULT_DURATION + 1 },
    { result: 'invalid' },
  ])('rejects invalid refresh configuration %j', (props) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(PullRefresh, { props: props as PullRefreshProps })).toThrow(/scq-vue\/PullRefresh/)
  })
})

describe('SwipeCell groups and controlled acknowledgements', () => {
  it('focuses an enabled action after keyboard opening and restores content on Escape', async () => {
    const wrapper = keep(mount(SwipeCell, { attachTo: document.body, props: { rightWidth: ACTION_WIDTH }, slots: {
      default: 'Row', right: '<button disabled>Blocked</button><a href="#action">Action link</a><button>Other</button>',
    } }))
    const content = wrapper.get<HTMLElement>('.scq-swipe-cell__content')
    content.element.focus()
    await content.trigger('keydown', { key: 'ArrowLeft' })
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('a').element)
    await wrapper.get('a').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(document.activeElement).toBe(content.element)
  })

  it('does not focus hidden actions when a controlled keyboard open is rejected', async () => {
    const wrapper = keep(mount(SwipeCell, { attachTo: document.body, props: { modelValue: '', rightWidth: ACTION_WIDTH }, slots: { default: 'Row', right: '<button>Action</button>' } }))
    const content = wrapper.get<HTMLElement>('.scq-swipe-cell__content')
    content.element.focus()
    await content.trigger('keydown', { key: 'ArrowLeft' })
    await flushPromises()
    expect(wrapper.emitted('open')).toEqual([['right']])
    expect(document.activeElement).toBe(content.element)
  })

  it.each([true, false])('restores focus to content or the action after a close guard returns %s', async allowed => {
    const decision = deferred()
    const wrapper = keep(mount(SwipeCell, { attachTo: document.body, props: { rightWidth: ACTION_WIDTH, beforeClose: () => decision.promise }, slots: { default: 'Row', right: '<button>Action</button>' } }))
    await wrapper.vm.open('right')
    const button = wrapper.get<HTMLButtonElement>('button')
    button.element.focus()
    await button.trigger('click')
    button.element.blur()
    decision.resolve(allowed)
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get(allowed ? '.scq-swipe-cell__content' : 'button').element)
  })

  it('moves action focus to content after an external controlled close', async () => {
    const wrapper = keep(mount(SwipeCell, { attachTo: document.body, props: { modelValue: 'right', rightWidth: ACTION_WIDTH }, slots: { default: 'Row', right: '<button>Action</button>' } }))
    wrapper.get<HTMLButtonElement>('button').element.focus()
    await wrapper.setProps({ modelValue: '' })
    expect(document.activeElement).toBe(wrapper.get('.scq-swipe-cell__content').element)
  })

  it('does not let arrow keys cancel an in-flight close request', async () => {
    const decision = deferred()
    let signal!: AbortSignal
    const wrapper = keep(mount(SwipeCell, { props: { rightWidth: ACTION_WIDTH, beforeClose: (_context, current) => { signal = current; return decision.promise } } }))
    await wrapper.vm.open('right')
    const closing = wrapper.vm.close()
    await flushPromises()
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(signal.aborted).toBe(false)
    expect(wrapper.vm.pending).toBe(true)
    decision.resolve(false)
    await closing
    expect(expanded(wrapper)).toBe(true)
  })

  it('preserves modified, composing and prevented reveal keys', async () => {
    const wrapper = keep(mount(SwipeCell, { props: { rightWidth: ACTION_WIDTH } }))
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await wrapper.trigger('keydown', { key: 'ArrowLeft', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
    event.preventDefault()
    wrapper.element.dispatchEvent(event)
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('releases captured drags when widths change and ignores unrelated pointer endings', async () => {
    const wrapper = keep(mount(SwipeCell, { props: { rightWidth: ACTION_WIDTH } }))
    const content = wrapper.get('.scq-swipe-cell__content')
    const captures = new Set<number>()
    const capture = vi.fn((id: number) => { captures.add(id) })
    const release = vi.fn((id: number) => { captures.delete(id) })
    Object.assign(content.element, { setPointerCapture: capture, hasPointerCapture: (id: number) => captures.has(id), releasePointerCapture: release })
    await content.trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 0, button: 0 })
    await content.trigger('pointermove', { pointerId: 1, clientX: 0, clientY: 0 })
    expect(capture).toHaveBeenCalledWith(1)
    await content.trigger('pointerup', { pointerId: 2 })
    expect(wrapper.classes()).toContain('is-dragging')
    expect(wrapper.emitted('open')).toBeUndefined()
    await wrapper.setProps({ rightWidth: ACTION_WIDTH / 2 })
    expect(release).toHaveBeenCalledWith(1)
    expect(wrapper.classes()).not.toContain('is-dragging')
    await content.trigger('pointerup', { pointerId: 1 })
    expect(wrapper.emitted('open')).toBeUndefined()
    await content.trigger('pointerdown', { pointerId: 3, clientX: 100, clientY: 0, button: 0 })
    await content.trigger('pointermove', { pointerId: 3, clientX: 0, clientY: 0 })
    wrapper.unmount()
    wrappers.pop()
    expect(release).toHaveBeenCalledWith(3)
  })

  it('preserves keyboard clicks after a refused drag while suppressing its trailing pointer click', async () => {
    const wrapper = keep(mount(SwipeCell, { props: { modelValue: '', rightWidth: ACTION_WIDTH } }))
    const content = wrapper.get('.scq-swipe-cell__content')
    for (const detail of [1, 0]) {
      await content.trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 0, button: 0 })
      await content.trigger('pointermove', { pointerId: 1, clientX: 0, clientY: 0 })
      await content.trigger('pointerup', { pointerId: 1 })
      content.element.dispatchEvent(new MouseEvent('click', { detail, bubbles: true, cancelable: true }))
      await nextTick()
      expect(wrapper.emitted('click')?.length ?? 0).toBe(detail === 1 ? 0 : 1)
    }
    expect(wrapper.emitted('click')).toEqual([['cell']])
  })

  it('does not claim a child-owned pointer gesture', async () => {
    const wrapper = keep(mount(SwipeCell, { props: { rightWidth: ACTION_WIDTH }, slots: { default: () => h('div', { class: 'child-gesture', onPointermove: (event: PointerEvent) => event.preventDefault() }, 'Child') } }))
    const child = wrapper.get('.child-gesture')
    await child.trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 0, button: 0 })
    await child.trigger('pointermove', { pointerId: 1, clientX: 0, clientY: 0 })
    await child.trigger('pointerup', { pointerId: 1 })
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('preserves independent opening without a group, including other named groups', async () => {
    const { entries } = cells(() => [{}, {}, { group: 'one' }, { group: 'two' }])
    for (const entry of entries) await entry.vm.open('right')
    expect(entries.every(expanded)).toBe(true)
    expect(entries.every((entry) => entry.emitted('close') === undefined)).toBe(true)
  })

  it('closes the previous group member before opening the next with keyboard or method', async () => {
    const { entries: [first, second] } = cells(() => [{ group: 'inbox' }, { group: 'inbox' }])
    await first.vm.open('right')
    await second.trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(first.emitted('close')).toEqual([[{ position: 'right', reason: 'group' }]])
    expect(first.emitted('update:modelValue')).toEqual([['right'], ['']])
    expect(second.emitted('open')).toEqual([['left']])
    expect(expanded(first)).toBe(false)
    expect(expanded(second)).toBe(true)
  })

  it('coalesces repeated group attempts, refuses other candidates, and blocks on false', async () => {
    const decision = deferred()
    const beforeClose = vi.fn(() => decision.promise)
    const { entries: [first, second, third] } = cells(() => [{ group: 'inbox', beforeClose }, { group: 'inbox' }, { group: 'inbox' }])
    await first.vm.open('right')
    const firstAttempt = second.vm.open('right')
    const duplicate = second.vm.open('right')
    await flushPromises()
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(await third.vm.open('right')).toBe(false)
    expect(first.attributes('aria-busy')).toBe('true')
    expect(second.attributes('aria-busy')).toBe('true')
    decision.resolve(false)
    expect(await firstAttempt).toBe(false)
    expect(await duplicate).toBe(false)
    await nextTick()
    expect(expanded(first)).toBe(true)
    expect(expanded(second)).toBe(false)
    expect(second.attributes('aria-busy')).toBe('false')
    expect(second.emitted('open')).toBeUndefined()
  })

  it('waits indefinitely for an accepted controlled close, not just its guard result', async () => {
    const previous = ref<SwipeCellPosition>('right')
    const beforeClose = vi.fn().mockResolvedValue(true)
    const { entries: [first, second] } = cells(() => [{ group: 'inbox', modelValue: previous.value, beforeClose }, { group: 'inbox' }])
    const opening = second.vm.open('right')
    await flushPromises()
    expect(first.emitted('update:modelValue')).toEqual([['']])
    expect(first.emitted('close')).toEqual([[{ position: 'right', reason: 'group' }]])
    expect(expanded(first)).toBe(true)
    expect(second.emitted('open')).toBeUndefined()
    expect(second.attributes('aria-busy')).toBe('true')
    previous.value = ''
    await nextTick()
    expect(await opening).toBe(true)
    await nextTick()
    expect(expanded(first)).toBe(false)
    expect(expanded(second)).toBe(true)
  })

  it('reserves the group until a proposed controlled open is acknowledged', async () => {
    const selected = ref<SwipeCellPosition>('')
    const { entries: [first, second] } = cells(() => [{ group: 'inbox', modelValue: selected.value }, { group: 'inbox' }])
    const opening = first.vm.open('right')
    await flushPromises()
    expect(first.emitted('open')).toEqual([['right']])
    expect(expanded(first)).toBe(false)
    expect(await second.vm.open('right')).toBe(false)
    selected.value = 'right'
    await nextTick()
    expect(await opening).toBe(true)
    expect(expanded(first)).toBe(true)
    const next = second.vm.open('right')
    await flushPromises()
    expect(first.emitted('update:modelValue')).toEqual([['right'], ['']])
    expect(second.emitted('open')).toBeUndefined()
    selected.value = ''
    await nextTick()
    expect(await next).toBe(true)
  })

  it('can explicitly cancel unacknowledged controlled requests and safely retry', async () => {
    const { entries: [first, second] } = cells(() => [{ group: 'inbox', modelValue: '' }, { group: 'inbox' }])
    const opening = first.vm.open('right')
    await flushPromises()
    first.vm.cancelPending()
    expect(await opening).toBe(false)
    expect(await second.vm.open('right')).toBe(true)
    expect(expanded(first)).toBe(false)
  })

  it('surfaces guard errors, retains the old row, and permits a later retry', async () => {
    const failure = new Error('Cannot close')
    const beforeClose = vi.fn().mockRejectedValue(failure)
    const onError = vi.fn()
    const { entries: [first, second] } = cells(() => [{ group: 'inbox', beforeClose, onError } as SwipeCellProps, { group: 'inbox' }])
    await first.vm.open('right')
    expect(await second.vm.open('right')).toBe(false)
    expect(first.emitted('error')).toEqual([[failure]])
    expect(onError).toHaveBeenCalledWith(failure)
    expect(expanded(first)).toBe(true)
    expect(second.emitted('open')).toBeUndefined()
    beforeClose.mockResolvedValue(true)
    expect(await second.vm.open('right')).toBe(true)
  })

  it('does not silently swallow a guard failure without an error listener', async () => {
    const failure = new Error('Visible failure')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = keep(mount(SwipeCell, { props: { rightWidth: ACTION_WIDTH, beforeClose: () => { throw failure } } }))
    await wrapper.vm.open('right')
    expect(await wrapper.vm.close()).toBe(false)
    expect(wrapper.emitted('error')).toEqual([[failure]])
    expect(log).toHaveBeenCalledWith('[scq-vue] Async guard failed', failure)
    expect(expanded(wrapper)).toBe(true)
  })

  it('preserves externally forced conflicts and reports them without coercing controlled values', async () => {
    const firstValue = ref<SwipeCellPosition>('right')
    const secondValue = ref<SwipeCellPosition>('')
    const conflict = vi.fn()
    const { entries: [first, second, third] } = cells(() => [
      { group: 'inbox', modelValue: firstValue.value, onGroupConflict: conflict } as SwipeCellProps,
      { group: 'inbox', modelValue: secondValue.value, onGroupConflict: conflict } as SwipeCellProps,
      { group: 'inbox' },
    ])
    secondValue.value = 'left'
    await nextTick()
    expect(expanded(first)).toBe(true)
    expect(expanded(second)).toBe(true)
    expect(first.emitted('update:modelValue')).toBeUndefined()
    expect(second.emitted('update:modelValue')).toBeUndefined()
    expect(conflict).toHaveBeenCalledTimes(2)
    expect(first.emitted('group-conflict')?.[0][0]).toMatchObject({ group: 'inbox', cells: [{ position: 'right' }, { position: 'left' }] })
    const opening = third.vm.open('right')
    await flushPromises()
    expect(third.emitted('open')).toBeUndefined()
    firstValue.value = ''
    await nextTick()
    await flushPromises()
    expect(second.emitted('update:modelValue')).toEqual([['']])
    expect(third.emitted('open')).toBeUndefined()
    secondValue.value = ''
    await nextTick()
    expect(await opening).toBe(true)
  })

  it('aborts stale guards when an externally controlled position changes', async () => {
    const decision = deferred()
    let signal: AbortSignal | undefined
    const beforeClose = vi.fn((_context: SwipeCellClose, requestSignal: AbortSignal) => { signal = requestSignal; return decision.promise })
    const previous = ref<SwipeCellPosition>('right')
    const { entries: [first, second] } = cells(() => [{ group: 'inbox', modelValue: previous.value, beforeClose }, { group: 'inbox' }])
    const opening = second.vm.open('right')
    await flushPromises()
    previous.value = 'left'
    await nextTick()
    expect(await opening).toBe(false)
    expect(signal?.aborted).toBe(true)
    decision.resolve(true)
    await flushPromises()
    expect(first.emitted('close')).toBeUndefined()
    expect(second.emitted('open')).toBeUndefined()
    expect(first.get('.scq-swipe-cell__content').attributes('style')).toContain(`translateX(${ACTION_WIDTH}px)`)
  })

  it('allows an externally acknowledged close even if the obsolete guard never resolves', async () => {
    const decision = deferred()
    const previous = ref<SwipeCellPosition>('right')
    let signal: AbortSignal | undefined
    const { entries: [first, second] } = cells(() => [
      { group: 'inbox', modelValue: previous.value, beforeClose: (_context, current) => { signal = current; return decision.promise } },
      { group: 'inbox' },
    ])
    const opening = second.vm.open('right')
    await flushPromises()
    previous.value = ''
    await nextTick()
    expect(await opening).toBe(true)
    expect(signal?.aborted).toBe(true)
    decision.resolve(false)
    await flushPromises()
    expect(first.emitted('close')).toBeUndefined()
    expect(second.emitted('open')).toEqual([['right']])
  })

  it('cancels pending user opens when a third party externally opens another member', async () => {
    const decision = deferred()
    const thirdPosition = ref<SwipeCellPosition>('')
    const { entries: [first, second, third] } = cells(() => [
      { group: 'inbox', beforeClose: () => decision.promise, onGroupConflict: vi.fn() } as SwipeCellProps,
      { group: 'inbox' },
      { group: 'inbox', modelValue: thirdPosition.value, onGroupConflict: vi.fn() } as SwipeCellProps,
    ])
    await first.vm.open('right')
    const opening = second.vm.open('right')
    await flushPromises()
    thirdPosition.value = 'right'
    await nextTick()
    expect(await opening).toBe(false)
    decision.resolve(true)
    await flushPromises()
    expect(first.emitted('close')).toBeUndefined()
    expect(second.emitted('open')).toBeUndefined()
    expect(expanded(third)).toBe(true)
    expect(third.emitted('group-conflict')).toHaveLength(1)
  })

  it('ignores stale guard failures after reopening or guard replacement', async () => {
    const failure = deferred()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = keep(mount(SwipeCell, { props: { leftWidth: ACTION_WIDTH, rightWidth: ACTION_WIDTH, beforeClose: () => failure.promise } }))
    await wrapper.vm.open('right')
    const closing = wrapper.vm.close()
    await flushPromises()
    await wrapper.vm.open('left')
    expect(await closing).toBe(false)
    failure.reject(new Error('Old failure'))
    await flushPromises()
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(log).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeUndefined()
    const replacement = deferred()
    await wrapper.setProps({ beforeClose: () => replacement.promise })
    const secondClose = wrapper.vm.close()
    await flushPromises()
    await wrapper.setProps({ beforeClose: () => true })
    expect(await secondClose).toBe(false)
    replacement.resolve(true)
    await flushPromises()
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(await wrapper.vm.close()).toBe(true)
  })

  it('releases a removed peer, but never opens an unmounted requested target', async () => {
    const decision = deferred()
    const visible = ref(true)
    const targetVisible = ref(true)
    const beforeClose = vi.fn(() => decision.promise)
    const host = keep(mount({ setup: () => () => h('div', [
      visible.value && h(SwipeCell, { key: 'old', group: 'inbox', modelValue: 'right', beforeClose, rightWidth: ACTION_WIDTH }),
      targetVisible.value && h(SwipeCell, { key: 'new', group: 'inbox', rightWidth: ACTION_WIDTH }),
    ]) }))
    const target = host.findAllComponents(SwipeCell)[1]
    const opening = target.vm.open('right')
    await flushPromises()
    visible.value = false
    await nextTick()
    expect(await opening).toBe(true)
    await target.vm.close()
    visible.value = true
    await nextTick()
    const nextOpening = target.vm.open('right')
    await flushPromises()
    const oldCount = target.emitted('open')?.length
    targetVisible.value = false
    await nextTick()
    expect(await nextOpening).toBe(false)
    decision.resolve(true)
    await flushPromises()
    expect(target.emitted('open')).toHaveLength(oldCount!)
  })

  it.each(['disabled', 'group', 'width'] as const)('cancels a pending target after its %s changes', async (change) => {
    const decision = deferred()
    const enabled = ref(true)
    const group = ref('inbox')
    const width = ref(ACTION_WIDTH)
    const { entries: [first, second] } = cells(() => [
      { group: 'inbox', beforeClose: () => decision.promise },
      { group: group.value, disabled: !enabled.value, rightWidth: width.value },
    ])
    await first.vm.open('right')
    const opening = second.vm.open('right')
    await flushPromises()
    if (change === 'disabled') enabled.value = false
    if (change === 'group') group.value = 'different'
    if (change === 'width') width.value = 0
    await nextTick()
    expect(await opening).toBe(false)
    decision.resolve(true)
    await flushPromises()
    expect(first.emitted('close')).toBeUndefined()
    expect(second.emitted('open')).toBeUndefined()
  })

  it('remeasures action targets after a slow guard instead of opening a removed slot', async () => {
    const decision = deferred()
    const showAction = ref(true)
    const host = keep(mount({ setup: () => () => h('div', [
      h(SwipeCell, { group: 'inbox', rightWidth: ACTION_WIDTH, beforeClose: () => decision.promise }),
      h(SwipeCell, { group: 'inbox' }, { right: () => showAction.value ? h('button', 'Action') : null }),
    ]) }))
    const [first, second] = host.findAllComponents(SwipeCell)
    const actions = second.get('.scq-swipe-cell__actions--right').element
    vi.spyOn(actions, 'getBoundingClientRect').mockImplementation(() => ({ width: actions.querySelector('button') ? ACTION_WIDTH : 0 } as DOMRect))
    await first.vm.open('right')
    const opening = second.vm.open('right')
    await flushPromises()
    showAction.value = false
    await nextTick()
    decision.resolve(true)
    expect(await opening).toBe(false)
    expect(second.emitted('open')).toBeUndefined()
  })

  it('does not couple groups in separate Vue apps', async () => {
    const first = keep(mount(SwipeCell, { props: { group: 'inbox', rightWidth: ACTION_WIDTH } }))
    const second = keep(mount(SwipeCell, { props: { group: 'inbox', rightWidth: ACTION_WIDTH } }))
    await first.vm.open('right')
    await second.vm.open('right')
    expect(expanded(first)).toBe(true)
    expect(expanded(second)).toBe(true)
  })

  it.each([
    { leftWidth: -1 }, { rightWidth: NaN }, { rightWidth: Infinity },
    { group: NaN }, { group: {} }, { modelValue: 'invalid' },
  ])('rejects invalid swipe configuration %j', (props) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(SwipeCell, { props: props as SwipeCellProps })).toThrow(/scq-vue\/SwipeCell/)
  })
})

describe('SwipeCell outside clicks and gestures', () => {
  it('keeps a grouped drag preview inert until the previous close is accepted', async () => {
    const { entries: [first, second] } = cells(() => [{ group: 'inbox', beforeClose: () => false }, { group: 'inbox' }])
    await first.vm.open('right')
    const content = second.get('.scq-swipe-cell__content')
    await content.trigger('pointerdown', { clientX: 100, clientY: 0, button: 0 })
    await content.trigger('pointermove', { clientX: 0, clientY: 0 })
    expect(expanded(second)).toBe(false)
    expect(second.get('.scq-swipe-cell__actions--right').attributes('inert')).toBeDefined()
    await second.get('.scq-swipe-cell__actions--right button').trigger('click')
    expect(second.emitted('click')).toBeUndefined()
    await content.trigger('pointerup')
    await flushPromises()
    expect(expanded(first)).toBe(true)
    expect(expanded(second)).toBe(false)
    expect(second.emitted('open')).toBeUndefined()
  })

  it('keeps outside closing opt-in and routes it through the same asynchronous guard', async () => {
    const decision = deferred()
    const beforeClose = vi.fn(() => decision.promise)
    const wrapper = keep(mount(SwipeCell, {
      attachTo: document.body,
      props: { rightWidth: ACTION_WIDTH, beforeClose },
      slots: { default: 'Row', right: '<button>Action</button>' },
    }))
    await wrapper.vm.open('right')
    document.body.click()
    await flushPromises()
    expect(beforeClose).not.toHaveBeenCalled()
    await wrapper.setProps({ closeOnClickOutside: true })
    await wrapper.trigger('click')
    expect(beforeClose).not.toHaveBeenCalled()
    document.body.click()
    document.body.click()
    await flushPromises()
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(beforeClose.mock.calls[0][0]).toMatchObject({ position: 'right', reason: 'outside' })
    decision.resolve(false)
    await flushPromises()
    expect(expanded(wrapper)).toBe(true)
    beforeClose.mockResolvedValue(true)
    document.body.click()
    await flushPromises()
    expect(expanded(wrapper)).toBe(false)
    expect(wrapper.emitted('close')).toEqual([[{ position: 'right', reason: 'outside' }]])
  })

  it('waits for controlled outside-close acknowledgement and cancels stale outside requests', async () => {
    const wrapper = keep(mount(SwipeCell, { attachTo: document.body, props: { modelValue: 'right', rightWidth: ACTION_WIDTH, closeOnClickOutside: true } }))
    document.body.click()
    document.body.click()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(expanded(wrapper)).toBe(true)
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.setProps({ modelValue: '' })
    await flushPromises()
    expect(wrapper.attributes('aria-busy')).toBe('false')
    const decision = deferred()
    await wrapper.setProps({ modelValue: 'right', beforeClose: () => decision.promise })
    document.body.click()
    await flushPromises()
    await wrapper.setProps({ closeOnClickOutside: false })
    decision.resolve(true)
    await flushPromises()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(expanded(wrapper)).toBe(true)
  })

  it('prevents repeated action/cell clicks while a close is pending', async () => {
    const decision = deferred()
    const onAction = vi.fn()
    const beforeClose = vi.fn(() => decision.promise)
    const wrapper = keep(mount(SwipeCell, { props: { rightWidth: ACTION_WIDTH, beforeClose }, slots: { right: () => h('button', { onClick: onAction }, 'Action') } }))
    await wrapper.vm.open('right')
    const button = wrapper.get('button')
    await button.trigger('click')
    await button.trigger('click')
    await wrapper.get('.scq-swipe-cell__content').trigger('click')
    await flushPromises()
    expect(beforeClose).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('click')).toEqual([['right']])
    decision.resolve(false)
    await flushPromises()
    expect(wrapper.get('.scq-swipe-cell__actions--right').attributes('inert')).toBeUndefined()
  })

  it('leaves vertical/cancelled gestures and editable keyboard targets alone', async () => {
    const wrapper = keep(mount(SwipeCell, { props: { rightWidth: ACTION_WIDTH }, slots: { default: '<input><div contenteditable="true">Edit</div>' } }))
    const content = wrapper.get('.scq-swipe-cell__content')
    await content.trigger('pointerdown', { clientX: 100, clientY: 0, button: 0 })
    await content.trigger('pointermove', { clientX: 90, clientY: 100 })
    await content.trigger('pointerup')
    await content.trigger('pointerdown', { clientX: 100, clientY: 0, button: 0 })
    await content.trigger('pointermove', { clientX: 0, clientY: 0 })
    await content.trigger('pointercancel')
    await content.trigger('pointerup')
    await wrapper.get('input').trigger('keydown', { key: 'ArrowLeft' })
    await wrapper.get('[contenteditable]').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('open')).toBeUndefined()
    await content.trigger('pointerdown', { clientX: 100, clientY: 0, button: 0 })
    await content.trigger('pointermove', { clientX: 0, clientY: 0 })
    await content.trigger('pointerup')
    expect(wrapper.emitted('open')).toEqual([['right']])
  })
})
