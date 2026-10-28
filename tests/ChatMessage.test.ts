// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChatMessage, { type ChatMessageActionPayload } from '../src/components/ChatMessage/ChatMessage.vue'
import hljs from 'highlight.js/lib/core'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'

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
    vi.useRealTimers()
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

  it('keeps explicit status alongside content and honors visibility overrides', async () => {
    const wrapper = mountMessage({ message: 'Partial answer', status: { type: 'error', visible: true } })

    expect(wrapper.get('.scq-chat-message__text').text()).toBe('Partial answer')
    expect(wrapper.get('.scq-chat-message__status-text').text()).toBe('处理失败')

    await wrapper.setProps({ status: { type: 'error', visible: false } })
    expect(wrapper.find('.scq-chat-message__status').exists()).toBe(false)
    expect(wrapper.get('.scq-chat-message__text').text()).toBe('Partial answer')

    await wrapper.setProps({ status: { type: 'tool', text: 'Searching sources' } })
    expect(wrapper.get('.scq-chat-message__status-text').text()).toBe('Searching sources')
  })

  it('renders the controlled generation lifecycle without replacing the answer', async () => {
    const wrapper = mountMessage({ message: 'Partial answer', contentType: 'text' })
    expect(wrapper.find('.scq-chat-message__status').exists()).toBe(false)

    const stages = [
      ['waiting', '等待响应', true],
      ['generating', '正在生成', true],
      ['error', '生成失败', false],
      ['stopped', '已停止', false],
      ['completed', '生成完成', false],
    ] as const

    for (const [generationStatus, text, busy] of stages) {
      await wrapper.setProps({ generationStatus })
      expect(wrapper.get('.scq-chat-message__status-text').text()).toBe(text)
      expect(wrapper.find('.scq-chat-message__status-indicator').exists()).toBe(busy)
      expect(wrapper.attributes('aria-busy')).toBe(busy ? 'true' : undefined)
      expect(wrapper.get('.scq-chat-message__text').text()).toBe('Partial answer')
    }

    await wrapper.setProps({ generationStatus: 'error', statusTexts: { error: 'Connection lost' } })
    expect(wrapper.get('.scq-chat-message__status-text').text()).toBe('Connection lost')
    await wrapper.setProps({ status: { text: 'Please retry', visible: false } })
    expect(wrapper.find('.scq-chat-message__status').exists()).toBe(false)
    await wrapper.setProps({ status: { text: 'Please retry', visible: true } })
    expect(wrapper.get('.scq-chat-message__status-text').text()).toBe('Please retry')
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

  it('supports explicit single-selection confirmation and explains constraints', async () => {
    const wrapper = mountMessage({
      selection: { autoSubmit: false, options: [{ value: 'first', label: 'First' }] },
    })
    expect(wrapper.get('.scq-chat-message__selection-hint').text()).toContain('至少选择 1 项')
    expect(wrapper.get('.scq-chat-message__selection-confirm').attributes('disabled')).toBeDefined()
    await wrapper.get('.scq-chat-message__selection-option').trigger('click')
    expect(wrapper.emitted('selection-submit')).toBeUndefined()
    await wrapper.get('.scq-chat-message__selection-confirm').trigger('click')
    expect(wrapper.emitted('selection-submit')).toHaveLength(1)

    await wrapper.setProps({
      selectionValues: ['first', 'second'],
      selection: { mode: 'multiple', min: 1, max: 1, options: [{ value: 'first', label: 'First' }, { value: 'second', label: 'Second' }] },
    })
    expect(wrapper.get('.scq-chat-message__selection-hint').text()).toContain('已超出最多 1 项')
    expect(wrapper.get('.scq-chat-message__selection-confirm').attributes('disabled')).toBeDefined()
  })

  it('locks asynchronous submissions and preserves other input for retry', async () => {
    let rejectSubmission!: (reason: Error) => void
    const submit = vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectSubmission = reject }))
      .mockResolvedValue(undefined)
    const wrapper = mountMessage({
      selection: { id: 'async', mode: 'multiple', allowOther: true, options: [{ value: 'preset', label: 'Preset' }] },
      selectionSubmit: submit,
    })
    await wrapper.get('.scq-chat-message__selection-other-input').setValue('Custom choice')
    const confirm = wrapper.get('.scq-chat-message__selection-confirm')
    await confirm.trigger('click')
    await confirm.trigger('click')
    expect(submit).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('selection-submit')).toHaveLength(1)
    expect(wrapper.get('.scq-chat-message__selection').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('.scq-chat-message__selection-other-input').attributes('disabled')).toBeDefined()

    rejectSubmission(new Error('Network unavailable'))
    await flushPromises()
    expect(wrapper.get('.scq-chat-message__selection-error').text()).toBe('Network unavailable')
    expect(wrapper.get<HTMLInputElement>('.scq-chat-message__selection-other-input').element.value).toBe('Custom choice')
    expect(wrapper.get('.scq-chat-message__selection-confirm').text()).toBe('重新提交')
    expect(wrapper.emitted('selection-error')).toHaveLength(1)

    await wrapper.get('.scq-chat-message__selection-confirm').trigger('click')
    await flushPromises()
    expect(submit).toHaveBeenCalledTimes(2)
    expect(submit.mock.calls[1][0]).toMatchObject({ values: ['Custom choice'], selectedOptions: [] })
    expect(wrapper.get('.scq-chat-message__selection-summary').text()).toContain('Custom choice')
    expect(wrapper.find('.scq-chat-message__selection-confirm').exists()).toBe(false)
    expect(wrapper.emitted('selection-success')).toHaveLength(1)
  })

  it('supports externally controlled submitting, failure and submitted states', async () => {
    const selection = { id: 'controlled', mode: 'multiple', options: [{ value: 'first', label: 'First' }] }
    const wrapper = mountMessage({ selection })
    await wrapper.get('.scq-chat-message__selection-option').trigger('click')
    await wrapper.setProps({ selection: { ...selection, status: 'submitting' } })
    expect(wrapper.get('.scq-chat-message__selection-confirm').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ selection: { ...selection, status: 'error', errorText: 'Try again' } })
    expect(wrapper.get('.scq-chat-message__selection-option').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.scq-chat-message__selection-error').text()).toBe('Try again')
    expect(wrapper.get('.scq-chat-message__selection-confirm').attributes('disabled')).toBeUndefined()
    await wrapper.setProps({ selection: { ...selection, status: 'submitted' } })
    expect(wrapper.get('.scq-chat-message__selection-summary').text()).toContain('First')
    expect(wrapper.get('.scq-chat-message__selection-option').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ selection: { ...selection, status: 'expired', refreshable: true } })
    await wrapper.get('.scq-chat-message__selection-refresh').trigger('click')
    expect(wrapper.emitted('selection-refresh')?.[0]?.[0]).toMatchObject({ id: 'controlled' })
  })

  it('keeps other-text provenance when values collide and controlled values echo', async () => {
    const selection = { id: 'collision', mode: 'multiple', allowOther: true, options: [{ value: 'email', label: 'Email' }] }
    const wrapper = mountMessage({ selection })
    await wrapper.get('.scq-chat-message__selection-other-input').setValue('email')
    await wrapper.setProps({ selectionValues: ['email'] })
    await wrapper.setProps({ selectionValues: ['email'], selection: { ...selection, options: [...selection.options] } })
    expect(wrapper.get('button.scq-chat-message__selection-option').attributes('aria-pressed')).toBe('false')
    await wrapper.get('.scq-chat-message__selection-confirm').trigger('click')
    expect(wrapper.emitted('selection-submit')?.[0]?.[0]).toMatchObject({ values: ['email'], selectedOptions: [] })

    await wrapper.get('button.scq-chat-message__selection-option').trigger('click')
    await wrapper.get('.scq-chat-message__selection-confirm').trigger('click')
    expect(wrapper.emitted('selection-submit')?.[1]?.[0]).toMatchObject({
      values: ['email', 'email'], selectedOptions: [{ value: 'email', label: 'Email' }],
    })

    await wrapper.setProps({ selection: { ...selection, id: 'history' }, selectionValues: ['email'] })
    expect(wrapper.get('button.scq-chat-message__selection-option').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get<HTMLInputElement>('.scq-chat-message__selection-other-input').element.value).toBe('')
  })

  it('cancels obsolete submissions when selection identity changes or unmounts', async () => {
    let finish!: () => void
    const submit = vi.fn((_payload, _signal: AbortSignal) => new Promise<void>((resolve) => { finish = resolve }))
    const selection = { id: 'old', options: [{ value: 'first', label: 'First' }] }
    const wrapper = mountMessage({ selection, selectionSubmit: submit })
    await wrapper.get('.scq-chat-message__selection-option').trigger('click')
    const signal = submit.mock.calls[0][1]
    await wrapper.setProps({ selection: { ...selection, id: 'new' } })
    expect(signal.aborted).toBe(true)
    finish()
    await flushPromises()
    expect(wrapper.emitted('selection-success')).toBeUndefined()
    expect(wrapper.find('.scq-chat-message__selection-summary').exists()).toBe(false)
    await wrapper.get('.scq-chat-message__selection-option').trigger('click')
    wrapper.unmount()
    expect(submit.mock.calls[1][1].aborted).toBe(true)
    finish()
    await flushPromises()
    expect(wrapper.emitted('selection-success')).toBeUndefined()
  })

  it('invalidates a pending submission when controlled values are replaced', async () => {
    let finish!: () => void
    const submit = vi.fn((_payload, _signal: AbortSignal) => new Promise<void>((resolve) => { finish = resolve }))
    const wrapper = mountMessage({
      selection: { options: [{ value: 'first', label: 'First' }, { value: 'second', label: 'Second' }] },
      selectionSubmit: submit,
    })
    await wrapper.findAll('.scq-chat-message__selection-option')[0].trigger('click')
    await wrapper.setProps({ selectionValues: ['second'] })
    expect(submit.mock.calls[0][1].aborted).toBe(true)
    finish()
    await flushPromises()
    expect(wrapper.emitted('selection-success')).toBeUndefined()
    expect(wrapper.find('.scq-chat-message__selection-summary').exists()).toBe(false)
    expect(wrapper.findAll('.scq-chat-message__selection-option')[1].attributes('aria-pressed')).toBe('true')
  })

  it('preserves trimmed other-input echoes and exposes complete values to action slots', async () => {
    const wrapper = mount(ChatMessage, {
      props: { message: '', selection: { allowOther: true, options: [{ value: 'email', label: 'Email' }] } },
      slots: { 'selection-actions': ({ values, confirm }) => h('button', { class: 'confirm-slot', onClick: confirm }, JSON.stringify(values)) },
    })
    wrappers.push(wrapper)
    await wrapper.get('.scq-chat-message__selection-other-input').setValue(' email ')
    expect(wrapper.get('.confirm-slot').text()).toBe('[" email "]')
    await wrapper.setProps({ selectionValues: ['email'] })
    expect(wrapper.get('.confirm-slot').text()).toBe('["email"]')
    await wrapper.get('.confirm-slot').trigger('click')
    expect(wrapper.emitted('selection-submit')?.[0]?.[0]).toMatchObject({ values: ['email'], selectedOptions: [] })
  })

  it('does not count empty optional other input toward the minimum selection', async () => {
    const wrapper = mountMessage({ selection: { allowOther: true, otherRequired: false, options: [] } })
    await wrapper.get('.scq-chat-message__selection-other-input').setValue('   ')
    expect(wrapper.get('.scq-chat-message__selection-count').text()).toBe('已选 0 项')
    expect(wrapper.get('.scq-chat-message__selection-confirm').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.scq-chat-message__selection-hint').text()).toContain('至少选择 1 项')
  })

  it('keeps default actions opt-in and lets the actions slot replace them', () => {
    const plain = mountMessage({ message: 'Answer' })
    expect(plain.find('.scq-chat-message__actions').exists()).toBe(false)
    const wrapper = mount(ChatMessage, {
      props: { message: 'Answer', actions: ['copy'] },
      slots: { actions: '<button class="custom-action">Custom action</button>' },
    })
    wrappers.push(wrapper)
    expect(wrapper.find('.custom-action').exists()).toBe(true)
    expect(wrapper.find('[data-action="copy"]').exists()).toBe(false)
  })

  it('copies whole messages as raw Markdown or plain text with feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const message = '# Heading\n\nA **bold** [link](https://example.com).\n\n```ts\nconst value = 1\n```'
    const wrapper = mountMessage({ message, contentType: 'markdown', actions: ['copy'] })
    await wrapper.get('[data-action="copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenLastCalledWith(message)
    expect(wrapper.get('.scq-chat-message__action-feedback').text()).toBe('已复制')

    await wrapper.setProps({ copyFormat: 'text' })
    await wrapper.get('[data-action="copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenLastCalledWith('Heading\nA bold link.\nconst value = 1')
    expect(wrapper.emitted('action-success')).toHaveLength(2)

    writeText.mockRejectedValueOnce(new Error('Clipboard unavailable'))
    await wrapper.get('[data-action="copy"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('.scq-chat-message__action-feedback').attributes('role')).toBe('alert')
    expect(wrapper.get('.scq-chat-message__action-feedback').text()).toContain('复制失败')
    expect(wrapper.emitted('action-error')?.[0]?.[1]).toMatchObject({ action: 'copy' })
  })

  it('blocks duplicate copy operations and clears feedback timers on unmount', async () => {
    vi.useFakeTimers()
    let finish!: () => void
    const writeText = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mountMessage({ message: 'Answer', actions: ['copy'] })
    await wrapper.get('[data-action="copy"]').trigger('click')
    await wrapper.get('[data-action="copy"]').trigger('click')
    expect(writeText).toHaveBeenCalledTimes(1)
    finish()
    await flushPromises()
    expect(wrapper.get('.scq-chat-message__action-feedback').text()).toBe('已复制')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('emits distinct lifecycle actions without changing the controlled generation status', async () => {
    const wrapper = mountMessage({
      message: 'Partial answer', generationStatus: 'generating', actions: ['stop', 'retry', 'regenerate', 'like'],
    })
    expect(wrapper.find('[data-action="retry"]').exists()).toBe(false)
    expect(wrapper.find('[data-action="regenerate"]').exists()).toBe(false)
    expect(wrapper.get('[data-action="like"]').attributes('disabled')).toBeDefined()
    const stop = wrapper.get('[data-action="stop"]')
    expect(stop.classes()).toContain('is-stop')
    expect(stop.attributes('aria-label')).toBe('停止生成')
    expect(stop.get('.scq-icon--stop').classes()).toContain('scq-icon--solid')
    expect(stop.get('svg').attributes('fill')).toBe('currentColor')
    expect(stop.get('svg').attributes('stroke')).toBe('none')
    await stop.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('stop')).toHaveLength(1)
    expect(wrapper.props('generationStatus')).toBe('generating')

    await wrapper.setProps({ generationStatus: 'error' })
    expect(wrapper.find('[data-action="stop"]').exists()).toBe(false)
    await wrapper.get('[data-action="retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.emitted('regenerate')).toBeUndefined()
    await wrapper.setProps({ generationStatus: 'completed' })
    expect(wrapper.find('[data-action="retry"]').exists()).toBe(false)
    await wrapper.get('[data-action="regenerate"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('regenerate')).toHaveLength(1)
  })

  it.each([
    ['waiting', 'stop'],
    ['generating', 'stop'],
    ['completed', 'regenerate'],
    ['error', 'retry'],
    ['stopped', 'retry'],
  ] as const)('shows only the relevant lifecycle action for %s', (generationStatus, expectedAction) => {
    const wrapper = mountMessage({
      message: 'Answer',
      generationStatus,
      actions: ['retry', { name: 'regenerate', label: 'Generate again' }, 'stop'],
    })
    expect(wrapper.findAll('[data-action]').map(button => button.attributes('data-action'))).toEqual([expectedAction])
  })

  it('preserves explicit retry and regenerate configuration without a generation status', () => {
    const wrapper = mountMessage({ message: 'Answer', actions: ['retry', 'regenerate'] })
    expect(wrapper.findAll('[data-action]').map(button => button.attributes('data-action'))).toEqual(['retry', 'regenerate'])
  })

  it('updates feedback only after successful actions and supports cancellation and controlled values', async () => {
    const actionHandler = vi.fn().mockRejectedValueOnce(new Error('Feedback unavailable')).mockResolvedValue(undefined)
    const wrapper = mountMessage({ message: 'Answer', actions: ['like', 'dislike'], actionHandler })
    await wrapper.get('[data-action="like"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-action="like"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('.scq-chat-message__action-feedback').text()).toBe('Feedback unavailable')
    expect(wrapper.emitted('update:feedback')).toBeUndefined()

    await wrapper.get('[data-action="like"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-action="like"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('update:feedback')?.at(-1)).toEqual(['like'])
    await wrapper.get('[data-action="like"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:feedback')?.at(-1)).toEqual([null])
    expect(wrapper.get('[data-action="like"]').attributes('aria-pressed')).toBe('false')

    await wrapper.setProps({ feedback: 'like' })
    await wrapper.get('[data-action="dislike"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:feedback')?.at(-1)).toEqual(['dislike'])
    expect(wrapper.get('[data-action="like"]').attributes('aria-pressed')).toBe('true')
    await wrapper.setProps({ feedback: 'dislike' })
    expect(wrapper.get('[data-action="dislike"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-action="like"]').attributes('aria-pressed')).toBe('false')
  })

  it('lets stop interrupt a pending generation action and ignores obsolete completion', async () => {
    let finish!: () => void
    const actionHandler = vi.fn((payload: ChatMessageActionPayload, _signal: AbortSignal) => {
      if (payload.action === 'regenerate') return new Promise<void>((resolve) => { finish = resolve })
    })
    const wrapper = mountMessage({ message: 'Answer', generationStatus: 'completed', actions: ['regenerate', 'stop'], actionHandler })
    await wrapper.get('[data-action="regenerate"]').trigger('click')
    const signal = actionHandler.mock.calls[0][1]
    await wrapper.setProps({ generationStatus: 'generating' })
    expect(wrapper.get('[data-action="stop"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('[data-action="stop"]').trigger('click')
    await flushPromises()
    expect(signal.aborted).toBe(true)
    finish()
    await flushPromises()
    expect(wrapper.emitted('action-success')).toEqual([[expect.objectContaining({ action: 'stop' })]])
  })

  it('shows an outlined loading icon while stopping and restores the solid stop icon afterwards', async () => {
    let finish!: () => void
    const actionHandler = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    const wrapper = mountMessage({ message: 'Answer', generationStatus: 'generating', actions: ['stop'], actionHandler })
    const stop = wrapper.get('[data-action="stop"]')
    await stop.trigger('click')
    expect(stop.attributes('aria-busy')).toBe('true')
    expect(stop.attributes('disabled')).toBeDefined()
    expect(stop.get('.scq-icon--refresh').classes()).toContain('scq-icon--outline')
    expect(stop.get('svg').attributes('fill')).toBe('none')
    finish()
    await flushPromises()
    expect(stop.get('.scq-icon--stop').classes()).toContain('scq-icon--solid')
    expect(stop.attributes('disabled')).toBeUndefined()
    expect(wrapper.emitted('stop')).toHaveLength(1)
  })

  it('honors configured action loading, disabled state and rejected guards', async () => {
    const actionHandler = vi.fn().mockResolvedValue(false)
    const wrapper = mountMessage({
      message: 'Answer', generationStatus: 'generating', actions: [{ name: 'copy', loading: true }, 'stop', 'like'], actionHandler,
    })
    expect(wrapper.get('[data-action="copy"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('[data-action="stop"]').attributes('disabled')).toBeUndefined()
    await wrapper.setProps({ generationStatus: 'completed', actions: [{ name: 'copy', disabled: true }, { name: 'like', label: 'Helpful answer' }] })
    expect(wrapper.get('[data-action="copy"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-action="like"]').attributes('title')).toBe('Helpful answer')
    await wrapper.get('[data-action="like"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:feedback')).toBeUndefined()
    expect(wrapper.emitted('action-success')).toBeUndefined()
    expect(wrapper.get('[data-action="like"]').attributes('disabled')).toBeUndefined()
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
    const attachments = wrapper.findAll('.scq-chat-message__attachment-link')

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
    await wrapper.get('.scq-chat-message__image img').trigger('load')
    const trigger = wrapper.get('.scq-image__preview-trigger')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await flushPromises()

    const dialog = document.querySelector<HTMLElement>('.scq-image-viewer')
    const closeButton = document.querySelector<HTMLButtonElement>('.scq-image-viewer__close')
    expect(dialog?.getAttribute('aria-label')).toBe('图片预览')
    expect(closeButton?.getAttribute('aria-label')).toBe('关闭预览')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(dialog)

    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    expect(document.querySelector('.scq-image-viewer')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger.element)
  })

  it('reserves media dimensions and retries failed images through Image', async () => {
    const wrapper = mountMessage({ message: { type: 'image', src: '/photo.png', width: 240, height: 160 } })
    expect(wrapper.get('.scq-chat-message__image').attributes('style')).toContain('height: 160px')
    await wrapper.get('.scq-chat-message__image img').trigger('error')
    expect(wrapper.emitted('image-error')?.[0]).toEqual(['/photo.png'])
    expect(wrapper.text()).toContain('图片加载失败')
    await wrapper.get('.scq-chat-message__media-retry').trigger('click')
    expect(wrapper.get('.scq-chat-message__image img').attributes('src')).toBe('/photo.png')
    await wrapper.get('.scq-chat-message__image img').trigger('load')
    expect(wrapper.find('.scq-image__preview-trigger').exists()).toBe(true)
  })

  it('opens Markdown images in the shared gallery and restores the trigger focus', async () => {
    const wrapper = mountMessage({ message: '![First](/one.png)\n\n![Second](/two.png)', contentType: 'markdown' })
    const trigger = wrapper.findAll('.scq-chat-message__markdown-image')[1]
    await trigger.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('preview-open')?.[0]).toEqual(['/two.png'])
    const viewer = document.querySelector<HTMLElement>('.scq-image-viewer')!
    expect(viewer.querySelector('img')?.getAttribute('src')).toBe('/two.png')
    viewer.querySelector<HTMLButtonElement>('.scq-image-viewer__previous')!.click()
    await nextTick()
    expect(viewer.querySelector('img')?.getAttribute('src')).toBe('/one.png')
    viewer.querySelector<HTMLButtonElement>('.scq-image-viewer__close')!.click()
    await flushPromises()
    expect(wrapper.emitted('preview-close')?.[0]).toEqual(['/one.png'])
    expect(document.activeElement).toBe(trigger.element)
    await wrapper.setProps({ previewable: false })
    expect(wrapper.find('.scq-chat-message__markdown-image').exists()).toBe(false)
  })

  it('uses native attachment actions and keeps failed URLs non-navigable', () => {
    const wrapper = mountMessage({ attachments: [
      { id: 'ready', name: 'report.pdf', url: '/report.pdf' },
      { id: 'failed', name: 'failed.pdf', url: '/failed.pdf', status: 'error' },
      { id: 'upload', name: 'upload.pdf', status: 'uploading', progress: 35 },
    ] })
    expect(wrapper.get('[data-attachment-action="download"]').attributes('download')).toBe('report.pdf')
    expect(wrapper.findAll('[data-attachment-action="retry"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-attachment-action="cancel"]')).toHaveLength(1)
    expect(wrapper.findAll('.scq-chat-message__attachment-link')[1].attributes('href')).toBeUndefined()
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('35')
  })

  it('isolates attachment requests and retains a failed action for retry', async () => {
    let reject!: (error: Error) => void
    const handler = vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, rejectRequest) => { reject = rejectRequest })).mockResolvedValue(undefined)
    const wrapper = mountMessage({ attachments: [{ id: 'one', name: 'one.pdf', status: 'error' }, { id: 'two', name: 'two.pdf', status: 'error' }], attachmentActionHandler: handler })
    const retry = wrapper.findAll('[data-attachment-action="retry"]')
    await retry[0].trigger('click')
    await retry[0].trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(retry[1].attributes('disabled')).toBeUndefined()
    reject(new Error('Connection lost'))
    await flushPromises()
    expect(wrapper.get('.scq-chat-message__attachment-error').text()).toBe('Connection lost')
    await retry[0].trigger('click')
    await flushPromises()
    expect(wrapper.emitted('attachment-action-success')?.[0]?.[0]).toMatchObject({ action: 'retry', attachment: { id: 'one' } })
  })

  it('cancels detached attachment operations without applying stale results', async () => {
    let finish!: () => void
    const handler = vi.fn((_payload, _signal: AbortSignal) => new Promise<void>((resolve) => { finish = resolve }))
    const wrapper = mountMessage({ attachments: [{ id: 'one', name: 'one.pdf', url: '/old.pdf' }], attachmentActionHandler: handler })
    await wrapper.get('[data-attachment-action="download"]').trigger('click')
    await wrapper.setProps({ attachments: [{ id: 'one', name: 'one.pdf', url: '/refreshed.pdf' }] })
    expect(handler.mock.calls[0][1].aborted).toBe(false)
    await wrapper.setProps({ attachments: [] })
    expect(handler.mock.calls[0][1].aborted).toBe(true)
    finish()
    await flushPromises()
    expect(wrapper.emitted('attachment-action-success')).toBeUndefined()
  })

  it('shows only copy controls and preserves the complete code content', async () => {
    const code = '  first\nsecond\nthird\nfourth\n'
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mountMessage({ message: `\`\`\`text\n${code}\`\`\``, contentType: 'markdown' })
    expect(wrapper.findAll('.scq-chat-message__code-header button')).toHaveLength(1)
    expect(wrapper.get('.scq-chat-message__code-header button').classes()).toContain('scq-chat-message__code-copy')
    expect(wrapper.get('.scq-chat-message__code-body').element.textContent).toBe(code)
    expect(wrapper.get('.scq-chat-message__code-body').attributes('aria-hidden')).toBeUndefined()
    await wrapper.get('.scq-chat-message__code-copy').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(code)
    expect(wrapper.get('.scq-chat-message__sr-feedback').text()).toBe('已复制')
    expect(wrapper.get('.scq-chat-message__code-copy').attributes('aria-label')).toBe('已复制')
  })

  it('copies JSON and avoids repeating highlight work for unchanged code blocks', async () => {
    const highlight = vi.spyOn(hljs, 'highlight')
    const wrapper = mountMessage({ message: '```ts\nconst count = 1\n```', contentType: 'markdown' })
    const calls = highlight.mock.calls.length
    await wrapper.setProps({ message: '```ts\nconst count = 1\n```\n\nMore text' })
    expect(highlight).toHaveBeenCalledTimes(calls)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    await wrapper.setProps({ message: { result: 42 }, contentType: 'json' })
    expect(wrapper.findAll('.scq-chat-message__code-header button')).toHaveLength(1)
    await wrapper.get('.scq-chat-message__code-copy').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ result: 42 }, null, 2))
  })

  it('coalesces opt-in stream updates and flushes immediately on terminal states', async () => {
    vi.useFakeTimers()
    const wrapper = mountMessage({ message: 'Start', contentType: 'markdown', generationStatus: 'generating', streamInterval: 100 })
    await wrapper.setProps({ message: 'Start one' })
    await wrapper.setProps({ message: 'Start one two' })
    expect(wrapper.get('.scq-chat-message__markdown').text()).toBe('Start')
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.get('.scq-chat-message__markdown').text()).toBe('Start one two')
    await wrapper.setProps({ message: 'Final answer', generationStatus: 'completed' })
    expect(wrapper.get('.scq-chat-message__markdown').text()).toBe('Final answer')
    await wrapper.setProps({ generationStatus: 'generating', message: 'New answer' })
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('inherits locale, theme and disabled configuration without announcing streamed content', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: 'en-US', theme: 'dark', disabled: true, tokens: { primary: '#008060' } },
      slots: { default: () => h(ChatMessage, {
        message: '```ts\nconst answer = 42\n```', contentType: 'markdown', generationStatus: 'completed', actions: ['copy'],
        selection: { mode: 'multiple', allowOther: true, options: [{ value: 'one', label: 'One' }] },
      }) },
    })
    wrappers.push(wrapper)
    const message = wrapper.getComponent(ChatMessage)
    expect(message.get('.scq-chat-message__status-text').text()).toBe('Generation completed')
    expect(message.get('[data-action="copy"]').attributes('aria-label')).toBe('Copy message')
    expect(message.get('[data-action="copy"]').attributes('disabled')).toBeDefined()
    expect(message.get('.scq-chat-message__selection-other-input').attributes('placeholder')).toBe('Enter another choice')
    expect(message.get('.scq-chat-message__selection-option').attributes('disabled')).toBeDefined()
    expect(message.get('.scq-chat-message__bubble').attributes('aria-live')).toBe('off')
    expect(message.attributes('style')).toContain('--scq-primary: #008060')
    expect(message.get('.scq-chat-message__code-copy').text()).toBe('Copy')
    await wrapper.setProps({ locale: 'zh-CN', disabled: false })
    expect(message.get('[data-action="copy"]').attributes('aria-label')).toBe('复制消息')
    expect(message.get('[data-action="copy"]').attributes('disabled')).toBeUndefined()
  })

  it('preserves explicit text overrides and associates selection guidance', () => {
    const wrapper = mountMessage({
      message: '```ts\nconst count = 1\n```', contentType: 'markdown', codeCopyText: 'Copy snippet',
      texts: { otherPlaceholder: 'Specify another channel' },
      selection: { allowOther: true, autoSubmit: false, options: [] },
    })
    expect(wrapper.get('.scq-chat-message__code-copy').text()).toBe('Copy snippet')
    expect(wrapper.get('.scq-chat-message__selection-other-input').attributes('placeholder')).toBe('Specify another channel')
    expect(wrapper.get('.scq-chat-message__selection-other-input').attributes('aria-describedby')).toBe(wrapper.get('.scq-chat-message__selection-hint').attributes('id'))
  })

  it('renders safe sources, excerpts and cancellable citation navigation', async () => {
    const wrapper = mountMessage({
      message: 'Answer', sources: [
        { id: 'guide', title: 'Deployment guide', url: 'https://example.com/guide', page: 8, excerpt: 'Review the release checklist.' },
        { id: 'unsafe', title: 'Local record', url: 'javascript:alert(1)' },
      ],
      'onSource-click': (_payload: unknown, event: MouseEvent) => event.preventDefault(),
    })
    expect(wrapper.get('.scq-chat-message__source a').attributes('rel')).toContain('noopener')
    expect(wrapper.findAll('.scq-chat-message__source a')).toHaveLength(1)
    expect(wrapper.get('.scq-chat-message__source-page').text()).toBe('第 8 页')
    expect(wrapper.get('details p').text()).toBe('Review the release checklist.')
    await wrapper.get('.scq-chat-message__source button').trigger('click')
    expect(wrapper.emitted('source-click')?.[0]?.[0]).toMatchObject({ index: 1, source: { id: 'unsafe' } })
  })

  it('renders ordered mixed content and preserves keyed custom input state', async () => {
    const parts = [
      { id: 'intro', type: 'markdown', content: '**Overview**' },
      { id: 'editor', type: 'custom', data: { title: 'Note' }, text: 'Custom note' },
      { id: 'result', type: 'json', content: { count: 2 } },
    ] as const
    const wrapper = mount(ChatMessage, {
      props: { message: 'Legacy fallback', parts: [...parts], actions: ['copy'] },
      slots: { part: ({ part }) => h('input', { 'aria-label': part.data.title }) },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    const input = wrapper.get('input')
    await input.setValue('Keep my draft')
    await wrapper.setProps({ parts: [{ ...parts[0], content: '**Updated**' }, parts[1], parts[2]] })
    expect(wrapper.get('input').element).toBe(input.element)
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('Keep my draft')
    expect(wrapper.findAll('[data-part-id]').map(part => part.attributes('data-part-id'))).toEqual(['intro', 'editor', 'result'])
    expect(wrapper.text()).not.toContain('Legacy fallback')
    expect(wrapper.text()).toContain('Updated')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    await wrapper.get('[data-action="copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('**Updated**\n\nCustom note\n\n{\n  "count": 2\n}')
  })

  it('keeps nested code-copy handling inside its owning content segment', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mountMessage({ parts: [{ id: 'code', type: 'markdown', content: '```ts\nconst count = 1\n```' }] })
    await wrapper.get('.scq-chat-message__code-copy').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('const count = 1\n')
  })

  it('stabilizes automatic stream rendering while preserving explicit plain text', async () => {
    const wrapper = mountMessage({ message: 'Beginning', generationStatus: 'waiting' })
    const markdown = wrapper.get('.scq-chat-message__markdown').element
    await wrapper.setProps({ message: '**Beginning**', generationStatus: 'generating' })
    expect(wrapper.get('.scq-chat-message__markdown').element).toBe(markdown)
    await wrapper.setProps({ generationStatus: 'completed' })
    expect(wrapper.get('.scq-chat-message__markdown').element).toBe(markdown)
    await wrapper.setProps({ contentType: 'text' })
    expect(wrapper.get('.scq-chat-message__text').text()).toBe('**Beginning**')
  })

  it('preserves linked Markdown image navigation without nesting interactive controls', () => {
    const wrapper = mountMessage({ message: '[![Guide](/guide.png)](https://example.com/guide)', contentType: 'markdown' })
    expect(wrapper.get('.scq-chat-message__markdown a').attributes('href')).toBe('https://example.com/guide')
    expect(wrapper.find('.scq-chat-message__markdown a button').exists()).toBe(false)
  })

  it('shares one gallery between Markdown and image parts', async () => {
    const wrapper = mountMessage({ parts: [
      { id: 'text', type: 'markdown', content: '![First](/one.png)' },
      { id: 'photo', type: 'image', content: { src: '/two.png', alt: 'Second' } },
    ] })
    await wrapper.get('.scq-chat-message__markdown-image').trigger('click')
    await flushPromises()
    const viewer = document.querySelector<HTMLElement>('.scq-image-viewer')!
    expect(viewer.querySelector('.scq-image-viewer__toolbar span')?.textContent).toBe('1 / 2')
    viewer.querySelector<HTMLButtonElement>('.scq-image-viewer__next')!.click()
    await nextTick()
    expect(viewer.querySelector('img')?.getAttribute('src')).toBe('/two.png')
    viewer.querySelector<HTMLButtonElement>('.scq-image-viewer__close')!.click()
    await flushPromises()
    expect(wrapper.emitted('preview-close')?.[0]).toEqual(['/two.png'])
  })

  it('does not navigate disabled source links or bypass attachment handlers through the filename', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountMessage({
      disabled: true, sources: [{ title: 'Guide', url: 'https://example.com' }],
      attachments: [{ id: 'file', name: 'guide.pdf', url: '/expired.pdf' }], attachmentActionHandler: handler,
    })
    expect(wrapper.get('.scq-chat-message__source a').attributes('href')).toBeUndefined()
    expect(wrapper.get('.scq-chat-message__source a').attributes('aria-disabled')).toBe('true')
    expect(wrapper.get('.scq-chat-message__attachment-link').attributes('href')).toBeUndefined()
    await wrapper.setProps({ disabled: false })
    await wrapper.get('.scq-chat-message__attachment-link').trigger('click')
    await flushPromises()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0]).toMatchObject({ action: 'preview', attachment: { id: 'file' } })
  })

  it('keeps a retried upload active during progress updates and lets cancel interrupt it', async () => {
    let finish!: () => void
    const handler = vi.fn((payload: { action: string }, _signal: AbortSignal) => payload.action === 'retry'
      ? new Promise<void>((resolve) => { finish = resolve }) : undefined)
    const wrapper = mountMessage({ attachments: [{ id: 'upload', name: 'upload.pdf', status: 'error' }], attachmentActionHandler: handler })
    await wrapper.get('[data-attachment-action="retry"]').trigger('click')
    const signal = handler.mock.calls[0][1]
    await wrapper.setProps({ attachments: [{ id: 'upload', name: 'upload.pdf', status: 'uploading', progress: 30 }] })
    expect(signal.aborted).toBe(false)
    expect(wrapper.get('[data-attachment-action="cancel"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('[data-attachment-action="cancel"]').trigger('click')
    await flushPromises()
    expect(signal.aborted).toBe(true)
    finish()
    await flushPromises()
    expect(wrapper.emitted('attachment-action-success')).toEqual([[expect.objectContaining({ action: 'cancel' })]])
  })
})
