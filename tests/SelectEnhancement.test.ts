// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Select from '../src/components/Select/Select.vue'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import type { SelectOption } from '../src/components/Select/types'

const wrappers: VueWrapper[] = []
const OPTIONS: SelectOption[] = [{ label: 'Alpha', value: 'a' }, { label: 'Blocked', value: 'b', disabled: true }, { label: 'Charlie', value: 'c' }]
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
beforeEach(() => vi.useFakeTimers())
afterEach(async () => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  await flushPromises()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Select keyboard and fields', () => {
  it('ignores composition, shortcuts and consumed keys without changing the model or panel', async () => {
    const wrapper = mount(Select, { props: { options: OPTIONS, multiple: true, modelValue: ['a'], teleported: false } })
    wrappers.push(wrapper)
    const control = wrapper.get('[role="combobox"]')
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: 229 }]) {
      await control.trigger('keydown', { key: 'Backspace', ...options })
      await control.trigger('keydown', { key: 'ArrowDown', ...options })
    }
    const consumed = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    consumed.preventDefault()
    control.element.dispatchEvent(consumed)
    expect(control.attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('deduplicates controlled tags without changing the parent value and restores removed-button focus', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { options: OPTIONS, multiple: true, modelValue: ['a', 'a', 'c'], teleported: false } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('.scq-select__tag')).toHaveLength(2)
    expect(wrapper.props('modelValue')).toEqual(['a', 'a', 'c'])
    const remove = wrapper.get<HTMLButtonElement>('.scq-select__tag-close')
    remove.element.focus()
    await remove.trigger('click')
    expect(wrapper.emitted('change')?.[0]).toEqual([['c']])
    await wrapper.setProps({ modelValue: ['c'] })
    expect(document.activeElement).toBe(wrapper.get('[role="combobox"]').element)
  })

  it.each([{ pageSize: 0 }, { pageSize: 1.5 }, { debounce: Infinity }, { debounce: -1 }, { height: NaN }])('reports invalid geometry or scheduling: %j', props => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Select, { props })).toThrow('[scq-vue] Select')
  })

  it('opens a non-searchable combobox and navigates without choosing disabled options', async () => {
    const wrapper = mount(Select, { props: { options: OPTIONS, teleported: false } })
    wrappers.push(wrapper)
    const control = wrapper.get('[role="combobox"]')
    expect(control.attributes('tabindex')).toBe('0')
    await control.trigger('keydown', { key: 'ArrowDown' })
    expect(control.attributes('aria-controls')).toBe(wrapper.get('[role="listbox"]').attributes('id'))
    expect(wrapper.get('.is-active').text()).toBe('Alpha')
    await control.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.get('.is-active').text()).toBe('Charlie')
    expect(control.attributes('aria-activedescendant')).toBe(wrapper.get('.is-active').attributes('id'))
    await control.trigger('keydown', { key: 'Home' })
    expect(wrapper.get('.is-active').text()).toBe('Alpha')
    await control.trigger('keydown', { key: 'End' })
    await control.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('change')).toEqual([['c']])
    expect(control.attributes('aria-expanded')).toBe('false')
  })

  it('handles pointer opening before blur validation moves the control, without toggling twice', async () => {
    const wrapper = mount(Select, { props: { options: OPTIONS, teleported: false }, attachTo: document.body })
    wrappers.push(wrapper)
    const control = wrapper.get('[role="combobox"]')
    await control.trigger('mousedown', { button: 0 })
    control.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await nextTick()
    expect(control.attributes('aria-expanded')).toBe('true')
    await control.trigger('mousedown', { button: 0 })
    control.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await nextTick()
    expect(control.attributes('aria-expanded')).toBe('false')
  })

  it('supports typeahead, Escape, Tab and multiple-value Backspace', async () => {
    const wrapper = mount(Select, { props: { options: OPTIONS, multiple: true, modelValue: ['a', 'c'], teleported: false } })
    wrappers.push(wrapper)
    const control = wrapper.get('[role="combobox"]')
    await control.trigger('keydown', { key: 'c' })
    expect(wrapper.get('.is-active').text()).toContain('Charlie')
    await control.trigger('keydown', { key: 'Escape' })
    expect(control.attributes('aria-expanded')).toBe('false')
    await control.trigger('keydown', { key: 'Backspace' })
    expect(wrapper.emitted('change')).toEqual([[['a']]])
    await control.trigger('keydown', { key: 'ArrowUp' })
    await control.trigger('keydown', { key: 'Tab' })
    expect(control.attributes('aria-expanded')).toBe('false')
  })

  it('reveals the current selection when reopening instead of only pinning its DOM', async () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
    const scroll = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
    try {
      const wrapper = mount(Select, { props: { options: OPTIONS, modelValue: 'c', teleported: false }, attachTo: document.body })
      wrappers.push(wrapper)
      wrapper.vm.open()
      await flushPromises()
      expect(scroll.mock.contexts.some((element) => element instanceof HTMLElement && element.textContent?.includes('Charlie'))).toBe(true)
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', original)
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
    }
  })

  it('keeps numeric and string values separate and renders unknown selected values explicitly', async () => {
    const wrapper = mount(Select, { props: {
      options: [{ label: 'Number', value: 1 }, { label: 'String', value: '1' }],
      modelValue: [1, '1', 'unloaded'], multiple: true, teleported: false,
    } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('.scq-select__tag').map((tag) => tag.text().replace(/\s+/g, ' '))).toEqual(['Number ×', 'String ×', 'unloaded ×'])
    await wrapper.get('[role="combobox"]').trigger('click')
    const options = wrapper.findAll('[role="option"]')
    expect(options[0].attributes('id')).not.toBe(options[1].attributes('id'))
    expect(options.every((option) => option.attributes('aria-selected') === 'true')).toBe(true)
  })

  it('associates a searchable input with its field and enforces the form disabled constraint', async () => {
    const model = reactive({ city: null })
    const wrapper = mount(Form, { props: { model }, slots: {
      default: () => h(FormItem, { prop: 'city', label: 'City', error: 'Choose a city' }, {
        default: () => h(Select, { filterable: true, disabled: false, options: OPTIONS, modelValue: model.city, teleported: false }),
      }),
    }, attachTo: document.body })
    wrappers.push(wrapper)
    await nextTick()
    const select = wrapper.getComponent(Select)
    const input = select.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain(wrapper.get('.scq-form-item__error').attributes('id'))
    await wrapper.setProps({ disabled: true })
    expect(input.element.disabled).toBe(true)
    select.vm.open()
    await nextTick()
    expect(select.find('.scq-select__panel').exists()).toBe(false)
  })

  it('keeps readonly and disabled interactions inert while preserving imperative clear', async () => {
    const wrapper = mount(Select, { props: { readonly: true, modelValue: 'a', options: OPTIONS, teleported: false } })
    wrappers.push(wrapper)
    await wrapper.get('[role="combobox"]').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    wrapper.vm.clear()
    expect(wrapper.emitted('change')).toEqual([[null]])
  })

  it('commits IME search once and preserves composition across rerenders', async () => {
    const wrapper = mount(Select, { props: { filterable: true, options: [{ label: '中文', value: 'zh' }], teleported: false } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.trigger('compositionstart')
    input.element.value = '中'
    await input.trigger('input', { isComposing: true })
    await wrapper.setProps({ size: 'large' })
    expect(input.element.value).toBe('中')
    expect(wrapper.emitted('search')).toBeUndefined()
    input.element.value = '中文'
    await input.trigger('compositionend')
    await input.trigger('input', { isComposing: false })
    expect(wrapper.emitted('search')).toEqual([['中文']])
  })

  it('keeps the panel open while entering the pager and closes when focus leaves it', async () => {
    const wrapper = mount(Select, { props: { options: OPTIONS, pagination: true, pageSize: 1, teleported: false } })
    wrappers.push(wrapper)
    const control = wrapper.get('[role="combobox"]')
    await control.trigger('keydown', { key: 'ArrowDown' })
    const nextPage = wrapper.findAll('.scq-select__pager-btn')[1]
    await control.trigger('focusout', { relatedTarget: nextPage.element })
    expect(control.attributes('aria-expanded')).toBe('true')
    await nextPage.trigger('focusout', { relatedTarget: null })
    expect(control.attributes('aria-expanded')).toBe('false')
  })
})

describe('Select remote requests', () => {
  it('displays only the third query when earlier requests finish later', async () => {
    const pending = new Map<string, ReturnType<typeof deferred<SelectOption[]>>>()
    const remoteMethod = vi.fn((query: string, _page: number, _size: number, _signal: AbortSignal) => {
      if (!query) return Promise.resolve([])
      const request = deferred<SelectOption[]>()
      pending.set(query, request)
      return request.promise
    })
    const onError = vi.fn()
    const wrapper = mount(Select, { props: { remote: true, remoteMethod, filterable: true, debounce: 0, teleported: false, onError } })
    wrappers.push(wrapper)
    await flushPromises()
    const input = wrapper.get('input')
    await input.trigger('focus')
    for (const query of ['first', 'second', 'third']) {
      await input.setValue(query)
      await vi.advanceTimersByTimeAsync(0)
      await flushPromises()
    }
    expect(remoteMethod.mock.calls.find((call) => call[0] === 'first')![3].aborted).toBe(true)
    expect(remoteMethod.mock.calls.find((call) => call[0] === 'second')![3].aborted).toBe(true)
    pending.get('second')!.resolve([{ label: 'Obsolete second', value: 2 }])
    pending.get('third')!.resolve([{ label: 'Latest third', value: 3 }])
    await flushPromises()
    pending.get('first')!.reject(new Error('Obsolete failure'))
    await flushPromises()
    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['Latest third'])
    expect(onError).not.toHaveBeenCalled()
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(input.attributes('aria-busy')).toBeUndefined()
  })

  it('exposes failures and retries instead of displaying a success-shaped empty result', async () => {
    const request = deferred<SelectOption[]>()
    const failure = new Error('Offline')
    const remoteMethod = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValue([{ label: 'Recovered', value: 1 }])
    const onError = vi.fn()
    const wrapper = mount(Select, { props: { remote: true, remoteMethod, teleported: false, onError } })
    wrappers.push(wrapper)
    wrapper.vm.open()
    await flushPromises()
    request.reject(failure)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').exists()).toBe(true)
    expect(onError).toHaveBeenCalledWith(failure)
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="option"]').text()).toBe('Recovered')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('keeps selected labels across remote pages and invalidates source caches', async () => {
    const remoteMethod = vi.fn((_query: string, page: number) => Promise.resolve({
      list: [{ label: `Page ${page}`, value: page }], total: 2,
    }))
    const wrapper = mount(Select, { props: { remote: true, remoteMethod, multiple: true, modelValue: [1], pagination: true, pageSize: 1, teleported: false } })
    wrappers.push(wrapper)
    await flushPromises()
    wrapper.vm.open()
    await flushPromises()
    await wrapper.findAll('.scq-select__pager-btn')[1].trigger('click')
    await flushPromises()
    expect(wrapper.get('.scq-select__pager-text').text()).toBe('2 / 2')
    expect(wrapper.get('.scq-select__tag').text()).toContain('Page 1')
    expect(wrapper.get('[role="option"]').text()).toBe('Page 2')
    wrapper.vm.close()
    wrapper.vm.open()
    await flushPromises()
    expect(remoteMethod).toHaveBeenCalledTimes(2)
    const replacement = vi.fn().mockResolvedValue({ list: [{ label: 'New source', value: 1 }], total: 1 })
    await wrapper.setProps({ remoteMethod: replacement })
    await flushPromises()
    expect(wrapper.get('.scq-select__tag').text()).toContain('New source')
    expect(replacement).toHaveBeenCalledTimes(1)
  })

  it('cancels debounced, active and unmounted work without emitting errors', async () => {
    const request = deferred<SelectOption[]>()
    const remoteMethod = vi.fn((_query: string, _page: number, _size: number, _signal: AbortSignal) => request.promise)
    const onError = vi.fn()
    const wrapper = mount(Select, { props: { remote: true, remoteMethod, filterable: true, debounce: 100, teleported: false, onError } })
    wrappers.push(wrapper)
    await flushPromises()
    const signal = remoteMethod.mock.calls[0][3]
    await wrapper.get('input').setValue('scheduled')
    expect(signal.aborted).toBe(true)
    wrapper.vm.close()
    await vi.advanceTimersByTimeAsync(100)
    expect(remoteMethod).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    request.reject(new Error('Late'))
    await flushPromises()
    expect(onError).not.toHaveBeenCalled()
  })

  it('validates remote result shapes and explicit zero totals', async () => {
    const onError = vi.fn()
    const remoteMethod = vi.fn().mockResolvedValueOnce({ invalid: [] }).mockResolvedValue({ list: [], total: 0 })
    const wrapper = mount(Select, { props: { remote: true, remoteMethod, pagination: true, teleported: false, onError } })
    wrappers.push(wrapper)
    wrapper.vm.open()
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError))
    await wrapper.vm.refreshRemote()
    await flushPromises()
    expect(wrapper.find('.scq-select__pager').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('cancels an edited query when an external selection replaces the input label', async () => {
    const pending = deferred<SelectOption[]>()
    const remoteMethod = vi.fn((query: string, _page: number, _size: number, _signal: AbortSignal) =>
      query ? pending.promise : Promise.resolve(OPTIONS))
    const wrapper = mount(Select, { props: {
      modelValue: 'a', options: OPTIONS, remote: true, remoteMethod,
      filterable: true, debounce: 0, teleported: false,
    } })
    wrappers.push(wrapper)
    await flushPromises()
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.setValue('edited')
    await vi.advanceTimersByTimeAsync(0)
    const signal = remoteMethod.mock.calls.find(([query]) => query === 'edited')![3]
    await wrapper.setProps({ modelValue: 'c' })
    expect(signal.aborted).toBe(true)
    pending.resolve([{ label: 'Obsolete edited result', value: 'old' }])
    await flushPromises()
    expect(input.element.value).toBe('Charlie')
    expect(wrapper.findAll('[role="option"]').map((option) => option.get('span').text())).toEqual(['Alpha', 'Blocked', 'Charlie'])
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})
