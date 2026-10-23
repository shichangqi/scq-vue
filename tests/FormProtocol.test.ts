// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import type { FormFieldState } from '../src/components/Form/context'
import Input from '../src/components/Input/Input.vue'

const wrappers: VueWrapper[] = []
afterEach(async () => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  await flushPromises()
  vi.useRealTimers()
  vi.restoreAllMocks()
})
const makeForm = (initial = '') => {
  const model = reactive({ name: initial })
  const wrapper = mount(Form, {
    props: { model, showErrorSummary: true, focusOnError: true },
    slots: { default: () => h(FormItem, { prop: 'name', label: 'Name', help: 'Account name', rules: { required: true, message: 'Required name' } }, {
      default: () => h(Input, { modelValue: model.name, 'onUpdate:modelValue': (value) => { model.name = String(value) } }),
    }) }, attachTo: document.body,
  })
  wrappers.push(wrapper)
  return { wrapper, model }
}

describe('Form field protocol', () => {
  it('exposes identity-aware focus to custom error summaries', async () => {
    const wrapper = mount(Form, {
      attachTo: document.body, props: { model: { value: '' } },
      slots: {
        default: () => [
          h(FormItem, { prop: 'value', error: 'First' }, { default: () => h(Input) }),
          h(FormItem, { prop: 'value', error: 'Second' }, { default: () => h(Input) }),
        ],
        'error-summary': ({ errors, focusError }: { errors: FormFieldState[]; focusError: (error: FormFieldState) => boolean }) =>
          h('button', { type: 'button', onClick: () => focusError(errors[1]) }, 'Focus second'),
      },
    })
    wrappers.push(wrapper)
    await nextTick()
    await wrapper.get('.scq-form__errors button').trigger('click')
    expect(document.activeElement).toBe(wrapper.findAll('input')[1].element)
  })
  it('distinguishes summary entries for repeated paths and skips disabled focus targets', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const firstDisabled = ref(false)
    const wrapper = mount(Form, {
      attachTo: document.body, props: { model: { name: '' }, showErrorSummary: true },
      slots: { default: () => [
        h(FormItem, { prop: 'name', label: 'First name', error: 'First error' }, { default: () => h(Input, { disabled: firstDisabled.value }) }),
        h(FormItem, { prop: 'name', label: 'Second name', error: 'Second error' }, { default: () => h(Input) }),
      ] },
    })
    wrappers.push(wrapper)
    await nextTick()
    const buttons = wrapper.findAll('.scq-form__errors button')
    expect(buttons.map(button => button.text())).toEqual(['First name: First error', 'Second name: Second error'])
    await buttons[1].trigger('click')
    expect(document.activeElement).toBe(wrapper.findAll('input')[1].element)
    firstDisabled.value = true
    await nextTick()
    expect(wrapper.vm.focusField('name')).toBe(true)
    expect(document.activeElement).toBe(wrapper.findAll('input')[1].element)
    expect(wrapper.vm.focusFirstError()).toBe(true)
    expect(warn).not.toHaveBeenCalled()
  })
  it('keeps explicit errors authoritative for standalone FormItem validation', async () => {
    const wrapper = mount(FormItem, { props: { label: 'Standalone', error: 'Server error' }, slots: { default: () => h(Input) } })
    wrappers.push(wrapper)
    expect(await wrapper.vm.validate()).toBe(false)
    wrapper.vm.clearValidate()
    await nextTick()
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    await wrapper.setProps({ error: '' })
    expect(await wrapper.vm.validate()).toBe(true)
  })

  it('focuses a usable native control inside an unregistered group wrapper', async () => {
    const wrapper = mount(Form, { attachTo: document.body, props: { model: { choice: true } }, slots: {
      default: () => h(FormItem, { prop: 'choice', label: 'Choices', help: 'Choose a value' }, {
        default: () => h('div', { role: 'group' }, [h('input', { type: 'hidden' }), h('input', { type: 'checkbox', checked: true })]),
      }),
    } })
    wrappers.push(wrapper)
    await nextTick()
    const checkbox = wrapper.get('input[type="checkbox"]')
    expect(wrapper.vm.focusField('choice')).toBe(true)
    expect(document.activeElement).toBe(checkbox.element)
    checkbox.element.blur()
    await wrapper.get('label').trigger('click')
    expect(document.activeElement).toBe(checkbox.element)
  })

  it('renews reset baselines when a registered field moves to another model path', async () => {
    const model = reactive({ first: 'First', second: 'Second' })
    const path = ref<'first' | 'second'>('first')
    const wrapper = mount(Form, { props: { model }, slots: {
      default: () => h(FormItem, { prop: path.value, label: 'Field' }, {
        default: () => h(Input, { modelValue: model[path.value], 'onUpdate:modelValue': value => { model[path.value] = String(value) } }),
      }),
    } })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue('Changed first')
    path.value = 'second'
    await nextTick()
    expect(wrapper.vm.getFieldState('first')).toBeUndefined()
    expect(wrapper.vm.getFieldState('second')).toMatchObject({ dirty: false, touched: false })
    await wrapper.get('input').setValue('Changed second')
    await wrapper.vm.resetFields('second')
    expect(model).toEqual({ first: 'Changed first', second: 'Second' })
  })

  it('keeps hidden inline errors in validity and summaries without dangling error descriptions', async () => {
    const wrapper = mount(Form, { props: { model: { value: '' }, showErrorSummary: true }, slots: {
      default: () => h(FormItem, { prop: 'value', label: 'Value', help: 'Help', error: 'Server error', showMessage: false }, { default: () => h(Input) }),
    } })
    wrappers.push(wrapper)
    await nextTick()
    expect(await wrapper.vm.validate()).toBe(false)
    expect(wrapper.find('.scq-form-item__error').exists()).toBe(false)
    expect(wrapper.get('.scq-form__errors').text()).toContain('Server error')
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(wrapper.get('.scq-form-item__help').attributes('id'))
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })
  it('links labels, help and errors, summarizes errors and focuses the first invalid input', async () => {
    const { wrapper } = makeForm()
    await nextTick()
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-labelledby')).toBe(wrapper.get('label').attributes('id'))
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('.scq-form-item__help').attributes('id'))
    expect(wrapper.vm.state.dirty).toBe(false)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.scq-form__errors').text()).toContain('Name: Required name')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain(wrapper.get('.scq-form-item__error').attributes('id'))
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.vm.getFieldState('name')).toMatchObject({ touched: true, dirty: false, pending: false, error: 'Required name' })
  })

  it('tracks dirty/touched separately and resets the mounted baseline', async () => {
    const { wrapper, model } = makeForm('Original')
    await wrapper.get('input').setValue('Changed')
    await flushPromises()
    expect(wrapper.vm.state).toMatchObject({ dirty: true, touched: false })
    await wrapper.get('input').trigger('blur')
    await wrapper.get('input').trigger('focusout')
    await flushPromises()
    expect(wrapper.vm.state.touched).toBe(true)
    await wrapper.vm.resetFields()
    expect(model.name).toBe('Original')
    expect(wrapper.vm.state).toMatchObject({ dirty: false, touched: false, pending: false, errors: [] })
  })

  it('supports native controls and isolates two forms in the same application', async () => {
    const first = reactive({ value: '' })
    const second = reactive({ value: 'Second' })
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [first, second].map((model, index) => h(Form, { model }, {
        default: () => h(FormItem, { prop: 'value', label: `Field ${index}`, rules: { required: true, message: 'Required' } }, {
          default: () => index ? h(Input, { modelValue: model.value }) : h('input', { value: model.value }),
        }),
      }))),
    }), { attachTo: document.body })
    wrappers.push(wrapper)
    await nextTick()
    const forms = wrapper.findAllComponents(Form)
    const inputs = wrapper.findAll('input')
    expect(inputs[0].attributes('id')).not.toBe(inputs[1].attributes('id'))
    expect(await forms[0].vm.validate()).toBe(false)
    expect(forms[1].vm.state.errors).toEqual([])
    expect(inputs[1].attributes('aria-invalid')).toBeUndefined()
    expect(forms[0].vm.focusField('value')).toBe(true)
    expect(document.activeElement).toBe(inputs[0].element)
  })

  it('reactively updates automatically assigned explicit field IDs', async () => {
    const model = reactive({ value: '' })
    const forId = ref('first-id')
    const wrapper = mount(Form, { props: { model }, slots: {
      default: () => h(FormItem, { prop: 'value', label: 'Value', forId: forId.value }, { default: () => h(Input) }),
    } })
    wrappers.push(wrapper)
    await nextTick()
    forId.value = 'second-id'
    await nextTick()
    expect(wrapper.get('input').attributes('id')).toBe('second-id')
    expect(wrapper.get('label').attributes('for')).toBe('second-id')
  })

  it('validates dependencies using the full model with opt-in debounce', async () => {
    vi.useFakeTimers()
    const model = reactive({ password: 'same', confirm: 'same' })
    const validator = vi.fn((_rule, value, _callback, source) => value === source.password ? Promise.resolve() : Promise.reject(new Error('Mismatch')))
    const wrapper = mount(Form, { props: { model, showErrorSummary: true }, slots: {
      default: () => h(FormItem, { prop: 'confirm', dependencies: ['password'], validateDebounce: 20, rules: { asyncValidator: validator } }, {
        default: () => h(Input, { modelValue: model.confirm }),
      }),
    } })
    wrappers.push(wrapper)
    model.password = 'new'
    await nextTick()
    await vi.advanceTimersByTimeAsync(19)
    expect(validator).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()
    expect(wrapper.vm.getFieldState('confirm')?.error).toBe('Mismatch')
    expect(validator).toHaveBeenCalledTimes(1)
    model.confirm = 'new'
    await nextTick()
    await vi.advanceTimersByTimeAsync(20)
    await flushPromises()
    expect(wrapper.vm.state.errors).toEqual([])
  })

  it('does not report stale success for a changed value and ignores removed fields', async () => {
    const model = reactive({ value: 'old' })
    const visible = ref(true)
    let settle!: () => void
    const check = new Promise<void>((resolve) => { settle = resolve })
    const wrapper = mount(Form, { props: { model }, slots: {
      default: () => visible.value ? h(FormItem, { prop: 'value', rules: { trigger: 'blur', asyncValidator: () => check } }, { default: () => h(Input) }) : null,
    } })
    wrappers.push(wrapper)
    const validation = wrapper.vm.validate()
    model.value = 'new'
    await nextTick()
    settle()
    expect(await validation).toBe(false)
    expect(wrapper.vm.state.errors).toEqual([])
    visible.value = false
    await nextTick()
    expect(wrapper.vm.getFieldState('value')).toBeUndefined()
    expect(await wrapper.vm.validate()).toBe(true)
  })

  it('keeps manual errors authoritative and deep dirty state reactive', async () => {
    const model = reactive({ profile: { name: 'Ada' } })
    const error = ref('Server error')
    const wrapper = mount(Form, { props: { model }, slots: {
      default: () => h(FormItem, { prop: 'profile', error: error.value }, { default: () => h(Input, { modelValue: model.profile.name }) }),
    } })
    wrappers.push(wrapper)
    expect(await wrapper.vm.validate()).toBe(false)
    model.profile.name = 'Grace'
    await nextTick()
    expect(wrapper.vm.state.dirty).toBe(true)
    error.value = ''
    await nextTick()
    expect(await wrapper.vm.validate()).toBe(true)
    await wrapper.vm.resetFields()
    expect(model.profile).toEqual({ name: 'Ada' })
    expect(wrapper.vm.state.dirty).toBe(false)
  })

  it('does not commit IME input twice or lose composition during attribute updates', async () => {
    const { wrapper, model } = makeForm()
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '中'
    await input.trigger('input', { isComposing: true })
    await wrapper.setProps({ size: 'large' })
    expect(input.element.value).toBe('中')
    expect(model.name).toBe('')
    input.element.value = '中文'
    await input.trigger('compositionend')
    await input.trigger('input', { isComposing: false })
    expect(model.name).toBe('中文')
    expect(wrapper.getComponent(Input).emitted('update:modelValue')).toEqual([['中文']])
  })

  it('keeps an external reset authoritative when an old composition finishes later', async () => {
    const { wrapper, model } = makeForm('Original')
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '中'
    await input.trigger('input', { isComposing: true })
    model.name = 'Reset'
    await nextTick()
    expect(input.element.value).toBe('Reset')
    input.element.value = '中文'
    await input.trigger('compositionend')
    await input.trigger('input', { isComposing: false })
    expect(model.name).toBe('Reset')
    expect(input.element.value).toBe('Reset')
    expect(wrapper.getComponent(Input).emitted('update:modelValue')).toBeUndefined()
  })

  it('does not revive composition after native change on blur followed by a form reset', async () => {
    const { wrapper, model } = makeForm('Original')
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '中'
    await input.trigger('change')
    await wrapper.vm.resetFields()
    const committed = wrapper.getComponent(Input).emitted('update:modelValue')?.length || 0
    input.element.value = '旧组合'
    await input.trigger('compositionend')
    await input.trigger('input')
    expect(model.name).toBe('Original')
    expect(input.element.value).toBe('Original')
    expect(wrapper.getComponent(Input).emitted('update:modelValue')?.length || 0).toBe(committed)
  })

  it.each(['disabled', 'readonly'] as const)('does not restore cancelled IME text after becoming %s', async (state) => {
    const wrapper = mount(Input, { props: { modelValue: 'Original' } })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.trigger('compositionstart')
    input.element.value = '中文'
    await wrapper.setProps({ [state]: true })
    input.element.value = '旧输入'
    input.element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    input.element.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(input.element.value).toBe('Original')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it.each([
    { showPassword: false }, { readonly: true }, { disabled: true }, { type: 'text' as const },
  ])('conceals revealed passwords when display or interaction state changes: %j', async (props) => {
    const wrapper = mount(Input, { props: { modelValue: 'Secret', type: 'password', showPassword: true } })
    wrappers.push(wrapper)
    await wrapper.get('.scq-input__password').trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('text')
    await wrapper.setProps(props)
    await wrapper.setProps({ type: 'password', showPassword: true, readonly: false, disabled: false })
    expect(wrapper.get('input').attributes('type')).toBe('password')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
