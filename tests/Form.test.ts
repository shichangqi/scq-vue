// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import Input from '../src/components/Input/Input.vue'
import type { FormRules } from '../src/components/Form'

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

const mountForm = (rules: FormRules, initial = 'Ada') => {
  const model = reactive({ user: { name: initial } })
  const wrapper = mount(defineComponent({
    components: { Form, FormItem, Input },
    setup: () => ({ model, rules }),
    template: '<Form :model="model" :rules="rules"><FormItem prop="user.name" label="Name" for-id="name"><Input id="name" v-model="model.user.name" /></FormItem><button type="submit">Submit</button></Form>',
  }))
  wrappers.push(wrapper)
  return { wrapper, model, form: wrapper.findComponent(Form) }
}

describe('Form', () => {
  it('validates existing Input without changing its model or events', async () => {
    const { wrapper, model, form } = mountForm({ 'user.name': { required: true, message: 'Name is required' } }, '')
    expect(await form.vm.validate()).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toBe('Name is required')
    await wrapper.get('input').setValue('Grace')
    await flushPromises()
    expect(model.user.name).toBe('Grace')
    expect(wrapper.findComponent(Input).emitted('update:modelValue')?.[0]).toEqual(['Grace'])
    expect(await form.vm.validate()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('resets nested fields to their mounted values and clears validation', async () => {
    const { wrapper, model, form } = mountForm({ 'user.name': { required: true, message: 'Required' } })
    await wrapper.get('input').setValue('')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    await form.vm.resetFields()
    expect(model.user.name).toBe('Ada')
    expect(wrapper.get('input').element.value).toBe('Ada')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('respects blur-only rules', async () => {
    const { wrapper } = mountForm({ 'user.name': { required: true, message: 'Required', trigger: 'blur' } })
    await wrapper.get('input').setValue('')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    await wrapper.get('input').trigger('focusout')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Required')
  })

  it('ignores obsolete async validation results', async () => {
    let rejectOld: (error: Error) => void = () => {}
    const oldResult = new Promise<void>((_resolve, reject) => { rejectOld = reject })
    const { wrapper } = mountForm({ 'user.name': {
      asyncValidator: (_rule, value) => value === 'old' ? oldResult : Promise.resolve(),
    } })
    await wrapper.get('input').setValue('old')
    await wrapper.get('input').setValue('new')
    await flushPromises()
    rejectOld(new Error('Already taken'))
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('.is-validating').exists()).toBe(false)
  })

  it('reports submit validity and supports selected field validation', async () => {
    const { wrapper, form } = mountForm({ 'user.name': { required: true } }, '')
    expect(await form.vm.validateField('missing')).toBe(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(form.emitted('submit')).toEqual([[false]])
  })

  it('invalidates an in-flight blur-only check when the input changes again', async () => {
    let rejectCheck: (error: Error) => void = () => {}
    const result = new Promise<void>((_resolve, reject) => { rejectCheck = reject })
    const { wrapper } = mountForm({ 'user.name': { trigger: 'blur', asyncValidator: () => result } })
    await wrapper.get('input').trigger('focusout')
    await wrapper.get('input').setValue('New name')
    rejectCheck(new Error('Previous name unavailable'))
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('.is-validating').exists()).toBe(false)
  })
})