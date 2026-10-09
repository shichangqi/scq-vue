// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DatePicker from '../src/components/DatePicker/DatePicker.vue'
import TimePicker from '../src/components/TimePicker/TimePicker.vue'
import Slider from '../src/components/Slider/Slider.vue'
import Rate from '../src/components/Rate/Rate.vue'
import AutoComplete, { type AutoCompleteOption } from '../src/components/AutoComplete/AutoComplete.vue'
import Transfer from '../src/components/Transfer/Transfer.vue'
import Upload, { type UploadFile, type UploadRequestOptions } from '../src/components/Upload/Upload.vue'
import Cascader from '../src/components/Cascader/Cascader.vue'
import TreeSelect from '../src/components/TreeSelect/TreeSelect.vue'

vi.mock('@floating-ui/dom', () => ({ autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} }, computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }), offset: vi.fn(), flip: vi.fn(), shift: vi.fn() }))
const wrappers: VueWrapper[] = []
afterEach(() => { wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.restoreAllMocks(); vi.useRealTimers() })

describe('DatePicker', () => {
  it('selects a range and closes only after the second valid date', async () => {
    const wrapper = mount(DatePicker, { props: { type: 'daterange', minDate: '2026-10-01', maxDate: '2026-10-31', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    await wrapper.get('[data-date="2026-10-10"]').trigger('click')
    expect(wrapper.find('.scq-calendar').exists()).toBe(true)
    await wrapper.get('[data-date="2026-10-12"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['2026-10-10', '2026-10-12']])
    expect(wrapper.find('.scq-calendar').exists()).toBe(false)
    await wrapper.get('.scq-field__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})

describe('TimePicker', () => {
  it('validates bounds and controlled ranges', async () => {
    const wrapper = mount(TimePicker, { props: { modelValue: ['09:00', '17:00'], isRange: true, min: '08:00', max: '20:00' } })
    wrappers.push(wrapper)
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('18:00')
    expect(wrapper.emitted('invalid')).toEqual([['18:00']])
    expect(inputs[0].element.value).toBe('09:00')
    await inputs[1].setValue('18:00')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['09:00', '18:00']]])
    await inputs[0].setValue('07:00')
    expect(wrapper.emitted('invalid')).toHaveLength(2)
  })
})

describe('Slider', () => {
  it('normalizes decimal steps and preserves ordered range handles', async () => {
    const wrapper = mount(Slider, { props: { modelValue: .2, min: 0, max: 1, step: .1 } })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue('.3')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([.3])
    expect(wrapper.emitted('change')?.[0]).toEqual([.3])
    await wrapper.setProps({ range: true, modelValue: [.2, .8] })
    const inputs = wrapper.findAll('input')
    expect(inputs.every((input) => input.attributes('min') === '0' && input.attributes('max') === '1')).toBe(true)
    expect(inputs[0].attributes('aria-valuemax')).toBe('0.8')
    expect(inputs[1].attributes('aria-valuemin')).toBe('0.2')
    await inputs[1].setValue('.9')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[.2, .9]])
    await inputs[0].setValue('1')
    expect(wrapper.emitted('update:modelValue')?.[2]).toEqual([[.8, .8]])
    expect(inputs[0].element.value).toBe('0.8')
  })
})

describe('Rate', () => {
  it('supports half-step keyboard selection, clearing and readonly state', async () => {
    const wrapper = mount(Rate, { props: { allowHalf: true } })
    wrappers.push(wrapper)
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[.5]])
    await wrapper.trigger('keydown', { key: 'End' })
    expect(wrapper.attributes('aria-valuenow')).toBe('5')
    await wrapper.findAll('button')[4].trigger('click')
    expect(wrapper.attributes('aria-valuenow')).toBe('0')
    await wrapper.setProps({ readonly: true })
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('change')).toHaveLength(3)
  })
})

describe('AutoComplete', () => {
  it('ignores stale asynchronous suggestions and aborts replaced requests', async () => {
    vi.useFakeTimers()
    const resolvers: ((value: AutoCompleteOption[]) => void)[] = []
    const signals: AbortSignal[] = []
    const fetchSuggestions = vi.fn((_query: string, signal: AbortSignal) => { signals.push(signal); return new Promise<AutoCompleteOption[]>((resolve) => resolvers.push(resolve)) })
    const wrapper = mount(AutoComplete, { props: { fetchSuggestions, debounce: 20, teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue('old')
    await vi.advanceTimersByTimeAsync(20)
    await wrapper.get('input').setValue('new')
    await vi.advanceTimersByTimeAsync(20)
    expect(signals[0].aborted).toBe(true)
    resolvers[1]([{ value: 'new result' }])
    await flushPromises()
    resolvers[0]([{ value: 'old result' }])
    await flushPromises()
    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['new result'])
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')?.[0][0]).toEqual({ value: 'new result' })
  })

  it('does not commit text during IME composition', async () => {
    const wrapper = mount(AutoComplete, { props: { teleport: false } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '\u6587'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await input.trigger('compositionend')
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toEqual([['\u6587']])
  })
})

describe('Transfer', () => {
  it('moves filtered enabled selections without moving disabled rows', async () => {
    const wrapper = mount(Transfer, { props: { filterable: true, data: [{ key: 1, label: 'Alpha' }, { key: 2, label: 'Beta', disabled: true }, { key: 3, label: 'Alpine' }] } })
    wrappers.push(wrapper)
    await wrapper.findAll('input[type="search"]')[0].setValue('Al')
    await wrapper.findAll('header input')[0].setValue(true)
    await wrapper.findAll('.scq-transfer__actions button')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 3]]])
    expect(wrapper.emitted('change')?.[0]).toEqual([[1, 3], 'right', [1, 3]])
    await wrapper.findAll('header input')[1].setValue(true)
    await wrapper.findAll('.scq-transfer__actions button')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[]])
  })
})

describe('Upload', () => {
  it('validates size, accept and limits before sending requests', async () => {
    const wrapper = mount(Upload, { props: { accept: '.txt', maxSize: 3, limit: 1, autoUpload: false } })
    wrappers.push(wrapper)
    wrapper.vm.addFiles([new File(['x'], 'image.png', { type: 'image/png' })])
    wrapper.vm.addFiles([new File(['long'], 'large.txt', { type: 'text/plain' })])
    expect(wrapper.emitted('reject')?.map((event) => event[1])).toEqual(['type', 'size'])
    wrapper.vm.addFiles([new File(['ok'], 'one.txt', { type: 'text/plain' })])
    wrapper.vm.addFiles([new File(['ok'], 'two.txt', { type: 'text/plain' })])
    expect(wrapper.emitted('exceed')).toHaveLength(1)
    await flushPromises()
    expect(wrapper.findAll('.scq-upload__list li')).toHaveLength(1)
    expect(wrapper.get('.scq-upload__trigger').text()).toContain('\u9009\u62e9\u6587\u4ef6')
    expect(wrapper.get('.scq-upload__action').attributes('aria-label')).toBe('\u4e0a\u4f20 one.txt')
  })

  it('reports progress, cancels requests and ignores late success', async () => {
    let request!: UploadRequestOptions
    let resolve!: (value: unknown) => void
    const httpRequest = vi.fn((options: UploadRequestOptions) => { request = options; return new Promise((complete) => { resolve = complete }) })
    const wrapper = mount(Upload, { props: { httpRequest } })
    wrappers.push(wrapper)
    wrapper.vm.addFiles([new File(['data'], 'report.txt')])
    await flushPromises()
    request.onProgress(48)
    expect(wrapper.emitted('progress')?.[0][0]).toBe(48)
    wrapper.vm.abort()
    expect(request.signal.aborted).toBe(true)
    resolve({ ok: true })
    await flushPromises()
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(wrapper.emitted('abort')).toHaveLength(1)
    const file = (wrapper.emitted('update:fileList')!.at(-1)![0] as UploadFile[])[0]
    expect(file.status).toBe('cancelled')
  })

  it('handles failed uploads, retry and asynchronous removal guards', async () => {
    const httpRequest = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true })
    const beforeRemove = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    const wrapper = mount(Upload, { props: { httpRequest, beforeRemove } })
    wrappers.push(wrapper)
    wrapper.vm.addFiles([new File(['data'], 'report.txt')])
    await flushPromises()
    expect(wrapper.emitted('error')).toHaveLength(1)
    await wrapper.vm.submit()
    expect(wrapper.emitted('success')).toHaveLength(1)
    const file = (wrapper.emitted('update:fileList')!.at(-1)![0] as UploadFile[])[0]
    await wrapper.vm.remove(file.uid)
    expect(wrapper.emitted('remove')).toBeUndefined()
    await wrapper.vm.remove(file.uid)
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })
})

describe('Cascader', () => {
  it('emits complete paths and filters by ancestor labels', async () => {
    const wrapper = mount(Cascader, { props: { filterable: true, teleport: false, options: [{ value: 'parent', label: 'Parent', children: [{ value: 'leaf', label: 'Leaf' }, { value: 'blocked', label: 'Blocked', disabled: true }] }] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await wrapper.get('.scq-cascader__columns button').trigger('click')
    expect(wrapper.findAll('.scq-cascader__columns ul')).toHaveLength(2)
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.findAll('.scq-cascader__columns ul')[1].get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['parent', 'leaf']]])
    await wrapper.get('.scq-field__trigger').trigger('click')
    await wrapper.get('input[type="search"]').setValue('Parent')
    expect(wrapper.findAll('.scq-cascader__results button')).toHaveLength(1)
  })
})

describe('TreeSelect', () => {
  it('does not select lazily loaded parents when restricted to leaves', async () => {
    const wrapper = mount(TreeSelect, { props: { leafOnly: true, teleport: false, data: [{ key: 'parent', label: 'Parent' }], load: async () => [{ key: 'leaf', label: 'Leaf', isLeaf: true }] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await wrapper.get('.scq-tree__toggle').trigger('click')
    await flushPromises()
    await wrapper.findAll('[role="treeitem"]')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.findAll('[role="treeitem"]')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['leaf']])
  })

  it('supports selection, filtering and controlled clearing', async () => {
    const wrapper = mount(TreeSelect, { props: { filterable: true, teleport: false, data: [{ key: 1, label: 'Engineering', children: [{ key: 2, label: 'Platform' }] }] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await wrapper.get('input[type="search"]').setValue('Platform')
    await wrapper.findAll('[role="treeitem"]')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
    expect(wrapper.get('.scq-field__value').text()).toBe('Platform')
    await wrapper.get('.scq-field__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([null])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})