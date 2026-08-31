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
