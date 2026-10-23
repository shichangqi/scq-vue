// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AutoComplete from '../src/components/AutoComplete/AutoComplete.vue'
import type { AutoCompleteOption, AutoCompleteQueryContext } from '../src/components/AutoComplete'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import AutoCompleteOptionRow from '../src/components/AutoComplete/AutoCompleteOption.vue'
import { MAX_TIMEOUT_DELAY } from '../src/utils/async'

vi.mock('@floating-ui/dom', () => ({
  autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} },
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  offset: vi.fn(), flip: vi.fn(), shift: vi.fn(),
}))

const SETTINGS = { debounce: 30, cacheTtl: 100, minLength: 2, pageSize: 2 } as const
const OPTIONS: AutoCompleteOption[] = [
  { label: 'Alpha', value: 'a', group: 'People' },
  { label: 'Blocked', value: 'b', disabled: true, group: 'People' },
  { label: 'Charlie', value: 'c', group: 'Projects' },
]
const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
const dispose = (wrapper: VueWrapper) => { wrappers.splice(wrappers.indexOf(wrapper), 1); wrapper.unmount() }
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const groupBy = (option: AutoCompleteOption) => typeof option.group === 'string' ? option.group : undefined

beforeEach(() => vi.useFakeTimers())
afterEach(async () => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  await flushPromises()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('AutoComplete local suggestions', () => {
  it('preserves input shortcuts and composition events without selecting or opening', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: OPTIONS, teleport: false, highlightFirstItem: true } }))
    const input = wrapper.get('input')
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { keyCode: 229 }, { isComposing: true }]) {
      await input.trigger('keydown', { key: 'ArrowDown', ...options })
    }
    expect(input.attributes('aria-expanded')).toBe('false')
    await input.trigger('focus')
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { keyCode: 229 }]) {
      await input.trigger('keydown', { key: 'Enter', ...options })
    }
    const consumed = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    consumed.preventDefault()
    input.element.dispatchEvent(consumed)
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('rejects stale option events and makes refresh inert after unmount', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: OPTIONS, teleport: false } }))
    await wrapper.get('input').trigger('focus')
    const row = wrapper.findComponent(AutoCompleteOptionRow)
    await wrapper.setProps({ options: [{ value: 'a', label: 'Replacement', disabled: true }] })
    row.vm.$emit('select', OPTIONS[0])
    expect(wrapper.emitted('select')).toBeUndefined()
    const refresh = wrapper.vm.refresh
    dispose(wrapper)
    expect(await refresh()).toBe(false)
  })

  it('rejects timer overflow rather than issuing an immediate remote query', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(AutoComplete, { props: { debounce: MAX_TIMEOUT_DELAY + 1 } })).toThrow('debounce')
  })

  it('preserves default filtering, events and value submission when labels differ', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: OPTIONS, teleport: false } }))
    const input = wrapper.get('input')
    expect(input.attributes('aria-controls')).toBeUndefined()
    await input.setValue('al')
    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['Alpha'])
    expect(wrapper.find('mark').exists()).toBe(false)
    expect(wrapper.find('.scq-auto-complete__group').exists()).toBe(false)
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-controls')).toBe(wrapper.get('[role="listbox"]').attributes('id'))
    expect(input.attributes('aria-activedescendant')).toBe(wrapper.get('[role="option"]').attributes('id'))
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['al'], ['a']])
    expect(wrapper.emitted('input')).toEqual([['al']])
    expect(wrapper.emitted('change')).toEqual([['a']])
    expect(wrapper.emitted('select')).toEqual([[OPTIONS[0]]])
    expect(input.element.value).toBe('a')
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('groups suggestions without making headings or disabled options selectable', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: OPTIONS, groupBy, teleport: false } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    expect(wrapper.findAll('.scq-auto-complete__group').map((group) => group.text())).toEqual(['People', 'Projects'])
    expect(wrapper.findAll('[role="option"]')).toHaveLength(OPTIONS.length)
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.get('[aria-selected="true"]').attributes('aria-label')).toBe('People: Alpha')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Charlie')
    await input.trigger('keydown', { key: 'Home' })
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Alpha')
    await input.trigger('keydown', { key: 'End' })
    expect(wrapper.get('[aria-selected="true"]').attributes('aria-posinset')).toBe('3')
    await input.trigger('keydown', { key: 'Escape' })
    expect(input.attributes('aria-expanded')).toBe('false')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Charlie')
  })

  it('supports custom filtering and highlights literal matches without interpreting HTML or regex', async () => {
    const options = [{ label: '<b>A+B</b> a+b', value: 'mail', group: 'Custom' }]
    const filterMethod = vi.fn((query: string, option: AutoCompleteOption) => query === 'a+b' || option.value.includes(query))
    const wrapper = track(mount(AutoComplete, { props: { options, filterMethod, highlightMatch: true, teleport: false } }))
    await wrapper.get('input').setValue('a+b')
    expect(filterMethod).toHaveBeenCalledWith('a+b', options[0])
    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['A+B', 'a+b'])
    expect(wrapper.get('[role="option"]').text()).toBe('<b>A+B</b> a+b')
    expect(wrapper.find('b').exists()).toBe(false)
    await wrapper.get('input').setValue('mail')
    expect(wrapper.get('[role="option"]').text()).toBe(options[0].label)
    expect(wrapper.findAll('mark')).toHaveLength(0)
  })

  it('preserves option, group and empty slots', async () => {
    const wrapper = track(mount(AutoComplete, {
      props: { options: OPTIONS, groupBy, teleport: false, highlightMatch: true },
      slots: {
        default: ({ option, index }) => h('strong', `${index}:${option.value}`),
        group: ({ group }) => h('em', group),
        empty: () => h('span', 'No suggestions'),
      },
    }))
    await wrapper.get('input').trigger('focus')
    expect(wrapper.findAll('[role="option"] strong').map((option) => option.text())).toEqual(['0:a', '1:b', '2:c'])
    expect(wrapper.findAll('.scq-auto-complete__group em')).toHaveLength(2)
    await wrapper.get('input').setValue('missing')
    expect(wrapper.get('[role="listbox"]').text()).toBe('No suggestions')
  })

  it('keeps the active option across reordering and reconciles disabled or removed options', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: OPTIONS, teleport: false } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'End' })
    await wrapper.setProps({ options: [OPTIONS[2], OPTIONS[0], OPTIONS[1]] })
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Charlie')
    expect(input.attributes('aria-activedescendant')).toBe(wrapper.get('[aria-selected="true"]').attributes('id'))
    await wrapper.setProps({ options: [{ ...OPTIONS[2], disabled: true }, OPTIONS[0]] })
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Alpha')
    await wrapper.setProps({ options: [] })
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
  })

  it('keeps duplicate values renderable with distinct IDs', async () => {
    const wrapper = track(mount(AutoComplete, { props: {
      options: [{ value: 'same', label: 'First' }, { value: 'same', label: 'Second' }], teleport: false,
    } }))
    await wrapper.get('input').trigger('focus')
    const options = wrapper.findAll('[role="option"]')
    expect(options).toHaveLength(2)
    expect(options[0].attributes('id')).not.toBe(options[1].attributes('id'))
    await options[1].trigger('click')
    expect(wrapper.emitted('select')?.[0][0]).toEqual({ value: 'same', label: 'Second' })
  })

  it('does not query on focus or click when showOnFocus is disabled', async () => {
    const fetchSuggestions = vi.fn().mockResolvedValue(OPTIONS)
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, showOnFocus: false, debounce: 0, teleport: false } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.trigger('click')
    await flushPromises()
    expect(fetchSuggestions).not.toHaveBeenCalled()
    expect(input.attributes('aria-expanded')).toBe('false')
    await input.setValue('a')
    await flushPromises()
    expect(fetchSuggestions).toHaveBeenCalledTimes(1)
  })

  it('clamps a local page after options shrink without changing the input value', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: OPTIONS, pagination: true, pageSize: 1, teleport: false } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'PageDown' })
    await input.trigger('keydown', { key: 'PageDown' })
    expect(wrapper.get('.scq-auto-complete__pager span').text()).toBe('3 / 3')
    await wrapper.setProps({ options: [OPTIONS[0]] })
    await nextTick()
    expect(wrapper.get('[role="option"]').text()).toBe('Alpha')
    expect(wrapper.find('.scq-auto-complete__pager').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('AutoComplete field and composition protocol', () => {
  it('links the actual input, tracks field state and enforces form disabled constraints', async () => {
    const model = reactive({ member: '' })
    const wrapper = track(mount(Form, { props: { model, showErrorSummary: true, focusOnError: true }, slots: {
      default: () => h(FormItem, { prop: 'member', label: 'Member', help: 'Choose a member', rules: { required: true, message: 'Required member' } }, {
        default: () => h(AutoComplete, {
          modelValue: model.member, 'onUpdate:modelValue': (value) => { model.member = value },
          options: OPTIONS, disabled: false, teleport: false, 'data-field': 'member',
        }),
      }),
    }, attachTo: document.body }))
    const input = wrapper.get('input')
    await nextTick()
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-labelledby')).toBe(wrapper.get('label').attributes('id'))
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('.scq-form-item__help').attributes('id'))
    expect(wrapper.get('.scq-auto-complete').attributes('data-field')).toBe('member')
    expect(wrapper.get('.scq-auto-complete').attributes('id')).toBeUndefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain(wrapper.get('.scq-form-item__error').attributes('id'))
    expect(document.activeElement).toBe(input.element)
    await input.setValue('Alpha')
    await input.trigger('blur')
    await flushPromises()
    expect(wrapper.vm.getFieldState('member')).toMatchObject({ dirty: true, touched: true, pending: false })
    await wrapper.vm.resetFields()
    expect(input.element.value).toBe('')
    expect(wrapper.vm.state).toMatchObject({ dirty: false, touched: false })
    await wrapper.setProps({ disabled: true })
    expect(input.element.disabled).toBe(true)
    expect(await wrapper.getComponent(AutoComplete).vm.refresh()).toBe(false)
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('forwards explicit accessibility attributes and preserves ConfigProvider overrides', async () => {
    const wrapper = track(mount(ConfigProvider, { props: { disabled: true, size: 'small', locale: 'en-US' }, slots: {
      default: () => h(AutoComplete, { disabled: false, id: 'member-input', 'aria-label': 'Member query', 'aria-describedby': 'external-help', options: OPTIONS, teleport: false }),
    } }))
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('member-input')
    expect(input.attributes('aria-label')).toBe('Member query')
    expect(input.attributes('aria-describedby')).toBe('external-help')
    expect(input.element.disabled).toBe(false)
    expect(wrapper.get('.scq-field').classes()).toContain('scq-field--small')
    await input.trigger('focus')
    expect(wrapper.get('[role="listbox"]').attributes('aria-label')).toBe('Member query')
    await input.setValue('a')
    expect(wrapper.get('.scq-field__clear').attributes('aria-label')).toBe('Clear')
  })

  it('aborts pre-composition work and commits IME text once after an unrelated rerender', async () => {
    const pending = deferred<AutoCompleteOption[]>()
    const fetchSuggestions = vi.fn((_query: string, _signal: AbortSignal) => pending.promise)
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, debounce: 0, teleport: false } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await flushPromises()
    const signal = fetchSuggestions.mock.calls[0][1]
    await input.trigger('compositionstart')
    expect(signal.aborted).toBe(true)
    input.element.value = '\u4e2d'
    await input.trigger('input', { isComposing: true })
    await wrapper.setProps({ size: 'large' })
    expect(input.element.value).toBe('\u4e2d')
    expect(wrapper.emitted('input')).toBeUndefined()
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    input.element.value = '\u4e2d\u6587'
    await input.trigger('compositionend')
    await input.trigger('input', { isComposing: false })
    await flushPromises()
    expect(wrapper.emitted('input')).toEqual([['\u4e2d\u6587']])
    expect(fetchSuggestions).toHaveBeenCalledTimes(2)
    pending.resolve([])
    await flushPromises()
  })

  it('keeps a teleported pager inside the field and closes when focus leaves it', async () => {
    const model = reactive({ member: '' })
    const wrapper = track(mount(Form, { props: { model }, slots: {
      default: () => [
        h(FormItem, { prop: 'member', label: 'Member' }, { default: () => h(AutoComplete, { options: OPTIONS, pagination: true, pageSize: 1 }) }),
        h('button', { type: 'button', class: 'outside-field' }, 'Outside'),
      ],
    }, attachTo: document.body }))
    const input = wrapper.get('input')
    input.element.focus()
    await nextTick()
    const nextPage = document.querySelectorAll<HTMLButtonElement>('.scq-auto-complete__pager button')[1]
    nextPage.focus()
    await nextTick()
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(wrapper.vm.getFieldState('member')?.touched).toBe(false)
    wrapper.get<HTMLButtonElement>('.outside-field').element.focus()
    await nextTick()
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.vm.getFieldState('member')?.touched).toBe(true)
  })

  it('closes from a pager Escape without reopening when focus is restored', async () => {
    const wrapper = track(mount(AutoComplete, { props: { options: OPTIONS, pagination: true, pageSize: 1 }, attachTo: document.body }))
    const input = wrapper.get('input')
    input.element.focus()
    await flushPromises()
    const nextPage = document.querySelectorAll<HTMLButtonElement>('.scq-auto-complete__pager button')[1]
    nextPage.focus()
    nextPage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(input.element)
    expect(input.attributes('aria-expanded')).toBe('false')
  })
})

describe('AutoComplete remote suggestions', () => {
  it('enforces minimum length and deduplicates scheduled and active identical queries', async () => {
    const pending = deferred<AutoCompleteOption[]>()
    const fetchSuggestions = vi.fn((_query: string, _signal: AbortSignal) => pending.promise)
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, minLength: SETTINGS.minLength, debounce: SETTINGS.debounce, teleport: false } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.setValue('a')
    await vi.advanceTimersByTimeAsync(SETTINGS.debounce)
    expect(fetchSuggestions).not.toHaveBeenCalled()
    expect(input.attributes('aria-expanded')).toBe('false')
    await input.setValue('ab')
    await input.trigger('focus')
    expect(input.attributes('aria-busy')).toBe('true')
    await vi.advanceTimersByTimeAsync(SETTINGS.debounce)
    await input.trigger('focus')
    await input.trigger('click')
    await vi.advanceTimersByTimeAsync(SETTINGS.debounce)
    expect(fetchSuggestions).toHaveBeenCalledTimes(1)
    expect(fetchSuggestions.mock.calls[0][1].aborted).toBe(false)
    await wrapper.get('.scq-field__clear').trigger('click')
    expect(input.element.value).toBe('')
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(fetchSuggestions.mock.calls[0][1].aborted).toBe(true)
    pending.resolve(OPTIONS)
    await flushPromises()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('applies only the third query when older results or failures arrive last', async () => {
    const pending = new Map<string, ReturnType<typeof deferred<AutoCompleteOption[]>>>()
    const fetchSuggestions = vi.fn((query: string, _signal: AbortSignal) => {
      const request = deferred<AutoCompleteOption[]>()
      pending.set(query, request)
      return request.promise
    })
    const onError = vi.fn()
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, debounce: 0, teleport: false, onError } }))
    const input = wrapper.get('input')
    for (const query of ['first', 'second', 'third']) { await input.setValue(query); await flushPromises() }
    expect(fetchSuggestions.mock.calls.slice(0, -1).every(([, signal]) => signal.aborted)).toBe(true)
    pending.get('second')!.resolve([{ value: 'Obsolete second' }])
    pending.get('third')!.resolve([{ value: 'Latest third' }])
    await flushPromises()
    pending.get('first')!.reject(new Error('Obsolete failure'))
    await flushPromises()
    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['Latest third'])
    expect(onError).not.toHaveBeenCalled()
    expect(input.attributes('aria-busy')).toBeUndefined()
  })

  it.each(['close', 'blur', 'disabled', 'readonly', 'unmount', 'outside'] as const)('cancels active work on %s and isolates late failures', async (action) => {
    const pending = deferred<AutoCompleteOption[]>()
    const fetchSuggestions = vi.fn((_query: string, _signal: AbortSignal) => pending.promise)
    const onError = vi.fn()
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, debounce: 0, onError }, attachTo: document.body }))
    await wrapper.get('input').setValue('pending')
    await flushPromises()
    const signal = fetchSuggestions.mock.calls[0][1]
    if (action === 'close') wrapper.vm.close()
    else if (action === 'blur') await wrapper.get('input').trigger('blur')
    else if (action === 'unmount') dispose(wrapper)
    else if (action === 'outside') document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    else await wrapper.setProps({ [action]: true })
    await nextTick()
    expect(signal.aborted).toBe(true)
    pending.reject(new Error('Late failure'))
    await flushPromises()
    expect(onError).not.toHaveBeenCalled()
    expect(document.querySelector('.scq-auto-complete__content')).toBeNull()
  })

  it('cancels a scheduled provider before closing or unmounting', async () => {
    const fetchSuggestions = vi.fn().mockResolvedValue(OPTIONS)
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, debounce: SETTINGS.debounce, teleport: false } }))
    await wrapper.get('input').setValue('scheduled')
    wrapper.vm.close()
    await vi.advanceTimersByTimeAsync(SETTINGS.debounce)
    expect(fetchSuggestions).not.toHaveBeenCalled()
    await wrapper.get('input').setValue('unmounted')
    dispose(wrapper)
    await vi.advanceTimersByTimeAsync(SETTINGS.debounce)
    expect(fetchSuggestions).not.toHaveBeenCalled()
  })

  it('invalidates the old request on external model changes without emitting input events', async () => {
    const pending = deferred<AutoCompleteOption[]>()
    const fetchSuggestions = vi.fn((query: string, _signal: AbortSignal) => query === 'old' ? pending.promise : [{ value: query }])
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, debounce: 0, teleport: false } }))
    await wrapper.get('input').setValue('old')
    await flushPromises()
    const signal = fetchSuggestions.mock.calls[0][1]
    await wrapper.setProps({ modelValue: 'external' })
    await flushPromises()
    expect(signal.aborted).toBe(true)
    pending.resolve([{ value: 'obsolete' }])
    await flushPromises()
    expect(wrapper.get('input').element.value).toBe('external')
    expect(wrapper.get('[role="option"]').text()).toBe('external')
    expect(wrapper.emitted('input')).toEqual([['old']])
  })

  it('retains legacy two-argument providers and leaves completed-result caching disabled by default', async () => {
    const fetchSuggestions = vi.fn((query: string, signal: AbortSignal) => signal.aborted ? [] : [{ value: query || 'Default' }])
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, debounce: 0, teleport: false } }))
    await wrapper.get('input').trigger('focus')
    await flushPromises()
    await wrapper.get('input').trigger('focus')
    await flushPromises()
    expect(fetchSuggestions).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[role="option"]').text()).toBe('Default')
  })

  it('expires caches at the configured boundary and supports force refresh and source invalidation', async () => {
    const fetchSuggestions = vi.fn((query: string) => [{ value: query }])
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, cacheTtl: SETTINGS.cacheTtl, debounce: 0, teleport: false } }))
    const input = wrapper.get('input')
    for (const value of ['first', 'second', 'first']) { await input.setValue(value); await flushPromises() }
    expect(fetchSuggestions).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(SETTINGS.cacheTtl)
    await input.trigger('focus')
    await flushPromises()
    expect(fetchSuggestions).toHaveBeenCalledTimes(3)
    expect(await wrapper.vm.refresh()).toBe(true)
    expect(fetchSuggestions).toHaveBeenCalledTimes(4)
    wrapper.vm.clearCache()
    await input.trigger('focus')
    await flushPromises()
    expect(fetchSuggestions).toHaveBeenCalledTimes(5)
    const replacement = vi.fn().mockResolvedValue([{ value: 'Replacement' }])
    await wrapper.setProps({ fetchSuggestions: replacement })
    await flushPromises()
    expect(wrapper.get('[role="option"]').text()).toBe('Replacement')
    expect(replacement).toHaveBeenCalledTimes(1)
  })

  it('does not resurrect a cached success after a forced refresh fails', async () => {
    const onError = vi.fn()
    const failure = new Error('Offline')
    const fetchSuggestions = vi.fn().mockResolvedValueOnce(OPTIONS).mockRejectedValue(failure)
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, onError, cacheTtl: SETTINGS.cacheTtl, debounce: 0, teleport: false } }))
    await wrapper.get('input').trigger('focus')
    await flushPromises()
    expect(await wrapper.vm.refresh()).toBe(false)
    wrapper.vm.close()
    await wrapper.get('input').trigger('focus')
    await flushPromises()
    expect(fetchSuggestions).toHaveBeenCalledTimes(3)
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
    expect(wrapper.get('[role="alert"]').text()).toContain('\u52a0\u8f7d\u5931\u8d25')
  })

  it('settles a cancelled refresh even when the provider ignores the abort signal', async () => {
    const pending = deferred<AutoCompleteOption[]>()
    const onError = vi.fn()
    const fetchSuggestions = vi.fn((_query: string, _signal: AbortSignal) => pending.promise)
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, onError, teleport: false } }))
    const result = wrapper.vm.refresh()
    await flushPromises()
    wrapper.vm.close()
    expect(await result).toBe(false)
    expect(fetchSuggestions.mock.calls[0][1].aborted).toBe(true)
    pending.reject(new Error('Late failure'))
    await flushPromises()
    expect(onError).not.toHaveBeenCalled()
  })

  it('logs unhandled current provider failures in addition to showing retry', async () => {
    const failure = new Error('Offline')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions: () => { throw failure }, debounce: 0, teleport: false } }))
    await wrapper.get('input').trigger('focus')
    await flushPromises()
    expect(log).toHaveBeenCalledWith('[scq-vue] Async guard failed', failure)
    expect(wrapper.emitted('error')).toEqual([[failure]])
    expect(wrapper.get('[role="alert"] button').exists()).toBe(true)
  })

  it.each([undefined, null, { invalid: [] }, { list: [{ value: 7 }] }, { list: [], total: -1 }, { list: [], total: 1.5 }])('reports invalid results and retries successfully: %j', async (invalid) => {
    const onError = vi.fn()
    const fetchSuggestions = vi.fn().mockResolvedValueOnce(invalid).mockResolvedValue({ list: [], total: 0 })
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, onError, debounce: 0, pagination: true, teleport: false } }))
    await wrapper.get('input').trigger('focus')
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError))
    expect(wrapper.get('[role="alert"]').text()).toContain('\u52a0\u8f7d\u5931\u8d25')
    expect(wrapper.get('[role="alert"] button').text()).toBe('\u91cd\u8bd5')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('.scq-auto-complete__pager').exists()).toBe(false)
  })

  it('paginates with the third context argument and preserves a still-present active value', async () => {
    const fetchSuggestions = vi.fn((_query: string, _signal: AbortSignal, { page, pageSize }: AutoCompleteQueryContext) => ({
      list: page === 1 ? [{ value: 'a', label: 'Alpha' }, { value: 'shared', label: 'Shared first' }]
        : [{ value: 'shared', label: 'Shared second' }, { value: 'c', label: 'Charlie' }],
      total: pageSize * 2,
    }))
    const wrapper = track(mount(AutoComplete, { props: {
      fetchSuggestions, debounce: 0, pagination: true, pageSize: SETTINGS.pageSize, teleport: false, cacheTtl: SETTINGS.cacheTtl,
    } }))
    const input = wrapper.get('input')
    await input.trigger('focus')
    await flushPromises()
    await input.trigger('keydown', { key: 'End' })
    await input.trigger('keydown', { key: 'PageDown' })
    await flushPromises()
    expect(fetchSuggestions.mock.calls[1][1]).toBeInstanceOf(AbortSignal)
    expect(fetchSuggestions.mock.calls[1][2]).toEqual({ page: 2, pageSize: SETTINGS.pageSize })
    expect(wrapper.get('.scq-auto-complete__pager span').text()).toBe('2 / 2')
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Shared second')
    expect(input.attributes('aria-activedescendant')).toBe(wrapper.get('[aria-selected="true"]').attributes('id'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await input.trigger('keydown', { key: 'PageUp' })
    await flushPromises()
    expect(fetchSuggestions).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Shared first')
    await wrapper.setProps({ pageSize: 1 })
    await flushPromises()
    expect(fetchSuggestions.mock.calls.at(-1)?.[2]).toEqual({ page: 1, pageSize: 1 })
    expect(wrapper.emitted('page-change')).toEqual([[2], [1]])
  })

  it('retries a failed page rather than resetting to the first page', async () => {
    const onError = vi.fn()
    const failure = new Error('Offline')
    const fetchSuggestions = vi.fn()
      .mockResolvedValueOnce({ list: [{ value: 'First' }], total: 2 })
      .mockRejectedValueOnce(failure)
      .mockResolvedValue({ list: [{ value: 'Second' }], total: 2 })
    const wrapper = track(mount(AutoComplete, { props: { fetchSuggestions, onError, debounce: 0, pagination: true, pageSize: 1, teleport: false } }))
    await wrapper.get('input').trigger('focus')
    await flushPromises()
    await wrapper.get('input').trigger('keydown', { key: 'PageDown' })
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(failure)
    expect(await wrapper.vm.retry()).toBe(true)
    expect(fetchSuggestions.mock.calls.at(-1)?.[2]).toEqual({ page: 2, pageSize: 1 })
    expect(wrapper.get('[role="option"]').text()).toBe('Second')
  })
})
