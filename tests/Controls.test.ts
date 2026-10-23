// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Switch from '../src/components/Switch/Switch.vue'
import InputNumber from '../src/components/InputNumber/InputNumber.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import { h, nextTick, ref, Teleport } from 'vue'
import Loading from '../src/components/Loading/Loading.vue'
import Skeleton from '../src/components/Skeleton/Skeleton.vue'
import Alert from '../src/components/Alert/Alert.vue'
import Badge from '../src/components/Badge/Badge.vue'
import Tag from '../src/components/Tag/Tag.vue'
import Empty from '../src/components/Empty/Empty.vue'
import Progress from '../src/components/Progress/Progress.vue'
import Avatar from '../src/components/Avatar/Avatar.vue'
import Search from '../src/components/Search/Search.vue'
import NoticeBar from '../src/components/NoticeBar/NoticeBar.vue'
import Form from '../src/components/Form/Form.vue'
import Checkbox from '../src/components/Checkbox/Checkbox.vue'
import CheckboxGroup from '../src/components/Checkbox/CheckboxGroup.vue'
import Radio from '../src/components/Radio/Radio.vue'
import RadioGroup from '../src/components/Radio/RadioGroup.vue'
import Button from '../src/components/Button/Button.vue'

const wrappers: VueWrapper[] = []

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('Button', () => {
  it('inherits Form disabled state outside its native fieldset via Teleport', async () => {
    const click = vi.fn()
    const wrapper = mount(Form, {
      attachTo: document.body, props: { model: {}, disabled: true },
      slots: { default: () => h(Teleport, { to: 'body' }, h(Button, { disabled: false, onClick: click, id: 'teleported-form-button' }, () => 'Save')) },
    })
    wrappers.push(wrapper)
    const button = document.getElementById('teleported-form-button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    button.click()
    expect(click).not.toHaveBeenCalled()
    await wrapper.setProps({ disabled: false })
    button.click()
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('preserves native button, submit and reset semantics', () => {
    const submit = vi.fn((event: Event) => event.preventDefault())
    const wrapper = mount({ render: () => h('form', { onSubmit: submit }, [
      h('input'), h(Button, {}, () => 'Default'), h(Button, { nativeType: 'submit' }, () => 'Submit'), h(Button, { nativeType: 'reset' }, () => 'Reset'),
    ]) }, { attachTo: document.body })
    wrappers.push(wrapper)
    const buttons = wrapper.findAll<HTMLButtonElement>('button')
    buttons[0].element.click()
    expect(submit).not.toHaveBeenCalled()
    buttons[1].element.click()
    expect(submit).toHaveBeenCalledTimes(1)
    const input = wrapper.get<HTMLInputElement>('input').element
    input.defaultValue = 'Original'
    input.value = 'Edited'
    buttons[2].element.click()
    expect(input.value).toBe('Original')
  })
})

describe('Switch', () => {
  it('emits the existing boolean model and change convention', async () => {
    const wrapper = mount(Switch, { props: { ariaLabel: 'Notifications' } })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.emitted('change')).toEqual([[true]])
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('input').attributes('aria-checked')).toBe('true')
    await wrapper.get('input').setValue(false)
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false])
  })

  it.each(['disabled', 'loading'] as const)('does not change while %s', async (state) => {
    const wrapper = mount(Switch, { props: { [state]: true } })
    wrappers.push(wrapper)
    expect(wrapper.get('input').element.disabled).toBe(true)
    await wrapper.get('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('inherits provider state and allows an explicit override', () => {
    const wrapper = mount(ConfigProvider, {
      props: { disabled: true, size: 'large' },
      slots: { default: () => [h(Switch), h(Switch, { disabled: false, size: 'small' })] },
    })
    wrappers.push(wrapper)
    const switches = wrapper.findAllComponents(Switch)
    expect(switches[0].get('input').element.disabled).toBe(true)
    expect(switches[0].classes()).toContain('scq-switch--large')
    expect(switches[1].get('input').element.disabled).toBe(false)
    expect(switches[1].classes()).toContain('scq-switch--small')
  })
})

describe('Checkbox', () => {
    it('initializes native indeterminate state and keeps it in sync with controlled props', async () => {
      const wrapper = mount(Checkbox, { props: { indeterminate: true } })
      wrappers.push(wrapper)
      const input = wrapper.get<HTMLInputElement>('input')
      expect(input.element.indeterminate).toBe(true)
      await wrapper.setProps({ modelValue: true })
      expect(input.element.indeterminate).toBe(false)
      expect(input.element.checked).toBe(true)
      await wrapper.setProps({ modelValue: false })
      expect(input.element.indeterminate).toBe(true)
    })

    it('restores checked and indeterminate states when a controlled proposal is ignored', async () => {
      const wrapper = mount(Checkbox, { props: { modelValue: false, indeterminate: true }, attachTo: document.body })
      wrappers.push(wrapper)
      const input = wrapper.get<HTMLInputElement>('input')
      input.element.click()
      await nextTick()
      expect(wrapper.emitted('change')).toEqual([[true]])
      expect(input.element.checked).toBe(false)
      expect(input.element.indeterminate).toBe(true)
    })

    it('restores native state for a rejected disabled change', async () => {
      const wrapper = mount(Checkbox, { props: { modelValue: true, disabled: true } })
      wrappers.push(wrapper)
      const input = wrapper.get<HTMLInputElement>('input')
      input.element.checked = false
      input.element.dispatchEvent(new Event('change', { bubbles: true }))
      await nextTick()
      expect(input.element.checked).toBe(true)
      expect(wrapper.emitted('change')).toBeUndefined()
    })

    it('preserves group selection when the parent does not accept a click', async () => {
      const wrapper = mount(CheckboxGroup, {
        props: { modelValue: ['a'] }, slots: { default: () => [h(Checkbox, { value: 'a' }), h(Checkbox, { value: 'b' })] },
        attachTo: document.body,
      })
      wrappers.push(wrapper)
      wrapper.findAll<HTMLInputElement>('input')[1].element.click()
      await nextTick()
      expect(wrapper.emitted('change')).toEqual([[['a', 'b']]])
      expect(wrapper.findAll<HTMLInputElement>('input').map(input => input.element.checked)).toEqual([true, false])
    })
})

describe('Radio', () => {
  it('restores a rejected standalone proposal and its named native peer', async () => {
    const wrapper = mount({ render: () => h('form', [
      h(Radio, { modelValue: 'a', value: 'a', name: 'choice' }),
      h(Radio, { modelValue: 'a', value: 'b', name: 'choice' }),
    ]) }, { attachTo: document.body })
    wrappers.push(wrapper)
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[1].element.click()
    await nextTick()
    expect(wrapper.findAllComponents(Radio)[1].emitted('change')).toEqual([['b']])
    expect(inputs.map(input => input.element.checked)).toEqual([true, false])
    expect(new FormData(wrapper.element as HTMLFormElement).get('choice')).toBe('a')
  })

  it('restores the whole controlled native group when a proposal is ignored', async () => {
    const wrapper = mount(RadioGroup, {
      attachTo: document.body, props: { modelValue: 'a', name: 'choice' },
      slots: { default: () => [h(Radio, { value: 'a' }), h(Radio, { value: 'b' })] },
    })
    wrappers.push(wrapper)
    wrapper.findAll<HTMLInputElement>('input')[1].element.click()
    await nextTick()
    expect(wrapper.emitted('change')).toEqual([['b']])
    expect(wrapper.findAll<HTMLInputElement>('input').map(input => input.element.checked)).toEqual([true, false])
    await wrapper.setProps({ modelValue: 'b' })
    expect(wrapper.findAll<HTMLInputElement>('input').map(input => input.element.checked)).toEqual([false, true])
  })

  it('restores rejected disabled changes without affecting another form with the same name', async () => {
    const wrapper = mount({ render: () => h('div', [
      h('form', [h(Radio, { modelValue: 'first', value: 'first', name: 'choice' })]),
      h('form', [
        h(Radio, { modelValue: 'a', value: 'a', name: 'choice' }),
        h(Radio, { modelValue: 'a', value: 'b', name: 'choice', disabled: true }),
      ]),
    ]) }, { attachTo: document.body })
    wrappers.push(wrapper)
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    inputs[2].element.checked = true
    inputs[2].element.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(inputs.map(input => input.element.checked)).toEqual([true, true, false])
    expect(wrapper.findAllComponents(Radio)[2].emitted('change')).toBeUndefined()
  })
})

describe('RadioGroup', () => {
  it('provides one tab stop and keyboard selection without requiring a native name', async () => {
    const wrapper = mount(RadioGroup, {
      attachTo: document.body, props: { modelValue: 'a' },
      slots: { default: () => [h(Radio, { value: 'a' }), h(Radio, { value: 'b', disabled: true }), h(Radio, { value: 'c' })] },
    })
    wrappers.push(wrapper)
    await nextTick()
    const inputs = wrapper.findAll<HTMLInputElement>('input')
    expect(inputs.map(input => input.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    inputs[0].element.focus()
    await inputs[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('change')).toEqual([['c']])
    expect(document.activeElement).toBe(inputs[2].element)
    expect(inputs.map(input => input.element.checked)).toEqual([true, false, false])
    await wrapper.setProps({ modelValue: 'c' })
    expect(inputs.map(input => input.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    await inputs[2].trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['a'])
    expect(document.activeElement).toBe(inputs[0].element)
  })

  it('repairs tab entry when the selected option is disabled or removed', async () => {
    const locked = ref(false)
    const present = ref(true)
    const wrapper = mount(RadioGroup, {
      attachTo: document.body, props: { modelValue: 'a' },
      slots: { default: () => [h(Radio, { value: 'a', disabled: locked.value }), present.value ? h(Radio, { value: 'b' }) : null, h(Radio, { value: 'c' })] },
    })
    wrappers.push(wrapper)
    locked.value = true
    await nextTick()
    expect(wrapper.get('input[tabindex="0"]').attributes('value')).toBe('b')
    present.value = false
    await nextTick()
    expect(wrapper.get('input[tabindex="0"]').attributes('value')).toBe('c')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('uses current DOM order after reordering options and leaves unnamed form data unchanged', async () => {
    const options = ref(['a', 'b', 'c'])
    const wrapper = mount({ render: () => h('form', [
      h(RadioGroup, { modelValue: 'c' }, { default: () => options.value.map(value => h(Radio, { value, key: value })) }),
    ]) }, { attachTo: document.body })
    wrappers.push(wrapper)
    options.value = ['c', 'a', 'b']
    await nextTick()
    await wrapper.get('input[value="c"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.getComponent(RadioGroup).emitted('change')).toEqual([['a']])
    expect([...new FormData(wrapper.element as HTMLFormElement).keys()]).toEqual([])
  })

  it('does not let nested group navigation affect the outer group', async () => {
    const wrapper = mount(RadioGroup, {
      attachTo: document.body, props: { modelValue: 'outer' },
      slots: { default: () => [h(Radio, { value: 'outer' }), h(RadioGroup, { modelValue: 'a' }, {
        default: () => [h(Radio, { value: 'a' }), h(Radio, { value: 'b' })],
      })] },
    })
    wrappers.push(wrapper)
    await wrapper.get('input[value="a"]').trigger('keydown', { key: 'End' })
    expect(wrapper.findAllComponents(RadioGroup).find(group => group.vm !== wrapper.vm)?.emitted('change')).toEqual([['b']])
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})

describe('CheckboxGroup', () => {
  it('submits only selected typed values and excludes a disabled group from native FormData', async () => {
    const disabled = ref(false)
    const wrapper = mount({ render: () => h('form', [
      h(CheckboxGroup, { modelValue: [false, 0], name: 'choices', disabled: disabled.value }, {
        default: () => [h(Checkbox, { value: false }), h(Checkbox, { value: 0 }), h(Checkbox, { value: 'other' })],
      }),
    ]) }, { attachTo: document.body })
    wrappers.push(wrapper)
    expect(new FormData(wrapper.element as HTMLFormElement).getAll('choices')).toEqual(['false', '0'])
    disabled.value = true
    await nextTick()
    expect(new FormData(wrapper.element as HTMLFormElement).getAll('choices')).toEqual([])
  })
  it('removes duplicate selections without mutating the caller array', async () => {
    const selected = ['a', 'a', 'b']
    const wrapper = mount(CheckboxGroup, { attachTo: document.body, props: { modelValue: selected }, slots: { default: () => h(Checkbox, { value: 'a' }) } })
    wrappers.push(wrapper)
    wrapper.get<HTMLInputElement>('input').element.click()
    await nextTick()
    expect(wrapper.emitted('change')).toEqual([[['b']]])
    expect(selected).toEqual(['a', 'a', 'b'])
  })

  it('uses unique typed membership without conflating false and zero', async () => {
    const wrapper = mount(CheckboxGroup, {
      attachTo: document.body,
      props: { modelValue: [false, false, 0], name: 'choices' },
      slots: { default: () => [h(Checkbox, { value: false }), h(Checkbox, { value: 0 }), h(Checkbox, { value: 'new' })] },
    })
    wrappers.push(wrapper)
    wrapper.findAll<HTMLInputElement>('input')[2].element.click()
    await nextTick()
    expect(wrapper.emitted('change')).toEqual([[[false, 0, 'new']]])
    expect(wrapper.findAll('input').map(input => input.attributes('name'))).toEqual(['choices', 'choices', 'choices'])
    await wrapper.setProps({ modelValue: [false, 0, 'new'] })
    wrapper.findAll<HTMLInputElement>('input')[0].element.click()
    await nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([[0, 'new']])
  })
})

describe('InputNumber', () => {
  it.each(['disabled', 'readonly'] as const)('restores the displayed value when %s rejects an input event', async (state) => {
    const wrapper = mount(InputNumber, { props: { modelValue: 2, [state]: true } })
    wrappers.push(wrapper)
    const input = wrapper.get<HTMLInputElement>('input')
    input.element.value = '9'
    input.element.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(input.element.value).toBe('2')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it.each([
    { min: 10, max: 1 }, { step: 0 }, { step: Number.NaN },
    { precision: Number.NaN }, { precision: 1.5 }, { min: Infinity }, { max: -Infinity },
  ])('reports invalid numeric configuration and recovers after correction: %j', async (props) => {
    const wrapper = mount(InputNumber, { props: { modelValue: 2, ...props } })
    wrappers.push(wrapper)
    expect(wrapper.emitted('invalid')?.at(-1)?.[1]).toBe('configuration')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ min: 0, max: 10, step: 1, precision: 2 })
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('change')).toEqual([[3]])
  })

  it('never emits infinity after an overflowing step', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: Number.MAX_VALUE, step: Number.MAX_VALUE } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('invalid')?.at(-1)?.[1]).toBe('number')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    await wrapper.setProps({ modelValue: 1, step: 1 })
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
  })

  it.each([Number.NaN, Infinity, -Infinity])('reports non-finite controlled values instead of stepping them: %s', async (modelValue) => {
    const wrapper = mount(InputNumber, { props: { modelValue } })
    wrappers.push(wrapper)
    expect(wrapper.emitted('invalid')?.at(-1)?.[1]).toBe('number')
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('change')).toBeUndefined()
  })
  it('steps decimals without floating-point residue and clamps to bounds', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 0.2, step: 0.1, min: 0, max: 0.3 } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0.3])
    await wrapper.setProps({ modelValue: 0.3 })
    expect(wrapper.findAll('button')[1].element.disabled).toBe(true)
    await wrapper.get('input').setValue('20')
    expect(wrapper.get('input').element.value).toBe('0.3')
  })

  it('supports clearing, precision, and keyboard stepping', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 2, precision: 1 } })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue('2.46')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2.5])
    await wrapper.get('input').setValue('')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([undefined])
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.[2]).toEqual([3])
  })

  it('does not emit changes when readonly', async () => {
    const wrapper = mount(InputNumber, { props: { readonly: true, modelValue: 2 } })
    wrappers.push(wrapper)
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})

describe('Empty', () => {
  it('distinguishes an omitted description from an explicitly empty description', async () => {
    const wrapper = mount(Empty)
    wrappers.push(wrapper)
    expect(wrapper.get('.scq-empty__description').text()).not.toBe('')
    await wrapper.setProps({ description: '' })
    expect(wrapper.find('.scq-empty__description').exists()).toBe(false)
    await wrapper.setProps({ description: undefined })
    expect(wrapper.get('.scq-empty__description').text()).not.toBe('')
  })

  it('falls back to its preset on image error and retries without accepting stale events', async () => {
    const wrapper = mount(Empty, { props: { image: '/empty-original.svg', preset: 'search' } })
    wrappers.push(wrapper)
    const original = wrapper.get('img')
    await original.trigger('error')
    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.scq-icon--search').exists()).toBe(true)
    wrapper.vm.retry()
    await nextTick()
    const retried = wrapper.get('img')
    expect(retried.element).not.toBe(original.element)
    original.element.dispatchEvent(new Event('error'))
    expect(wrapper.emitted('error')).toHaveLength(1)
    await retried.trigger('load')
    expect(wrapper.emitted('load')).toHaveLength(1)
    await wrapper.setProps({ image: '/empty-new.svg' })
    retried.element.dispatchEvent(new Event('error'))
    expect(wrapper.get('img').attributes('src')).toBe('/empty-new.svg')
    expect(wrapper.emitted('error')).toHaveLength(1)
  })

  it('keeps image and description slots authoritative over props', () => {
    const wrapper = mount(Empty, { props: { image: '/unused.svg', description: '' }, slots: {
      image: '<span data-custom-image>Illustration</span>', description: 'Custom description',
    } })
    wrappers.push(wrapper)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('[data-custom-image]').text()).toBe('Illustration')
    expect(wrapper.get('.scq-empty__description').text()).toBe('Custom description')
  })

  it('normalizes image sizes and reports invalid presets and dimensions', () => {
    const wrapper = mount(Empty, { props: { imageSize: -1 } })
    wrappers.push(wrapper)
    expect(wrapper.get('.scq-empty__image').attributes('style')).toContain('width: 0px')
    expect(() => mount(Empty, { props: { imageSize: Infinity } })).toThrow('must be finite')
    expect(() => mount(Empty, { attrs: { preset: 'constructor' } })).toThrow('Unknown Empty preset')
  })
})

describe('Badge', () => {
  it.each([
    { value: Number.NaN }, { value: Infinity }, { value: -Infinity },
    { value: 1, max: Number.NaN }, { value: 1, max: -1 },
  ])('reports invalid numeric values and limits instead of rendering them: %j', props => {
    expect(() => mount(Badge, { props })).toThrow('[scq-vue] Badge')
  })

  it('supports an uncapped finite value and preserves string labels independently of numeric caps', async () => {
    const wrapper = mount(Badge, { props: { value: 120, max: Infinity } })
    wrappers.push(wrapper)
    expect(wrapper.get('sup').text()).toBe('120')
    await wrapper.setProps({ max: 0 })
    expect(wrapper.get('sup').text()).toBe('0+')
    await wrapper.setProps({ value: '120' })
    expect(wrapper.get('sup').text()).toBe('120')
  })

  it('rejects non-finite offsets while preserving signed pixel offsets', () => {
    expect(() => mount(Badge, { props: { value: 1, offset: [Number.NaN, 2] } })).toThrow('two finite numbers')
    const wrapper = mount(Badge, { props: { value: 1, offset: [-4, 6] } })
    wrappers.push(wrapper)
    expect(wrapper.get('sup').attributes('style')).toContain('--scq-badge-offset-x: -4px')
    expect(wrapper.get('sup').attributes('style')).toContain('--scq-badge-offset-y: 6px')
  })

  it('reactively updates custom badge content while hidden remains authoritative', async () => {
    const wrapper = mount(Badge, { props: { value: 10, max: 9, live: 'polite' }, slots: {
      content: ({ value, displayValue }: { value: string | number; displayValue: string | number }) => `${value} (${displayValue})`,
    } })
    wrappers.push(wrapper)
    expect(wrapper.get('sup').text()).toBe('10 (9+)')
    await wrapper.setProps({ value: 5 })
    expect(wrapper.get('sup').text()).toBe('5 (5)')
    expect(wrapper.get('sup').attributes('aria-atomic')).toBe('true')
    await wrapper.setProps({ hidden: true })
    expect(wrapper.find('sup').exists()).toBe(false)
  })
})

describe('Tag', () => {
  it('keeps selection and closing disabled through a Form Teleport despite an explicit override', async () => {
    const change = vi.fn()
    const close = vi.fn()
    const wrapper = mount(Form, {
      attachTo: document.body, props: { model: {}, disabled: true },
      slots: { default: () => h(Teleport, { to: 'body' }, h(Tag, { id: 'teleported-tag', selectable: true, closable: true, disabled: false, onChange: change, onClose: close }, () => 'Choice')) },
    })
    wrappers.push(wrapper)
    const tag = document.getElementById('teleported-tag')!
    const buttons = Array.from(tag.querySelectorAll('button'))
    expect(buttons.every(button => button.disabled)).toBe(true)
    buttons.forEach(button => button.click())
    expect(change).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    await wrapper.setProps({ disabled: false })
    buttons[0].click()
    buttons[1].click()
    expect(change).toHaveBeenCalledWith(true)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('names icon-only selections and associates close actions with their tag text', () => {
    const wrapper = mount(Tag, { props: { icon: 'check', selectable: true, closable: true, ariaLabel: 'Completed filter', closeLabel: 'Remove completed filter' } })
    wrappers.push(wrapper)
    const select = wrapper.get('.scq-tag__select')
    const close = wrapper.get('.scq-tag__close')
    expect(select.attributes('aria-label')).toBe('Completed filter')
    expect(close.attributes('aria-label')).toBe('Remove completed filter')
    expect(close.attributes('aria-describedby')).toBe(select.attributes('id'))
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('keeps tag-description IDs distinct in one application', () => {
    const wrapper = mount({ render: () => h('div', [
      h(Tag, { closable: true }, () => 'First'), h(Tag, { closable: true }, () => 'Second'),
    ]) })
    wrappers.push(wrapper)
    const ids = wrapper.findAll('.scq-tag__text').map(text => text.attributes('id'))
    expect(new Set(ids).size).toBe(2)
    expect(wrapper.findAll('.scq-tag__close').map(button => button.attributes('aria-describedby'))).toEqual(ids)
  })
})

describe('Alert', () => {
  it('keeps action-slot events separate from dismissal and never submits an enclosing form', async () => {
    const submit = vi.fn((event: Event) => event.preventDefault())
    const action = vi.fn()
    const close = vi.fn()
    const wrapper = mount({ render: () => h('form', { onSubmit: submit }, [
      h(Alert, { title: 'Notice', closeText: 'Dismiss', onClose: close }, {
        actions: () => h('button', { type: 'button', onClick: action }, 'Review'),
      }),
    ]) }, { attachTo: document.body })
    wrappers.push(wrapper)
    wrapper.get<HTMLButtonElement>('.scq-alert__actions button').element.click()
    expect(action).toHaveBeenCalledTimes(1)
    expect(close).not.toHaveBeenCalled()
    expect(wrapper.find('.scq-alert').exists()).toBe(true)
    wrapper.get<HTMLButtonElement>('.scq-alert__close').element.click()
    await nextTick()
    expect(close).toHaveBeenCalledWith(expect.any(MouseEvent))
    expect(submit).not.toHaveBeenCalled()
    expect(wrapper.find('.scq-alert').exists()).toBe(false)
  })

  it('keeps custom content and close labels while updating live-region severity', async () => {
    const wrapper = mount(Alert, {
      props: { title: 'Fallback title', description: 'Fallback description', closeText: 'Dismiss' },
      slots: { title: '<strong>Custom title</strong>', default: 'Custom description', icon: '<span data-custom-icon>!</span>' },
    })
    wrappers.push(wrapper)
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).not.toContain('Fallback')
    expect(wrapper.get('.scq-alert__close').attributes('aria-label')).toBe('Dismiss')
    await wrapper.setProps({ type: 'error', showIcon: false })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.find('[data-custom-icon]').exists()).toBe(false)
    expect(wrapper.get('.scq-alert__title').text()).toBe('Custom title')
    await wrapper.setProps({ type: 'warning', closable: false })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.find('.scq-alert__close').exists()).toBe(false)
  })
})

describe('Progress', () => {
  it.each(['circle', 'dashboard'] as const)('preserves exact fractional geometry and buffer bounds in %s mode', async type => {
    const wrapper = mount(Progress, { props: { type, percentage: 37.5, buffer: 75 } })
    wrappers.push(wrapper)
    const length = (selector: string) => Number(wrapper.get(selector).attributes('stroke-dasharray').split(' ')[0])
    expect(length('.scq-progress__ring-fill') / length('.scq-progress__ring-track')).toBeCloseTo(0.375)
    expect(length('.scq-progress__ring-buffer') / length('.scq-progress__ring-track')).toBeCloseTo(0.75)
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('37.5')
    await wrapper.setProps({ percentage: 100 })
    expect(length('.scq-progress__ring-fill')).toBeCloseTo(length('.scq-progress__ring-track'))
    expect(length('.scq-progress__ring-buffer')).toBeCloseTo(length('.scq-progress__ring-track'))
  })

  it('orders color thresholds without mutating them and clears explicit color overrides', async () => {
    const color = [{ percentage: 100, color: 'green' }, { percentage: 50, color: 'red' }]
    const wrapper = mount(Progress, { props: { percentage: 50, color } })
    wrappers.push(wrapper)
    expect(wrapper.element.style.getPropertyValue('--scq-progress-color')).toBe('red')
    await wrapper.setProps({ percentage: 50.1 })
    expect(wrapper.element.style.getPropertyValue('--scq-progress-color')).toBe('green')
    expect(color.map(stop => stop.percentage)).toEqual([100, 50])
    await wrapper.setProps({ color: '' })
    expect(wrapper.element.style.getPropertyValue('--scq-progress-color')).toBe('')
    expect(wrapper.get<HTMLElement>('.scq-progress__fill').element.style.background).toBe('')
  })
})

describe('Loading', () => {
  it.each([false, true])('restores blocked content focus without stealing moved focus (moved=%s)', async moved => {
    const wrapper = mount(Loading, { attachTo: document.body, props: { loading: false }, slots: { default: '<button>Continue</button>' } })
    wrappers.push(wrapper)
    const button = wrapper.get<HTMLButtonElement>('button')
    const outside = document.createElement('button')
    document.body.append(outside)
    try {
      button.element.focus()
      await wrapper.setProps({ loading: true })
      button.element.blur()
      if (moved) outside.focus()
      await wrapper.setProps({ loading: false })
      await nextTick()
      expect(document.activeElement).toBe(moved ? outside : button.element)
    } finally {
      outside.remove()
    }
  })

  it.each([{ delay: Infinity }, { delay: Number.NaN }, { minDuration: Infinity }, { minDuration: Number.NaN }, { size: Infinity }])('reports invalid timings or dimensions: %j', props => {
    expect(() => mount(Loading, { props })).toThrow('must be finite')
  })
})

describe('Feedback', () => {
  it('reobserves recreated notice nodes after controlled reopening and releases measurements on unmount', async () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { observe = observe; disconnect = disconnect })
    try {
      const wrapper = mount(NoticeBar, { props: { modelValue: true, text: 'Notice', wrap: false, scrollable: true } })
      wrappers.push(wrapper)
      const oldContent = wrapper.get('.scq-notice-bar__content').element
      expect(observe).toHaveBeenCalledWith(oldContent)
      await wrapper.setProps({ modelValue: false })
      await nextTick()
      expect(disconnect).toHaveBeenCalled()
      await wrapper.setProps({ modelValue: true })
      await nextTick()
      const content = wrapper.get('.scq-notice-bar__content').element
      expect(content).not.toBe(oldContent)
      expect(observe).toHaveBeenCalledWith(content)
      disconnect.mockClear()
      wrapper.unmount()
      wrappers.pop()
      expect(disconnect).toHaveBeenCalledTimes(1)
    } finally { vi.unstubAllGlobals() }
  })

  it('keeps notice timing normalization and reports derived duration overflow', async () => {
    const wrapper = mount(NoticeBar, { props: { text: 'Notice', wrap: false, scrollable: true, speed: 0, delay: Infinity } })
    wrappers.push(wrapper)
    Object.defineProperty(wrapper.get('.scq-notice-bar__content').element, 'scrollWidth', { value: 500 })
    Object.defineProperty(wrapper.get('.scq-notice-bar__viewport').element, 'clientWidth', { value: 100 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.get('.scq-notice-bar__content').attributes('style')).toContain('--scq-notice-duration: 10s')
    expect(wrapper.get('.scq-notice-bar__content').attributes('style')).toContain('--scq-notice-delay: 1000ms')
    await wrapper.setProps({ delay: -1 })
    expect(wrapper.get('.scq-notice-bar__content').attributes('style')).toContain('--scq-notice-delay: 0ms')
    await expect(wrapper.setProps({ speed: Number.MIN_VALUE })).rejects.toThrow('scroll duration must be finite')
  })

  it('pauses notices without resetting measured animation and supports controlled reopening', async () => {
    const wrapper = mount(NoticeBar, { props: { text: 'Notice', scrollable: true, wrap: false, closable: true, modelValue: true } })
    wrappers.push(wrapper)
    Object.defineProperty(wrapper.get('.scq-notice-bar__content').element, 'scrollWidth', { value: 360 })
    Object.defineProperty(wrapper.get('.scq-notice-bar__viewport').element, 'clientWidth', { value: 100 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    const style = wrapper.get('.scq-notice-bar__content').attributes('style')
    wrapper.vm.pause()
    await nextTick()
    expect(wrapper.classes()).toContain('is-paused')
    expect(wrapper.get('.scq-notice-bar__content').attributes('style')).toBe(style)
    wrapper.vm.resume()
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-paused')
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true, paused: false })
    wrapper.vm.pause()
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-paused')
    expect(wrapper.emitted('update:paused')?.at(-1)).toEqual([true])
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
  })
  it('keeps controlled alerts visible until acknowledged and emits one close per opening', async () => {
    const wrapper = mount(Alert, { props: { modelValue: true, title: 'Warning', closeText: 'Dismiss' }, slots: { icon: '<span>!</span>', actions: '<button>Retry</button>' } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-alert__close').trigger('click')
    await wrapper.get('.scq-alert__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.find('.scq-alert').exists()).toBe(true)
    expect(wrapper.get('.scq-alert__actions').text()).toBe('Retry')
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.scq-alert').exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    await wrapper.get('.scq-alert__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
    const local = mount(Alert)
    wrappers.push(local)
    await local.get('button').trigger('click')
    await local.setProps({ title: 'Changed' })
    expect(local.find('.scq-alert').exists()).toBe(false)
  })
  it('shares normalized progress semantics across circular, dashboard and buffered variants', async () => {
    const wrapper = mount(Progress, { props: { type: 'circle', percentage: 50, buffer: 20, color: [{ percentage: 50, color: 'red' }, { percentage: 100, color: 'green' }] } })
    wrappers.push(wrapper)
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('50')
    expect(wrapper.get('.scq-progress__ring-buffer').attributes('stroke-dasharray')).toBe(wrapper.get('.scq-progress__ring-fill').attributes('stroke-dasharray'))
    expect(wrapper.attributes('style')).toContain('--scq-progress-color: red')
    await wrapper.setProps({ type: 'dashboard', percentage: 100, strokeWidth: Infinity })
    expect(wrapper.get('.scq-progress__ring-fill').attributes('transform')).toBe('rotate(135 50 50)')
    expect(wrapper.attributes('style')).toContain('--scq-progress-color: green')
    expect(wrapper.get('.scq-progress__ring-fill').attributes('stroke-dasharray')).not.toContain('NaN')
    await wrapper.setProps({ indeterminate: true })
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.find('.scq-progress__ring-buffer').exists()).toBe(false)
  })
  it('delays loading, releases interaction immediately and clears minimum-duration timers', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(Loading, { props: { loading: true, delay: 50, minDuration: 100 }, slots: { default: '<button>Save</button>' } })
      wrappers.push(wrapper)
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.get('.scq-loading__content').attributes('inert')).toBeDefined()
      await wrapper.setProps({ loading: false })
      await vi.advanceTimersByTimeAsync(100)
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      await wrapper.setProps({ loading: true })
      await vi.advanceTimersByTimeAsync(50)
      expect(wrapper.find('[role="status"]').exists()).toBe(true)
      await wrapper.setProps({ loading: false })
      expect(wrapper.get('.scq-loading__content').attributes('inert')).toBeUndefined()
      expect(wrapper.get('.scq-loading__indicator').attributes('aria-hidden')).toBe('true')
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      await vi.advanceTimersByTimeAsync(99)
      expect(wrapper.find('.scq-loading__indicator').exists()).toBe(true)
      await vi.advanceTimersByTimeAsync(1)
      expect(wrapper.find('.scq-loading__indicator').exists()).toBe(false)
      await wrapper.setProps({ loading: true })
      wrapper.unmount()
      wrappers.pop()
      expect(vi.getTimerCount()).toBe(0)
    } finally { vi.useRealTimers() }
  })

  it('supports a custom non-blocking loading indicator', () => {
    const wrapper = mount(Loading, { props: { blocking: false }, slots: { default: '<input />', indicator: '<span>Working</span>' } })
    wrappers.push(wrapper)
    expect(wrapper.get('[role="status"]').text()).toBe('Working')
    expect(wrapper.get('.scq-loading__content').attributes('inert')).toBeUndefined()
  })
  it('uses opt-in empty presets and respects explicit descriptions and provider locale', async () => {
    const wrapper = mount(ConfigProvider, { props: { locale: 'en-US' }, slots: { default: () => h(Empty, { preset: 'search', size: 'small' }) } })
    wrappers.push(wrapper)
    expect(wrapper.text()).toBe('No matching results')
    expect(wrapper.find('.scq-empty--small').exists()).toBe(true)
    await wrapper.setProps({ locale: 'zh-CN' })
    expect(wrapper.text()).not.toBe('No matching results')
    const explicit = mount(Empty, { props: { preset: 'unconfigured', description: 'Custom reason' } })
    wrappers.push(explicit)
    expect(explicit.text()).toBe('Custom reason')
  })
  it('supports badge placement, custom content and explicit live announcements without changing zero rules', async () => {
    const wrapper = mount(Badge, { props: { placement: 'bottom-left', offset: [-4, 6], live: 'polite', text: 'Online' }, slots: { content: 'NEW', default: '<button>Inbox</button>' } })
    wrappers.push(wrapper)
    expect(wrapper.get('sup').text()).toBe('NEW')
    expect(wrapper.get('sup').classes()).toContain('scq-badge--bottom-left')
    expect(wrapper.get('sup').attributes('style')).toContain('--scq-badge-offset-x: -4px')
    expect(wrapper.get('sup').attributes('aria-live')).toBe('polite')
    await wrapper.setProps({ hidden: true })
    expect(wrapper.find('sup').exists()).toBe(false)
    const zero = mount(Badge, { props: { value: '0' } })
    wrappers.push(zero)
    expect(zero.get('sup').text()).toBe('0')
    expect(zero.get('sup').attributes('aria-live')).toBe('off')
  })
  it('keeps tag selection controlled and independent from closing', async () => {
    const wrapper = mount(Tag, { props: { selectable: true, closable: true }, slots: { default: 'Vue' } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-tag__select').trigger('click')
    expect(wrapper.emitted('update:selected')).toEqual([[true]])
    expect(wrapper.get('.scq-tag__select').attributes('aria-pressed')).toBe('false')
    await wrapper.setProps({ selected: true })
    await wrapper.get('.scq-tag__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('change')).toHaveLength(1)
    await wrapper.setProps({ disabled: true })
    await wrapper.get('.scq-tag__select').trigger('click')
    await wrapper.get('.scq-tag__close').trigger('click')
    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
  it('keeps notice scroll configuration stable when measured overflow disappears', async () => {
    const wrapper = mount(NoticeBar, { props: { text: 'Long notice', wrap: false, scrollable: true } })
    wrappers.push(wrapper)
    let contentWidth = 360
    Object.defineProperty(wrapper.get('.scq-notice-bar__content').element, 'scrollWidth', { get: () => contentWidth })
    Object.defineProperty(wrapper.get('.scq-notice-bar__viewport').element, 'clientWidth', { get: () => 100 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.classes()).toContain('is-scrolling')
    contentWidth = 100
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-scrolling')
    expect(wrapper.classes()).toContain('is-scrollable')
  })

  it('closes notice bars without emitting an extra row click', async () => {
    const wrapper = mount(NoticeBar, { props: { text: 'Scheduled maintenance', closable: true } })
    wrappers.push(wrapper)
    expect(wrapper.find('.scq-notice-bar__icon.scq-icon--bell').exists()).toBe(true)
    await wrapper.setProps({ icon: false })
    expect(wrapper.find('.scq-notice-bar__icon').exists()).toBe(false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('normalizes progress values and exposes an indeterminate state', async () => {
    const wrapper = mount(Progress, { props: { percentage: 150, ariaLabel: 'Upload' } })
    wrappers.push(wrapper)
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    expect(wrapper.text()).toBe('100%')
    await wrapper.setProps({ percentage: -10, format: (value) => `${value} files` })
    expect(wrapper.text()).toBe('0 files')
    await wrapper.setProps({ percentage: NaN })
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    await wrapper.setProps({ indeterminate: true })
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBeUndefined()
  })

  it('falls back after an avatar image error and retries a new source', async () => {
    const wrapper = mount(Avatar, { props: { src: '/missing.png', alt: 'Ada', size: 56 }, slots: { default: 'AL' } })
    wrappers.push(wrapper)
    expect(wrapper.get('img').attributes('alt')).toBe('Ada')
    await wrapper.get('img').trigger('error')
    expect(wrapper.text()).toBe('AL')
    expect(wrapper.attributes('aria-label')).toBe('Ada')
    expect(wrapper.emitted('error')).toHaveLength(1)
    await wrapper.setProps({ src: '/avatar.png' })
    expect(wrapper.get('img').attributes('src')).toBe('/avatar.png')
    await wrapper.get('img').trigger('load')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('keeps loading content mounted and releases it when finished', async () => {
    const wrapper = mount(Loading, { slots: { default: '<button>Save</button>' } })
    wrappers.push(wrapper)
    expect(wrapper.get('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
    await wrapper.setProps({ loading: false })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('.scq-loading__content').attributes('inert')).toBeUndefined()
  })

  it('replaces skeleton rows with resolved content', async () => {
    const wrapper = mount(Skeleton, { props: { rows: 4 }, slots: { default: 'Ready' } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(4)
    await wrapper.setProps({ loading: false })
    expect(wrapper.text()).toBe('Ready')
  })

  it('closes alerts but lets the parent own tag removal', async () => {
    const alert = mount(Alert, { props: { title: 'Notice' } })
    const tag = mount(Tag, { props: { closable: true }, slots: { default: 'Vue' } })
    wrappers.push(alert, tag)
    await alert.get('button').trigger('click')
    await tag.get('button').trigger('click')
    expect(alert.emitted('close')).toHaveLength(1)
    expect(alert.find('.scq-alert').exists()).toBe(false)
    expect(tag.emitted('close')).toHaveLength(1)
    expect(tag.text()).toBe('Vue')
  })

  it('handles badge zero, maximum and dot modes', async () => {
    const wrapper = mount(Badge, { props: { value: 0 } })
    wrappers.push(wrapper)
    expect(wrapper.find('sup').exists()).toBe(false)
    await wrapper.setProps({ showZero: true })
    expect(wrapper.get('sup').text()).toBe('0')
    await wrapper.setProps({ value: 120 })
    expect(wrapper.get('sup').text()).toBe('99+')
    await wrapper.setProps({ isDot: true })
    expect(wrapper.get('sup').classes()).toContain('is-dot')
  })
})

describe('Search', () => {
  it('does not nest a native form or submit its parent Form on Enter', async () => {
    const wrapper = mount(Form, {
      attachTo: document.body, props: { model: { query: 'report' } },
      slots: { default: () => h(Search, { modelValue: 'report', name: 'query' }) },
    })
    wrappers.push(wrapper)
    expect(wrapper.findAll('form')).toHaveLength(1)
    expect(new FormData(wrapper.element as HTMLFormElement).get('query')).toBe('report')
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.getComponent(Search).emitted('search')).toEqual([['report']])
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('can opt out of its native form when embedded in a plain HTML form', () => {
    const wrapper = mount({ render: () => h('form', [h(Search, { nativeForm: false, modelValue: 'query' })]) })
    wrappers.push(wrapper)
    expect(wrapper.findAll('form')).toHaveLength(1)
    expect(wrapper.get('[role="search"]').element.tagName).toBe('DIV')
  })

  it('ignores IME Enter and submits the subsequent ordinary Enter only once', async () => {
    const wrapper = mount(Search, { props: { modelValue: 'report' } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    await input.trigger('keydown', { key: 'Enter', keyCode: 229 })
    expect(wrapper.emitted('search')).toBeUndefined()
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('search')).toEqual([['report']])
  })

  it('cancels stale composition after an external query replacement', async () => {
    const wrapper = mount(Search, { props: { modelValue: 'Original' } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '中'
    await wrapper.setProps({ modelValue: 'Replacement' })
    expect(input.element.value).toBe('Replacement')
    input.element.value = '旧组合'
    await input.trigger('compositionend')
    await input.trigger('input')
    expect(input.element.value).toBe('Replacement')
    expect(wrapper.emitted('input')).toBeUndefined()
  })

  it.each(['disabled', 'readonly'] as const)('cancels pending composition when becoming %s', async (state) => {
    const wrapper = mount(Search, { props: { modelValue: 'Original' } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '中'
    await wrapper.setProps({ [state]: true })
    input.element.value = '旧组合'
    input.element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    input.element.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(input.element.value).toBe('Original')
    expect(wrapper.emitted('input')).toBeUndefined()
  })
  it('emits search, clear and cancel with an accessible native input', async () => {
    const wrapper = mount(Search, { props: { modelValue: 'report', showAction: true, ariaLabel: 'Documents' } })
    wrappers.push(wrapper)
    expect(wrapper.get('input').attributes('aria-label')).toBe('Documents')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('search')).toEqual([['report']])
    await wrapper.get('.scq-search__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
    await wrapper.get('.scq-search__action button').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('does not submit or commit intermediate composition text', async () => {
    const wrapper = mount(Search)
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '\u6587\u6863'
    await input.trigger('input')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('input')).toBeUndefined()
    expect(wrapper.emitted('search')).toBeUndefined()
    await input.trigger('compositionend')
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toEqual([['\u6587\u6863']])
  })

  it('inherits disabled state and keeps readonly values unchanged', async () => {
    const wrapper = mount(Search, { props: { disabled: true, modelValue: 'keep', showAction: true } })
    wrappers.push(wrapper)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('search')).toBeUndefined()
    await wrapper.setProps({ disabled: false, readonly: true })
    wrapper.vm.clear()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('.scq-search__clear').exists()).toBe(false)
  })
})