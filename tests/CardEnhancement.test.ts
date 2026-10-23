// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, Teleport } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Card from '../src/components/Card/Card.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import Form from '../src/components/Form/Form.vue'

const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
afterEach(() => { wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount()) })

describe('Card enhancement', () => {
  it('blocks interactive cards in a disabled Form even when teleported outside the fieldset', async () => {
    const select = vi.fn()
    const wrapper = track(mount(Form, {
      props: { model: {}, disabled: true }, attachTo: document.body,
      slots: { default: () => h(Teleport, { to: 'body' }, h(Card, { id: 'form-card', selectable: true, disabled: false, onSelect: select })) },
    }))
    const card = document.getElementById('form-card')!
    const button = card.querySelector<HTMLButtonElement>('button')!
    expect(button.disabled).toBe(true)
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(select).not.toHaveBeenCalled()
    await wrapper.setProps({ disabled: false })
    button.click()
    expect(select).toHaveBeenCalledWith(true, expect.any(MouseEvent))
  })

  it.each([false, true])('restores loading-hidden content focus without stealing moved focus (moved=%s)', async moved => {
    const wrapper = track(mount(Card, { attachTo: document.body, slots: { default: () => h('input', { value: 'Draft' }) } }))
    const input = wrapper.get<HTMLInputElement>('input')
    const outside = document.createElement('button')
    document.body.append(outside)
    try {
      input.element.focus()
      await wrapper.setProps({ loading: true })
      input.element.blur()
      if (moved) outside.focus()
      await wrapper.setProps({ loading: false })
      await flushPromises()
      expect(wrapper.get('input').element).toBe(input.element)
      expect(input.element.value).toBe('Draft')
      expect(document.activeElement).toBe(moved ? outside : input.element)
    } finally {
      outside.remove()
    }
  })

  it('normalizes finite padding and rejects non-finite padding', () => {
    const wrapper = track(mount(Card, { props: { padding: -1 } }))
    expect(wrapper.get('.scq-card__body').attributes('style')).toContain('padding: 0px')
    expect(() => mount(Card, { props: { padding: Infinity } })).toThrow('must be finite')
  })
  it('keeps the default article and legacy native click behavior', async () => {
    const onClick = vi.fn()
    const wrapper = track(mount(Card, { props: { onClick }, slots: { default: () => h('button', 'Inner') } }))
    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.find('.scq-card__control').exists()).toBe(false)
    await wrapper.get('button').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses a separate native control rather than hiding nested controls under a button role', async () => {
    const wrapper = track(mount(Card, { props: { header: 'Plan', selectable: true }, slots: { default: () => h('button', 'Details') } }))
    expect(wrapper.attributes('role')).toBeUndefined()
    const control = wrapper.get('.scq-card__control')
    expect(control.attributes('aria-labelledby')).toBe(wrapper.get('.scq-card__title').attributes('id'))
    expect(control.attributes('aria-pressed')).toBe('false')
    await control.trigger('click')
    expect(control.attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('update:selected')).toEqual([[true]])
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('ignores nested interactive elements and explicit action regions', async () => {
    const wrapper = track(mount(Card, { props: { selectable: true }, slots: {
      default: () => [h('button', [h('span', 'Button child')]), h('input'), h('span', { 'data-card-interactive': '' }, 'Custom')],
      actions: () => h('button', 'Hover action'),
    } }))
    await wrapper.get('button span').trigger('click')
    await wrapper.get('input').trigger('click')
    await wrapper.get('[data-card-interactive]').trigger('click')
    await wrapper.get('.scq-card__actions button').trigger('click')
    expect(wrapper.emitted('update:selected')).toBeUndefined()
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.get('.scq-card__body').trigger('click')
    expect(wrapper.emitted('update:selected')).toEqual([[true]])
  })

  it('preserves controlled selection and supports click cancellation', async () => {
    const wrapper = track(mount(Card, { props: { selectable: true, selected: false } }))
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:selected')).toEqual([[true]])
    expect(wrapper.get('.scq-card__control').attributes('aria-pressed')).toBe('false')
    await wrapper.setProps({ selected: true })
    expect(wrapper.get('.scq-card__control').attributes('aria-pressed')).toBe('true')
    const cancelled = track(mount(Card, { props: { selectable: true, onClick: (event: MouseEvent) => event.preventDefault() } }))
    await cancelled.trigger('click')
    expect(cancelled.emitted('update:selected')).toBeUndefined()
  })

  it('does not mistake an interactive ancestor outside the card for a nested action', async () => {
    const wrapper = track(mount({ render: () => h('div', { tabindex: 0 }, [h(Card, { selectable: true })]) }))
    const card = wrapper.getComponent(Card)
    await card.get('.scq-card__body').trigger('click')
    expect(card.emitted('update:selected')).toEqual([[true]])
  })

  it('blocks card activation while loading or disabled and retains form state', async () => {
    const wrapper = track(mount(Card, { props: { selectable: true, loading: true }, slots: { default: () => h('input', { value: 'Draft' }) } }))
    const input = wrapper.get('input').element
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.get('.scq-card__control').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ loading: false, disabled: true })
    expect(wrapper.get('input').element).toBe(input)
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('inherits size and disabled state while honoring explicit overrides', async () => {
    const wrapper = track(mount(ConfigProvider, { props: { size: 'small', disabled: true, locale: 'en-US' }, slots: { default: () => h(Card, { selectable: true }) } }))
    expect(wrapper.get('.scq-card__body').attributes('style')).toContain('12px')
    expect(wrapper.get('.scq-card__control').attributes('aria-label')).toBe('Select card')
    expect(wrapper.get('.scq-card__control').attributes('disabled')).toBeDefined()
    const card = track(mount(Card, { props: { size: 'small', padding: 30, mediaRatio: '16 / 9' }, slots: { media: () => h('img', { alt: 'Media' }) } }))
    expect(card.get('.scq-card__body').attributes('style')).toContain('30px')
    expect(card.get('.scq-card__media').attributes('style')).toContain('16 / 9')
  })
})
