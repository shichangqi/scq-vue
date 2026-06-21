<template>
  <div class="scq-chat-message" :class="`is-${role}`">
    <div v-if="shouldShowTime" class="scq-chat-message__time">
      {{ formattedTime }}
    </div>

    <div class="scq-chat-message__body">
      <div v-if="shouldShowAvatar" class="scq-chat-message__avatar" :title="name || undefined">
        <img v-if="avatar" :src="avatar" :alt="avatarAlt" />
        <span v-else>{{ avatarInitial }}</span>
      </div>

      <div class="scq-chat-message__content">
        <div v-if="shouldShowName" class="scq-chat-message__name">{{ name }}</div>

        <div class="scq-chat-message__bubble" :class="bubbleClasses" :aria-live="streaming ? 'polite' : undefined">
          <div v-if="shouldShowStatus" class="scq-chat-message__status" :class="`is-${resolvedStatusType}`" role="status">
            <span class="scq-chat-message__status-text">{{ resolvedStatusText }}</span>
            <span v-if="resolvedStatusLoading" class="scq-chat-message__status-indicator" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>

          <div
            v-if="resolvedContentType === 'markdown'"
            class="scq-chat-message__markdown"
            v-html="renderedMarkdown"
          ></div>

          <pre v-else-if="resolvedContentType === 'json'" class="scq-chat-message__code-block"><code class="hljs language-json" v-html="highlightedJson"></code></pre>

          <div v-else-if="resolvedContentType === 'image'" class="scq-chat-message__media">
            <img
              v-if="resolvedMedia.src && !imageLoadFailed"
              class="scq-chat-message__image"
              :src="resolvedMedia.src"
              :alt="resolvedMedia.alt"
              :title="resolvedMedia.title"
              loading="lazy"
              :tabindex="previewable ? 0 : undefined"
              :role="previewable ? 'button' : undefined"
              @click="openImagePreview"
              @keydown.enter="openImagePreview"
              @keydown.space.prevent="openImagePreview"
              @error="handleImageError"
            />
            <div v-else-if="resolvedMedia.src" class="scq-chat-message__image-fallback">
              <span>{{ imageFallbackText }}</span>
            </div>
            <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
          </div>

          <div v-else-if="resolvedContentType === 'video'" class="scq-chat-message__media">
            <video
              v-if="resolvedMedia.src"
              class="scq-chat-message__video"
              :src="resolvedMedia.src"
              :poster="resolvedMedia.poster"
              :controls="resolvedMedia.controls"
              :autoplay="resolvedMedia.autoplay"
              :muted="resolvedMedia.muted"
              :loop="resolvedMedia.loop"
              :preload="resolvedMedia.preload"
              playsinline
            >
              当前浏览器不支持视频播放。
            </video>
            <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
          </div>

          <div v-else class="scq-chat-message__text">{{ renderedText }}</div>

          <span v-if="shouldShowStreamCursor" class="scq-chat-message__stream-cursor" aria-hidden="true"></span>
        </div>

        <div v-if="normalizedAttachments.length" class="scq-chat-message__attachments">
          <a
            v-for="attachment in normalizedAttachments"
            :key="attachment.key"
            class="scq-chat-message__attachment"
            :class="[`is-${attachment.type}`, `is-${attachment.status}`]"
            :href="attachment.url || undefined"
            :target="attachment.target"
            :rel="attachment.rel"
            :download="attachment.download"
            :aria-disabled="attachment.url ? undefined : 'true'"
            @click="handleAttachmentClick($event, attachment)"
          >
            <span class="scq-chat-message__attachment-icon" aria-hidden="true">{{ attachment.icon }}</span>
            <span class="scq-chat-message__attachment-main">
              <span class="scq-chat-message__attachment-name">{{ attachment.name }}</span>
              <span class="scq-chat-message__attachment-meta">
                <span>{{ attachment.label }}</span>
                <span v-if="attachment.sizeText">{{ attachment.sizeText }}</span>
                <span v-if="attachment.statusText">{{ attachment.statusText }}</span>
              </span>
              <span v-if="attachment.progress !== null" class="scq-chat-message__attachment-progress">
                <span :style="{ width: `${attachment.progress}%` }"></span>
              </span>
            </span>
          </a>
        </div>

        <div v-if="$slots.actions" class="scq-chat-message__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showImagePreview"
        ref="previewRef"
        class="scq-chat-message__preview"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        @click="closeImagePreview"
        @keydown.esc="closeImagePreview"
      >
        <button type="button" class="scq-chat-message__preview-close" aria-label="关闭预览" @click.stop="closeImagePreview">×</button>
        <img :src="resolvedMedia.src" :alt="resolvedMedia.alt" @click.stop />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import jsonLang from 'highlight.js/lib/languages/json'
import javascriptLang from 'highlight.js/lib/languages/javascript'
import typescriptLang from 'highlight.js/lib/languages/typescript'
import xmlLang from 'highlight.js/lib/languages/xml'
import cssLang from 'highlight.js/lib/languages/css'
import bashLang from 'highlight.js/lib/languages/bash'
import { computed, nextTick, ref, watch } from 'vue'

defineOptions({
  name: 'ChatMessage',
})

hljs.registerLanguage('json', jsonLang)
hljs.registerLanguage('javascript', javascriptLang)
hljs.registerLanguage('js', javascriptLang)
hljs.registerLanguage('typescript', typescriptLang)
hljs.registerLanguage('ts', typescriptLang)
hljs.registerLanguage('html', xmlLang)
hljs.registerLanguage('xml', xmlLang)
hljs.registerLanguage('css', cssLang)
hljs.registerLanguage('bash', bashLang)
hljs.registerLanguage('shell', bashLang)

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight(code: string, language: string) {
    if (language && hljs.getLanguage(language)) {
      const highlighted = hljs.highlight(code, { language }).value
      return `<pre class="scq-chat-message__code-block"><code class="hljs language-${language}">${highlighted}</code></pre>`
    }

    const highlighted = hljs.highlightAuto(code).value
    return `<pre class="scq-chat-message__code-block"><code class="hljs">${highlighted}</code></pre>`
  },
})

markdown.renderer.rules.table_open = () => '<div class="scq-chat-message__table-wrap"><table>'
markdown.renderer.rules.table_close = () => '</table></div>'

export type ChatRole = 'ai' | 'user'
export type ChatMediaType = 'image' | 'video'
export type ChatContentType = 'auto' | 'text' | 'markdown' | 'json' | ChatMediaType
export type ChatStatusType = 'thinking' | 'tool' | 'loading' | 'success' | 'warning' | 'error'
export type ChatVideoPreload = 'auto' | 'metadata' | 'none'
export type ChatAttachmentType = 'pdf' | 'word' | 'excel' | 'ppt' | 'zip' | 'code' | 'text' | 'image' | 'video' | 'audio' | 'file'
export type ChatAttachmentStatus = 'default' | 'uploading' | 'success' | 'error'

export interface ChatMessageStatus {
  type?: ChatStatusType
  text?: string
  loading?: boolean
  visible?: boolean
}

export interface ChatMediaMessage {
  type?: ChatMediaType
  mediaType?: ChatMediaType
  contentType?: ChatMediaType
  src?: string
  url?: string
  source?: string
  alt?: string
  title?: string
  poster?: string
  controls?: boolean
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  preload?: ChatVideoPreload
}

export interface ChatAttachment {
  name: string
  url?: string
  type?: ChatAttachmentType | string
  size?: number | string
  download?: boolean | string
  target?: string
  rel?: string
  status?: ChatAttachmentStatus
  statusText?: string
  progress?: number
}

export interface ChatAttachmentClickPayload {
  attachment: ChatAttachment
  index: number
  name: string
  url: string
  type: ChatAttachmentType
  label: string
  sizeText: string
  status: ChatAttachmentStatus
  statusText: string
  progress: number | null
}

interface ResolvedMediaMessage {
  src: string
  alt: string
  title?: string
  poster?: string
  controls: boolean
  autoplay: boolean
  muted: boolean
  loop: boolean
  preload: ChatVideoPreload
}

interface NormalizedAttachment {
  key: string
  raw: ChatAttachment
  index: number
  name: string
  url: string
  type: ChatAttachmentType
  label: string
  icon: string
  sizeText: string
  download: boolean | string | undefined
  target: string | undefined
  rel: string | undefined
  status: ChatAttachmentStatus
  statusText: string
  progress: number | null
}

const props = withDefaults(
  defineProps<{
    message: unknown
    role?: ChatRole
    contentType?: ChatContentType
    showTime?: boolean
    streaming?: boolean
    status?: ChatMessageStatus | null
    avatar?: string
    name?: string
    showAvatar?: boolean
    showName?: boolean
    linkTarget?: string
    linkRel?: string
    previewable?: boolean
    imageFallbackText?: string
    attachments?: ChatAttachment[]
    attachmentClick?: (payload: ChatAttachmentClickPayload, event: MouseEvent) => boolean | void
    timestamp?: string | number | Date | null
    timeFormatter?: (value: string | number | Date | null | undefined) => string
  }>(),
  {
    role: 'ai',
    contentType: 'auto',
    showTime: true,
    streaming: false,
    status: null,
    avatar: '',
    name: '',
    showAvatar: true,
    showName: true,
    linkTarget: '_blank',
    linkRel: 'noopener noreferrer',
    previewable: true,
    imageFallbackText: '图片加载失败',
    attachments: () => [],
    attachmentClick: undefined,
    timestamp: null,
    timeFormatter: undefined,
  },
)

const emit = defineEmits<{
  (event: 'attachment-click', payload: ChatAttachmentClickPayload, nativeEvent: MouseEvent): void
  (event: 'preview-open', src: string): void
  (event: 'preview-close', src: string): void
  (event: 'image-error', src: string): void
}>()

const statusTextMap: Record<ChatStatusType, string> = {
  thinking: '',
  tool: '',
  loading: '',
  success: '',
  warning: '',
  error: '',
}

const attachmentLabelMap: Record<ChatAttachmentType, string> = {
  pdf: 'PDF',
  word: 'Word',
  excel: 'Excel',
  ppt: 'PPT',
  zip: 'ZIP',
  code: 'Code',
  text: 'Text',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  file: 'File',
}

const attachmentIconMap: Record<ChatAttachmentType, string> = {
  pdf: 'PDF',
  word: 'W',
  excel: 'X',
  ppt: 'P',
  zip: 'ZIP',
  code: '</>',
  text: 'TXT',
  image: 'IMG',
  video: 'VID',
  audio: 'AUD',
  file: 'FILE',
}

const showImagePreview = ref(false)
const imageLoadFailed = ref(false)
const previewRef = ref<HTMLElement | null>(null)

const defaultLinkOpen = markdown.renderer.rules.link_open ?? ((tokens, index, options, _env, self) => {
  return self.renderToken(tokens, index, options)
})

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index]
  const markdownEnv = env && typeof env === 'object' && !Array.isArray(env) ? (env as Record<string, unknown>) : {}
  const linkTarget = typeof markdownEnv.linkTarget === 'string' ? markdownEnv.linkTarget.trim() : ''
  const linkRel = typeof markdownEnv.linkRel === 'string' ? markdownEnv.linkRel.trim() : ''

  if (linkTarget) {
    token.attrSet('target', linkTarget)
  }

  if (linkRel) {
    token.attrSet('rel', linkRel)
  }

  return defaultLinkOpen(tokens, index, options, env, self)
}

const maybeJsonString = (raw: string): boolean => {
  const text = raw.trim()
  if (!text) {
    return false
  }

  if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) {
    return false
  }

  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

const maybeMarkdown = (raw: string): boolean => {
  const markdownPattern = /(#{1,6}\s)|(```)|(^>\s)|(^[-*+]\s)|(\[[^\]]+\]\([^\)]+\))|(\*\*[^*]+\*\*)/m
  return markdownPattern.test(raw)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const normalizeMediaType = (value: unknown): ChatMediaType | null => {
  if (value === 'image' || value === 'video') {
    return value
  }

  return null
}

const detectMediaTypeBySource = (source: string): ChatMediaType | null => {
  const text = source.trim().split(/[?#]/)[0].toLowerCase()
  if (!text) {
    return null
  }

  if (/^data:image\//.test(text) || /\.(apng|avif|bmp|gif|jpe?g|png|svg|webp)$/.test(text)) {
    return 'image'
  }

  if (/^data:video\//.test(text) || /\.(mp4|ogg|ogv|mov|m4v|webm)$/.test(text)) {
    return 'video'
  }

  return null
}

const getMediaSource = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }

  if (!isRecord(value)) {
    return ''
  }

  const source = value.src ?? value.url ?? value.source
  return typeof source === 'string' ? source : ''
}

const getMessageMediaType = (value: unknown): ChatMediaType | null => {
  if (isRecord(value)) {
    const explicitType = normalizeMediaType(value.type) ?? normalizeMediaType(value.mediaType) ?? normalizeMediaType(value.contentType)
    if (explicitType) {
      return explicitType
    }
  }

  return detectMediaTypeBySource(getMediaSource(value))
}

const getAttachmentTypeByName = (name: string): ChatAttachmentType => {
  const extension = name.trim().split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''

  if (extension === 'pdf') return 'pdf'
  if (['doc', 'docx', 'dot', 'dotx', 'rtf'].includes(extension)) return 'word'
  if (['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'csv'].includes(extension)) return 'excel'
  if (['ppt', 'pptx', 'pptm', 'pot', 'potx', 'pps', 'ppsx'].includes(extension)) return 'ppt'
  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'].includes(extension)) return 'zip'
  if (['js', 'ts', 'tsx', 'jsx', 'vue', 'json', 'html', 'css', 'scss', 'less', 'md', 'mdx', 'yaml', 'yml', 'xml', 'sql', 'py', 'java', 'go', 'rs', 'php', 'c', 'cpp', 'h', 'hpp', 'cs', 'sh', 'bat', 'ps1'].includes(extension)) return 'code'
  if (['txt', 'log', 'ini', 'conf'].includes(extension)) return 'text'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'apng', 'bmp', 'ico', 'heic'].includes(extension)) return 'image'
  if (['mp4', 'webm', 'mov', 'm4v', 'ogg', 'ogv', 'avi', 'mkv', 'flv', 'wmv'].includes(extension)) return 'video'
  if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'oga', 'wma'].includes(extension)) return 'audio'

  return 'file'
}

const normalizeAttachmentType = (type: unknown, name: string): ChatAttachmentType => {
  const value = typeof type === 'string' ? type.toLowerCase() : ''
  if (value in attachmentLabelMap) {
    return value as ChatAttachmentType
  }

  return getAttachmentTypeByName(name)
}

const formatAttachmentSize = (size: number | string | undefined): string => {
  if (typeof size === 'string') {
    return size
  }

  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
    return ''
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = size
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

const clampProgress = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Math.min(100, Math.max(0, value))
}

const resolvedContentType = computed<'text' | 'markdown' | 'json' | ChatMediaType>(() => {
  if (props.contentType !== 'auto') {
    return props.contentType
  }

  const mediaType = getMessageMediaType(props.message)
  if (mediaType) {
    return mediaType
  }

  if (typeof props.message !== 'string') {
    return 'json'
  }

  if (maybeJsonString(props.message)) {
    return 'json'
  }

  if (maybeMarkdown(props.message)) {
    return 'markdown'
  }

  return 'text'
})

const jsonText = computed(() => {
  if (typeof props.message === 'string') {
    const text = props.message.trim()
    if (maybeJsonString(text)) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        return text
      }
    }
    return text
  }

  return JSON.stringify(props.message, null, 2)
})

const highlightedJson = computed(() => {
  const content = jsonText.value || '{}'
  return hljs.highlight(content, { language: 'json' }).value
})

const renderedMarkdown = computed(() => {
  return markdown.render(String(props.message ?? ''), {
    linkTarget: props.linkTarget,
    linkRel: props.linkRel,
  })
})

const renderedText = computed(() => {
  return String(props.message ?? '')
})

const resolvedMedia = computed<ResolvedMediaMessage>(() => {
  const raw = props.message
  const source = getMediaSource(raw)
  const media: ChatMediaMessage = isRecord(raw) ? raw : {}

  return {
    src: source,
    alt: typeof media.alt === 'string' ? media.alt : '',
    title: typeof media.title === 'string' ? media.title : undefined,
    poster: typeof media.poster === 'string' ? media.poster : undefined,
    controls: media.controls !== false,
    autoplay: media.autoplay === true,
    muted: media.muted === true,
    loop: media.loop === true,
    preload: media.preload ?? 'metadata',
  }
})

const normalizedAttachments = computed<NormalizedAttachment[]>(() => {
  return props.attachments
    .filter((attachment) => attachment && attachment.name)
    .map((attachment, index) => {
      const name = attachment.name
      const type = normalizeAttachmentType(attachment.type, name)
      const status = attachment.status ?? 'default'
      const progress = clampProgress(attachment.progress)

      return {
        key: `${name}-${attachment.url ?? index}`,
        raw: attachment,
        index,
        name,
        url: attachment.url ?? '',
        type,
        label: attachmentLabelMap[type],
        icon: attachmentIconMap[type],
        sizeText: formatAttachmentSize(attachment.size),
        download: attachment.download,
        target: attachment.target ?? (attachment.url ? '_blank' : undefined),
        rel: attachment.rel ?? (attachment.url ? 'noopener noreferrer' : undefined),
        status,
        statusText: attachment.statusText ?? (status === 'uploading' ? '上传中' : status === 'error' ? '失败' : ''),
        progress,
      }
    })
})

const formatDateTime = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

const formattedTime = computed(() => {
  if (typeof props.timeFormatter === 'function') {
    return props.timeFormatter(props.timestamp)
  }

  if (props.timestamp === null || props.timestamp === undefined || props.timestamp === '') {
    return ''
  }

  return formatDateTime(props.timestamp)
})

const shouldShowTime = computed(() => {
  return props.showTime && Boolean(formattedTime.value)
})

const shouldShowAvatar = computed(() => {
  return props.showAvatar && Boolean(props.avatar || props.name)
})

const shouldShowName = computed(() => {
  return props.showName && Boolean(props.name)
})

const avatarInitial = computed(() => {
  const text = props.name.trim()
  return text ? text.slice(0, 1).toUpperCase() : ''
})

const avatarAlt = computed(() => {
  return props.name ? `${props.name} avatar` : 'avatar'
})

const isMediaContent = computed(() => {
  return resolvedContentType.value === 'image' || resolvedContentType.value === 'video'
})

const shouldShowStreamCursor = computed(() => {
  return props.streaming && !isMediaContent.value
})

const resolvedStatusType = computed<ChatStatusType>(() => {
  return props.status?.type ?? 'thinking'
})

const resolvedStatusLoading = computed(() => {
  return props.status?.loading ?? true
})

const resolvedStatusText = computed(() => {
  const text = props.status?.text?.trim() ?? ''
  return text || statusTextMap[resolvedStatusType.value]
})

const shouldShowStatus = computed(() => {
  if (typeof props.status?.visible === 'boolean') {
    return props.status.visible && Boolean(resolvedStatusText.value)
  }

  return Boolean(props.status && resolvedStatusText.value)
})

const bubbleClasses = computed(() => {
  return [
    `is-${resolvedContentType.value}`,
    {
      'is-streaming': shouldShowStreamCursor.value,
      'has-status': shouldShowStatus.value,
    },
  ]
})

const openImagePreview = () => {
  if (!props.previewable || !resolvedMedia.value.src || imageLoadFailed.value) {
    return
  }

  showImagePreview.value = true
  emit('preview-open', resolvedMedia.value.src)

  nextTick(() => {
    previewRef.value?.focus()
  })
}

const closeImagePreview = () => {
  if (!showImagePreview.value) {
    return
  }

  showImagePreview.value = false
  emit('preview-close', resolvedMedia.value.src)
}

const handleImageError = () => {
  imageLoadFailed.value = true
  showImagePreview.value = false
  emit('image-error', resolvedMedia.value.src)
}

const handleAttachmentClick = (event: MouseEvent, attachment: NormalizedAttachment) => {
  const payload: ChatAttachmentClickPayload = {
    attachment: attachment.raw,
    index: attachment.index,
    name: attachment.name,
    url: attachment.url,
    type: attachment.type,
    label: attachment.label,
    sizeText: attachment.sizeText,
    status: attachment.status,
    statusText: attachment.statusText,
    progress: attachment.progress,
  }
  const shouldContinue = props.attachmentClick?.(payload, event)

  emit('attachment-click', payload, event)

  if (shouldContinue === false || !attachment.url || attachment.status === 'uploading') {
    event.preventDefault()
  }
}

watch(
  () => resolvedMedia.value.src,
  () => {
    imageLoadFailed.value = false
    showImagePreview.value = false
  },
)
</script>

<style scoped>
.scq-chat-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0;
}

.scq-chat-message__body {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
}

.scq-chat-message__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  max-width: min(80%, 680px);
}

.scq-chat-message__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%);
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
}

.scq-chat-message__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scq-chat-message__name {
  max-width: 100%;
  margin: 0 4px 5px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scq-chat-message__time {
  font-size: 12px;
  color: #8c93a3;
  line-height: 1;
}

.scq-chat-message__bubble {
  max-width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  white-space: pre-wrap;
}

.scq-chat-message.is-ai {
  align-items: flex-start;
}

.scq-chat-message.is-user {
  align-items: flex-end;
}

.scq-chat-message.is-user .scq-chat-message__body {
  flex-direction: row-reverse;
}

.scq-chat-message.is-user .scq-chat-message__content {
  align-items: flex-end;
}

.scq-chat-message.is-user .scq-chat-message__avatar {
  border-color: rgba(43, 110, 242, 0.22);
  background: linear-gradient(135deg, #2b6ef2 0%, #22c4e8 100%);
  color: #ffffff;
}

.scq-chat-message.is-user .scq-chat-message__name {
  color: #7b8798;
}

.scq-chat-message.is-ai .scq-chat-message__time {
  margin-left: 4px;
  color: #5d6d8a;
}

.scq-chat-message.is-user .scq-chat-message__time {
  margin-right: 4px;
}

.scq-chat-message.is-ai .scq-chat-message__bubble {
  background: #f8fbff;
  color: #12355b;
  border: 1px solid #8fbaf5;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
}

.scq-chat-message.is-user .scq-chat-message__bubble {
  background: #2b6ef2;
  color: #ffffff;
  border: 1px solid #2b6ef2;
  border-bottom-right-radius: 4px;
}

.scq-chat-message__text {
  margin: 0;
}

.scq-chat-message__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  margin: 0 0 9px;
  padding: 5px 9px 5px 7px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.28);
  background: rgba(219, 234, 254, 0.62);
  color: #1d4ed8;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  vertical-align: top;
}

.scq-chat-message__status-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scq-chat-message__status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
}

.scq-chat-message__status-indicator span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.34;
  animation: scq-chat-message-status 1.2s ease-in-out infinite;
}

.scq-chat-message__status-indicator span:nth-child(2) {
  animation-delay: 0.16s;
}

.scq-chat-message__status-indicator span:nth-child(3) {
  animation-delay: 0.32s;
}

.scq-chat-message__status.is-tool {
  border-color: rgba(20, 184, 166, 0.28);
  background: rgba(204, 251, 241, 0.64);
  color: #0f766e;
}

.scq-chat-message__status.is-loading {
  border-color: rgba(99, 102, 241, 0.26);
  background: rgba(224, 231, 255, 0.66);
  color: #4338ca;
}

.scq-chat-message__status.is-success {
  border-color: rgba(34, 197, 94, 0.28);
  background: rgba(220, 252, 231, 0.68);
  color: #15803d;
}

.scq-chat-message__status.is-warning {
  border-color: rgba(245, 158, 11, 0.32);
  background: rgba(254, 243, 199, 0.72);
  color: #a16207;
}

.scq-chat-message__status.is-error {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(254, 226, 226, 0.74);
  color: #b91c1c;
}

.scq-chat-message.is-user .scq-chat-message__status {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.9);
}

@keyframes scq-chat-message-status {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.34;
  }

  40% {
    transform: translateY(-2px);
    opacity: 1;
  }
}

.scq-chat-message__bubble.is-streaming {
  position: relative;
}

.scq-chat-message__stream-cursor {
  display: inline-block;
  width: 7px;
  height: 1.2em;
  margin-left: 2px;
  border-radius: 999px;
  background: currentColor;
  vertical-align: -0.18em;
  animation: scq-chat-message-cursor 0.9s steps(2, start) infinite;
}

.scq-chat-message__code-block + .scq-chat-message__stream-cursor,
.scq-chat-message__markdown + .scq-chat-message__stream-cursor {
  margin-top: 6px;
}

@keyframes scq-chat-message-cursor {
  0%,
  45% {
    opacity: 1;
  }

  46%,
  100% {
    opacity: 0;
  }
}

.scq-chat-message__bubble.is-image,
.scq-chat-message__bubble.is-video {
  width: fit-content;
  max-width: min(100%, 520px);
  padding: 6px;
  line-height: 0;
  white-space: normal;
}

.scq-chat-message__bubble.is-image.has-status,
.scq-chat-message__bubble.is-video.has-status {
  line-height: 1.4;
}

.scq-chat-message__bubble.has-status .scq-chat-message__media {
  margin-top: 2px;
}

.scq-chat-message__media {
  display: block;
  line-height: 0;
}

.scq-chat-message__image,
.scq-chat-message__video {
  display: block;
  width: 100%;
  max-width: 100%;
  max-height: 360px;
  border-radius: 10px;
  object-fit: contain;
  background: #0f172a;
}

.scq-chat-message__image {
  height: auto;
}

.scq-chat-message__image[role='button'] {
  cursor: zoom-in;
}

.scq-chat-message__image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(280px, 70vw);
  min-height: 112px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.65);
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
}

.scq-chat-message__video {
  min-width: 220px;
}

.scq-chat-message__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  padding: 0 4px;
}

.scq-chat-message__action {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #475569;
  font-size: 12px;
  line-height: 1;
  padding: 5px 9px;
  cursor: pointer;
}

.scq-chat-message__action:hover {
  border-color: rgba(59, 130, 246, 0.35);
  color: #2563eb;
  background: #eff6ff;
}

.scq-chat-message__preview {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  outline: none;
  background: rgba(15, 23, 42, 0.78);
}

.scq-chat-message__preview img {
  display: block;
  max-width: min(100%, 1080px);
  max-height: 88vh;
  border-radius: 10px;
  object-fit: contain;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.scq-chat-message__preview-close {
  position: absolute;
  top: 18px;
  right: 22px;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.scq-chat-message__preview-close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.scq-chat-message__attachments {
  display: grid;
  gap: 8px;
  width: min(100%, 440px);
  margin-top: 8px;
}

.scq-chat-message__attachment {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 58px;
  padding: 9px 11px;
  border: 1px solid #dbe7f5;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f2937;
  text-decoration: none;
  white-space: normal;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.scq-chat-message__attachment[href]:hover {
  border-color: rgba(59, 130, 246, 0.42);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12);
  transform: translateY(-1px);
}

.scq-chat-message__attachment[aria-disabled='true'],
.scq-chat-message__attachment.is-uploading {
  cursor: default;
}

.scq-chat-message__attachment-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #eaf3ff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
}

.scq-chat-message__attachment.is-pdf .scq-chat-message__attachment-icon,
.scq-chat-message__attachment.is-error .scq-chat-message__attachment-icon {
  background: #fee2e2;
  color: #b91c1c;
}

.scq-chat-message__attachment.is-word .scq-chat-message__attachment-icon {
  background: #dbeafe;
  color: #1d4ed8;
}

.scq-chat-message__attachment.is-excel .scq-chat-message__attachment-icon {
  background: #dcfce7;
  color: #15803d;
}

.scq-chat-message__attachment.is-ppt .scq-chat-message__attachment-icon,
.scq-chat-message__attachment.is-zip .scq-chat-message__attachment-icon {
  background: #ffedd5;
  color: #c2410c;
}

.scq-chat-message__attachment.is-code .scq-chat-message__attachment-icon,
.scq-chat-message__attachment.is-text .scq-chat-message__attachment-icon {
  background: #ede9fe;
  color: #6d28d9;
}

.scq-chat-message__attachment-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.scq-chat-message__attachment-name {
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scq-chat-message__attachment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.2;
}

.scq-chat-message__attachment-progress {
  overflow: hidden;
  height: 4px;
  border-radius: 999px;
  background: #e2e8f0;
}

.scq-chat-message__attachment-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #3b82f6;
}

.scq-chat-message.is-user .scq-chat-message__attachment {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.scq-chat-message.is-user .scq-chat-message__attachment-name,
.scq-chat-message.is-user .scq-chat-message__attachment-meta {
  color: rgba(255, 255, 255, 0.92);
}

.scq-chat-message__markdown :deep(p) {
  margin: 0 0 10px;
}

.scq-chat-message__markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.scq-chat-message__table-wrap {
  position: relative;
  width: 100%;
  overflow-x: auto;
  margin: 10px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 60, 67, 0.42) transparent;
}

.scq-chat-message__table-wrap::before,
.scq-chat-message__table-wrap::after {
  content: '';
  position: sticky;
  top: 0;
  bottom: 0;
  width: 18px;
  pointer-events: none;
  z-index: 1;
}

.scq-chat-message__table-wrap::before {
  left: 0;
  float: left;
  margin-right: -18px;
  background: linear-gradient(90deg, rgba(248, 251, 255, 0.95) 0%, rgba(248, 251, 255, 0) 100%);
}

.scq-chat-message__table-wrap::after {
  right: 0;
  float: right;
  margin-left: -18px;
  background: linear-gradient(270deg, rgba(248, 251, 255, 0.95) 0%, rgba(248, 251, 255, 0) 100%);
}

.scq-chat-message__table-wrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scq-chat-message__table-wrap::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background: rgba(60, 60, 67, 0.38);
  background-clip: content-box;
}

.scq-chat-message__table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.scq-chat-message__markdown :deep(table) {
  width: max-content;
  min-width: 100%;
  table-layout: auto;
  border-collapse: collapse;
  margin: 0;
  background: #ffffff;
}

.scq-chat-message__markdown :deep(th),
.scq-chat-message__markdown :deep(td) {
  min-width: 120px;
  max-width: 320px;
  padding: 10px 14px;
  border: 1px solid #dbe4ee;
  text-align: left;
  vertical-align: top;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.scq-chat-message__markdown :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
  color: #334155;
}

.scq-chat-message__markdown :deep(td) {
  color: #334155;
}

.scq-chat-message__markdown :deep(tbody tr:nth-child(even)) {
  background: #f8fafc;
}

.scq-chat-message__markdown :deep(code:not(.hljs)) {
  font-family: 'Consolas', 'SFMono-Regular', Menlo, Monaco, monospace;
  font-size: 13px;
  border-radius: 6px;
  padding: 2px 6px;
  background: rgba(17, 24, 39, 0.08);
}

.scq-chat-message.is-ai .scq-chat-message__markdown :deep(code:not(.hljs)) {
  background: #eaf3ff;
}

.scq-chat-message__code-block {
  margin: 0;
  border-radius: 10px;
  padding: 10px 12px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 60, 67, 0.42) transparent;
  background: #0f172a;
  color: #e2e8f0;
}

.scq-chat-message__code-block::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scq-chat-message__code-block::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background: rgba(226, 232, 240, 0.45);
  background-clip: content-box;
}

.scq-chat-message__code-block::-webkit-scrollbar-track {
  background: transparent;
}

@media (hover: hover) {
  .scq-chat-message__table-wrap::-webkit-scrollbar-thumb {
    background: rgba(60, 60, 67, 0.52);
    background-clip: content-box;
  }

  .scq-chat-message__code-block::-webkit-scrollbar-thumb {
    background: rgba(226, 232, 240, 0.62);
    background-clip: content-box;
  }
}

.scq-chat-message__code-block code {
  font-family: 'Consolas', 'SFMono-Regular', Menlo, Monaco, monospace;
  font-size: 12px;
  white-space: pre;
}

.scq-chat-message.is-user .scq-chat-message__markdown :deep(a) {
  color: #dbe8ff;
}

.scq-chat-message.is-ai .scq-chat-message__markdown :deep(a) {
  color: #2454c6;
}

.scq-chat-message :deep(.hljs-keyword),
.scq-chat-message :deep(.hljs-string),
.scq-chat-message :deep(.hljs-number),
.scq-chat-message :deep(.hljs-title),
.scq-chat-message :deep(.hljs-attr),
.scq-chat-message :deep(.hljs-literal) {
  color: inherit;
}

.scq-chat-message.is-ai :deep(.hljs-keyword),
.scq-chat-message.is-ai :deep(.hljs-attr) {
  color: #7c3aed;
}

.scq-chat-message.is-ai :deep(.hljs-string) {
  color: #0f766e;
}

.scq-chat-message.is-ai :deep(.hljs-number),
.scq-chat-message.is-ai :deep(.hljs-literal) {
  color: #c2410c;
}

.scq-chat-message.is-user :deep(.hljs-keyword),
.scq-chat-message.is-user :deep(.hljs-attr) {
  color: #c4b5fd;
}

.scq-chat-message.is-user :deep(.hljs-string) {
  color: #5eead4;
}

.scq-chat-message.is-user :deep(.hljs-number),
.scq-chat-message.is-user :deep(.hljs-literal) {
  color: #fdba74;
}
</style>
