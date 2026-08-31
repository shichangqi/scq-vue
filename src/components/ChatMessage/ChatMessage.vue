<template>
  <div class="scq-chat-message" :class="`is-${role}`" @click="handleCodeCopyClick">
    <div v-if="shouldShowTime" class="scq-chat-message__time">
      {{ formattedTime }}
    </div>

    <div class="scq-chat-message__body">
      <div v-if="shouldShowAvatar" class="scq-chat-message__avatar" :title="avatarTitle">
        <img v-if="avatar" :src="avatar" :alt="avatarAlt" />
        <span v-else>{{ avatarInitial }}</span>
      </div>

      <div class="scq-chat-message__content">
        <div v-if="shouldShowName" class="scq-chat-message__name">{{ name }}</div>

        <div v-if="shouldShowStatus" class="scq-chat-message__status" :class="`is-${resolvedStatusType}`" role="status">
          <span class="scq-chat-message__status-text">{{ resolvedStatusText }}</span>
          <span v-if="resolvedStatusLoading" class="scq-chat-message__status-indicator" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>

        <div v-if="shouldShowBubble" class="scq-chat-message__bubble" :class="bubbleClasses">
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
              {{ videoUnsupportedText }}
            </video>
            <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
          </div>

          <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
        </div>

        <div v-if="$slots.interaction" class="scq-chat-message__interaction">
          <slot name="interaction" />
        </div>

        <div v-if="normalizedAttachments.length" class="scq-chat-message__attachments">
          <a
            v-for="attachment in normalizedAttachments"
            :key="attachment.key"
            class="scq-chat-message__attachment"
            :class="[`is-${attachment.type}`, `is-${attachment.status}`]"
            :href="attachment.disabled ? undefined : attachment.url"
            :target="attachment.disabled ? undefined : attachment.target"
            :rel="attachment.disabled ? undefined : attachment.rel"
            :download="attachment.disabled ? undefined : attachment.download"
            :aria-disabled="attachment.disabled ? 'true' : undefined"
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
        class="scq-chat-message__preview"
        role="dialog"
        aria-modal="true"
        :aria-label="imagePreviewLabel"
        tabindex="-1"
        @click="closeImagePreview"
        @keydown="handlePreviewKeydown"
      >
        <button
          ref="previewCloseRef"
          type="button"
          class="scq-chat-message__preview-close"
          :aria-label="previewCloseLabel"
          @click.stop="closeImagePreview"
        >×</button>
        <img :src="previewSource" :alt="resolvedMedia.alt" @click.stop />
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
import pythonLang from 'highlight.js/lib/languages/python'
import javaLang from 'highlight.js/lib/languages/java'
import csharpLang from 'highlight.js/lib/languages/csharp'
import cppLang from 'highlight.js/lib/languages/cpp'
import goLang from 'highlight.js/lib/languages/go'
import rustLang from 'highlight.js/lib/languages/rust'
import phpLang from 'highlight.js/lib/languages/php'
import sqlLang from 'highlight.js/lib/languages/sql'
import yamlLang from 'highlight.js/lib/languages/yaml'
import markdownLang from 'highlight.js/lib/languages/markdown'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

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
hljs.registerLanguage('python', pythonLang)
hljs.registerLanguage('java', javaLang)
hljs.registerLanguage('csharp', csharpLang)
hljs.registerLanguage('cpp', cppLang)
hljs.registerLanguage('go', goLang)
hljs.registerLanguage('rust', rustLang)
hljs.registerLanguage('php', phpLang)
hljs.registerLanguage('sql', sqlLang)
hljs.registerLanguage('yaml', yamlLang)
hljs.registerLanguage('markdown', markdownLang)

export type ChatRole = 'ai' | 'user'
export type ChatMediaType = 'image' | 'video'
export type ChatContentType = 'auto' | 'text' | 'markdown' | 'json' | ChatMediaType
export type ChatStatusType = 'thinking' | 'tool' | 'loading' | 'success' | 'warning' | 'error'
export type ChatStatusTexts = Partial<Record<ChatStatusType, string>>
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
  id?: string | number
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
  disabled: boolean
}

const props = withDefaults(
  defineProps<{
    message: unknown
    role?: ChatRole
    contentType?: ChatContentType
    markdownBreaks?: boolean
    showTime?: boolean
    status?: ChatMessageStatus | null
    statusTexts?: ChatStatusTexts
    avatar?: string
    avatarText?: string
    avatarAlt?: string
    name?: string
    showAvatar?: boolean
    showName?: boolean
    linkTarget?: string
    linkRel?: string
    previewable?: boolean
    imageFallbackText?: string
    videoUnsupportedText?: string
    imagePreviewLabel?: string
    previewCloseLabel?: string
    codeCopyText?: string
    codeCopiedText?: string
    codeCopyFailedText?: string
    attachments?: ChatAttachment[]
    attachmentClick?: (payload: ChatAttachmentClickPayload, event: MouseEvent) => boolean | void
    timestamp?: string | number | Date | null
    timeFormatter?: (value: string | number | Date | null | undefined) => string
  }>(),
  {
    role: 'ai',
    contentType: 'auto',
    markdownBreaks: true,
    showTime: true,
    status: null,
    statusTexts: () => ({}),
    avatar: '',
    avatarText: '',
    avatarAlt: '',
    name: '',
    showAvatar: true,
    showName: true,
    linkTarget: '_blank',
    linkRel: 'noopener noreferrer',
    previewable: true,
    imageFallbackText: '图片加载失败',
    videoUnsupportedText: '当前浏览器不支持视频播放。',
    imagePreviewLabel: '图片预览',
    previewCloseLabel: '关闭预览',
    codeCopyText: '复制',
    codeCopiedText: '已复制',
    codeCopyFailedText: '复制失败',
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

const statusTextDefaults: Record<ChatStatusType, string> = {
  thinking: '正在思考',
  tool: '正在调用工具',
  loading: '正在处理中',
  success: '处理完成',
  warning: '请注意',
  error: '处理失败',
}

const loadingStatusTypes = new Set<ChatStatusType>(['thinking', 'tool', 'loading'])

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

const codeLanguageAliasMap: Record<string, string> = {
  'c#': 'csharp',
  cs: 'csharp',
  c: 'cpp',
  'c++': 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  golang: 'go',
  py: 'python',
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  'shell-session': 'bash',
  console: 'bash',
  terminal: 'bash',
  powershell: 'bash',
  pwsh: 'bash',
  ps1: 'bash',
  yml: 'yaml',
  jsonc: 'json',
  md: 'markdown',
  vue: 'xml',
  sfc: 'xml',
  jsx: 'javascript',
  tsx: 'typescript',
}

const codeLanguageClassAliasMap: Record<string, string> = {
  sfc: 'vue',
}

const normalizeCodeLanguage = (language: string): string => {
  const name = language.trim().toLowerCase().split(/\s+/)[0].replace(/^language-/, '')
  return codeLanguageAliasMap[name] ?? name
}

const normalizeCodeLanguageClass = (language: string): string => {
  const name = language.trim().toLowerCase().split(/\s+/)[0].replace(/^language-/, '')
  return codeLanguageClassAliasMap[name] ?? name
}

const getCodeLanguageClass = (language: string): string => {
  return language.replace(/[^a-z0-9_-]/g, '')
}

const escapeHtml = (raw: string): string => {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const highlightCode = (code: string, language: string, copyText: string): string => {
  if (!code.trim()) {
    return ''
  }

  const normalizedLanguage = normalizeCodeLanguage(language)
  const languageClass = getCodeLanguageClass(normalizeCodeLanguageClass(language) || normalizedLanguage)
  const displayLanguage = getCodeLanguageClass(normalizeCodeLanguageClass(language) || normalizedLanguage || 'text') || 'text'
  const rawCode = escapeHtml(code)
  const copyLabel = escapeHtml(copyText)

  if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
    const highlighted = hljs.highlight(code, { language: normalizedLanguage }).value
    return `<pre class="scq-chat-message__code-block"><div class="scq-chat-message__code-header"><span>${displayLanguage}</span><button type="button" class="scq-chat-message__code-copy" data-code="${rawCode}" aria-label="${copyLabel}">${copyLabel}</button></div><code class="hljs scq-chat-message__code-body language-${languageClass}">${highlighted}</code></pre>`
  }

  const highlighted = hljs.highlightAuto(code).value
  return `<pre class="scq-chat-message__code-block"><div class="scq-chat-message__code-header"><span>${displayLanguage}</span><button type="button" class="scq-chat-message__code-copy" data-code="${rawCode}" aria-label="${copyLabel}">${copyLabel}</button></div><code class="hljs scq-chat-message__code-body">${highlighted}</code></pre>`
}

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
})

markdown.renderer.rules.table_open = () => '<div class="scq-chat-message__table-wrap"><table>'
markdown.renderer.rules.table_close = () => '</table></div>'

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

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

let previewLockCount = 0
let originalBodyOverflow = ''

const lockPageScroll = () => {
  if (typeof document === 'undefined') {
    return
  }

  if (previewLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  previewLockCount += 1
}

const unlockPageScroll = () => {
  if (typeof document === 'undefined' || previewLockCount === 0) {
    return
  }

  previewLockCount -= 1
  if (previewLockCount === 0) {
    document.body.style.overflow = originalBodyOverflow
  }
}

const showImagePreview = ref(false)
const imageLoadFailed = ref(false)
const previewSource = ref('')
const previewCloseRef = ref<HTMLButtonElement | null>(null)
const previewTriggerRef = ref<HTMLElement | null>(null)
const previewScrollLocked = ref(false)
const codeCopyResetTimers = new Map<HTMLButtonElement, number>()

const maybeJsonString = (raw: string): boolean => {
  const text = raw.trim()
  if (!text || !((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) {
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
  const markdownPattern = /(^[ \t]{0,3}#{1,6}\s)|(```)|(^>\s)|(^[-*+]\s)|(^\|.+\|\s*$)|(\[[^\]]+\]\([^\)]+\))|(\*\*[^*]+\*\*)/m
  return markdownPattern.test(raw)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const safeJsonStringify = (value: unknown): string => {
  const ancestors: object[] = []

  try {
    return JSON.stringify(value, function (_key, currentValue: unknown) {
      if (typeof currentValue === 'bigint') {
        return currentValue.toString()
      }

      if (typeof currentValue !== 'object' || currentValue === null) {
        return currentValue
      }

      while (ancestors.length && ancestors[ancestors.length - 1] !== this) {
        ancestors.pop()
      }

      if (ancestors.includes(currentValue)) {
        return '[Circular]'
      }

      ancestors.push(currentValue)
      return currentValue
    }, 2) ?? ''
  } catch {
    try {
      return String(value ?? '')
    } catch {
      return ''
    }
  }
}

const normalizeMediaType = (value: unknown): ChatMediaType | null => {
  return value === 'image' || value === 'video' ? value : null
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
  return Object.hasOwn(attachmentLabelMap, value) ? value as ChatAttachmentType : getAttachmentTypeByName(name)
}

const normalizeAttachmentStatus = (status: unknown): ChatAttachmentStatus => {
  return status === 'uploading' || status === 'success' || status === 'error' ? status : 'default'
}

const normalizeAttachmentUrl = (url: unknown): string => {
  if (typeof url !== 'string') {
    return ''
  }

  const value = url.trim()
  const protocolProbe = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, '')
  const scheme = protocolProbe.match(/^([a-z][a-z\d+.-]*):/i)?.[1].toLowerCase()
  if (!scheme) {
    return value
  }

  return scheme === 'http' || scheme === 'https' || scheme === 'blob' ? value : ''
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
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null
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

  return maybeMarkdown(props.message) ? 'markdown' : 'text'
})

const jsonText = computed(() => {
  if (typeof props.message !== 'string') {
    return safeJsonStringify(props.message)
  }

  const text = props.message.trim()
  if (!maybeJsonString(text)) {
    return text
  }

  try {
    return safeJsonStringify(JSON.parse(text))
  } catch {
    return text
  }
})

const highlightedJson = computed(() => {
  return hljs.highlight(jsonText.value || '{}', { language: 'json' }).value
})

const rawMarkdownContent = computed(() => {
  return String(props.message ?? '').replace(/\r\n?/g, '\n')
})

const renderedMarkdown = computed(() => {
  markdown.set({
    breaks: props.markdownBreaks,
    highlight: (code: string, language: string) => highlightCode(code, language, props.codeCopyText),
  })

  return markdown.render(rawMarkdownContent.value, {
    linkTarget: props.linkTarget,
    linkRel: props.linkRel,
  })
})

const renderedText = computed(() => String(props.message ?? ''))

const hasMessageContent = computed(() => {
  const message = props.message
  if (message === null || message === undefined) return false
  if (typeof message === 'string') return message.trim().length > 0
  if (Array.isArray(message)) return message.length > 0
  if (isRecord(message)) return Object.keys(message).length > 0
  return true
})

const resolvedMedia = computed<ResolvedMediaMessage>(() => {
  const raw = props.message
  const media: ChatMediaMessage = isRecord(raw) ? raw : {}
  const preload = media.preload === 'auto' || media.preload === 'none' ? media.preload : 'metadata'

  return {
    src: getMediaSource(raw),
    alt: typeof media.alt === 'string' ? media.alt : '',
    title: typeof media.title === 'string' ? media.title : undefined,
    poster: typeof media.poster === 'string' ? media.poster : undefined,
    controls: media.controls !== false,
    autoplay: media.autoplay === true,
    muted: media.muted === true,
    loop: media.loop === true,
    preload,
  }
})

const normalizedAttachments = computed<NormalizedAttachment[]>(() => {
  return props.attachments
    .filter((attachment) => attachment && attachment.name)
    .map((attachment, index) => {
      const name = String(attachment.name)
      const type = normalizeAttachmentType(attachment.type, name)
      const status = normalizeAttachmentStatus(attachment.status)
      const progress = clampProgress(attachment.progress)
      const url = normalizeAttachmentUrl(attachment.url)
      const disabled = !url || status === 'uploading'
      const fallbackKey = `${name}-${url}-${index}`

      return {
        key: attachment.id === undefined ? fallbackKey : String(attachment.id),
        raw: attachment,
        index,
        name,
        url,
        type,
        label: attachmentLabelMap[type],
        icon: attachmentIconMap[type],
        sizeText: formatAttachmentSize(attachment.size),
        download: attachment.download,
        target: url ? attachment.target ?? '_blank' : undefined,
        rel: url ? attachment.rel ?? 'noopener noreferrer' : undefined,
        status,
        statusText: attachment.statusText ?? (status === 'uploading' ? '上传中' : status === 'error' ? '失败' : ''),
        progress,
        disabled,
      }
    })
})

const formatDateTime = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.format(date)
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

const shouldShowTime = computed(() => props.showTime && Boolean(formattedTime.value))
const resolvedAvatarText = computed(() => props.avatarText.trim() || props.name.trim())
const shouldShowAvatar = computed(() => props.showAvatar && Boolean(props.avatar || resolvedAvatarText.value))
const shouldShowName = computed(() => props.showName && Boolean(props.name))
const avatarInitial = computed(() => resolvedAvatarText.value.slice(0, 1).toUpperCase())
const avatarAlt = computed(() => props.avatarAlt.trim() || (resolvedAvatarText.value ? `${resolvedAvatarText.value} avatar` : 'avatar'))
const avatarTitle = computed(() => resolvedAvatarText.value || undefined)

const resolvedStatusType = computed<ChatStatusType>(() => props.status?.type ?? 'thinking')

const resolvedStatusLoading = computed(() => {
  return props.status?.loading ?? loadingStatusTypes.has(resolvedStatusType.value)
})

const resolvedStatusText = computed(() => {
  return props.status?.text?.trim() || props.statusTexts[resolvedStatusType.value] || statusTextDefaults[resolvedStatusType.value]
})

const shouldShowStatus = computed(() => {
  if (hasMessageContent.value) {
    return false
  }

  if (typeof props.status?.visible === 'boolean') {
    return props.status.visible && Boolean(resolvedStatusText.value)
  }

  return Boolean(props.status && resolvedStatusText.value)
})

const shouldShowBubble = computed(() => hasMessageContent.value || !shouldShowStatus.value)
const bubbleClasses = computed(() => `is-${resolvedContentType.value}`)

const openImagePreview = (event?: Event) => {
  if (!props.previewable || !resolvedMedia.value.src || imageLoadFailed.value || showImagePreview.value) {
    return
  }

  previewTriggerRef.value = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null
  previewSource.value = resolvedMedia.value.src
  showImagePreview.value = true
  lockPageScroll()
  previewScrollLocked.value = true
  emit('preview-open', previewSource.value)

  nextTick(() => previewCloseRef.value?.focus())
}

const closeImagePreview = () => {
  if (!showImagePreview.value) {
    return
  }

  const source = previewSource.value
  showImagePreview.value = false
  if (previewScrollLocked.value) {
    unlockPageScroll()
    previewScrollLocked.value = false
  }
  emit('preview-close', source)

  nextTick(() => previewTriggerRef.value?.focus())
}

const handlePreviewKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeImagePreview()
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    previewCloseRef.value?.focus()
  }
}

const handleImageError = () => {
  if (showImagePreview.value) {
    closeImagePreview()
  }
  imageLoadFailed.value = true
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
  if (shouldContinue === false || attachment.disabled) {
    event.preventDefault()
  }
}

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)

  try {
    textarea.select()
    if (!document.execCommand('copy')) {
      throw new Error('Copy command failed')
    }
  } finally {
    document.body.removeChild(textarea)
  }
}

const setCodeCopyFeedback = (target: HTMLButtonElement, text: string) => {
  const previousTimer = codeCopyResetTimers.get(target)
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer)
  }

  target.textContent = text
  const timer = window.setTimeout(() => {
    target.textContent = props.codeCopyText
    codeCopyResetTimers.delete(target)
  }, 1200)
  codeCopyResetTimers.set(target, timer)
}

const handleCodeCopyClick = (event: MouseEvent) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.scq-chat-message__code-copy') : null
  if (!target || !target.dataset.code) {
    return
  }

  copyText(target.dataset.code)
    .then(() => setCodeCopyFeedback(target, props.codeCopiedText))
    .catch(() => setCodeCopyFeedback(target, props.codeCopyFailedText))
}

watch(
  () => resolvedMedia.value.src,
  () => {
    if (showImagePreview.value) {
      closeImagePreview()
    }
    imageLoadFailed.value = false
  },
)

onBeforeUnmount(() => {
  if (previewScrollLocked.value) {
    unlockPageScroll()
  }
  codeCopyResetTimers.forEach((timer) => window.clearTimeout(timer))
  codeCopyResetTimers.clear()
})
</script>