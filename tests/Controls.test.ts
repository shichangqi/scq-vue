// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Switch from '../src/components/Switch/Switch.vue'
import InputNumber from '../src/components/InputNumber/InputNumber.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import { h, nextTick } from 'vue'
import Loading from '../src/components/Loading/Loading.vue'
import Skeleton from '../src/components/Skeleton/Skeleton.vue'
import Alert from '../src/components/Alert/Alert.vue'
import Badge from '../src/components/Badge/Badge.vue'
import Tag from '../src/components/Tag/Tag.vue'
import Progress from '../src/components/Progress/Progress.vue'
import Avatar from '../src/components/Avatar/Avatar.vue'
import Search from '../src/components/Search/Search.vue'
import NoticeBar from '../src/components/NoticeBar/NoticeBar.vue'

const wrappers: VueWrapper[] = []

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

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

describe('InputNumber', () => {
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

describe('Feedback', () => {
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