// @vitest-environment jsdom

import { computed, h, nextTick, reactive } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DateTimePicker from '../src/components/DateTimePicker/DateTimePicker.vue'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import { type DateTimePickerValue } from '../src/components/DateTimePicker/shared'
import { configKey, type ComponentConfig } from '../src/components/ConfigProvider/context'
import { dateTimeKey, parseDateTime } from '../src/utils/date'
import { TIME_LIMITS } from '../src/utils/time'
import { computePosition, shift } from '@floating-ui/dom'

vi.mock('@floating-ui/dom', () => ({
  autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} },
  computePosition: vi.fn(async () => ({ x: 0, y: 0, strategy: 'fixed' })),
  offset: vi.fn(), flip: vi.fn(), shift: vi.fn(),
}))

const TEST_DATE = '2026-10-13'
const TEST_VALUE = `${TEST_DATE} 09:30`
const TEST_NOW = new Date(2026, 9, 13, 10, 37, 26)
const MONTH_BOUNDS = { min: '2026-10-01 00:00', max: '2026-10-31 23:59' }
const wrappers: VueWrapper[] = []
const createPicker = (props: Partial<InstanceType<typeof DateTimePicker>['$props']> = {}) => {
  const wrapper = mount(DateTimePicker, { attachTo: document.body, props: { teleport: false, ...props } })
  wrappers.push(wrapper)
  return wrapper
}
const open = async (wrapper: VueWrapper) => {
  await wrapper.get('.scq-field__trigger').trigger('click')
  await flushPromises()
}
const selectDate = async (wrapper: VueWrapper, date = TEST_DATE) => {
  await wrapper.get(`[data-date="${date}"]`).trigger('click')
}
const selectPart = async (wrapper: VueWrapper, part: string, value: number) => {
  await wrapper.get(`[data-part="${part}"] [data-value="${value}"]`).trigger('click')
}
const confirm = async (wrapper: VueWrapper) => {
  await wrapper.get('.scq-date-time-picker__confirm').trigger('click')
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TEST_NOW)
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('date/time parsing', () => {
  it.each([
    '', '2026-02-29 10:00', '2024-02-30 10:00', '2026-13-01 10:00',
    '2026-10-13 24:00', '2026-10-13 10:60', '2026-10-13 10:00:60',
    '2026-10-13 9:30', '2026-10-13T09:30:00Z', '2026-10-13 09:30 extra',
  ])('rejects malformed or nonexistent local date/time %s', (value) => {
    expect(parseDateTime(value)).toBeUndefined()
  })

  it('preserves local fields and round-trips leap days without UTC conversion', () => {
    const date = parseDateTime('2024-02-29 09:30:15')!
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()])
      .toEqual([2024, 1, 29, 9, 30, 15])
    expect(dateTimeKey(date, true)).toBe('2024-02-29 09:30:15')
    expect(dateTimeKey(date)).toBe('2024-02-29 09:30')
  })
})

describe('DateTimePicker', () => {
  it('keeps only necessary actions below the compact calendar and guides empty selections in the time heading', async () => {
    const wrapper = createPicker()
    await open(wrapper)
    expect(wrapper.get('.scq-calendar').classes()).toContain('scq-calendar--compact')
    expect(wrapper.find('.scq-calendar__footer').exists()).toBe(false)
    expect(wrapper.find('.scq-date-time-picker__status').exists()).toBe(false)
    expect(wrapper.find('.scq-date-time-picker__extra').exists()).toBe(false)
    expect(wrapper.get('.scq-date-time-picker__time-title').text()).toContain('请先选择日期')
    expect(wrapper.get('.scq-field__trigger').attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.findAll('.scq-date-time-picker__footer button')).toHaveLength(3)
    await wrapper.get('[data-panel="month"]').trigger('click')
    expect(wrapper.findAll('.scq-calendar__footer button')).toHaveLength(1)
    await wrapper.get('.scq-calendar__back').trigger('click')
    expect(wrapper.find('.scq-calendar__footer').exists()).toBe(false)
    await selectDate(wrapper)
    expect(wrapper.get('.scq-date-time-picker__time-title').text()).toContain('选择时间')
    expect(wrapper.find('.scq-date-time-picker__status').exists()).toBe(false)
    await wrapper.setProps({ showNow: false })
    expect(wrapper.find('.scq-date-time-picker__now').exists()).toBe(false)
    expect(wrapper.findAll('.scq-date-time-picker__footer button')).toHaveLength(2)
  })

  describe('DateTimePicker form integration', () => {
    const createForm = (initial: DateTimePickerValue = '', props: Partial<InstanceType<typeof DateTimePicker>['$props']> = {}) => {
      const model = reactive({ appointment: initial })
      const wrapper = mount(Form, {
        attachTo: document.body,
        props: { model, showErrorSummary: true, focusOnError: true },
        slots: {
          default: () => h(FormItem, {
            prop: 'appointment', label: 'Appointment', help: 'Choose a local date and time',
            rules: { required: true, message: 'Appointment is required', trigger: 'blur' },
          }, {
            default: () => h(DateTimePicker, {
              ...props, modelValue: model.appointment, name: 'appointment',
              'aria-describedby': 'appointment-hint',
              'onUpdate:modelValue': (value: DateTimePickerValue) => { model.appointment = value },
            }),
          }),
        },
      })
      wrappers.push(wrapper)
      return { wrapper, model, picker: wrapper.getComponent(DateTimePicker) }
    }

    it('links labels, help and validation errors to the trigger and focuses the invalid field', async () => {
      const { wrapper, picker } = createForm()
      await nextTick()
      const trigger = picker.get('.scq-field__trigger')
      expect(trigger.attributes('id')).toBeTruthy()
      expect(wrapper.get('label').attributes('for')).toBe(trigger.attributes('id'))
      expect(trigger.attributes('aria-labelledby')).toBe(wrapper.get('label').attributes('id'))
      expect(trigger.attributes('aria-describedby')?.split(' ')).toEqual([
        'appointment-hint', wrapper.get('.scq-form-item__help').attributes('id'),
      ])
      expect(trigger.attributes('aria-required')).toBe('true')
      expect(picker.attributes('aria-describedby')).toBeUndefined()
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(trigger.attributes('aria-invalid')).toBe('true')
      expect(trigger.attributes('aria-describedby')).toContain(wrapper.get('.scq-form-item__error').attributes('id'))
      expect(document.activeElement).toBe(trigger.element)
      expect(wrapper.vm.focusField('appointment')).toBe(true)
    })

    it('merges its own constraint error with field and caller descriptions', async () => {
      const { wrapper, picker } = createForm('2026-02-30 09:00')
      await nextTick()
      const trigger = picker.get('.scq-field__trigger')
      expect(trigger.attributes('aria-describedby')?.split(' ')).toEqual([
        'appointment-hint', wrapper.get('.scq-form-item__help').attributes('id'),
        picker.get('.scq-date-time-picker__status').attributes('id'),
      ])
      expect(trigger.attributes('aria-invalid')).toBe('true')
    })

    it('does not touch the field on entry to a teleported panel but validates when leaving it', async () => {
      const { wrapper, picker } = createForm()
      await nextTick()
      picker.get<HTMLButtonElement>('.scq-field__trigger').element.focus()
      await open(picker)
      const panel = document.body.querySelector<HTMLElement>('.scq-date-time-picker__panel')!
      expect(panel.contains(document.activeElement)).toBe(true)
      expect(wrapper.vm.getFieldState('appointment')?.touched).toBe(false)
      expect(wrapper.get('label').attributes('for')).toBe(picker.get('.scq-field__trigger').attributes('id'))
      const outside = document.createElement('button')
      document.body.append(outside)
      try {
        outside.focus()
        await flushPromises()
        expect(wrapper.vm.getFieldState('appointment')).toMatchObject({ touched: true, error: 'Appointment is required' })
        expect(picker.get('.scq-field__trigger').attributes('aria-invalid')).toBe('true')
      } finally {
        outside.remove()
      }
    })

    it.each([false, true])('blocks methods and form submission when Form is disabled (teleport=%s)', async (teleport) => {
      const { wrapper, picker, model } = createForm(TEST_VALUE, { disabled: false, teleport })
      await open(picker)
      await wrapper.setProps({ disabled: true })
      await flushPromises()
      expect(document.body.querySelector('.scq-date-time-picker__panel')).toBeNull()
      expect(picker.get('.scq-field__trigger').attributes('disabled')).toBeDefined()
      expect(picker.find('.scq-field__clear').exists()).toBe(false)
      expect(new FormData(wrapper.element as HTMLFormElement).has('appointment')).toBe(false)
      picker.vm.show()
      picker.vm.clear()
      picker.vm.confirm()
      await flushPromises()
      expect(document.body.querySelector('.scq-date-time-picker__panel')).toBeNull()
      expect(model.appointment).toBe(TEST_VALUE)
      expect(picker.emitted('change')).toBeUndefined()
      await wrapper.setProps({ disabled: false })
      expect(wrapper.vm.focusField('appointment')).toBe(true)
      await open(picker)
      expect(document.body.querySelector('.scq-date-time-picker__panel')).not.toBeNull()
    })

    it('keeps drafts out of dirty state and resynchronizes an open panel on form reset', async () => {
      const { wrapper, picker, model } = createForm(TEST_VALUE, { teleport: false })
      await open(picker)
      await selectPart(picker, 'hour', 12)
      expect(wrapper.vm.state.dirty).toBe(false)
      await confirm(picker)
      expect(model.appointment).toBe(`${TEST_DATE} 12:30`)
      expect(wrapper.vm.state.dirty).toBe(true)
      await open(picker)
      await selectPart(picker, 'hour', 15)
      await wrapper.vm.resetFields()
      await flushPromises()
      expect(model.appointment).toBe(TEST_VALUE)
      expect(wrapper.vm.state).toMatchObject({ dirty: false, touched: false, errors: [] })
      expect(picker.get('[data-part="hour"] [aria-pressed="true"]').text()).toBe('09')
      await confirm(picker)
      expect(picker.emitted('confirm')?.at(-1)).toEqual([TEST_VALUE])
    })
  })

  it('still renders an explicitly supplied footer with the current draft', async () => {
    const wrapper = mount(DateTimePicker, {
      props: { modelValue: TEST_VALUE, teleport: false },
      slots: { footer: ({ value }: { value: DateTimePickerValue }) => h('span', String(value)) },
    })
    wrappers.push(wrapper)
    await open(wrapper)
    expect(wrapper.get('.scq-date-time-picker__extra').text()).toBe(TEST_VALUE)
    await selectPart(wrapper, 'hour', 12)
    expect(wrapper.get('.scq-date-time-picker__extra').text()).toBe(`${TEST_DATE} 12:30`)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('uses heading grids to navigate without changing the draft or losing the selected time', async () => {
    const wrapper = createPicker({ modelValue: TEST_VALUE, min: '2026-01-01 00:00', max: '2028-12-31 23:59' })
    await open(wrapper)
    expect(wrapper.find('input[type="month"], input[type="date"], input[type="time"], select').exists()).toBe(false)
    expect(wrapper.findAll('.scq-calendar__header')).toHaveLength(1)
    await wrapper.get('[data-panel="year"]').trigger('click')
    await wrapper.get('[data-period="2027"]').trigger('click')
    await wrapper.get('[data-period="2027-02"]').trigger('click')
    expect(wrapper.get('[data-part="hour"] [aria-pressed="true"]').text()).toBe('09')
    expect(wrapper.get('[data-part="minute"] [aria-pressed="true"]').text()).toBe('30')
    expect(wrapper.emitted('draft-change')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await selectDate(wrapper, '2027-02-15')
    expect(wrapper.emitted('draft-change')?.at(-1)).toEqual(['2027-02-15 09:30'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([['2027-02-15 09:30']])
  })

  it('navigates the active range endpoint while preserving the other endpoint and its time', async () => {
    const wrapper = createPicker({ type: 'datetimerange', modelValue: [TEST_VALUE, '2026-11-15 18:00'] })
    await open(wrapper)
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await wrapper.get('[data-panel="year"]').trigger('click')
    await wrapper.get('[data-period="2027"]').trigger('click')
    await wrapper.get('[data-period="2027-01"]').trigger('click')
    expect(wrapper.emitted('draft-change')).toBeUndefined()
    await selectDate(wrapper, '2027-01-15')
    expect(wrapper.get('[data-part="hour"] [aria-pressed="true"]').text()).toBe('18')
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[[TEST_VALUE, '2027-01-15 18:00']]])
  })

  it('selects date and time in one popup and commits only on confirmation', async () => {
    const wrapper = createPicker({ ...MONTH_BOUNDS, defaultTime: '09:30', name: 'appointment' })
    await open(wrapper)
    expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)
    expect(vi.mocked(shift)).toHaveBeenLastCalledWith(expect.objectContaining({ crossAxis: true }))
    expect(wrapper.find('.scq-calendar').exists()).toBe(true)
    expect(wrapper.findAll('[data-part]')).toHaveLength(2)
    expect(wrapper.get('.scq-date-time-picker__confirm').attributes('disabled')).toBeDefined()
    await selectDate(wrapper)
    await selectPart(wrapper, 'hour', 15)
    await selectPart(wrapper, 'minute', 45)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('draft-change')?.at(-1)).toEqual([`${TEST_DATE} 15:45`])
    expect(wrapper.get('input[type="hidden"]').element.value).toBe('')
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 15:45`]])
    expect(wrapper.emitted('change')).toEqual([[`${TEST_DATE} 15:45`]])
    expect(wrapper.emitted('confirm')).toEqual([[`${TEST_DATE} 15:45`]])
    expect(wrapper.get('.scq-field__value').text()).toBe(`${TEST_DATE} 15:45`)
    expect(wrapper.get('input[type="hidden"]').element.value).toBe(`${TEST_DATE} 15:45`)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('.scq-field__trigger').element)
  })

  it('formats display independently from the controlled model and retains seconds', async () => {
    const original = `${TEST_DATE} 09:30:15`
    const wrapper = createPicker({ modelValue: original, seconds: true, secondStep: 5, format: 'dd/MM/yyyy HH:mm:ss' })
    expect(wrapper.get('.scq-field__value').text()).toBe('13/10/2026 09:30:15')
    await open(wrapper)
    await selectPart(wrapper, 'second', 35)
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 09:30:35`]])
    expect(wrapper.get('.scq-field__value').text()).toBe('13/10/2026 09:30:15')
    await wrapper.setProps({ modelValue: `${TEST_DATE} 09:30:35` })
    expect(wrapper.get('.scq-field__value').text()).toBe('13/10/2026 09:30:35')
  })

  it('discards drafts on cancel, Escape, outside click and exposed hide', async () => {
    const wrapper = createPicker({ modelValue: TEST_VALUE })
    await open(wrapper)
    await selectPart(wrapper, 'hour', 12)
    await wrapper.get('.scq-date-time-picker__cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    await open(wrapper)
    expect(wrapper.get('[data-part="hour"] [aria-pressed="true"]').text()).toBe('09')
    await selectPart(wrapper, 'hour', 13)
    await wrapper.get('[data-part="hour"] [aria-pressed="true"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await open(wrapper)
    await selectPart(wrapper, 'hour', 14)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.vm.show()
    await flushPromises()
    expect(wrapper.get('[data-part="hour"] [aria-pressed="true"]').text()).toBe('09')
    wrapper.vm.hide()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
  })

  it('selects an ordered cross-day range with per-endpoint defaults and clears to an empty array', async () => {
    const wrapper = createPicker({ type: 'datetimerange', defaultTime: ['09:00', '18:00'], name: 'period', ...MONTH_BOUNDS })
    await open(wrapper)
    await selectDate(wrapper)
    expect(wrapper.get('.scq-date-time-picker__confirm').attributes('disabled')).toBeDefined()
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await selectDate(wrapper, '2026-10-14')
    expect(wrapper.get('[data-part="hour"] [aria-pressed="true"]').text()).toBe('18')
    await selectPart(wrapper, 'hour', 19)
    await confirm(wrapper)
    const expected = [`${TEST_DATE} 09:00`, '2026-10-14 19:00']
    expect(wrapper.emitted('update:modelValue')).toEqual([[expected]])
    expect(wrapper.findAll('input[type="hidden"]').map((input) => [input.attributes('name'), input.element.value]))
      .toEqual([['period[0]', expected[0]], ['period[1]', expected[1]]])
    await wrapper.get('.scq-field__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.findAll('input[type="hidden"]').map((input) => input.element.value)).toEqual(['', ''])
    await open(wrapper)
    expect(wrapper.findAll('[role="tab"]')[0].attributes('aria-selected')).toBe('true')
  })

  it('rejects reversed times without sorting away the endpoint being edited', async () => {
    const wrapper = createPicker({ type: 'datetimerange', modelValue: [`${TEST_DATE} 09:00`, `${TEST_DATE} 10:00`] })
    await open(wrapper)
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await selectPart(wrapper, 'hour', 8)
    expect(wrapper.emitted('invalid')?.at(-1)?.[0]).toBe('range-order')
    expect(wrapper.get('[role="alert"]').text()).toContain('结束时间')
    expect(wrapper.get('.scq-field__trigger').attributes('aria-describedby')).toBe(wrapper.get('[role="alert"]').attributes('id'))
    expect(wrapper.get('.scq-date-time-picker__confirm').attributes('disabled')).toBeDefined()
    wrapper.vm.confirm()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await selectPart(wrapper, 'hour', 11)
    expect(wrapper.find('.scq-date-time-picker__status').exists()).toBe(false)
    expect(wrapper.get('.scq-field__trigger').attributes('aria-describedby')).toBeUndefined()
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[[`${TEST_DATE} 09:00`, `${TEST_DATE} 11:00`]]])
  })

  it.each(['max-range', 'disabled-date'] as const)('validates inclusive range days: %s', async (reason) => {
    const wrapper = createPicker({
      type: 'datetimerange',
      maxRange: reason === 'max-range' ? 2 : undefined,
      disabledDate: reason === 'disabled-date' ? (date: Date) => date.getDate() === 14 : undefined,
    })
    await open(wrapper)
    await selectDate(wrapper)
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await selectDate(wrapper, '2026-10-15')
    expect(wrapper.emitted('invalid')?.at(-1)?.[0]).toBe(reason)
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('enforces full timestamp boundaries down to seconds and resolves dependent columns', async () => {
    const wrapper = createPicker({ min: `${TEST_DATE} 10:30:15`, max: `${TEST_DATE} 10:31:20`, seconds: true })
    await open(wrapper)
    await selectDate(wrapper)
    expect(wrapper.get('[data-part="second"] [aria-pressed="true"]').text()).toBe('15')
    expect(wrapper.get('[data-part="hour"] [data-value="9"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-part="minute"] [data-value="29"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-part="second"] [data-value="14"]').attributes('disabled')).toBeDefined()
    await selectPart(wrapper, 'minute', 31)
    expect(wrapper.get('[data-part="second"] [data-value="21"]').attributes('disabled')).toBeDefined()
    await selectPart(wrapper, 'second', 20)
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 10:31:20`]])
  })

  it('does not discard an hour or minute when only a nonzero second is allowed', async () => {
    const disabledTime = vi.fn((date: Date) => date.getSeconds() !== 30)
    const wrapper = createPicker({ seconds: true, min: `${TEST_DATE} 09:00:00`, max: `${TEST_DATE} 09:59:59`, disabledTime })
    await open(wrapper)
    await selectDate(wrapper)
    expect(wrapper.get('[data-part="hour"] [data-value="9"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-part="minute"] [data-value="45"]').attributes('disabled')).toBeUndefined()
    await selectPart(wrapper, 'minute', 45)
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 09:45:30`]])
    expect(disabledTime).toHaveBeenCalledWith(expect.any(Date), 'single')
  })

  it('respects second-precision bounds even when selecting only minutes', async () => {
    const wrapper = createPicker({ min: `${TEST_DATE} 09:30:45`, max: `${TEST_DATE} 09:31:15` })
    await open(wrapper)
    await selectDate(wrapper)
    expect(wrapper.get('[data-part="minute"] [data-value="30"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-part="minute"] [data-value="31"]').attributes('disabled')).toBeUndefined()
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 09:31`]])
  })

  it('uses exact step options and preserves the grid through column changes', async () => {
    const minuteStep = 15
    const secondStep = 10
    const wrapper = createPicker({ seconds: true, minuteStep, secondStep, modelValue: `${TEST_DATE} 09:30:20` })
    await open(wrapper)
    expect(wrapper.findAll('[data-part="minute"] button')).toHaveLength(TIME_LIMITS.minute / minuteStep)
    expect(wrapper.findAll('[data-part="second"] button')).toHaveLength(TIME_LIMITS.second / secondStep)
    await selectPart(wrapper, 'hour', 10)
    await selectPart(wrapper, 'second', 50)
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 10:30:50`]])
  })

  it('reports unavailable days without replacing the previous draft', async () => {
    const wrapper = createPicker({ modelValue: TEST_VALUE, disabledTime: (date) => date.getDate() === 14 })
    await open(wrapper)
    await selectDate(wrapper, '2026-10-14')
    expect(wrapper.emitted('invalid')?.at(-1)?.[0]).toBe('disabled-time')
    expect(wrapper.emitted('draft-change')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('不可选用')
    await selectDate(wrapper, '2026-10-15')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('evaluates shortcuts on click, rejects invalid values and does not auto-commit', async () => {
    const shortcut = vi.fn(() => `${TEST_DATE} 14:00`)
    const wrapper = createPicker({
      ...MONTH_BOUNDS,
      shortcuts: [
        { label: 'Afternoon', value: shortcut },
        { label: 'Outside', value: '2027-01-01 10:00' },
        { label: 'Disabled', value: TEST_VALUE, disabled: true },
      ],
    })
    await open(wrapper)
    expect(shortcut).not.toHaveBeenCalled()
    const shortcuts = wrapper.findAll('.scq-date-time-picker__shortcuts button')
    expect(shortcuts[2].attributes('disabled')).toBeDefined()
    await shortcuts[1].trigger('click')
    expect(wrapper.emitted('invalid')?.at(-1)?.[0]).toBe('out-of-range')
    await shortcuts[0].trigger('click')
    expect(shortcut).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 14:00`]])
  })

  it('validates Now against bounds and steps rather than bypassing restrictions', async () => {
    const wrapper = createPicker({ seconds: true, minuteStep: 15, secondStep: 10, min: `${TEST_DATE} 11:00:00` })
    await open(wrapper)
    await wrapper.get('.scq-date-time-picker__now').trigger('click')
    expect(wrapper.emitted('invalid')?.at(-1)?.[0]).toBe('out-of-range')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ min: `${TEST_DATE} 00:00:00` })
    await wrapper.get('.scq-date-time-picker__now').trigger('click')
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[`${TEST_DATE} 10:30:20`]])
  })

  it('resynchronizes external values while open and revalidates changed constraints', async () => {
    const wrapper = createPicker({ modelValue: TEST_VALUE })
    await open(wrapper)
    await selectPart(wrapper, 'hour', 13)
    await wrapper.setProps({ modelValue: '2026-11-02 11:15' })
    expect(wrapper.get('.scq-calendar [role="grid"]').attributes('aria-label')).toBe('2026\u5e7411\u6708')
    expect(wrapper.get('[data-part="hour"] [aria-pressed="true"]').text()).toBe('11')
    await wrapper.setProps({ max: '2026-11-02 10:00' })
    expect(wrapper.get('.scq-date-time-picker__confirm').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('invalid')?.at(-1)?.[0]).toBe('out-of-range')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('inherits size, locale and disabled state while honoring explicit overrides and readonly', async () => {
    const config = computed<ComponentConfig>(() => ({ size: 'large', locale: 'en-US', disabled: true, theme: 'dark' }))
    const wrapper = mount(DateTimePicker, {
      attachTo: document.body,
      props: { modelValue: TEST_VALUE, teleport: false },
      global: { provide: { [configKey]: config } },
    })
    wrappers.push(wrapper)
    expect(wrapper.find('.scq-field--large').exists()).toBe(true)
    expect(wrapper.get('.scq-field__trigger').attributes('aria-label')).toBe('Choose date and time')
    wrapper.vm.show()
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.setProps({ disabled: false })
    await open(wrapper)
    expect(wrapper.get('.scq-date-time-picker__confirm').text()).toBe('Confirm')
    expect(wrapper.get('.scq-date-time-picker__panel').attributes('style')).toContain('color-scheme: dark')
    expect(wrapper.get('[data-panel="month"]').attributes('aria-label')).toBe('Choose month: October')
    expect(wrapper.findAll('.scq-calendar__title-button').map((button) => button.attributes('data-panel'))).toEqual(['month', 'year'])
    await wrapper.get('[data-panel="month"]').trigger('click')
    expect(wrapper.get('[data-period="2026-01"]').text()).toBe('January')
    expect(wrapper.get('[data-period="2026-10"]').text()).toBe('October')
    await wrapper.setProps({ readonly: true })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.vm.clear()
    wrapper.vm.show()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('.scq-field__clear').exists()).toBe(false)
  })

  it('supports keyboard opening, time-column navigation and range endpoint tabs', async () => {
    const wrapper = createPicker({ type: 'datetimerange', modelValue: [TEST_VALUE, `${TEST_DATE} 11:00`] })
    await wrapper.get('.scq-field__trigger').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement?.getAttribute('data-date')).toBe(TEST_DATE)
    await wrapper.findAll('[role="tab"]')[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.findAll('[role="tab"]')[1].attributes('aria-selected')).toBe('true')
    await wrapper.get('[data-part="minute"] [data-value="0"]').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.get('[data-part="minute"] [aria-pressed="true"]').text()).toBe('01')
    expect(document.activeElement?.getAttribute('data-value')).toBe('1')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await confirm(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([[[TEST_VALUE, `${TEST_DATE} 11:01`]]])
  })

  it('waits for floating positioning before moving keyboard focus into the panel', async () => {
    let position!: (result: Awaited<ReturnType<typeof computePosition>>) => void
    vi.mocked(computePosition).mockImplementationOnce(() => new Promise((resolve) => { position = resolve }))
    const wrapper = createPicker({ modelValue: TEST_VALUE })
    const trigger = wrapper.get<HTMLButtonElement>('.scq-field__trigger')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement).toBe(trigger.element)
    position({ x: 0, y: 0, strategy: 'fixed', placement: 'bottom-start', middlewareData: {} })
    await flushPromises()
    expect(document.activeElement?.getAttribute('data-date')).toBe(TEST_DATE)
  })

  it.each([
    { minuteStep: 0 }, { secondStep: Number.NaN }, { minuteStep: 1.5 },
    { min: 'invalid' }, { min: '2026-10-15 10:00', max: TEST_VALUE },
    { maxRange: -1 }, { defaultTime: '25:00' }, { format: 'invalid' },
  ])('reports invalid configuration explicitly: %j', async (props) => {
    const wrapper = createPicker(props)
    expect(wrapper.emitted('invalid')?.[0]?.[0]).toBe('configuration')
    expect(wrapper.get('[role="alert"]').exists()).toBe(true)
    await open(wrapper)
    expect(wrapper.get('.scq-date-time-picker__confirm').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('reports malformed controlled values instead of silently treating them as empty', () => {
    const wrapper = createPicker({ modelValue: '2026-02-30 09:00' })
    expect(wrapper.emitted('invalid')).toEqual([['format', '2026-02-30 09:00']])
    expect(wrapper.get('.scq-field__trigger').attributes('aria-invalid')).toBe('true')
  })

  it('teleports the integrated panel to a custom target and cleans it up', async () => {
    const target = document.createElement('div')
    target.id = 'date-time-picker-test-target'
    document.body.append(target)
    try {
      const wrapper = createPicker({ teleport: `#${target.id}`, modelValue: TEST_VALUE })
      await open(wrapper)
      expect(target.querySelectorAll('[role="dialog"]')).toHaveLength(1)
      expect(target.querySelector('.scq-calendar')).not.toBeNull()
      expect(target.querySelector('.scq-time-picker__columns')).not.toBeNull()
      wrapper.vm.hide()
      await flushPromises()
      expect(target.children).toHaveLength(0)
    } finally {
      target.remove()
    }
  })
})
