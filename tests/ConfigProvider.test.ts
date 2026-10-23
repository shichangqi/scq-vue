// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createApp, defineComponent, h, nextTick, ref, type Component } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Button, Input, Radio, RadioGroup, Checkbox, CheckboxGroup, Select, Cell, Form,
  ConfigProvider, Dialog, Modal, Message, Popup, Toast, Notification, Tooltip, Popover,
  Switch, List, CollapseItem,
  useDialog, useModal, useMessage, useToast, useNotification,
  type ComponentConfig, type ThemeTokens,
} from '../src/index'
import { defaultConfig, getThemeStyle } from '../src/components/ConfigProvider/context'

const wrappers: VueWrapper[] = []
const targets: HTMLElement[] = []
const colors = { outer: '#15803d', inner: '#7c3aed', updated: '#0284c7', dark: '#1d1e1f', light: '#ffffff' }
const hooks = { useDialog, useModal, useMessage, useToast, useNotification }

vi.mock('@floating-ui/dom', () => ({
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  autoUpdate: (_reference: Element, _floating: Element, update: () => void) => { update(); return () => {} },
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}))

beforeEach(() => vi.useFakeTimers())
afterEach(async () => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  Dialog.destroyAll()
  Modal.destroyAll()
  Message.destroyAll()
  Toast.destroyAll()
  Notification.destroyAll()
  await vi.runOnlyPendingTimersAsync()
  await flushPromises()
  targets.splice(0).forEach((target) => target.remove())
  vi.clearAllTimers()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const settleLayers = async () => {
  await nextTick()
  await vi.runOnlyPendingTimersAsync()
  await flushPromises()
}

const createFeedback = () => ({
  dialog: useDialog(),
  modal: useModal(),
  message: useMessage(),
  toast: useToast(),
  notification: useNotification(),
})
type Feedback = ReturnType<typeof createFeedback>
const mountScope = (props: Partial<ComponentConfig>) => {
  let feedback: Feedback | undefined
  const Consumer = defineComponent({
    setup() {
      feedback = createFeedback()
      return () => h('span')
    },
  })
  const wrapper = mount(ConfigProvider, { props, slots: { default: () => h(Consumer) }, attachTo: document.body })
  wrappers.push(wrapper)
  if (!feedback) throw new Error('Feedback consumer did not mount')
  return { wrapper, feedback }
}

const controls: { name: string; component: Component; prefix: string }[] = [
  { name: 'Button', component: Button, prefix: 'my-btn' },
  { name: 'Input', component: Input, prefix: 'scq-input' },
  { name: 'Radio', component: Radio, prefix: 'scq-radio' },
  { name: 'Checkbox', component: Checkbox, prefix: 'scq-checkbox' },
  { name: 'Select', component: Select, prefix: 'scq-select' },
]

describe('Configuration precedence', () => {
  it.each(['primary', 'success', 'warning', 'danger'] as const)('derives %s interaction colors only for explicit semantic tokens', (token) => {
    expect(getThemeStyle(defaultConfig)).toEqual({})
    const styles = getThemeStyle({ ...defaultConfig, tokens: { [token]: colors.inner } })
    expect(styles[`--scq-color-${token}`]).toBe(colors.inner)
    for (const suffix of ['hover', 'hover-start', 'active', 'active-border', 'soft-bg', 'soft-border', 'focus-ring', 'shadow', 'shadow-hover', 'shadow-active']) {
      expect(styles[`--scq-color-${token}-${suffix}`]).toContain(`color-mix(in srgb, ${colors.inner},`)
    }
  })

  it.each(controls)('$name keeps standalone defaults and inherits reactive configuration', async ({ component, prefix }) => {
    const standalone = mount(component)
    wrappers.push(standalone)
    expect(standalone.classes()).toContain(`${prefix}--default`)
    expect(standalone.classes()).not.toContain('is-disabled')

    const wrapper = mount(ConfigProvider, {
      props: { size: 'large', disabled: true },
      slots: { default: () => [h(component), h(component, { size: 'small', disabled: false })] },
    })
    wrappers.push(wrapper)
    const children = wrapper.findAllComponents(component)
    expect(children[0].classes()).toContain(`${prefix}--large`)
    expect(children[0].classes()).toContain('is-disabled')
    expect(children[1].classes()).toContain(`${prefix}--small`)
    expect(children[1].classes()).not.toContain('is-disabled')
    await wrapper.setProps({ size: 'small', disabled: false })
    expect(children[0].classes()).toContain(`${prefix}--small`)
    expect(children[0].classes()).not.toContain('is-disabled')
  })

  it.each([
    { group: RadioGroup, item: Radio },
    { group: CheckboxGroup, item: Checkbox },
  ])('keeps group constraints and allows the group to override the provider', async ({ group, item }) => {
    const wrapper = mount(ConfigProvider, {
      props: { disabled: true, size: 'large' },
      slots: {
        default: () => [
          h(group, { disabled: false, size: 'small' }, { default: () => h(item, { value: 'a' }) }),
          h(group, { disabled: true }, { default: () => h(item, { value: 'b', disabled: false }) }),
        ],
      },
    })
    wrappers.push(wrapper)
    const inputs = wrapper.findAll('input')
    expect(inputs[0].element.disabled).toBe(false)
    expect(inputs[1].element.disabled).toBe(true)
    const groups = wrapper.findAllComponents(group)
    await inputs[0].setValue(true)
    expect(groups[0].emitted('change')).toHaveLength(1)
    await inputs[1].trigger('change')
    expect(groups[1].emitted('change')).toBeUndefined()
  })

  it('propagates form size and disabled state to native and teleported controls', async () => {
    const formDisabled = ref(false)
    const wrapper = mount(ConfigProvider, {
      props: { size: 'large', disabled: true },
      slots: {
        default: () => h(Form, { model: {}, size: 'small', disabled: formDisabled.value }, {
          default: () => [h(Input), h(Select), h(Switch), h(Button, { nativeType: 'submit' })],
        }),
      },
    })
    wrappers.push(wrapper)
    const form = wrapper.getComponent(Form)
    expect(form.get('fieldset').element.disabled).toBe(false)
    expect(form.getComponent(Input).classes()).toContain('scq-input--small')
    expect(form.getComponent(Select).classes()).toContain('scq-select--small')
    expect(form.getComponent(Switch).get('input').element.disabled).toBe(false)
    expect(form.getComponent(Button).attributes('type')).toBe('submit')
    await form.getComponent(Select).get('.scq-select__control').trigger('click')
    expect(document.querySelector('.scq-select__panel')).not.toBeNull()
    formDisabled.value = true
    await nextTick()
    expect(form.getComponent(Button).get('button').element.disabled).toBe(true)
    expect(form.getComponent(Switch).get('input').element.disabled).toBe(true)
    expect(document.querySelector('.scq-select__panel')).toBeNull()
  })

  it('preserves loading guards and native reset semantics', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { disabled: true },
      slots: { default: () => h(Button, { disabled: false, loading: true, nativeType: 'reset' }) },
    })
    wrappers.push(wrapper)
    const button = wrapper.getComponent(Button)
    expect(button.attributes('type')).toBe('reset')
    expect(button.get('button').element.disabled).toBe(true)
    await button.trigger('click')
    expect(button.emitted('click')).toBeUndefined()
  })

  it('disables legacy cell links without emitting navigation clicks', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { disabled: true },
      slots: { default: () => [h(Cell, { href: '#destination' }), h(Cell, { href: '#destination', disabled: false })] },
    })
    wrappers.push(wrapper)
    const cells = wrapper.findAllComponents(Cell)
    expect(cells[0].element.tagName).toBe('BUTTON')
    expect(cells[1].element.tagName).toBe('A')
    await cells[0].trigger('click')
    expect(cells[0].emitted('click')).toBeUndefined()
  })

  it.each([List, CollapseItem])('inherits disabled state without losing explicit false', async (component) => {
    const wrapper = mount(ConfigProvider, {
      props: { disabled: true },
      slots: { default: () => [h(component as Component), h(component as Component, { disabled: false })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.findAll('button').map((button) => button.element.disabled)).toEqual([true, false])
    await wrapper.setProps({ disabled: false })
    expect(wrapper.findAll('button').map((button) => button.element.disabled)).toEqual([false, false])
  })

  it('disables list retries as well as automatic loading', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { disabled: true },
      slots: { default: () => h(List, { error: true }) },
    })
    wrappers.push(wrapper)
    const list = wrapper.getComponent(List)
    await list.get('button').trigger('click')
    expect(list.get('button').element.disabled).toBe(true)
    expect(list.emitted('update:error')).toBeUndefined()
    expect(list.emitted('load')).toBeUndefined()
  })

  it('merges tokens, isolates nested overrides and resets inherited dark styles', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: 'dark', locale: 'en-US', tokens: { primary: colors.outer, success: colors.outer } },
      slots: {
        default: () => [
          h(ConfigProvider, { 'data-scope': 'inherited' }),
          h(ConfigProvider, { theme: 'light', tokens: { primary: colors.inner }, 'data-scope': 'inner' }),
        ],
      },
    })
    wrappers.push(wrapper)
    const inherited = wrapper.get<HTMLElement>('[data-scope="inherited"]')
    const inner = wrapper.get<HTMLElement>('[data-scope="inner"]')
    expect(inherited.classes()).toContain('scq-theme-dark')
    expect(inherited.element.style.colorScheme).toBe('dark')
    expect(inner.element.style.colorScheme).toBe('light')
    expect(inner.element.style.getPropertyValue('--scq-surface')).toBe(colors.light)
    expect(inner.element.style.getPropertyValue('--scq-shadow-modal')).toContain('15, 23, 42')
    expect(inner.element.style.getPropertyValue('--scq-primary')).toBe(colors.inner)
    expect(inner.element.style.getPropertyValue('--scq-color-success')).toBe(colors.outer)
    await wrapper.setProps({ tokens: { primary: colors.updated, warning: colors.updated } })
    expect(inherited.element.style.getPropertyValue('--scq-primary')).toBe(colors.updated)
    expect(inner.element.style.getPropertyValue('--scq-primary')).toBe(colors.inner)
    expect(inner.element.style.getPropertyValue('--scq-color-success')).toBe('')
    expect(inner.element.style.getPropertyValue('--scq-color-warning')).toBe(colors.updated)
  })
})

describe('Localized legacy controls', () => {
  it('treats undefined nested token overrides as inheritance in panels and scoped feedback', async () => {
    const radii = { outer: '12px', inner: '6px', updated: '16px' }
    const overrides = ref<ThemeTokens>({ primary: colors.inner, radius: radii.inner })
    let feedback: Feedback | undefined
    const Consumer = defineComponent({
      setup() {
        feedback = createFeedback()
        return () => h(Select)
      },
    })
    const wrapper = mount(ConfigProvider, {
      attachTo: document.body,
      props: { tokens: { primary: colors.outer, radius: radii.outer } },
      slots: { default: () => h(ConfigProvider, { tokens: overrides.value, 'data-scope': 'nested-undefined' }, { default: () => h(Consumer) }) },
    })
    wrappers.push(wrapper)
    if (!feedback) throw new Error('Scoped feedback did not mount')
    feedback.message.success({ message: 'Inherited tokens', duration: 0 })
    await wrapper.getComponent(Select).get('.scq-select__control').trigger('click')
    await settleLayers()
    const targets = [
      wrapper.get<HTMLElement>('[data-scope="nested-undefined"]').element,
      document.querySelector<HTMLElement>('.scq-select__panel')!,
      document.querySelector<HTMLElement>('.scq-message')!,
    ]
    for (const target of targets) expect(target.style.getPropertyValue('--scq-primary')).toBe(colors.inner)
    overrides.value = { primary: undefined, radius: undefined }
    await settleLayers()
    for (const target of targets) {
      expect(target.style.getPropertyValue('--scq-primary')).toBe(colors.outer)
      expect(target.style.getPropertyValue('--scq-radius-md')).toBe(radii.outer)
      expect(target.style.getPropertyValue('--scq-control-radius')).toBe(radii.outer)
    }
    await wrapper.setProps({ tokens: { primary: colors.updated, radius: radii.updated } })
    await settleLayers()
    for (const target of targets) {
      expect(target.style.getPropertyValue('--scq-primary')).toBe(colors.updated)
      expect(target.style.getPropertyValue('--scq-radius-md')).toBe(radii.updated)
      expect(target.style.getPropertyValue('--scq-control-radius')).toBe(radii.updated)
    }
    expect(overrides.value).toEqual({ primary: undefined, radius: undefined })
  })
  it('updates select placeholders, empty results and teleported tokens without replacing explicit text', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: 'en-US', theme: 'dark', tokens: { primary: colors.outer } },
      slots: { default: () => [h(Select), h(Select, { placeholder: 'Custom prompt' })] },
    })
    wrappers.push(wrapper)
    const [select, explicit] = wrapper.findAllComponents(Select)
    expect(select.text()).toContain('Choose')
    await select.get('.scq-select__control').trigger('click')
    const panel = document.querySelector<HTMLElement>('.scq-select__panel')!
    expect(panel.textContent).toContain('No matching data')
    expect(panel.style.getPropertyValue('--scq-surface')).toBe(colors.dark)
    await wrapper.setProps({ locale: 'zh-CN', theme: 'light', tokens: { primary: colors.updated } })
    expect(panel.textContent).toContain('无匹配数据')
    expect(panel.style.getPropertyValue('--scq-primary')).toBe(colors.updated)
    expect(panel.style.getPropertyValue('--scq-surface')).toBe(colors.light)
    expect(explicit.text()).toContain('Custom prompt')
  })

  it('localizes input actions and prevents edits after the provider is disabled', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: 'en-US' },
      slots: { default: () => h(Input, { modelValue: 'secret', type: 'password', clearable: true, showPassword: true }) },
    })
    wrappers.push(wrapper)
    const input = wrapper.getComponent(Input)
    await input.get('input').trigger('focus')
    expect(input.get('.scq-input__clear').attributes('aria-label')).toBe('Clear input')
    expect(input.get('.scq-input__password').attributes('aria-label')).toBe('Show password')
    await wrapper.setProps({ locale: 'zh-CN' })
    expect(input.get('.scq-input__password').attributes('aria-label')).toBe('显示密码')
    await wrapper.setProps({ disabled: true })
    await input.get('input').trigger('input')
    expect(input.emitted('update:modelValue')).toBeUndefined()
    expect(input.find('.scq-input__clear').exists()).toBe(false)
  })

  it('preserves imperative clear methods for business-driven resets', () => {
    const input = mount(Input, { props: { disabled: true, readonly: true, modelValue: 'Reset me' } })
    const select = mount(Select, { props: { disabled: true, modelValue: 'a' } })
    wrappers.push(input, select)
    input.vm.clear()
    select.vm.clear()
    expect(input.emitted('update:modelValue')).toEqual([['']])
    expect(select.emitted('update:modelValue')).toEqual([[null]])
  })

  it.each([Tooltip, Popover])('inherits disabled state in anchored overlays with explicit overrides', async (component) => {
    const wrapper = mount(ConfigProvider, {
      props: { disabled: true },
      slots: { default: () => [
        h(component, { modelValue: true, content: 'Hidden', teleport: false }),
        h(component, { modelValue: true, content: 'Visible', teleport: false, disabled: false }),
      ] },
    })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.findAll('.scq-floating-panel')).toHaveLength(1)
    expect(wrapper.get('.scq-floating-panel').text()).toBe('Visible')
  })
})

describe('Teleported template configuration', () => {
  it.each([
    { component: Dialog, selector: '.scq-dialog__overlay', close: '.scq-dialog__close', english: 'Close dialog', props: { showClose: true } },
    { component: Modal, selector: '.scq-modal__overlay', close: '.scq-modal__close', english: 'Close modal', props: { showClose: true } },
    { component: Popup, selector: '.scq-popup__overlay', close: '.scq-popup__close', english: 'Close popup', props: { showClose: true } },
    { component: Message, selector: '.scq-message', close: '.scq-message__close', english: 'Close', props: { closable: true, duration: 0 } },
  ])('keeps $selector attached to its provider after teleport', async ({ component, selector, close, english, props }) => {
    const target = document.createElement('div')
    target.id = 'config-overlay-target'
    document.body.appendChild(target)
    targets.push(target)
    const wrapper = mount(ConfigProvider, {
      props: { locale: 'en-US', theme: 'dark', tokens: { primary: colors.outer } },
      slots: { default: () => h(component as Component, { modelValue: true, teleport: `#${target.id}`, ...props }) },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    await nextTick()
    const layer = target.querySelector<HTMLElement>(selector)!
    expect(layer.style.getPropertyValue('--scq-surface')).toBe(colors.dark)
    expect(layer.querySelector(close)?.getAttribute('aria-label')).toBe(english)
    await wrapper.setProps({ locale: 'zh-CN', theme: 'light', tokens: { primary: colors.updated } })
    expect(layer.style.getPropertyValue('--scq-primary')).toBe(colors.updated)
    expect(layer.querySelector(close)?.getAttribute('aria-label')).toContain('关闭')
  })
})

describe('Scoped method configuration', () => {
  it.each(Object.entries(hooks))('%s rejects calls outside component setup', (_name, hook) => {
    expect(() => hook()).toThrow('must be called during component setup')
  })

  it('rejects context overrides that would escape scoped cleanup while preserving static contexts', async () => {
    const { feedback } = mountScope({ locale: 'en-US' })
    const context = createApp({ render: () => null })._context
    expect(() => feedback.dialog.info({}, context)).toThrow('bound to its setup context')
    expect(() => feedback.modal.info({}, context)).toThrow('bound to its setup context')
    expect(() => feedback.message.info('Scoped', context)).toThrow('bound to its setup context')
    expect(() => feedback.toast.show('Scoped', context)).toThrow('bound to its setup context')
    expect(() => feedback.notification.show('Scoped', context)).toThrow('bound to its setup context')
    Message.info({ message: 'Explicit global context', duration: 0 }, context)
    await nextTick()
    expect(document.querySelector('.scq-message')?.textContent).toContain('Explicit global context')
  })

  it('keeps every method reactive and disposes only the owning scope on unmount', async () => {
    const first = mountScope({ locale: 'en-US', theme: 'dark', size: 'large', tokens: { primary: colors.outer } })
    const second = mountScope({ locale: 'zh-CN', theme: 'light', tokens: { primary: colors.inner } })
    const showAll = (api: Feedback, label: string) => {
      api.dialog.info({ message: label, showFooter: true, showConfirmButton: true })
      api.modal.confirm({ message: label, showClose: true, showFooter: true, showConfirmButton: true })
      api.message.success({ message: label, duration: 0, closable: true })
      api.toast.loading({ duration: 0 })
      api.notification.info({ id: 'same-id', message: label, duration: 0 })
    }
    showAll(first.feedback, 'First scope')
    showAll(second.feedback, 'Second scope')
    Message.info({ message: 'Global message', duration: 0, closable: true })
    await settleLayers()

    const selectors = ['.scq-dialog__overlay', '.scq-modal__overlay', '.scq-message', '.scq-toast-layer', '.scq-notification']
    for (const selector of selectors) {
      const layers = document.querySelectorAll<HTMLElement>(selector)
      expect(layers).toHaveLength(selector === '.scq-message' ? 3 : 2)
      expect(layers[0].style.getPropertyValue('--scq-primary')).toBe(colors.outer)
      expect(layers[1].style.getPropertyValue('--scq-primary')).toBe(colors.inner)
    }
    expect(document.querySelector('.scq-dialog__title')?.textContent).toBe('Notice')
    expect(document.querySelector('.scq-modal__title')?.textContent).toBe('Confirm')
    expect(document.querySelector('.scq-dialog .my-btn')?.classList.contains('my-btn--large')).toBe(true)
    expect(document.querySelector('.scq-toast')?.textContent).toContain('Loading')

    await first.wrapper.setProps({ locale: 'zh-CN', theme: 'light', tokens: { primary: colors.updated } })
    for (const selector of selectors) {
      const layers = document.querySelectorAll<HTMLElement>(selector)
      expect(layers[0].style.getPropertyValue('--scq-primary')).toBe(colors.updated)
      expect(layers[1].style.getPropertyValue('--scq-primary')).toBe(colors.inner)
    }
    expect(document.querySelector('.scq-dialog__title')?.textContent).toBe('提示')
    expect(document.querySelector('.scq-toast')?.textContent).toContain('加载中')

    first.wrapper.unmount()
    await settleLayers()
    for (const selector of selectors) {
      const layers = document.querySelectorAll<HTMLElement>(selector)
      expect(layers).toHaveLength(selector === '.scq-message' ? 2 : 1)
      expect(layers[0].style.getPropertyValue('--scq-primary')).toBe(colors.inner)
    }
    expect(document.querySelector('.scq-message-host')?.textContent).toContain('Global message')
  })

  it('isolates toast replacement, notification IDs and scoped destroyAll calls', async () => {
    const first = mountScope({ locale: 'en-US' })
    const second = mountScope({ locale: 'zh-CN' })
    first.feedback.toast.show({ message: 'Old', duration: 0 })
    second.feedback.toast.show({ message: 'Other scope', duration: 0 })
    first.feedback.toast.success({ message: 'New', duration: 0 })
    const notice = first.feedback.notification.show({ id: 'shared-id', message: 'Old notice', duration: 0 })
    second.feedback.notification.show({ id: 'shared-id', message: 'Other notice', duration: 0 })
    notice.update({ message: 'Updated notice' })
    first.feedback.message.info({ message: 'First message', duration: 0 })
    second.feedback.message.info({ message: 'Second message', duration: 0 })
    await flushPromises()
    expect(document.querySelectorAll('.scq-toast')).toHaveLength(2)
    expect(document.querySelectorAll('.scq-notification')).toHaveLength(2)
    expect(document.body.textContent).toContain('Updated notice')
    first.feedback.toast.clear()
    first.feedback.notification.destroyAll()
    first.feedback.message.destroyAll()
    await flushPromises()
    expect(document.querySelector('.scq-toast')?.textContent).toBe('Other scope')
    expect(document.querySelector('.scq-notification')?.textContent).toContain('Other notice')
    expect(document.querySelector('.scq-message')?.textContent).toContain('Second message')
  })

  it('does not reopen pending dialogs after their owner unmounts', async () => {
    const { wrapper, feedback } = mountScope({ locale: 'en-US' })
    const onClosed = vi.fn()
    feedback.dialog.info({ message: 'Pending dialog', onClosed })
    feedback.modal.info({ message: 'Pending modal', onClosed })
    wrapper.unmount()
    await settleLayers()
    expect(document.querySelector('.scq-dialog')).toBeNull()
    expect(document.querySelector('.scq-modal')).toBeNull()
    expect(onClosed).toHaveBeenCalledTimes(2)
  })

  it('does not repeat close callbacks when an owner unmounts during dismissal', async () => {
    const { wrapper, feedback } = mountScope({ locale: 'en-US' })
    const onClose = vi.fn()
    const onClosed = vi.fn()
    feedback.dialog.info({ message: 'Dialog', onClose, onClosed })
    feedback.modal.info({ message: 'Modal', onClose, onClosed })
    await settleLayers()
    feedback.dialog.destroyAll()
    feedback.modal.destroyAll()
    wrapper.unmount()
    await settleLayers()
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onClosed).toHaveBeenCalledTimes(2)
  })

  it('preserves explicit method labels, footer defaults and component configuration in slots', async () => {
    const { wrapper, feedback } = mountScope({ locale: 'en-US', size: 'large' })
    feedback.dialog.info({ message: 'No footer' })
    const instance = feedback.modal.confirm({
      title: 'Explicit title', confirmButtonText: 'Accept', cancelButtonText: 'Reject',
      content: () => h(Button, { size: 'small', disabled: false }, () => 'Custom content'),
    })
    await settleLayers()
    expect(document.querySelector('.scq-dialog__footer')).toBeNull()
    expect(document.querySelector('.scq-modal__body .my-btn--small')).not.toBeNull()
    await wrapper.setProps({ locale: 'zh-CN', disabled: true })
    expect(document.querySelector('.scq-modal__title')?.textContent).toBe('Explicit title')
    expect(document.querySelector('.scq-modal__action--confirm')?.textContent?.trim()).toBe('Accept')
    instance.update({ title: 'Updated title' })
    await nextTick()
    expect(document.querySelector('.scq-modal__title')?.textContent).toBe('Updated title')
  })
})
