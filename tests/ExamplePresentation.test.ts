// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ExampleSection from '../playground/src/components/ExampleSection.vue'
import CardExample from '../playground/src/components/examples/CardEnhancementExample.vue'
import ConfigExample from '../playground/src/components/examples/ConfigProviderExample.vue'
import UploadExample from '../playground/src/components/examples/UploadQueueExample.vue'
import FormExample from '../playground/src/components/examples/FormProtocolExample.vue'
import LayoutExample from '../playground/src/components/examples/LayoutExample.vue'
import MenuExample from '../playground/src/components/examples/MenuExample.vue'
import NotificationExample from '../playground/src/components/examples/NotificationExample.vue'
import ResultExample from '../playground/src/components/examples/ResultExample.vue'
import ToastTemplateExample from '../playground/src/components/examples/ToastTemplateExample.vue'
import SwipeCellGroupExample from '../playground/src/components/examples/SwipeCellGroupExample.vue'
import Card from '../src/components/Card/Card.vue'
import Checkbox from '../src/components/Checkbox/Checkbox.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import Form from '../src/components/Form/Form.vue'
import Layout from '../src/components/Layout/Layout.vue'
import Menu from '../src/components/Menu/Menu.vue'
import RadioGroup from '../src/components/RadioGroup'
import Select from '../src/components/Select/Select.vue'
import Upload from '../src/components/Upload/Upload.vue'

vi.mock('@floating-ui/dom', () => ({
  autoUpdate: (_reference: Element, _panel: Element, update: () => void) => { update(); return () => {} },
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}))

const wrappers: VueWrapper[] = []
const containers: HTMLElement[] = []
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
afterEach(async () => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  await flushPromises()
  containers.splice(0).forEach(container => container.remove())
})

describe('Example presentation and controls', () => {
  it('separates headings, controls and content without changing alert semantics', () => {
    const wrapper = track(mount(ExampleSection, {
      props: { title: 'Example', subtitle: 'Details', description: 'Instructions' },
      slots: {
        controls: () => h(Checkbox, { modelValue: true }, () => 'Toggle'),
        default: () => h('p', { role: 'alert' }, 'Request failed'),
      },
    }))
    expect(wrapper.get('h3').text()).toBe('Example')
    expect(wrapper.get('.example-section__controls input').element).toHaveProperty('checked', true)
    expect(wrapper.get('.example-section__body [role="alert"]').text()).toBe('Request failed')
  })

  it('keeps card drafts and independent actions separate from card selection', async () => {
    const wrapper = track(mount(CardExample))
    const card = wrapper.findAllComponents(Card)[0]
    const draft = card.get<HTMLInputElement>('input')
    await draft.setValue('Card draft')
    await card.get('button.my-btn').trigger('click')
    expect(card.props('selected')).toBe(false)
    expect(card.text()).toContain('Details: 1')
    await wrapper.getComponent(Checkbox).get('input').setValue(true)
    expect(card.props('loading')).toBe(true)
    await wrapper.getComponent(Checkbox).get('input').setValue(false)
    expect(card.get('input').element).toBe(draft.element)
    expect(draft.element.value).toBe('Card draft')
  })

  it('updates configuration through library selects while keeping nested overrides', async () => {
    const wrapper = track(mount(ConfigExample))
    const selects = wrapper.findAllComponents(Select)
    expect(selects.slice(0, 4).every(select => select.props('clearable') === false)).toBe(true)
    const scopes = wrapper.findAllComponents(ConfigProvider)
    selects[0].vm.$emit('update:modelValue', 'zh-CN')
    selects[1].vm.$emit('update:modelValue', 'light')
    selects[2].vm.$emit('update:modelValue', 'small')
    selects[3].vm.$emit('update:modelValue', 'purple')
    await nextTick()
    expect(scopes[0].props()).toMatchObject({ locale: 'zh-CN', theme: 'light', size: 'small', tokens: { primary: '#7c3aed' } })
    await wrapper.findAllComponents(Checkbox)[0].get('input').setValue(true)
    expect(scopes[0].props('disabled')).toBe(true)
    expect(scopes[1].props('disabled')).toBe(false)
    await wrapper.findAllComponents(Checkbox)[1].get('input').setValue(true)
    expect(scopes[1].props('tokens')?.primary).toBeUndefined()
  })

  it('preserves numeric, unlimited and invalid concurrency choices', async () => {
    const wrapper = track(mount(UploadExample))
    const select = wrapper.getComponent(Select)
    expect(select.props('clearable')).toBe(false)
    const upload = wrapper.getComponent(Upload)
    const options = select.props('options')!
    const unlimited = options.find(option => option.label === '不限制')!
    const invalid = options.find(option => option.label.includes('无效'))!
    select.vm.$emit('update:modelValue', unlimited.value)
    await nextTick()
    expect(upload.props('concurrency')).toBeUndefined()
    select.vm.$emit('update:modelValue', invalid.value)
    await nextTick()
    expect(upload.props('concurrency')).toBe(invalid.value)
    expect(wrapper.text()).toContain('configuration-error')
    const numeric = options.find(option => typeof option.value === 'number' && option.value > 0)!
    select.vm.$emit('update:modelValue', numeric.value)
    await nextTick()
    expect(upload.props('concurrency')).toBe(numeric.value)
  })

  it('retains form submission and reset inside the presentation wrapper', async () => {
    const wrapper = track(mount(FormExample))
    await wrapper.getComponent(Form).trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('请检查字段')
    const inputs = wrapper.findAll<HTMLInputElement>('.scq-input input')
    await inputs[0].setValue('Ada')
    await inputs[1].setValue('Ada')
    wrapper.getComponent(Select).vm.$emit('update:modelValue', 'editor')
    await nextTick()
    await wrapper.getComponent(Form).trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('校验通过')
    await wrapper.findAll('button').find(button => button.text().includes('重置'))!.trigger('click')
    await flushPromises()
    expect(inputs[0].element.value).toBe('')
  })

  it('keeps layout and menu direction controls wired to their components', async () => {
    const layout = track(mount(LayoutExample))
    layout.getComponent(RadioGroup).vm.$emit('update:modelValue', 'vertical')
    await nextTick()
    expect(layout.getComponent(Layout).props('direction')).toBe('vertical')
    const menu = track(mount(MenuExample))
    menu.getComponent(RadioGroup).vm.$emit('update:modelValue', 'horizontal')
    await nextTick()
    expect(menu.getComponent(Menu).props('mode')).toBe('horizontal')
  })

  it.each([
    ['notification', NotificationExample],
    ['result', ResultExample],
    ['toast', ToastTemplateExample],
    ['swipe-cell', SwipeCellGroupExample],
  ] as const)('keeps the required %s configuration selection non-clearable', async (_name, component) => {
    const container = document.createElement('div')
    document.body.append(container)
    containers.push(container)
    const wrapper = track(mount(component, { attachTo: container }))
    await nextTick()
    expect(wrapper.getComponent(Select).props('clearable')).toBe(false)
  })
})
