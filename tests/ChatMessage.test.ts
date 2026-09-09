// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChatMessage from '../src/components/ChatMessage/ChatMessage.vue'

const wrappers: VueWrapper[] = []

const mountMessage = (props: Record<string, unknown>) => {
  const wrapper = mount(ChatMessage, {
    props: {
      message: '',
      ...props,
    },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('ChatMessage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
  })

  it('handles a code-copy click only in the owning message instance', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const markdown = '```ts\nconst answer = 42\n```'
    const Parent = defineComponent({
      render: () => h('div', [
        h(ChatMessage, { message: markdown, contentType: 'markdown' }),
        h(ChatMessage, { message: markdown, contentType: 'markdown' }),
      ]),
    })
    const wrapper = mount(Parent, { attachTo: document.body })
    wrappers.push(wrapper)

    const buttons = wrapper.findAll('.scq-chat-message__code-copy')
    expect(buttons).toHaveLength(2)

    await buttons[0].trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('const answer = 42\n')
  })

  it('serializes BigInt and circular values without crashing', () => {
    const bigintWrapper = mountMessage({ message: 1n })
    expect(bigintWrapper.text()).toContain('"1"')

    const circular: Record<string, unknown> = {}
    circular.self = circular
    const circularWrapper = mountMessage({ message: circular })
    expect(circularWrapper.text()).toContain('"[Circular]"')
  })

  it('renders final Markdown without decoding escaped protocol text', () => {
    const wrapper = mountMessage({
      message: String.raw`literal \n\n and \u003cstrong\u003e`,
      contentType: 'markdown',
      markdownBreaks: false,
    })

    expect(wrapper.text()).toContain(String.raw`literal \n\n and \u003cstrong\u003e`)

    const hashtagWrapper = mountMessage({ message: '#topic', contentType: 'markdown' })
    expect(hashtagWrapper.find('h1').exists()).toBe(false)
    expect(hashtagWrapper.text()).toContain('#topic')
  })

  it('provides status defaults and limits loading indicators to active states', () => {
    const success = mountMessage({ status: { type: 'success' } })
    expect(success.get('.scq-chat-message__status-text').text()).toBe('处理完成')
    expect(success.find('.scq-chat-message__status-indicator').exists()).toBe(false)

    const loading = mountMessage({
      status: { type: 'loading' },
      statusTexts: { loading: 'Working' },
    })
    expect(loading.get('.scq-chat-message__status-text').text()).toBe('Working')
    expect(loading.find('.scq-chat-message__status-indicator').exists()).toBe(true)
  })

  it('submits a data-driven single selection immediately', async () => {
    const wrapper = mountMessage({
      selection: {
        id: 'visit-type',
        title: '请选择拜访方式',
        options: [
          { value: 'online', label: '线上拜访', description: '通过视频会议沟通' },
          { value: 'offline', label: '线下拜访' },
        ],
      },
    })

    expect(wrapper.find('.scq-chat-message__bubble').exists()).toBe(false)
    expect(wrapper.get('.scq-chat-message__selection-title').text()).toBe('请选择拜访方式')

    await wrapper.findAll('.scq-chat-message__selection-option')[1].trigger('click')

    expect(wrapper.emitted('update:selectionValues')?.[0]).toEqual([['offline']])
    expect(wrapper.emitted('selection-change')?.[0]?.[0]).toMatchObject({
      selectionId: 'visit-type',
      value: 'offline',
      values: ['offline'],
      selectedOptions: [{ value: 'offline', label: '线下拜访' }],
    })
    expect(wrapper.emitted('selection-submit')?.[0]?.[0]).toMatchObject({
      selectionId: 'visit-type',
      value: 'offline',
      values: ['offline'],
    })
  })

  it('confirms a data-driven multiple selection and respects unavailable states', async () => {
    const wrapper = mountMessage({
      selection: {
        id: 'products',
        mode: 'multiple',
        title: '请选择产品',
        max: 2,
        options: [
          { value: 1, label: '产品 A' },
          { value: 2, label: '产品 B' },
          { value: 3, label: '产品 C', disabled: true },
        ],
      },
    })
    const options = wrapper.findAll('.scq-chat-message__selection-option')

    await options[0].trigger('click')
    await options[1].trigger('click')
    await options[2].trigger('click')

    expect(wrapper.emitted('selection-change')).toHaveLength(2)
    expect(wrapper.emitted('selection-submit')).toBeUndefined()
    expect(wrapper.get('.scq-chat-message__selection-count').text()).toBe('已选 2 项')

    await wrapper.get('.scq-chat-message__selection-confirm').trigger('click')

    expect(wrapper.emitted('selection-submit')?.[0]?.[0]).toMatchObject({
      selectionId: 'products',
      value: 1,
      values: [1, 2],
    })

    await wrapper.setProps({
      selection: {
        id: 'products',
        mode: 'multiple',
        title: '请选择产品',
        status: 'expired',
        expiredText: '选择已失效',
        options: [{ value: 1, label: '产品 A' }],
      },
    })

    expect(wrapper.get('.scq-chat-message__selection-status').text()).toBe('选择已失效')
    expect(wrapper.get('.scq-chat-message__selection-option').attributes('disabled')).toBeDefined()
  })

  it('handles other input through the data-driven selection panel', async () => {
    const wrapper = mountMessage({
      selection: {
        id: 'delivery-channel',
        mode: 'multiple',
        title: '请选择消息发送渠道',
        max: 2,
        allowOther: true,
        otherLabel: '其他渠道',
        otherPlaceholder: '请输入渠道名称',
        otherMaxlength: 40,
        options: [
          { value: 'sms', label: '短信' },
          { value: 'email', label: '邮件' },
        ],
      },
    })

    const options = wrapper.findAll('.scq-chat-message__selection-option')
    expect(options).toHaveLength(3)
    expect(options[2].classes()).toContain('is-other')

    const otherInput = wrapper.get('.scq-chat-message__selection-other-input')
    expect(otherInput.attributes('placeholder')).toBe('请输入渠道名称')
    expect(otherInput.attributes('maxlength')).toBe('40')

    await otherInput.trigger('focus')
    expect(options[2].classes()).toContain('is-selected')
    expect(wrapper.get('.scq-chat-message__selection-confirm').attributes('disabled')).toBeDefined()

    await otherInput.setValue('email')
    expect(options[0].classes()).not.toContain('is-selected')
    expect(wrapper.get('.scq-chat-message__selection-count').text()).toBe('已选 1 项')

    await otherInput.setValue('企业微信')
    expect(wrapper.emitted('update:selectionValues')?.at(-1)).toEqual([['企业微信']])
    expect(wrapper.get('.scq-chat-message__selection-count').text()).toBe('已选 1 项')

    await wrapper.get('.scq-chat-message__selection-confirm').trigger('click')
    const payload = wrapper.emitted('selection-submit')?.[0]?.[0]
    expect(payload).toMatchObject({
      selectionId: 'delivery-channel',
      value: '企业微信',
      values: ['企业微信'],
      selectedOptions: [],
    })
    expect(payload).not.toHaveProperty('otherValue')
  })

  it('disables unsafe and uploading attachment links without dropping duplicates', () => {
    const wrapper = mountMessage({
      attachments: [
        { name: 'unsafe.pdf', url: 'javascript:alert(1)' },
        { name: 'obfuscated.pdf', url: 'java\nscript:alert(1)' },
        { name: 'report.pdf', url: '/report.pdf', status: 'uploading' },
        { name: 'report.pdf', url: '/report.pdf' },
        { name: 'report.pdf', url: '/report.pdf' },
      ],
    })
    const attachments = wrapper.findAll('.scq-chat-message__attachment')

    expect(attachments).toHaveLength(5)
    expect(attachments[0].attributes('href')).toBeUndefined()
    expect(attachments[0].attributes('aria-disabled')).toBe('true')
    expect(attachments[1].attributes('href')).toBeUndefined()
    expect(attachments[1].attributes('aria-disabled')).toBe('true')
    expect(attachments[2].attributes('href')).toBeUndefined()
    expect(attachments[2].attributes('aria-disabled')).toBe('true')
    expect(attachments[3].attributes('href')).toBe('/report.pdf')
    expect(attachments[4].attributes('href')).toBe('/report.pdf')
  })

  it('manages preview focus, scroll lock and focus restoration', async () => {
    const wrapper = mountMessage({
      message: {
        type: 'image',
        src: 'https://example.com/image.png',
        alt: 'Preview image',
      },
      contentType: 'image',
    })
    const trigger = wrapper.get('.scq-chat-message__image')

    await trigger.trigger('click')
    await nextTick()

    const dialog = document.querySelector<HTMLElement>('.scq-chat-message__preview')
    const closeButton = document.querySelector<HTMLButtonElement>('.scq-chat-message__preview-close')
    expect(dialog?.getAttribute('aria-label')).toBe('图片预览')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(closeButton)

    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(document.querySelector('.scq-chat-message__preview')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger.element)
  })
})
