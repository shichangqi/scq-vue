// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, h, nextTick, Teleport } from 'vue'
import { configKey, type ComponentConfig } from '../src/components/ConfigProvider/context'
import { shift } from '@floating-ui/dom'
import * as floating from '@floating-ui/dom'
import DatePicker from '../src/components/DatePicker/DatePicker.vue'
import TimePicker from '../src/components/TimePicker/TimePicker.vue'
import Slider from '../src/components/Slider/Slider.vue'
import Rate from '../src/components/Rate/Rate.vue'
import AutoComplete, { type AutoCompleteOption } from '../src/components/AutoComplete/AutoComplete.vue'
import Transfer from '../src/components/Transfer/Transfer.vue'
import Upload, { type UploadFile, type UploadRequestOptions } from '../src/components/Upload/Upload.vue'
import Cascader from '../src/components/Cascader/Cascader.vue'
import TreeSelect from '../src/components/TreeSelect/TreeSelect.vue'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import { COMPOSITION_KEY_CODE } from '../src/utils/composition'

vi.mock('@floating-ui/dom', () => ({ autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} }, computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }), offset: vi.fn(), flip: vi.fn(), shift: vi.fn() }))
const wrappers: VueWrapper[] = []
afterEach(() => { wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.restoreAllMocks(); vi.useRealTimers() })

describe('DatePicker', () => {
  it('focuses the active date on keyboard opening and restores the trigger on Escape', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { modelValue: '2026-10-15', teleport: false } })
    wrappers.push(wrapper)
    const trigger = wrapper.get<HTMLButtonElement>('.scq-field__trigger')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-15')
    await wrapper.get('[data-date="2026-10-15"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('lets an explicitly enabled picker select dates under a disabled provider', async () => {
    const config = computed<ComponentConfig>(() => ({ size: 'default', disabled: true, locale: 'en-US', theme: 'light' }))
    const wrapper = mount(DatePicker, {
      props: { disabled: false, teleport: false, modelValue: '2026-10-15' },
      global: { provide: { [configKey]: config } },
    })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    const day = wrapper.get('[data-date="2026-10-16"]')
    expect(day.attributes('disabled')).toBeUndefined()
    await day.trigger('click')
    expect(wrapper.emitted('change')).toEqual([['2026-10-16']])
  })

  it('closes a range popup and restores focus when clearing the range', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { type: 'daterange', modelValue: ['2026-10-15', '2026-10-16'], teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    const clear = wrapper.get<HTMLButtonElement>('.scq-field__clear')
    clear.element.focus()
    await clear.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.emitted('change')).toEqual([[[]]])
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(document.activeElement).toBe(wrapper.get('.scq-field__trigger').element)
  })

  it('focuses the dialog when no dates are available', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { teleport: false, disabledDate: () => true } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('[role="dialog"]').element)
    expect(wrapper.emitted('change')).toBeUndefined()
  })
  it.each(['date', 'daterange'] as const)('navigates custom year/month grids before selecting a %s value', async (type) => {
    const wrapper = mount(DatePicker, { props: { type, minDate: '2026-10-01', maxDate: '2027-12-31', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    expect(vi.mocked(shift)).toHaveBeenLastCalledWith(expect.objectContaining({ crossAxis: true }))
    expect(wrapper.find('input[type="month"], input[type="date"], select').exists()).toBe(false)
    expect(wrapper.findAll('.scq-calendar__header')).toHaveLength(1)
    await wrapper.get('[data-panel="year"]').trigger('click')
    await wrapper.get('[data-period="2027"]').trigger('click')
    await wrapper.get('[data-period="2027-02"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('[data-date="2027-02-10"]').trigger('click')
    if (type === 'daterange') {
      expect(wrapper.find('.scq-calendar').exists()).toBe(true)
      await wrapper.get('[data-date="2027-02-12"]').trigger('click')
    }
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([type === 'date' ? '2027-02-10' : ['2027-02-10', '2027-02-12']])
    expect(wrapper.find('.scq-calendar').exists()).toBe(false)
  })

  it('returns from month navigation with Escape before closing the popover', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { modelValue: '2026-10-15', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    await wrapper.get('[data-panel="month"]').trigger('click')
    await wrapper.get('[data-period="2026-10"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.scq-calendar').exists()).toBe(true)
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-15')
    await wrapper.get('[data-date="2026-10-15"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.scq-calendar').exists()).toBe(false)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    expect(wrapper.find('.scq-calendar__periods').exists()).toBe(false)
    expect(wrapper.find('[data-date="2026-10-15"]').exists()).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

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

  it('uses a compact calendar without a today footer and retains period back navigation', async () => {
    const wrapper = mount(DatePicker, { props: { teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    expect(wrapper.get('.scq-calendar').classes()).toContain('scq-calendar--compact')
    expect(wrapper.find('.scq-calendar__footer').exists()).toBe(false)
    for (const panel of ['year', 'month']) {
      await wrapper.get(`[data-panel="${panel}"]`).trigger('click')
      expect(wrapper.findAll('.scq-calendar__footer button')).toHaveLength(1)
      await wrapper.get('.scq-calendar__back').trigger('click')
      expect(wrapper.find('.scq-calendar__periods').exists()).toBe(false)
      expect(wrapper.find('.scq-calendar__footer').exists()).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    }
    await wrapper.get('[aria-current="date"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.find('.scq-calendar').exists()).toBe(false)
  })
})

describe('TimePicker', () => {
  it('resolves lower time parts when an hour starts before the minimum', async () => {
    const wrapper = mount(TimePicker, { props: { min: '09:30', max: '10:00', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    await wrapper.get('[data-part="hour"] [data-value="9"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([['09:30']])
  })

  it('keeps an hour available when only nonzero seconds satisfy the predicate', async () => {
    const wrapper = mount(TimePicker, { props: {
      seconds: true, min: '09:00:00', max: '09:00:59', teleport: false,
      disabledTime: (value: string) => value !== '09:00:30',
    } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    const hour = wrapper.get('[data-part="hour"] [data-value="9"]')
    expect(hour.attributes('disabled')).toBeUndefined()
    await hour.trigger('click')
    expect(wrapper.emitted('change')).toEqual([['09:00:30']])
  })

  it.each(['now', 'confirm'])('rejects an out-of-bounds current time from %s without committing', async (action) => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 22, 9, 7))
    const wrapper = mount(TimePicker, { props: { min: '10:00', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('click')
    await flushPromises()
    await wrapper.get(`.scq-time-picker__btn--${action}`).trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('invalid')).toEqual([['09:07']])
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.scq-time-picker__panel').exists()).toBe(true)
  })

  it('rounds Now down to an available step instead of producing minute 59', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 22, 9, 59))
    const wrapper = mount(TimePicker, { props: { step: 15, teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('click')
    await flushPromises()
    await wrapper.get('.scq-time-picker__btn--now').trigger('click')
    expect(wrapper.emitted('change')).toEqual([['09:45']])
  })

  it('normalizes typed range endpoints before checking chronological order', async () => {
    const wrapper = mount(TimePicker, { props: { isRange: true, modelValue: ['08:00', '18:00'] } })
    wrappers.push(wrapper)
    await wrapper.findAll('input')[0].setValue('9:00')
    expect(wrapper.emitted('change')).toEqual([[['09:00', '18:00']]])
    expect(wrapper.emitted('invalid')).toBeUndefined()
  })

  it.each(['disabled', 'readonly'] as const)('discards open state when %s changes', async (prop) => {
    const wrapper = mount(TimePicker, { props: { modelValue: '09:00', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('click')
    await flushPromises()
    await wrapper.setProps({ [prop]: true })
    expect(wrapper.find('.scq-time-picker__panel').exists()).toBe(false)
    await wrapper.setProps({ [prop]: false })
    expect(wrapper.find('.scq-time-picker__panel').exists()).toBe(false)
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
  })

  it('revalidates the selected time at confirmation after constraints change', async () => {
    const wrapper = mount(TimePicker, { props: { modelValue: '09:00', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('click')
    await flushPromises()
    await wrapper.setProps({ min: '10:00' })
    await wrapper.get('.scq-time-picker__btn--confirm').trigger('click')
    expect(wrapper.emitted('invalid')).toEqual([['09:00']])
    expect(wrapper.find('.scq-time-picker__panel').exists()).toBe(true)
  })

  it('rebuilds choices when disabled-time and overnight rules change while open', async () => {
    const wrapper = mount(TimePicker, { props: { modelValue: ['09:00', '10:00'], isRange: true, teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('click')
    await flushPromises()
    const firstHour = (hour: number) => wrapper.findAll('.scq-time-picker__range-section')[0].get(`[data-part="hour"] [data-value="${hour}"]`)
    expect(firstHour(11).attributes('disabled')).toBeDefined()
    await wrapper.setProps({ allowOvernight: true })
    expect(firstHour(11).attributes('disabled')).toBeUndefined()
    await wrapper.setProps({ disabledTime: (value: string) => value.startsWith('11:') })
    expect(firstHour(11).attributes('disabled')).toBeDefined()
    await wrapper.setProps({ disabledTime: undefined })
    expect(firstHour(11).attributes('disabled')).toBeUndefined()
  })

  it('opens the active endpoint with keyboard focus and restores it when clearing', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { isRange: true, modelValue: ['09:00', '17:00'], teleport: false } })
    wrappers.push(wrapper)
    const input = wrapper.findAll<HTMLInputElement>('input')[1]
    input.element.focus()
    await input.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement?.closest('.scq-time-picker__range-section')).toBe(wrapper.findAll('.scq-time-picker__range-section')[1].element)
    expect(document.activeElement?.getAttribute('data-value')).toBe('17')
    await wrapper.get('.scq-field__clear').trigger('click')
    expect(wrapper.find('.scq-time-picker__panel').exists()).toBe(false)
    expect(document.activeElement).toBe(input.element)
  })
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

  it('opens panel and selects time via custom columns', async () => {
    const wrapper = mount(TimePicker, { props: { modelValue: '10:00', teleport: false } })
    wrappers.push(wrapper)
    expect(wrapper.find('.scq-time-picker__panel').exists()).toBe(false)
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(wrapper.find('.scq-time-picker__panel').exists()).toBe(true)
    const cells = wrapper.findAll('.scq-time-picker__cell')
    expect(cells.length).toBeGreaterThan(0)
    const minute30 = cells.find((cell) => cell.text() === '30')
    expect(minute30).toBeDefined()
    await minute30!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['10:30']])
    await wrapper.find('.scq-field__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('preserves range endpoints and seconds when using the shared time columns', async () => {
    const wrapper = mount(TimePicker, { props: { modelValue: ['09:00:15', '17:30:45'], isRange: true, seconds: true, teleport: false } })
    wrappers.push(wrapper)
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    const sections = wrapper.findAll('.scq-time-picker__range-section')
    expect(sections).toHaveLength(2)
    expect(sections[1].findAll('[data-part]')).toHaveLength(3)
    await sections[1].get('[data-part="minute"] [data-value="45"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['09:00:15', '17:45:45']]])
  })

  it('supports keyboard navigation through enabled shared time options', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { modelValue: '09:30', min: '09:00', max: '12:00', teleport: false } })
    wrappers.push(wrapper)
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    await wrapper.get('[data-part="hour"] [data-value="9"]').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['10:30']])
    expect(document.activeElement?.getAttribute('data-value')).toBe('10')
  })
})

describe('Slider', () => {
  it('associates both native thumbs with form help and errors', async () => {
    const value: [number, number] = [10, 20]
    const wrapper = mount(Form, {
      attachTo: document.body, props: { model: { budget: value } },
      slots: { default: () => h(FormItem, { prop: 'budget', label: 'Budget', help: 'Allowed budget', error: 'No funds' }, {
        default: () => h(Slider, { modelValue: value, range: true }),
      }) },
    })
    wrappers.push(wrapper)
    await flushPromises()
    for (const input of wrapper.findAll('input')) {
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(input.attributes('aria-describedby')).toContain(wrapper.get('.scq-form-item__help').attributes('id'))
      expect(input.attributes('aria-describedby')).toContain(wrapper.get('.scq-form-item__error').attributes('id'))
    }
    expect(wrapper.vm.focusField('budget')).toBe(true)
    expect(document.activeElement).toBe(wrapper.findAll('input')[0].element)
  })
  it('does not commit a stale drag after external values or range settings change', async () => {
    const wrapper = mount(Slider, { props: { modelValue: 20 } })
    wrappers.push(wrapper)
    const input = wrapper.get<HTMLInputElement>('input')
    input.element.value = '40'
    await input.trigger('input')
    await wrapper.setProps({ modelValue: 80 })
    await input.trigger('change')
    expect(wrapper.emitted('change')).toEqual([[80]])
    input.element.value = '90'
    await input.trigger('input')
    await wrapper.setProps({ max: 50 })
    await input.trigger('change')
    expect(wrapper.emitted('change')?.at(-1)).toEqual([50])
  })

  it('restores rejected native input and discards a pending drag across disabled changes', async () => {
    const wrapper = mount(Slider, { props: { modelValue: 20 } })
    wrappers.push(wrapper)
    const input = wrapper.get<HTMLInputElement>('input')
    input.element.value = '40'
    await input.trigger('input')
    await wrapper.setProps({ disabled: true })
    input.element.value = '60'
    input.element.dispatchEvent(new Event('input', { bubbles: true }))
    expect(input.element.value).toBe('20')
    await wrapper.setProps({ disabled: false })
    await input.trigger('change')
    expect(wrapper.emitted('change')).toEqual([[20]])
  })

  it.each([
    { min: 10, max: 1 }, { min: -Number.MAX_VALUE, max: Number.MAX_VALUE },
    { step: 0 }, { step: Number.MIN_VALUE }, { min: Number.NaN },
  ])('reports invalid slider configuration and prevents mutation: %j', async (props) => {
    const wrapper = mount(Slider, { props: { modelValue: 20, ...props } })
    wrappers.push(wrapper)
    expect(wrapper.emitted('invalid')?.at(-1)?.[1]).toBe('configuration')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('style')).not.toMatch(/NaN|Infinity/)
    await wrapper.setProps({ min: 0, max: 100, step: 1 })
    expect(wrapper.get('input').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
  })

  it('reports non-finite controlled values without outputting non-finite positions', () => {
    const wrapper = mount(Slider, { props: { modelValue: [10, Number.NaN], range: true } })
    wrappers.push(wrapper)
    expect(wrapper.emitted('invalid')?.at(-1)?.[1]).toBe('number')
    expect(wrapper.attributes('style')).not.toMatch(/NaN|Infinity/)
    expect(wrapper.findAll('input').every(input => input.attributes('aria-invalid') === 'true')).toBe(true)
  })
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
  it('clears the hovered fill after clearing a score and focuses the accessible slider', async () => {
    const wrapper = mount(Rate, { attachTo: document.body, props: { showText: true } })
    wrappers.push(wrapper)
    const star = wrapper.findAll('button')[1]
    await star.trigger('click')
    await star.trigger('mousemove')
    expect(wrapper.get('.scq-rate__text').text()).toBe('2')
    await star.trigger('click')
    expect(wrapper.attributes('aria-valuenow')).toBe('0')
    expect(wrapper.get('.scq-rate__text').text()).toBe('0')
    expect(wrapper.findAll('.scq-rate__fill').every(fill => fill.attributes('style')?.includes('width: 0%'))).toBe(true)
    expect(document.activeElement).toBe(wrapper.element)
  })

  it.each([
    { readonly: true }, { disabled: true }, { modelValue: 1 }, { max: 2 }, { allowHalf: true },
  ])('discards stale hover previews when state changes: %j', async (props) => {
    const wrapper = mount(Rate, { props: { modelValue: 2, showText: true } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[4].trigger('mousemove')
    expect(wrapper.get('.scq-rate__text').text()).toBe('5')
    await wrapper.setProps(props)
    expect(wrapper.get('.scq-rate__text').text()).toBe(String(props.modelValue ?? 2))
    expect(wrapper.emitted('change')).toBeUndefined()
  })
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
  it('restores native checkbox state when a disabled change is rejected', async () => {
    const wrapper = mount(Transfer, { props: { disabled: true, data: [{ key: 1, label: 'Alpha' }] } })
    wrappers.push(wrapper)
    const inputs = wrapper.findAll<HTMLInputElement>('input[type="checkbox"]')
    for (const input of inputs) {
      input.element.checked = true
      input.element.indeterminate = true
      input.element.dispatchEvent(new Event('change', { bubbles: true }))
    }
    await nextTick()
    expect(inputs.every(input => !input.element.checked)).toBe(true)
    expect(inputs[0].element.indeterminate).toBe(false)
    expect(wrapper.emitted('check-change')).toBeUndefined()
  })

  it('ignores modified navigation and deduplicates emitted bound keys', async () => {
    const wrapper = mount(Transfer, { attachTo: document.body, props: { data: [{ key: 1, label: 'Alpha' }, { key: 2, label: 'Beta' }], modelValue: [99, 99] } })
    wrappers.push(wrapper)
    const first = wrapper.get<HTMLInputElement>('[data-transfer-index="0"] input')
    first.element.focus()
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: 229 }]) {
      await first.trigger('keydown', { key: 'ArrowDown', ...options })
      expect(document.activeElement).toBe(first.element)
    }
    await first.setValue(true)
    await wrapper.findAll('.scq-transfer__actions button')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[99, 1]])
    expect(wrapper.props('modelValue')).toEqual([99, 99])
  })

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
  const options = [{ value: 0, label: 'Parent', children: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'locked', label: 'Locked', disabled: true }] }] as const

  it('connects the actual dialog and focuses the selected path on keyboard opening', async () => {
    const wrapper = mount(Cascader, { attachTo: document.body, props: { teleport: false, options, modelValue: [0, 'b'] as const } })
    wrappers.push(wrapper)
    const trigger = wrapper.get<HTMLButtonElement>('.scq-field__trigger')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('aria-controls')).toBe(wrapper.get('[role="dialog"]').attributes('id'))
    const selected = wrapper.findAll('[role="option"][aria-selected="true"]').at(-1)!
    expect(selected.element.tagName).toBe('BUTTON')
    expect(document.activeElement).toBe(selected.element)
    expect(selected.text()).toBe('B')
    await selected.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(wrapper.get('[role="option"]').element)
    await wrapper.get('[role="option"]').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement?.textContent).toBe('A')
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(trigger.attributes('aria-controls')).toBeUndefined()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('navigates filtered candidates without submitting Enter from the search field', async () => {
    const wrapper = mount(Cascader, { attachTo: document.body, props: { teleport: false, filterable: true, options } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const input = wrapper.get<HTMLInputElement>('input[type="search"]')
    expect(document.activeElement).toBe(input.element)
    await input.setValue(' Parent ')
    expect(input.attributes('aria-controls')).toBe(wrapper.get('.scq-cascader__results').attributes('id'))
    expect(wrapper.findAll('.scq-cascader__results [role="option"]')).toHaveLength(2)
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    input.element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(wrapper.emitted('change')).toBeUndefined()
    await input.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    expect(document.activeElement).toBe(input.element)
    await input.trigger('keydown', { key: 'ArrowDown' })
    const results = wrapper.findAll('.scq-cascader__results [role="option"]')
    expect(document.activeElement).toBe(results[0].element)
    await results[0].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(results[1].element)
    await results[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[0, 'b']]])
  })

  it('clears disabled filtering and preserves usable focus', async () => {
    const wrapper = mount(Cascader, { attachTo: document.body, props: { teleport: false, filterable: true, options } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    await wrapper.get('input[type="search"]').setValue('Parent')
    await wrapper.setProps({ filterable: false })
    await nextTick()
    expect(wrapper.find('.scq-cascader__results').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('[role="option"]').element)
    await wrapper.setProps({ filterable: true })
    expect(wrapper.get<HTMLInputElement>('input[type="search"]').element.value).toBe('')
    await wrapper.get('input[type="search"]').setValue('   ')
    expect(wrapper.find('.scq-cascader__results').exists()).toBe(false)
  })

  it('keeps filtering when an equivalent controlled path array is replaced', async () => {
    const wrapper = mount(Cascader, { props: { teleport: false, filterable: true, options, modelValue: [0, 'a'] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await wrapper.get('input[type="search"]').setValue('Parent')
    await wrapper.setProps({ modelValue: [0, 'a'] })
    expect(wrapper.get<HTMLInputElement>('input[type="search"]').element.value).toBe('Parent')
    expect(wrapper.find('.scq-cascader__results').exists()).toBe(true)
  })

  it('synchronizes external values and repairs focused paths removed by new data', async () => {
    const second = { value: 'other', label: 'Other', children: [{ value: 'leaf', label: 'Leaf' }] } as const
    const wrapper = mount(Cascader, { attachTo: document.body, props: { teleport: false, options: [...options, second], modelValue: [0, 'a'] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    await wrapper.setProps({ modelValue: ['other', 'leaf'] })
    await nextTick()
    expect(wrapper.get('.scq-field__value').text()).toBe('Other / Leaf')
    expect(document.activeElement?.textContent).toBe('Leaf')
    await wrapper.setProps({ options })
    await nextTick()
    expect(wrapper.findAll('.scq-cascader__columns ul')).toHaveLength(1)
    expect(document.activeElement).toBe(wrapper.get('[role="option"]').element)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('ignores removed options and closed popup result nodes', async () => {
    const wrapper = mount(Cascader, { props: { teleport: false, filterable: true, options: [{ value: 'old', label: 'Old' }] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    const oldOption = wrapper.get('[role="option"]')
    await wrapper.setProps({ options: [{ value: 'new', label: 'New' }] })
    await oldOption.trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.get('input[type="search"]').setValue('New')
    const oldResult = wrapper.get('.scq-cascader__results button')
    await wrapper.get('.scq-field__trigger').trigger('click')
    await oldResult.trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('does not consume modified, composing or prevented trigger keys', async () => {
    const wrapper = mount(Cascader, { props: { teleport: false, options } })
    wrappers.push(wrapper)
    const trigger = wrapper.get('.scq-field__trigger')
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await trigger.trigger('keydown', { key: 'ArrowDown', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    event.preventDefault()
    trigger.element.dispatchEvent(event)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('preserves scalar zero and readonly path shapes in native form values', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const wrapper = mount(Cascader, { attachTo: form, props: { name: 'path', options, emitPath: false, modelValue: 0 } })
    wrappers.push(wrapper)
    try {
      expect(new FormData(form).get('path')).toBe('0')
      await wrapper.setProps({ modelValue: [0, 'b'] as const, emitPath: true })
      expect(new FormData(form).get('path')).toBe('[0,"b"]')
      await wrapper.setProps({ disabled: true })
      expect(new FormData(form).has('path')).toBe(false)
      expect(wrapper.vm.focus()).toBe(false)
    } finally { form.remove() }
  })

  it('treats a teleported clear control as part of the form field focus boundary', async () => {
    const wrapper = mount(Form, { attachTo: document.body, props: { model: { path: [0, 'b'] } }, slots: {
      default: () => h(FormItem, { prop: 'path', label: 'Path' }, () => h(Teleport, { to: document.body }, h(Cascader, { options, modelValue: [0, 'b'] }))),
    } })
    wrappers.push(wrapper)
    const field = wrapper.getComponent(Cascader)
    const outside = document.createElement('button')
    document.body.append(outside)
    try {
      field.get<HTMLButtonElement>('.scq-field__trigger').element.focus()
      field.get<HTMLButtonElement>('.scq-field__clear').element.focus()
      await flushPromises()
      expect(wrapper.vm.getFieldState('path')?.touched).toBe(false)
      outside.focus()
      await flushPromises()
      expect(wrapper.vm.getFieldState('path')?.touched).toBe(true)
    } finally { outside.remove() }
  })

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
  it('uses the same known-empty leaf definition as Tree when a loader is present', async () => {
    const load = vi.fn().mockResolvedValue([])
    const wrapper = mount(TreeSelect, { props: { data: [{ key: 'leaf', label: 'Known leaf', children: [] }], load, leafOnly: true, teleport: false } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    expect(wrapper.find('button.scq-tree__toggle').exists()).toBe(false)
    await wrapper.get('[role="treeitem"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['leaf']])
    expect(load).not.toHaveBeenCalled()
  })

  it('reports a forwarded lazy-load failure when no error listener is provided', async () => {
    const failure = new Error('Unavailable')
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(TreeSelect, { props: { data: [{ key: 'lazy', label: 'Lazy' }], teleport: false, load: async () => { throw failure } } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await wrapper.get('button.scq-tree__toggle').trigger('click')
    await flushPromises()
    expect(report).toHaveBeenCalledTimes(1)
    expect(report).toHaveBeenCalledWith('[scq-vue] TreeSelect node loading failed', failure)
  })

  it('waits for positioning before focusing the selected tree node', async () => {
    let finish!: (value: Awaited<ReturnType<typeof floating.computePosition>>) => void
    const position = vi.spyOn(floating, 'computePosition').mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    try {
      const wrapper = mount(TreeSelect, { attachTo: document.body, props: { teleport: false, filterable: true, modelValue: 0, data: [{ key: 0, label: 'Zero' }] } })
      wrappers.push(wrapper)
      const trigger = wrapper.get<HTMLButtonElement>('.scq-field__trigger')
      trigger.element.focus()
      await trigger.trigger('keydown', { key: 'ArrowDown' })
      await flushPromises()
      expect(document.activeElement).toBe(trigger.element)
      finish({ x: 0, y: 0, strategy: 'fixed', placement: 'bottom', middlewareData: {} })
      await flushPromises()
      expect(document.activeElement).toBe(wrapper.get('[role="treeitem"]').element)
      expect(wrapper.get('[role="tree"]').attributes('id')).toBe(trigger.attributes('aria-controls'))
    } finally { position.mockRestore() }
  })

  it('normalizes duplicate readonly keys and mode changes without losing cached labels or form shape', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const values = [0, 0, 1] as const
    const wrapper = mount(TreeSelect, { attachTo: form, props: { name: 'selection', modelValue: values, multiple: true, checkStrictly: true, teleport: false, data: [{ key: 0, label: 'Zero' }, { key: 1, label: 'One' }] } })
    wrappers.push(wrapper)
    const warning = vi.spyOn(console, 'warn')
    try {
      expect(wrapper.get('.scq-field__value').text()).toBe('Zero, One')
      expect(new FormData(form).getAll('selection[]')).toEqual(['0', '1'])
      await wrapper.get('.scq-field__trigger').trigger('click')
      await flushPromises()
      await wrapper.setProps({ multiple: false })
      expect(wrapper.get('.scq-field__value').text()).toBe('Zero')
      expect(new FormData(form).getAll('selection')).toEqual(['0'])
      expect(wrapper.get('[role="treeitem"][aria-selected="true"]').text()).toBe('Zero')
      await wrapper.setProps({ data: [], multiple: true })
      expect(wrapper.get('.scq-field__value').text()).toBe('Zero, One')
      expect(values).toEqual([0, 0, 1])
      expect(wrapper.emitted('change')).toBeUndefined()
      expect(warning).not.toHaveBeenCalled()
    } finally { form.remove() }
  })

  it('protects filter Enter and repairs focus when filtering is disabled', async () => {
    const wrapper = mount(TreeSelect, { attachTo: document.body, props: { filterable: true, teleport: false, data: [{ key: 0, label: 'Zero' }, { key: 1, label: 'One' }] } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    const input = wrapper.get<HTMLInputElement>('input[type="search"]')
    input.element.focus()
    await input.setValue('One')
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    input.element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(wrapper.emitted('change')).toBeUndefined()
    await input.trigger('keydown', { key: 'ArrowDown', ctrlKey: true })
    await input.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    expect(document.activeElement).toBe(input.element)
    await wrapper.setProps({ filterable: false })
    await flushPromises()
    expect(wrapper.find('input[type="search"]').exists()).toBe(false)
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
    expect(document.activeElement?.getAttribute('role')).toBe('treeitem')
    await wrapper.setProps({ filterable: true })
    expect(wrapper.get<HTMLInputElement>('input[type="search"]').element.value).toBe('')
  })

  it('ignores modified, composing and prevented open requests', async () => {
    const wrapper = mount(TreeSelect, { props: { teleport: false, data: [{ key: 0, label: 'Zero' }] } })
    wrappers.push(wrapper)
    const trigger = wrapper.get('.scq-field__trigger')
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await trigger.trigger('keydown', { key: 'ArrowDown', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    event.preventDefault()
    trigger.element.dispatchEvent(event)
    expect(wrapper.find('[role="tree"]').exists()).toBe(false)
  })

  it('stops change and clear notifications when the model update disposes the component', async () => {
    const change = vi.fn()
    const clear = vi.fn()
    const wrapper = mount(TreeSelect, { props: {
      modelValue: 0, data: [{ key: 0, label: 'Zero' }], onChange: change, onClear: clear,
      'onUpdate:modelValue': (): void => { wrapper.unmount() },
    } })
    wrapper.vm.clear()
    await nextTick()
    expect(change).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

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