<template>
  <div class="scq-chat-message" :class="`is-${role}`">
    <div v-if="shouldShowTime" class="scq-chat-message__time">
      {{ formattedTime }}
    </div>

    <div class="scq-chat-message__bubble" :class="`is-${resolvedContentType}`">
      <div
        v-if="resolvedContentType === 'markdown'"
        class="scq-chat-message__markdown"
        v-html="renderedMarkdown"
      ></div>

      <pre v-else-if="resolvedContentType === 'json'" class="scq-chat-message__code-block">
        <code class="hljs language-json" v-html="highlightedJson"></code>
      </pre>

      <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
    </div>
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
import { computed } from 'vue'

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

type ChatRole = 'ai' | 'user'
type ChatContentType = 'auto' | 'text' | 'markdown' | 'json'

const props = withDefaults(
  defineProps<{
    message: unknown
    role?: ChatRole
    contentType?: ChatContentType
    showTime?: boolean
    timestamp?: string | number | Date | null
    timeFormatter?: (value: string | number | Date | null | undefined) => string
  }>(),
  {
    role: 'ai',
    contentType: 'auto',
    showTime: true,
    timestamp: null,
    timeFormatter: undefined,
  },
)

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

const resolvedContentType = computed<'text' | 'markdown' | 'json'>(() => {
  if (props.contentType !== 'auto') {
    return props.contentType
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
  return markdown.render(String(props.message ?? ''))
})

const renderedText = computed(() => {
  return String(props.message ?? '')
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
</script>

<style scoped>
.scq-chat-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0;
}

.scq-chat-message__time {
  font-size: 12px;
  color: #8c93a3;
  line-height: 1;
}

.scq-chat-message__bubble {
  max-width: min(80%, 680px);
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
  scrollbar-color: rgba(148, 163, 184, 0.55) transparent;
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
  height: 8px;
}

.scq-chat-message__table-wrap::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.5);
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
  background: #0f172a;
  color: #e2e8f0;
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
