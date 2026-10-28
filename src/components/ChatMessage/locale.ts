import { computed } from 'vue'
import { useConfig, type ComponentLocale } from '../ConfigProvider/context'

const chinese = {
  actions: { copy: '复制消息', retry: '重试', regenerate: '重新生成', stop: '停止生成', like: '有帮助', dislike: '无帮助', copied: '已复制', copyFailed: '复制失败，请重试', failed: '操作失败，请重试' },
  status: { thinking: '正在思考', tool: '正在调用工具', loading: '正在处理中', success: '处理完成', warning: '请注意', error: '处理失败' },
  generation: { waiting: '等待响应', generating: '正在生成', completed: '生成完成', stopped: '已停止', error: '生成失败' },
  selection: { confirm: '确认选择', submitting: '提交中', error: '提交失败，请重试', retry: '重新提交', submitted: '已选择：{values}', empty: '无', refresh: '重新获取选项', disabled: '当前选择不可用', otherRequired: '请填写其他内容', minimum: '至少选择 {min} 项', maximum: '最多选择 {max} 项', range: '选择 {min} 至 {max} 项', exceeded: '已超出最多 {max} 项的限制' },
  labels: { message: '聊天消息', copy: '复制', copied: '已复制', copyFailed: '复制失败', imageError: '图片加载失败', preview: '图片预览', closePreview: '关闭预览', videoUnsupported: '当前浏览器不支持视频播放。', other: '其他', otherPlaceholder: '请输入其他内容', choose: '请选择候选项', expired: '候选项已过期，请重新选择', selectedCount: '已选 {count} 项', uploading: '上传中', failed: '失败', download: '下载', sources: '引用来源', page: '第 {page} 页', sourceDetail: '引用片段', customContent: '自定义内容', separator: '、' },
}

const messages: Record<ComponentLocale, typeof chinese> = {
  'zh-CN': chinese,
  'en-US': {
    actions: { copy: 'Copy message', retry: 'Retry', regenerate: 'Regenerate', stop: 'Stop generating', like: 'Helpful', dislike: 'Not helpful', copied: 'Copied', copyFailed: 'Copy failed. Please retry.', failed: 'Action failed. Please retry.' },
    status: { thinking: 'Thinking', tool: 'Using a tool', loading: 'Processing', success: 'Completed', warning: 'Please note', error: 'Failed' },
    generation: { waiting: 'Waiting for response', generating: 'Generating', completed: 'Generation completed', stopped: 'Stopped', error: 'Generation failed' },
    selection: { confirm: 'Confirm selection', submitting: 'Submitting', error: 'Submission failed. Please retry.', retry: 'Submit again', submitted: 'Selected: {values}', empty: 'None', refresh: 'Refresh choices', disabled: 'Selection is unavailable', otherRequired: 'Enter your other choice', minimum: 'Select at least {min}', maximum: 'Select at most {max}', range: 'Select {min} to {max}', exceeded: 'More than {max} choices selected' },
    labels: { message: 'Chat message', copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed', imageError: 'Image failed to load', preview: 'Image preview', closePreview: 'Close preview', videoUnsupported: 'Your browser does not support video playback.', other: 'Other', otherPlaceholder: 'Enter another choice', choose: 'Choose an option', expired: 'These choices have expired', selectedCount: '{count} selected', uploading: 'Uploading', failed: 'Failed', download: 'Download', sources: 'Sources', page: 'Page {page}', sourceDetail: 'Source excerpt', customContent: 'Custom content', separator: ', ' },
  },
}

export type ChatMessageTexts = Partial<typeof chinese.labels>

export const useChatLocale = (overrides: () => ChatMessageTexts | undefined = () => undefined) => {
  const config = useConfig()
  const bundle = computed(() => messages[config.value.locale])
  const text = (key: keyof typeof chinese.labels): string => overrides()?.[key] ?? bundle.value.labels[key]
  return { bundle, text }
}
