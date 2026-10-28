<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqChatMessage from '../../../../src/components/ChatMessage'
import ScqConfigProvider from '../../../../src/components/ConfigProvider'
import ScqInput from '../../../../src/components/Input'
import type { ChatAttachment, ChatAttachmentActionHandler, ChatAttachmentActionPayload, ChatMessagePart, ChatMessageSource, ChatMessageSourcePayload } from '../../../../src/components/ChatMessage'
import type { ChatGenerationStatus, ChatMessageAction, ChatMessageActionHandler, ChatMessageFeedback, ChatMessageSelection, ChatMessageSelectionStatus, ChatMessageSelectionSubmit, ChatMessageSelectionValue } from '../../../../src/components/ChatMessage'
import ExampleSection from '../ExampleSection.vue'

const SELECTION: ChatMessageSelection = { title: '选择关注领域', mode: 'multiple', min: 1, max: 2, options: [{ value: 'design', label: '设计', description: '界面与交互' }, { value: 'code', label: '开发', description: '组件与工具' }] }
const CONTENT = '第一行\n第二行\n\n[示例链接](https://example.com)\n\n```ts\nconst message = "Hello"\n```'
const STATUS_TEXTS = { success: '内容已准备完成' }
const values = ref<ChatMessageSelectionValue[]>([])
const disabled = ref(false)
const breaks = ref(true)
const showName = ref(true)
const event = ref('尚未确认')

const DEMO_TIMING = { generationStep: 450, selectionSubmit: 900, failureChunk: 1, attachment: 600, streamInterval: 80 }
const CONTENT_LAYOUT = { imageWidth: 280, imageHeight: 180 }
const ANSWER_CHUNKS = ['## 本周交付计划\n\n', '1. 完成需求确认与接口联调。\n', '2. 核对验收清单与测试结果。\n', '3. 周五提交交付说明和操作手册。']
const MESSAGE_ACTIONS: ChatMessageAction[] = ['copy', 'stop', 'retry', 'regenerate', 'like', 'dislike']
const answer = ref(ANSWER_CHUNKS.join(''))
const generation = ref<ChatGenerationStatus>('completed')
const feedback = ref<ChatMessageFeedback>(null)
const failNextGeneration = ref(false)
const failNextSelection = ref(true)
const requestValues = ref<ChatMessageSelectionValue[]>([])
const requestId = ref(0)
const requestStatus = ref<ChatMessageSelectionStatus>('pending')
const requestOptions = [{ value: 'email', label: '邮件', description: '发送交付说明与文档链接' }, { value: 'meeting', label: '线上会议', description: '演示并确认交付结果' }]
const requestSelection = computed<ChatMessageSelection>(() => ({
  id: requestId.value,
  title: '选择交付方式',
  options: requestOptions,
  autoSubmit: false,
  allowOther: true,
  otherPlaceholder: '填写其他交付方式',
  status: requestStatus.value,
  refreshable: true,
}))
const pendingDelays = new Set<() => void>()

const delay = (duration: number, signal: AbortSignal) => new Promise<boolean>((resolve) => {
  if (signal.aborted) { resolve(false); return }
  const finish = (completed: boolean) => {
    window.clearTimeout(timer)
    signal.removeEventListener('abort', cancel)
    pendingDelays.delete(cancel)
    resolve(completed)
  }
  const cancel = () => finish(false)
  const timer = window.setTimeout(() => finish(true), duration)
  pendingDelays.add(cancel)
  signal.addEventListener('abort', cancel, { once: true })
})

const handleMessageAction: ChatMessageActionHandler = async (payload, signal) => {
  if (payload.action === 'stop') { generation.value = 'stopped'; return }
  if (payload.action !== 'retry' && payload.action !== 'regenerate') return
  const shouldFail = failNextGeneration.value
  failNextGeneration.value = false
  feedback.value = null
  answer.value = ''
  generation.value = 'waiting'
  for (const [index, chunk] of ANSWER_CHUNKS.entries()) {
    if (!await delay(DEMO_TIMING.generationStep, signal)) return false
    answer.value += chunk
    generation.value = 'generating'
    if (shouldFail && index === DEMO_TIMING.failureChunk) {
      generation.value = 'error'
      throw new Error('连接中断，已保留生成内容')
    }
  }
  generation.value = 'completed'
}

const submitSelection: ChatMessageSelectionSubmit = async (_payload, signal) => {
  if (!await delay(DEMO_TIMING.selectionSubmit, signal)) return false
  if (failNextSelection.value) {
    failNextSelection.value = false
    throw new Error('提交失败，选择已保留，请重试')
  }
}

const resetSelection = () => {
  requestId.value += 1
  requestValues.value = []
  requestStatus.value = 'pending'
}

const darkContent = ref(false)
const englishContent = ref(false)
const reviewDone = ref(false)
const reviewNote = ref('')
const sourceNotice = ref('')
const sourceRecords: ChatMessageSource[] = [
  { id: 'release', title: '交付清单', page: 3, excerpt: '交付前确认接口联调、回归测试和操作手册。' },
  { id: 'guide', title: '接入文档', url: 'https://vuejs.org/guide/introduction.html', excerpt: '组件数据由业务应用提供，并通过事件响应用户操作。' },
]
const sampleCode = ['type Delivery = {', '  version: string', '  checks: string[]', '}', '', 'const delivery: Delivery = {', '  version: "1.2.5",', '  checks: ["interfaces", "regression", "manual"],', '}', '', 'export function ready(value: Delivery) {', '  return value.checks.length > 0', '}'].join('\n')
const contentParts: ChatMessagePart[] = [
  { id: 'intro', type: 'markdown', content: '## 交付资料\n\n请核对标识资源和发布配置。\n\n![SCQ VUE 标识](/favicon.png)' },
  { id: 'image', type: 'image', content: { src: '/logo.svg', alt: 'SCQ VUE 品牌标识', width: CONTENT_LAYOUT.imageWidth, height: CONTENT_LAYOUT.imageHeight } },
  { id: 'review', type: 'custom', text: '交付验收', data: { status: 'pending' } },
  { id: 'code', type: 'markdown', content: '```ts\n' + sampleCode + '\n```' },
  { id: 'json', type: 'json', content: { version: '1.2.5', checks: ['interfaces', 'regression', 'manual'] } },
]
const inspectSource = (payload: ChatMessageSourcePayload, event: MouseEvent) => {
  event.preventDefault()
  sourceNotice.value = `${payload.source.title}：${payload.source.excerpt || ''}`
}
const failNextDownload = ref(true)
const attachmentNotice = ref('')
const demoAttachments = ref<ChatAttachment[]>([
  { id: 'ready', name: 'delivery-notes.txt', type: 'text', url: '/delivery-notes.txt', size: 240, actions: ['download'] },
  { id: 'failed', name: 'release-checklist.txt', type: 'text', status: 'error', statusText: '上传失败' },
  { id: 'uploading', name: 'review-notes.txt', type: 'text', status: 'uploading', progress: 48 },
])
const handleAttachmentAction: ChatAttachmentActionHandler = async (payload, signal) => {
  if (!await delay(DEMO_TIMING.attachment, signal)) return false
  if (payload.action === 'download') {
    if (failNextDownload.value) { failNextDownload.value = false; throw new Error('下载地址已过期，请重试') }
    const link = document.createElement('a')
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent('SCQ VUE delivery notes\nVersion: 1.2.5\nChecks: interfaces, regression, manual')}`
    link.download = payload.name
    document.body.append(link)
    link.click()
    link.remove()
  }
}
const completeAttachmentAction = (payload: ChatAttachmentActionPayload) => {
  const item = demoAttachments.value.find(attachment => attachment.id === payload.attachment.id)
  if (!item) return
  if (payload.action === 'retry') { item.status = 'success'; item.url = '/release-checklist.txt'; item.statusText = '已上传'; item.progress = undefined }
  if (payload.action === 'cancel') { item.status = 'error'; item.statusText = '已取消'; item.progress = undefined }
  attachmentNotice.value = payload.action === 'download' ? `已下载 ${payload.name}` : `${payload.name}：${item.statusText}`
}

onBeforeUnmount(() => pendingDelays.forEach(cancel => cancel()))
</script>

<template>
  <ExampleSection title="选择插槽与内容显示选项">
    <template #controls><ScqCheckbox v-model="disabled">禁用选择</ScqCheckbox><ScqCheckbox v-model="breaks">Markdown 换行</ScqCheckbox><ScqCheckbox v-model="showName">显示昵称</ScqCheckbox></template>
    <ScqChatMessage v-model:selection-values="values" :message="CONTENT" content-type="markdown" :markdown-breaks="breaks" name="SCQ Assistant" :show-name="showName" :show-time="false" :status="{ type: 'success' }" :status-texts="STATUS_TEXTS" :selection="SELECTION" :selection-disabled="disabled" link-target="_self" link-rel="nofollow" code-copy-text="复制示例" code-copied-text="已复制示例" code-copy-failed-text="复制失败，请手动选择" @selection-submit="payload => event = JSON.stringify(payload.values)">
      <template #selection-title="{ selection }"><strong>{{ selection.title }}（最多两项）</strong></template>
      <template #selection-option="{ option, selected }">{{ selected ? '✓ ' : '' }}{{ option.label }} · {{ option.description }}</template>
      <template #selection-actions="{ values: selected, disabled: unavailable, confirm }"><ScqButton :disabled="unavailable" @click="confirm">确认 {{ selected.length }} 项</ScqButton></template>
    </ScqChatMessage>
    <output role="status">{{ event }}</output>
  </ExampleSection>

  <ExampleSection title="生成中断、重试与消息反馈">
    <template #controls>
      <ScqCheckbox v-model="failNextGeneration">下次生成失败</ScqCheckbox>
    </template>
    <div data-chat-demo="generation">
      <ScqChatMessage
        v-model:feedback="feedback"
        :message="answer"
        content-type="markdown"
        name="项目助手"
        :show-time="false"
        :generation-status="generation"
        :stream-interval="DEMO_TIMING.streamInterval"
        :actions="MESSAGE_ACTIONS"
        :action-handler="handleMessageAction"
      />
    </div>
  </ExampleSection>

  <ExampleSection title="选择提交与失败恢复">
    <template #controls>
      <ScqCheckbox v-model="failNextSelection">下次提交失败</ScqCheckbox>
      <ScqButton icon="refresh" @click="resetSelection">重置选择</ScqButton>
      <ScqButton @click="requestStatus = 'expired'">使选项过期</ScqButton>
    </template>
    <div data-chat-demo="selection-submit">
      <ScqChatMessage
        v-model:selection-values="requestValues"
        message="交付文档已经整理完成，请确认接收方式。"
        name="项目助手"
        :show-time="false"
        :selection="requestSelection"
        :selection-submit="submitSelection"
        @selection-refresh="resetSelection"
      />
    </div>
  </ExampleSection>

  <ExampleSection title="图文资料、代码阅读与引用来源">
    <template #controls><ScqCheckbox v-model="darkContent">深色主题</ScqCheckbox><ScqCheckbox v-model="englishContent">英文文案</ScqCheckbox></template>
    <ScqConfigProvider :theme="darkContent ? 'dark' : 'light'" :locale="englishContent ? 'en-US' : 'zh-CN'">
      <div class="chat-content-demo" data-chat-demo="content">
        <ScqChatMessage :parts="contentParts" :sources="sourceRecords" :actions="['copy', 'like', 'dislike']" name="交付助手" @source-click="inspectSource">
          <template #part="{ part }"><div v-if="part.id === 'review'" class="chat-review-fields"><ScqCheckbox v-model="reviewDone">验收已确认</ScqCheckbox><ScqInput v-model="reviewNote" aria-label="验收备注" placeholder="填写验收备注" /></div></template>
        </ScqChatMessage>
        <output v-if="sourceNotice" role="status">{{ sourceNotice }}</output>
      </div>
    </ScqConfigProvider>
  </ExampleSection>

  <ExampleSection title="附件重试、取消与下载">
    <template #controls><ScqCheckbox v-model="failNextDownload">下次下载失败</ScqCheckbox></template>
    <div data-chat-demo="attachments">
      <ScqChatMessage message="交付文件已整理，请确认附件状态。" :attachments="demoAttachments" :attachment-action-handler="handleAttachmentAction" @attachment-action-success="completeAttachmentAction" />
      <output role="status">{{ attachmentNotice }}</output>
    </div>
  </ExampleSection>
</template>

<style scoped>
.chat-content-demo { padding: 12px; background: var(--scq-surface); color: var(--scq-text); min-width: 0; }
.chat-review-fields { display: grid; gap: 8px; max-width: 100%; }
.chat-content-demo output { display: block; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
</style>
