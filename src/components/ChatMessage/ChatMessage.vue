<template>
  <div class="scq-chat-message" :class="[`is-${role}`, { 'has-selection': selection }]" :style="themeStyle" role="group" :aria-label="chatText('message')" :aria-busy="isGenerating || undefined" @click="handleCodeCopyClick">
    <div v-if="shouldShowTime" class="scq-chat-message__time">
      {{ formattedTime }}
    </div>

    <div class="scq-chat-message__body">
      <div v-if="shouldShowAvatar" class="scq-chat-message__avatar" :title="avatarTitle">
        <img v-if="avatar" :src="avatar" :alt="avatarAlt" />
        <span v-else>{{ avatarInitial }}</span>
      </div>

      <div class="scq-chat-message__content" :class="{ 'has-selection': selection }">
        <div v-if="shouldShowName" class="scq-chat-message__name">{{ name }}</div>

        <div v-if="shouldShowStatus" class="scq-chat-message__status" :class="`is-${resolvedStatusType}`" role="status" aria-live="polite" aria-atomic="true">
          <span class="scq-chat-message__status-text">{{ resolvedStatusText }}</span>
          <span v-if="resolvedStatusLoading" class="scq-chat-message__status-indicator" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>

        <div v-if="normalizedParts.length" class="scq-chat-message__parts" aria-live="off">
          <div v-for="(part, index) in normalizedParts" :key="part.id" class="scq-chat-message__part" :data-part-id="part.id">
            <ChatMessageContent
              v-if="part.type !== 'custom'"
              :message="part.content"
              :content-type="part.type"
              :role="role"
              :show-avatar="false"
              :show-name="false"
              :show-time="false"
              :markdown-breaks="markdownBreaks"
              :previewable="previewable"
              :image-preview-sources="partImageSources"
              :image-preview-label="imagePreviewLabel"
              :preview-close-label="previewCloseLabel"
              :image-fallback-text="imageFallbackText"
              :code-copy-text="codeCopyText"
              :code-copied-text="codeCopiedText"
              :code-copy-failed-text="codeCopyFailedText"
              :syntax-highlight="syntaxHighlight"
              :disabled="isDisabled"
              :texts="texts"
              :link-target="linkTarget"
              :link-rel="linkRel"
              @preview-open="emit('preview-open', $event)"
              @preview-close="emit('preview-close', $event)"
              @image-error="emit('image-error', $event)"
            />
            <slot v-else name="part" :part="part" :index="index">
              <div class="scq-chat-message__text">{{ part.text || chatText('customContent') }}</div>
            </slot>
          </div>
        </div>

        <div v-else-if="shouldShowBubble" class="scq-chat-message__bubble" :class="bubbleClasses" aria-live="off">
          <div
            v-if="resolvedContentType === 'markdown'"
            class="scq-chat-message__markdown"
            v-html="renderedMarkdown"
          ></div>

          <div v-else-if="resolvedContentType === 'json'" class="scq-chat-message__json" v-html="highlightedJson"></div>

          <div v-else-if="resolvedContentType === 'image'" class="scq-chat-message__media">
            <Image
              v-if="resolvedMedia.src"
              ref="mediaImageRef"
              class="scq-chat-message__image"
              :src="resolvedMedia.src"
              :alt="resolvedMedia.alt"
              :title="resolvedMedia.title"
              :width="resolvedMedia.width"
              :height="resolvedMedia.height"
              fit="contain"
              :preview="previewable && !isDisabled"
              :preview-src-list="previewable && !isDisabled ? mediaPreviewSources : []"
              :initial-index="mediaPreviewIndex"
              :preview-label="imagePreviewLabel"
              :preview-close-label="previewCloseLabel"
              preview-wheel-zoom
              preview-pinch-zoom
              preview-double-click-reset
              @show="openImagePreview"
              @switch="handlePreviewSwitch"
              @close="closeImagePreview"
              @load="imageLoadFailed = false"
              @error="handleImageError"
            >
              <template #error>{{ imageFallbackText }}</template>
            </Image>
            <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
            <button v-if="imageLoadFailed" type="button" class="scq-chat-message__media-retry" :disabled="isDisabled" @click="retryMessageImage">
              <Icon name="refresh" :size="CHAT_MESSAGE_DEFAULTS.actionIconSize" />
              {{ actionTextDefaults.retry }}
            </button>
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

        <section v-if="normalizedSources.length" class="scq-chat-message__sources" :aria-label="chatText('sources')">
          <strong class="scq-chat-message__sources-title">{{ chatText('sources') }}</strong>
          <ol>
            <li v-for="(source, index) in normalizedSources" :key="source.key" class="scq-chat-message__source">
              <slot name="source" :source="source.raw" :index="index">
                <a v-if="source.url" :href="isDisabled ? undefined : source.url" :target="linkTarget" :rel="source.rel" :aria-disabled="isDisabled || undefined" @click="handleSourceClick($event, source.raw, index)">{{ source.raw.title }}</a>
                <button v-else type="button" :disabled="isDisabled" @click="handleSourceClick($event, source.raw, index)">{{ source.raw.title }}</button>
                <span v-if="source.raw.page !== undefined" class="scq-chat-message__source-page">{{ chatText('page').replace('{page}', String(source.raw.page)) }}</span>
                <details v-if="source.raw.excerpt" class="scq-chat-message__source-detail"><summary>{{ chatText('sourceDetail') }}</summary><p>{{ source.raw.excerpt }}</p></details>
              </slot>
            </li>
          </ol>
        </section>

        <section
          v-if="selection"
          class="scq-chat-message__selection"
          :class="[`is-${selectionMode}`, `is-${selectionStatus}`]"
          :aria-label="selectionAriaLabel"
          :aria-describedby="selectionHintText ? selectionHintId : undefined"
          :aria-busy="selectionStatus === 'submitting' || undefined"
        >
          <slot name="selection-title" :selection="selection">
            <strong v-if="selection.title" class="scq-chat-message__selection-title">
              {{ selection.title }}
            </strong>
          </slot>

          <p v-if="selectionStatus === 'submitted'" class="scq-chat-message__selection-summary" role="status">
            {{ selectionSummaryText }}
          </p>

          <div
            class="scq-chat-message__selection-options"
            role="group"
          >
            <button
              v-for="(option, index) in selectionOptions"
              :key="getSelectionOptionKey(option, index)"
              type="button"
              class="scq-chat-message__selection-option"
              :class="{ 'is-selected': isSelectionOptionSelected(option) }"
              :disabled="isSelectionOptionDisabled(option)"
              :aria-pressed="isSelectionOptionSelected(option)"
              @click="handleSelectionOptionClick(option)"
            >
              <slot
                name="selection-option"
                :option="option"
                :index="index"
                :selected="isSelectionOptionSelected(option)"
                :disabled="isSelectionOptionDisabled(option)"
              >
                <span class="scq-chat-message__selection-copy">
                  <b>{{ option.label }}</b>
                  <small v-if="option.description">{{ option.description }}</small>
                </span>
                <Icon :name="isSelectionOptionSelected(option) ? 'check' : 'chevronRight'" :size="15" />
              </slot>
            </button>

            <div
              v-if="selectionAllowsOther"
              class="scq-chat-message__selection-option is-other"
              :class="{ 'is-selected': otherSelectionSelected, 'is-disabled': isOtherSelectionDisabled }"
            >
              <button
                type="button"
                class="scq-chat-message__selection-other-toggle"
                :disabled="isOtherSelectionDisabled"
                :aria-pressed="otherSelectionSelected"
                @click="toggleOtherSelection"
              >
                <span class="scq-chat-message__selection-copy">
                  <b>{{ selection?.otherLabel || chatText('other') }}</b>
                </span>
                <Icon :name="otherSelectionSelected ? 'check' : 'chevronRight'" :size="15" />
              </button>
              <input
                class="scq-chat-message__selection-other-input"
                type="text"
                :value="otherSelectionText"
                :placeholder="selection?.otherPlaceholder || chatText('otherPlaceholder')"
                :maxlength="selectionOtherMaxlength"
                :disabled="isOtherSelectionDisabled"
                :aria-label="selection?.otherLabel || chatText('other')"
                :aria-describedby="selectionHintText ? selectionHintId : undefined"
                @focus="handleOtherSelectionFocus"
                @input="handleOtherSelectionInput"
              />
            </div>
          </div>

          <div v-if="shouldShowSelectionActions" class="scq-chat-message__selection-actions">
            <slot
              name="selection-actions"
              :selection="selection"
              :values="getSelectionValues()"
              :disabled="isSelectionConfirmDisabled"
              :loading="selectionStatus === 'submitting'"
              :status="selectionStatus"
              :confirm="confirmSelection"
            >
              <span class="scq-chat-message__selection-count">{{ selectedCountText }}</span>
              <button
                type="button"
                class="scq-chat-message__selection-confirm"
                :disabled="isSelectionConfirmDisabled"
                :title="selectionValidationText || undefined"
                @click="confirmSelection"
              >
                {{ selectionConfirmText }}
              </button>
            </slot>
          </div>

          <small v-if="selectionHintText" :id="selectionHintId" class="scq-chat-message__selection-hint" role="status">
            {{ selectionHintText }}
          </small>
          <small v-if="selectionStatus === 'error'" class="scq-chat-message__selection-error" role="alert">
            {{ selectionErrorText }}
          </small>
          <small v-if="selectionStatus === 'expired'" class="scq-chat-message__selection-status">
            {{ selection.expiredText || chatText('expired') }}
          </small>
          <button
            v-if="selectionStatus === 'expired' && selection.refreshable"
            type="button"
            class="scq-chat-message__selection-refresh"
            :disabled="isDisabled || selectionDisabled || selection.disabled"
            @click="emit('selection-refresh', selection)"
          >
            <Icon name="refresh" :size="15" />
            {{ selection.refreshText || selectionTextDefaults.refresh }}
          </button>
        </section>

        <div v-if="$slots.interaction" class="scq-chat-message__interaction">
          <slot name="interaction" />
        </div>

        <div v-if="normalizedAttachments.length" class="scq-chat-message__attachments">
          <ChatMessageAttachment
            v-for="attachment in normalizedAttachments"
            :key="attachment.key"
            :item="attachment"
            :actions="attachmentActions"
            :handler="attachmentActionHandler"
            :labels="attachmentActionTexts"
            :disabled="isDisabled"
            @click="handleAttachmentClick($event, attachment)"
            @action="emit('attachment-action', $event)"
            @success="emit('attachment-action-success', $event)"
            @error="(error, payload) => emit('attachment-action-error', error, payload)"
          />
        </div>

        <div v-if="$slots.actions || normalizedActions.length" class="scq-chat-message__actions">
          <slot name="actions" :actions="normalizedActions" :run="handleMessageAction" :feedback="resolvedFeedback" :pending="activeAction">
            <button
              v-for="action in normalizedActions"
              :key="action.name"
              type="button"
              class="scq-chat-message__action is-default"
              :class="{ 'is-selected': resolvedFeedback === action.name, 'is-stop': action.name === 'stop' }"
              :data-action="action.name"
              :disabled="isMessageActionDisabled(action)"
              :aria-label="getActionLabel(action)"
              :title="getActionLabel(action)"
              :aria-pressed="isFeedbackAction(action.name) ? resolvedFeedback === action.name : undefined"
              :aria-busy="isMessageActionLoading(action) || undefined"
              @click="handleMessageAction(action.name)"
            >
              <Icon
                class="scq-chat-message__action-icon"
                :class="{ 'is-loading': isMessageActionLoading(action), 'is-dislike': action.name === 'dislike' && !isMessageActionLoading(action) }"
                :name="isMessageActionLoading(action) ? 'refresh' : actionIconMap[action.name]"
                :variant="action.name === 'stop' && !isMessageActionLoading(action) ? 'solid' : 'outline'"
                :size="action.name === 'stop' ? CHAT_MESSAGE_DEFAULTS.stopIconSize : CHAT_MESSAGE_DEFAULTS.actionIconSize"
              />
            </button>
          </slot>
        </div>
        <div
          v-if="actionFeedbackText"
          class="scq-chat-message__action-feedback"
          :class="{ 'is-error': actionError }"
          :role="actionError ? 'alert' : 'status'"
        >
          {{ actionFeedbackText }}
        </div>
        <span class="scq-chat-message__sr-feedback" role="status" aria-live="polite">{{ codeCopyAnnouncement }}</span>
      </div>
    </div>

    <Image
      v-if="markdownPreviewVisible"
      class="scq-chat-message__preview-host"
      :width="0"
      :height="0"
      :preview-visible="markdownPreviewVisible"
      :preview-src-list="markdownPreviewSources"
      :preview-index="markdownPreviewIndex"
      :preview-label="imagePreviewLabel"
      :preview-close-label="previewCloseLabel"
      preview-wheel-zoom
      preview-pinch-zoom
      preview-double-click-reset
      @update:preview-index="handleMarkdownPreviewIndex"
      @close="closeMarkdownPreview"
    />
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
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Image from '../Image/Image.vue'
import type { ImageExpose } from '../Image/types'
import ChatMessageAttachment from './ChatMessageAttachment.vue'
import { useConfig, useThemeStyle } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'
import { useChatLocale, type ChatMessageTexts } from './locale'
import ChatMessageContent from './ChatMessage.vue'
import { safeHref } from '../../utils/link'
export type { ChatMessageTexts } from './locale'
import { MAX_TIMEOUT_DELAY, useAsyncGuard, type AsyncGuard } from '../../utils/async'

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
export type ChatGenerationStatus = 'waiting' | 'generating' | 'completed' | 'stopped' | 'error'
export type ChatMessageAction = 'copy' | 'retry' | 'regenerate' | 'stop' | 'like' | 'dislike'
export type ChatMessageFeedback = 'like' | 'dislike' | null
export type ChatMessageCopyFormat = 'markdown' | 'text'
export type ChatMessagePart =
  | { id: string | number; type: 'text' | 'markdown'; content: string }
  | { id: string | number; type: 'json'; content: unknown }
  | { id: string | number; type: ChatMediaType; content: string | ChatMediaMessage }
  | { id: string | number; type: 'custom'; data?: unknown; text?: string }

export interface ChatMessageSource {
  id?: string | number
  title: string
  url?: string
  page?: string | number
  excerpt?: string
}

export interface ChatMessageSourcePayload {
  source: ChatMessageSource
  index: number
}

export type ChatMessageActionTexts = Partial<Record<ChatMessageAction | 'copied' | 'copyFailed' | 'failed', string>>

export interface ChatMessageActionConfig {
  name: ChatMessageAction
  label?: string
  disabled?: boolean
  loading?: boolean
}

export interface ChatMessageActionPayload {
  action: ChatMessageAction
  message: unknown
  feedback?: ChatMessageFeedback
  text?: string
  parts?: ChatMessagePart[]
}

export type ChatMessageActionHandler = AsyncGuard<ChatMessageActionPayload>

export type ChatVideoPreload = 'auto' | 'metadata' | 'none'
export type ChatAttachmentType = 'pdf' | 'word' | 'excel' | 'ppt' | 'zip' | 'code' | 'text' | 'image' | 'video' | 'audio' | 'file'
export type ChatAttachmentStatus = 'default' | 'uploading' | 'success' | 'error'
export type ChatAttachmentAction = 'preview' | 'download' | 'retry' | 'cancel'
export type ChatAttachmentActionTexts = Partial<Record<ChatAttachmentAction | 'error', string>>
export type ChatMessageSelectionMode = 'single' | 'multiple'
export type ChatMessageSelectionStatus = 'pending' | 'submitting' | 'submitted' | 'error' | 'expired'
export type ChatMessageSelectionValue = string | number

export interface ChatMessageSelectionOption {
  value: ChatMessageSelectionValue
  label: string
  description?: string
  disabled?: boolean
}

export interface ChatMessageSelection {
  id?: string | number
  mode?: ChatMessageSelectionMode
  title?: string
  ariaLabel?: string
  options: ChatMessageSelectionOption[]
  selectedValues?: ChatMessageSelectionValue[]
  status?: ChatMessageSelectionStatus
  disabled?: boolean
  min?: number
  max?: number
  autoSubmit?: boolean
  confirmText?: string
  submittingText?: string
  errorText?: string
  retryText?: string
  submittedText?: string
  refreshable?: boolean
  refreshText?: string
  limitText?: string
  selectedCountText?: string
  expiredText?: string
  allowOther?: boolean
  otherLabel?: string
  otherPlaceholder?: string
  otherMaxlength?: number
  otherRequired?: boolean
}

export interface ChatMessageSelectionPayload {
  selection: ChatMessageSelection
  selectionId: string | number | undefined
  value: ChatMessageSelectionValue | undefined
  values: ChatMessageSelectionValue[]
  selectedOptions: ChatMessageSelectionOption[]
}

export type ChatMessageSelectionSubmit = AsyncGuard<ChatMessageSelectionPayload>

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
  width?: string | number
  height?: string | number
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
  actions?: ChatAttachmentAction[]
  disabled?: boolean
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

export interface ChatAttachmentActionPayload extends ChatAttachmentClickPayload {
  action: ChatAttachmentAction
}

export type ChatAttachmentActionHandler = AsyncGuard<ChatAttachmentActionPayload>

interface ResolvedMediaMessage {
  src: string
  alt: string
  width: string | number
  height: string | number
  title?: string
  poster?: string
  controls: boolean
  autoplay: boolean
  muted: boolean
  loop: boolean
  preload: ChatVideoPreload
}

export interface NormalizedChatAttachment {
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
    message?: unknown
    parts?: ChatMessagePart[]
    sources?: ChatMessageSource[]
    role?: ChatRole
    texts?: ChatMessageTexts
    disabled?: boolean
    contentType?: ChatContentType
    markdownBreaks?: boolean
    syntaxHighlight?: boolean
    streamInterval?: number
    showTime?: boolean
    status?: ChatMessageStatus | null
    statusTexts?: ChatStatusTexts
    generationStatus?: ChatGenerationStatus
    actions?: (ChatMessageAction | ChatMessageActionConfig)[]
    actionHandler?: ChatMessageActionHandler
    actionTexts?: ChatMessageActionTexts
    feedback?: ChatMessageFeedback
    copyFormat?: ChatMessageCopyFormat
    avatar?: string
    avatarText?: string
    avatarAlt?: string
    name?: string
    showAvatar?: boolean
    showName?: boolean
    linkTarget?: string
    linkRel?: string
    previewable?: boolean
    imagePreviewSources?: string[]
    imageFallbackText?: string
    videoUnsupportedText?: string
    imagePreviewLabel?: string
    previewCloseLabel?: string
    codeCopyText?: string
    codeCopiedText?: string
    codeCopyFailedText?: string
    attachments?: ChatAttachment[]
    attachmentActions?: ChatAttachmentAction[]
    attachmentActionHandler?: ChatAttachmentActionHandler
    attachmentActionTexts?: ChatAttachmentActionTexts
    attachmentClick?: (payload: ChatAttachmentClickPayload, event: MouseEvent) => boolean | void
    selection?: ChatMessageSelection | null
    selectionValues?: ChatMessageSelectionValue[]
    selectionDisabled?: boolean
    selectionSubmit?: ChatMessageSelectionSubmit
    timestamp?: string | number | Date | null
    timeFormatter?: (value: string | number | Date | null | undefined) => string
  }>(),
  {
    message: () => '',
    parts: () => [],
    sources: () => [],
    role: 'ai',
    texts: () => ({}),
    disabled: undefined,
    contentType: 'auto',
    markdownBreaks: true,
    syntaxHighlight: true,
    streamInterval: 0,
    showTime: true,
    status: null,
    statusTexts: () => ({}),
    generationStatus: undefined,
    actions: () => [],
    actionHandler: undefined,
    actionTexts: () => ({}),
    feedback: undefined,
    copyFormat: 'markdown',
    avatar: '',
    avatarText: '',
    avatarAlt: '',
    name: '',
    showAvatar: true,
    showName: true,
    linkTarget: '_blank',
    linkRel: 'noopener noreferrer',
    previewable: true,
    imagePreviewSources: () => [],
    imageFallbackText: undefined,
    videoUnsupportedText: undefined,
    imagePreviewLabel: undefined,
    previewCloseLabel: undefined,
    codeCopyText: undefined,
    codeCopiedText: undefined,
    codeCopyFailedText: undefined,
    attachments: () => [],
    attachmentActions: () => ['preview', 'download', 'retry', 'cancel'],
    attachmentActionHandler: undefined,
    attachmentActionTexts: () => ({}),
    attachmentClick: undefined,
    selection: null,
    selectionValues: undefined,
    selectionDisabled: false,
    selectionSubmit: undefined,
    timestamp: null,
    timeFormatter: undefined,
  },
)

const emit = defineEmits<{
  (event: 'source-click', payload: ChatMessageSourcePayload, nativeEvent: MouseEvent): void
  (event: 'attachment-click', payload: ChatAttachmentClickPayload, nativeEvent: MouseEvent): void
  (event: 'attachment-action' | 'attachment-action-success', payload: ChatAttachmentActionPayload): void
  (event: 'attachment-action-error', error: unknown, payload: ChatAttachmentActionPayload): void
  (event: 'preview-open', src: string): void
  (event: 'preview-close', src: string): void
  (event: 'image-error', src: string): void
  (event: 'update:selectionValues', values: ChatMessageSelectionValue[]): void
  (event: 'selection-change', payload: ChatMessageSelectionPayload): void
  (event: 'selection-submit', payload: ChatMessageSelectionPayload): void
  (event: 'selection-success', payload: ChatMessageSelectionPayload): void
  (event: 'selection-error', error: unknown, payload: ChatMessageSelectionPayload): void
  (event: 'selection-refresh', selection: ChatMessageSelection): void
  (event: 'action' | 'action-success', payload: ChatMessageActionPayload): void
  (event: 'action-error', error: unknown, payload: ChatMessageActionPayload): void
  (event: 'retry' | 'regenerate' | 'stop', payload: ChatMessageActionPayload): void
  (event: 'update:feedback' | 'feedback-change', value: ChatMessageFeedback): void
}>()

const CHAT_MESSAGE_DEFAULTS = {
  feedbackDuration: 1200,
  actionIconSize: 16,
  stopIconSize: 24,
  imageWidth: 320,
  imageHeight: 200,
  highlightCacheEntries: 32,
}

const actionIconMap: Record<ChatMessageAction, string> = {
  copy: 'copy',
  retry: 'refresh',
  regenerate: 'refresh',
  stop: 'stop',
  like: 'thumbs-up',
  dislike: 'thumbs-up',
}

const config = useConfig()
const themeStyle = useThemeStyle()
const { bundle: chatLocale, text: chatText } = useChatLocale(() => props.texts)
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const selectionHintId = useComponentId('scq-chat-selection-hint')
const actionTextDefaults = computed(() => chatLocale.value.actions)
const statusTextDefaults = computed(() => chatLocale.value.status)
const imageFallbackText = computed(() => props.imageFallbackText ?? chatText('imageError'))
const videoUnsupportedText = computed(() => props.videoUnsupportedText ?? chatText('videoUnsupported'))
const imagePreviewLabel = computed(() => props.imagePreviewLabel ?? chatText('preview'))
const previewCloseLabel = computed(() => props.previewCloseLabel ?? chatText('closePreview'))
const codeCopyText = computed(() => props.codeCopyText ?? chatText('copy'))
const codeCopiedText = computed(() => props.codeCopiedText ?? chatText('copied'))
const codeCopyFailedText = computed(() => props.codeCopyFailedText ?? chatText('copyFailed'))

const loadingStatusTypes = new Set<ChatStatusType>(['thinking', 'tool', 'loading'])

const generationStatusDefaults = computed<Record<ChatGenerationStatus, { type: ChatStatusType; text: string }>>(() => ({
  waiting: { type: 'loading', text: chatLocale.value.generation.waiting },
  generating: { type: 'loading', text: chatLocale.value.generation.generating },
  completed: { type: 'success', text: chatLocale.value.generation.completed },
  stopped: { type: 'warning', text: chatLocale.value.generation.stopped },
  error: { type: 'error', text: chatLocale.value.generation.error },
}))

const selectionTextDefaults = computed(() => chatLocale.value.selection)

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

const highlightedCodeCache = new Map<string, string>()

const highlightCode = (code: string, language: string, copyText: string): string => {
  if (!code.trim()) {
    return ''
  }

  const normalizedLanguage = normalizeCodeLanguage(language)
  const languageClass = getCodeLanguageClass(normalizeCodeLanguageClass(language) || normalizedLanguage)
  const displayLanguage = getCodeLanguageClass(normalizeCodeLanguageClass(language) || normalizedLanguage || 'text') || 'text'
  const rawCode = escapeHtml(code)
  const copyLabel = escapeHtml(copyText)
  const cacheKey = `${normalizedLanguage}\0${code}`
  let highlighted = props.syntaxHighlight ? highlightedCodeCache.get(cacheKey) : rawCode
  if (highlighted === undefined) {
    highlighted = normalizedLanguage && hljs.getLanguage(normalizedLanguage)
      ? hljs.highlight(code, { language: normalizedLanguage }).value
      : hljs.highlightAuto(code).value
    if (highlightedCodeCache.size >= CHAT_MESSAGE_DEFAULTS.highlightCacheEntries) {
      highlightedCodeCache.delete(highlightedCodeCache.keys().next().value!)
    }
    highlightedCodeCache.set(cacheKey, highlighted)
  }
  const disabled = isDisabled.value ? ' disabled' : ''
  return `<pre class="scq-chat-message__code-block"><div class="scq-chat-message__code-header"><span>${displayLanguage}</span><button type="button" class="scq-chat-message__code-copy" data-code="${rawCode}" aria-label="${copyLabel}"${disabled}>${copyLabel}</button></div><code class="hljs scq-chat-message__code-body language-${languageClass}">${highlighted}</code></pre>`
}

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
})

markdown.renderer.rules.table_open = () => '<div class="scq-chat-message__table-wrap"><table>'
markdown.renderer.rules.table_close = () => '</table></div>'

const defaultImageRenderer = markdown.renderer.rules.image!
markdown.renderer.rules.image = (tokens, index, options, env, self) => {
  tokens[index].attrSet('loading', 'lazy')
  tokens[index].attrSet('width', String(CHAT_MESSAGE_DEFAULTS.imageWidth))
  tokens[index].attrSet('height', String(CHAT_MESSAGE_DEFAULTS.imageHeight))
  const image = defaultImageRenderer(tokens, index, options, env, self)
  const insideLink = tokens.slice(0, index).reduce((depth, token) => depth + (token.type === 'link_open' ? 1 : token.type === 'link_close' ? -1 : 0), 0) > 0
  if (!env?.previewable || insideLink) return image
  return `<button type="button" class="scq-chat-message__markdown-image" aria-label="${escapeHtml(env.imagePreviewLabel)}">${image}</button>`
}

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

const dateTimeFormatter = computed(() => new Intl.DateTimeFormat(config.value.locale, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}))

const imageLoadFailed = ref(false)
const previewSource = ref('')
const mediaImageRef = ref<ImageExpose>()
const markdownPreviewVisible = ref(false)
const markdownPreviewSources = ref<string[]>([])
const markdownPreviewIndex = ref(0)
const codeCopyResetTimers = new Map<HTMLButtonElement, number>()
const codeCopyAnnouncement = ref('')
const currentSelectionValues = ref<ChatMessageSelectionValue[]>([])
const otherSelectionSelected = ref(false)
const otherSelectionText = ref('')
const localSelectionStatus = ref<ChatMessageSelectionStatus>('pending')
const localSelectionError = ref('')
const selectionSubmitGuard = useAsyncGuard<ChatMessageSelectionPayload>(
  () => props.selectionSubmit,
  (error, payload) => {
    localSelectionStatus.value = 'error'
    localSelectionError.value = error instanceof Error ? error.message : ''
    emit('selection-error', error, payload)
  },
  () => true,
)

const cancelSelectionSubmission = () => {
  selectionSubmitGuard.cancel()
  localSelectionStatus.value = 'pending'
  localSelectionError.value = ''
}

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

const displayedMessage = shallowRef(props.message)
const displayedParts = shallowRef(props.parts)
let streamTimer: ReturnType<typeof setTimeout> | undefined
const flushStream = () => {
  if (streamTimer !== undefined) clearTimeout(streamTimer)
  streamTimer = undefined
  displayedMessage.value = props.message
  displayedParts.value = props.parts
}
watch([() => props.message, () => props.parts, () => props.generationStatus, () => props.streamInterval], () => {
  const interval = props.streamInterval
  if (typeof props.message !== 'string' || !['waiting', 'generating'].includes(props.generationStatus ?? '')
    || !Number.isFinite(interval) || interval <= 0 || typeof window === 'undefined') {
    flushStream()
  } else if (streamTimer === undefined) {
    streamTimer = setTimeout(flushStream, Math.min(Math.floor(interval), MAX_TIMEOUT_DELAY))
  }
}, { flush: 'sync' })

const normalizedParts = computed(() => {
  const identities = new Set<string | number>()
  for (const part of displayedParts.value) {
    if (identities.has(part.id)) throw new Error('[scq-vue/ChatMessage] Part ids must be unique.')
    identities.add(part.id)
  }
  return displayedParts.value
})
const partImageSources = computed(() => {
  if (props.imagePreviewSources.length) return props.imagePreviewSources
  const sources: string[] = []
  const collect = (tokens: ReturnType<typeof markdown.parse>) => {
    let linkDepth = 0
    for (const token of tokens) {
      if (token.type === 'link_open') linkDepth += 1
      if (token.type === 'link_close') linkDepth -= 1
      if (token.type === 'image' && linkDepth === 0) sources.push(token.attrGet('src') ?? '')
      else if (token.children) collect(token.children)
    }
  }
  for (const part of normalizedParts.value) {
    if (part.type === 'image') sources.push(getMediaSource(part.content))
    if (part.type === 'markdown') collect(markdown.parse(part.content, {}))
  }
  return [...new Set(sources.filter(Boolean))]
})
const normalizedSources = computed(() => props.sources.map((source, index) => ({
  raw: source,
  key: `${source.id ?? index}-${index}`,
  url: safeHref(source.url),
  rel: [...new Set([...(props.linkRel || '').split(/\s+/), 'noopener', 'noreferrer'])].filter(Boolean).join(' '),
})))
const handleSourceClick = (event: MouseEvent, source: ChatMessageSource, index: number) => {
  if (isDisabled.value) { event.preventDefault(); return }
  emit('source-click', { source, index }, event)
}

const resolvedContentType = computed<'text' | 'markdown' | 'json' | ChatMediaType>(() => {
  if (props.contentType !== 'auto') {
    return props.contentType
  }
  if (props.generationStatus && typeof props.message === 'string') return 'markdown'

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
  return highlightCode(jsonText.value || '{}', 'json', codeCopyText.value)
})

const rawMarkdownContent = computed(() => {
  return String(displayedMessage.value ?? '').replace(/\r\n?/g, '\n')
})

const renderedMarkdown = computed(() => {
  markdown.set({
    breaks: props.markdownBreaks,
    highlight: (code: string, language: string) => highlightCode(code, language, codeCopyText.value),
  })

  return markdown.render(rawMarkdownContent.value, {
    linkTarget: props.linkTarget,
    linkRel: props.linkRel,
    previewable: props.previewable && !isDisabled.value,
    imagePreviewLabel: imagePreviewLabel.value,
  })
})

const renderedText = computed(() => String(displayedMessage.value ?? ''))

const hasMessageContent = computed(() => {
  if (props.parts.length) return true
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
    width: media.width ?? CHAT_MESSAGE_DEFAULTS.imageWidth,
    height: media.height ?? CHAT_MESSAGE_DEFAULTS.imageHeight,
    title: typeof media.title === 'string' ? media.title : undefined,
    poster: typeof media.poster === 'string' ? media.poster : undefined,
    controls: media.controls !== false,
    autoplay: media.autoplay === true,
    muted: media.muted === true,
    loop: media.loop === true,
    preload,
  }
})

const mediaPreviewSources = computed(() => props.imagePreviewSources.length ? props.imagePreviewSources : [resolvedMedia.value.src])
const mediaPreviewIndex = computed(() => Math.max(0, mediaPreviewSources.value.indexOf(resolvedMedia.value.src)))

const normalizedAttachments = computed<NormalizedChatAttachment[]>(() => {
  return props.attachments
    .filter((attachment) => attachment && attachment.name)
    .map((attachment, index) => {
      const name = String(attachment.name)
      const type = normalizeAttachmentType(attachment.type, name)
      const status = normalizeAttachmentStatus(attachment.status)
      const progress = clampProgress(attachment.progress)
      const url = normalizeAttachmentUrl(attachment.url)
      const disabled = attachment.disabled === true || !url || status === 'uploading' || status === 'error'
      const fallbackKey = `${name}-${index}`

      return {
        key: attachment.id === undefined ? fallbackKey : `${typeof attachment.id}-${attachment.id}`,
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
        statusText: attachment.statusText ?? (status === 'uploading' ? chatText('uploading') : status === 'error' ? chatText('failed') : ''),
        progress,
        disabled,
      }
    })
})

const formatDateTime = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.value.format(date)
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

const generationStatus = computed(() => props.generationStatus ? generationStatusDefaults.value[props.generationStatus] : undefined)
const isGenerating = computed(() => props.generationStatus === 'waiting' || props.generationStatus === 'generating')
const resolvedStatusType = computed<ChatStatusType>(() => props.status?.type ?? generationStatus.value?.type ?? 'thinking')

const resolvedStatusLoading = computed(() => {
  return props.status?.loading ?? loadingStatusTypes.has(resolvedStatusType.value)
})

const resolvedStatusText = computed(() => {
  return props.status?.text?.trim()
    || props.statusTexts[resolvedStatusType.value]
    || (props.status?.type ? statusTextDefaults.value[resolvedStatusType.value] : generationStatus.value?.text)
    || statusTextDefaults.value[resolvedStatusType.value]
})

const shouldShowStatus = computed(() => {
  if (typeof props.status?.visible === 'boolean') {
    return props.status.visible && Boolean(resolvedStatusText.value)
  }

  return Boolean((props.status || generationStatus.value) && resolvedStatusText.value)
})

const shouldShowBubble = computed(() => hasMessageContent.value || (!shouldShowStatus.value && !props.selection))
const bubbleClasses = computed(() => `is-${resolvedContentType.value}`)

const selectionMode = computed<ChatMessageSelectionMode>(() => {
  return props.selection?.mode === 'multiple' ? 'multiple' : 'single'
})

const selectionStatus = computed<ChatMessageSelectionStatus>(() => {
  const status = props.selection?.status
  if (status && status !== 'pending') return status
  if (selectionSubmitGuard.pending.value) return 'submitting'
  return localSelectionStatus.value
})

const selectionOptions = computed<ChatMessageSelectionOption[]>(() => {
  return Array.isArray(props.selection?.options) ? props.selection.options : []
})

const selectionAllowsOther = computed(() => props.selection?.allowOther === true)

const selectionOtherMaxlength = computed(() => {
  const maxlength = props.selection?.otherMaxlength
  return typeof maxlength === 'number' && Number.isFinite(maxlength) && maxlength >= 0
    ? Math.floor(maxlength)
    : undefined
})

const selectionAriaLabel = computed(() => {
  return props.selection?.ariaLabel || props.selection?.title || chatText('choose')
})

const selectionMinimum = computed(() => {
  const minimum = props.selection?.min
  return typeof minimum === 'number' && Number.isFinite(minimum) ? Math.max(0, Math.floor(minimum)) : 1
})

const selectionMaximum = computed<number | null>(() => {
  const maximum = props.selection?.max
  return typeof maximum === 'number' && Number.isFinite(maximum) ? Math.max(0, Math.floor(maximum)) : null
})

const isSelectionInteractionDisabled = computed(() => {
  return isDisabled.value || props.selectionDisabled || props.selection?.disabled === true
    || selectionSubmitGuard.pending.value
    || !['pending', 'error'].includes(selectionStatus.value)
})

const selectedOptionValues = computed(() => {
  return [...new Set(currentSelectionValues.value)].filter((value) => {
    return selectionOptions.value.some((option) => option.value === value)
  })
})

const selectedItemCount = computed(() => {
  return selectedOptionValues.value.length + (otherSelectionSelected.value && otherSelectionText.value.trim() ? 1 : 0)
})

const hasReachedSelectionMaximum = computed(() => {
  const occupiedSlots = selectedOptionValues.value.length + (otherSelectionSelected.value ? 1 : 0)
  return selectionMaximum.value !== null && occupiedSlots >= selectionMaximum.value
})

const isOtherSelectionDisabled = computed(() => {
  return isSelectionInteractionDisabled.value
    || (hasReachedSelectionMaximum.value && !otherSelectionSelected.value)
})

const isSelectionConfirmDisabled = computed(() => {
  const isOtherInputMissing = otherSelectionSelected.value
    && props.selection?.otherRequired !== false
    && !otherSelectionText.value.trim()
  return isSelectionInteractionDisabled.value
    || selectedItemCount.value < selectionMinimum.value
    || (selectionMaximum.value !== null && selectedItemCount.value > selectionMaximum.value)
    || isOtherInputMissing
})

const shouldShowSelectionActions = computed(() => {
  return !['submitted', 'expired'].includes(selectionStatus.value)
    && (selectionMode.value === 'multiple' || props.selection?.autoSubmit === false
      || selectionStatus.value === 'error' || selectionStatus.value === 'submitting'
      || (selectionAllowsOther.value && otherSelectionSelected.value))
})

const selectionConfirmText = computed(() => {
  if (selectionStatus.value === 'submitting') return props.selection?.submittingText || selectionTextDefaults.value.submitting
  if (selectionStatus.value === 'error') return props.selection?.retryText || selectionTextDefaults.value.retry
  return props.selection?.confirmText || selectionTextDefaults.value.confirm
})

const selectionErrorText = computed(() => props.selection?.errorText || localSelectionError.value || selectionTextDefaults.value.error)
const selectionSummaryText = computed(() => {
  const labels = selectedOptionValues.value.map((value) => selectionOptions.value.find((option) => option.value === value)!.label)
  if (otherSelectionSelected.value && otherSelectionText.value.trim()) labels.push(otherSelectionText.value.trim())
  return (props.selection?.submittedText || selectionTextDefaults.value.submitted)
    .replace('{values}', labels.join(chatText('separator')) || selectionTextDefaults.value.empty)
})

const formatSelectionLimits = (text: string) => text
  .replace('{min}', String(selectionMinimum.value))
  .replace('{max}', String(selectionMaximum.value ?? ''))

const selectionValidationText = computed(() => {
  if (selectionStatus.value === 'submitting') return selectionConfirmText.value
  if (isDisabled.value || props.selectionDisabled || props.selection?.disabled) return selectionTextDefaults.value.disabled
  if (otherSelectionSelected.value && props.selection?.otherRequired !== false && !otherSelectionText.value.trim()) {
    return selectionTextDefaults.value.otherRequired
  }
  if (selectedItemCount.value < selectionMinimum.value) return formatSelectionLimits(selectionTextDefaults.value.minimum)
  if (selectionMaximum.value !== null && selectedItemCount.value > selectionMaximum.value) {
    return formatSelectionLimits(selectionTextDefaults.value.exceeded)
  }
  return ''
})

const selectionHintText = computed(() => {
  if (selectionStatus.value === 'submitted' || selectionStatus.value === 'expired') return ''
  if (selectionValidationText.value) return selectionValidationText.value
  if (props.selection?.limitText) return formatSelectionLimits(props.selection.limitText)
  if (selectionMode.value !== 'multiple') return ''
  if (selectionMaximum.value !== null) {
    return formatSelectionLimits(selectionMinimum.value > 0 ? selectionTextDefaults.value.range : selectionTextDefaults.value.maximum)
  }
  return selectionMinimum.value > 0 ? formatSelectionLimits(selectionTextDefaults.value.minimum) : ''
})

const selectedCountText = computed(() => {
  const count = selectedItemCount.value
  return (props.selection?.selectedCountText || chatText('selectedCount')).replace('{count}', String(count))
})

const getSelectionOptionKey = (option: ChatMessageSelectionOption, index: number): string => {
  return `${typeof option.value}-${String(option.value)}-${index}`
}

const isSelectionOptionSelected = (option: ChatMessageSelectionOption): boolean => {
  return currentSelectionValues.value.includes(option.value)
}

const isSelectionOptionDisabled = (option: ChatMessageSelectionOption): boolean => {
  if (option.disabled || isSelectionInteractionDisabled.value) {
    return true
  }

  return selectionMode.value === 'multiple'
    && hasReachedSelectionMaximum.value
    && !isSelectionOptionSelected(option)
}

const getSelectionValues = (trimOther = false): ChatMessageSelectionValue[] => {
  const values: ChatMessageSelectionValue[] = [...selectedOptionValues.value]
  const otherValue = trimOther ? otherSelectionText.value.trim() : otherSelectionText.value
  if (otherSelectionSelected.value && otherValue) {
    values.push(otherValue)
  }
  return values
}

const createSelectionPayload = (trimOther = false): ChatMessageSelectionPayload | null => {
  if (!props.selection) {
    return null
  }

  const values = getSelectionValues(trimOther)
  const selectedOptions = selectedOptionValues.value
    .map((value) => selectionOptions.value.find((option) => option.value === value))
    .filter((option): option is ChatMessageSelectionOption => Boolean(option))

  return {
    selection: props.selection,
    selectionId: props.selection.id,
    value: values[0],
    values,
    selectedOptions,
  }
}

const emitSelectionChange = () => {
  const values = getSelectionValues()
  localSelectionStatus.value = 'pending'
  localSelectionError.value = ''
  emit('update:selectionValues', values)

  const payload = createSelectionPayload()
  if (payload) {
    emit('selection-change', payload)
  }
}

const confirmSelection = () => {
  if (isSelectionConfirmDisabled.value) {
    return
  }

  const payload = createSelectionPayload(true)
  if (payload) {
    if (props.selectionSubmit) {
      localSelectionStatus.value = 'pending'
      localSelectionError.value = ''
      void selectionSubmitGuard.run(payload, () => {
        localSelectionStatus.value = 'submitted'
        emit('selection-success', payload)
      })
    }
    emit('selection-submit', payload)
  }
}

const handleSelectionOptionClick = (option: ChatMessageSelectionOption) => {
  if (isSelectionOptionDisabled(option)) {
    return
  }

  if (selectionMode.value === 'single') {
    otherSelectionSelected.value = false
    currentSelectionValues.value = [option.value]
    emitSelectionChange()
    if (props.selection?.autoSubmit !== false) confirmSelection()
    return
  }

  currentSelectionValues.value = isSelectionOptionSelected(option)
    ? currentSelectionValues.value.filter((value) => value !== option.value)
    : [...currentSelectionValues.value, option.value]
  emitSelectionChange()
}

const toggleOtherSelection = () => {
  if (isOtherSelectionDisabled.value) {
    return
  }

  if (selectionMode.value === 'single') {
    currentSelectionValues.value = []
    otherSelectionSelected.value = true
  } else {
    otherSelectionSelected.value = !otherSelectionSelected.value
  }
  emitSelectionChange()
}

const handleOtherSelectionFocus = () => {
  if (isOtherSelectionDisabled.value || otherSelectionSelected.value) {
    return
  }

  if (selectionMode.value === 'single') {
    currentSelectionValues.value = []
  }
  otherSelectionSelected.value = true
  emitSelectionChange()
}

const handleOtherSelectionInput = (event: Event) => {
  if (isOtherSelectionDisabled.value || !(event.target instanceof HTMLInputElement)) {
    return
  }

  if (selectionMode.value === 'single') {
    currentSelectionValues.value = []
  }
  otherSelectionSelected.value = true
  otherSelectionText.value = event.target.value
  emitSelectionChange()
}

const selectionValuesEqual = (left: ChatMessageSelectionValue[], right: ChatMessageSelectionValue[]): boolean => {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

const syncSelectionValues = (reset = false) => {
  const selection = props.selection
  if (reset || !selection) {
    currentSelectionValues.value = []
    otherSelectionSelected.value = false
    otherSelectionText.value = ''
  }
  if (!selection) return

  const sourceValues = Array.isArray(props.selectionValues)
    ? props.selectionValues
    : Array.isArray(selection.selectedValues)
      ? selection.selectedValues
      : undefined
  const matchesCurrent = sourceValues && selectionValuesEqual(sourceValues, getSelectionValues())
  const matchesTrimmed = sourceValues && selectionValuesEqual(sourceValues, getSelectionValues(true))
  if (!reset && (!sourceValues || matchesCurrent || matchesTrimmed)) {
    if (!selectionValuesEqual(currentSelectionValues.value, selectedOptionValues.value)) cancelSelectionSubmission()
    currentSelectionValues.value = selectedOptionValues.value
    if (matchesTrimmed && !matchesCurrent) otherSelectionText.value = otherSelectionText.value.trim()
    if (!selectionAllowsOther.value) {
      otherSelectionSelected.value = false
      otherSelectionText.value = ''
    }
    return
  }
  if (!reset) cancelSelectionSubmission()
  const incomingValues = [...new Set(sourceValues ?? [])]
  const optionValues = incomingValues.filter((value) => {
    return selectionOptions.value.some((option) => option.value === value)
  })
  const otherValues = selectionAllowsOther.value
    ? incomingValues.filter((value) => !selectionOptions.value.some((option) => option.value === value))
    : []
  const otherValue = otherValues.length ? String(otherValues[otherValues.length - 1]) : ''
  const normalizedOptionValues = selectionMode.value === 'single' && otherValue
    ? []
    : selectionMode.value === 'single'
      ? optionValues.slice(0, 1)
      : optionValues
  currentSelectionValues.value = normalizedOptionValues
  otherSelectionSelected.value = Boolean(otherValue)
  otherSelectionText.value = otherValue
}

const openImagePreview = (index: number) => {
  previewSource.value = mediaPreviewSources.value[index] ?? resolvedMedia.value.src
  emit('preview-open', previewSource.value)
}

const closeImagePreview = () => {
  emit('preview-close', previewSource.value)
  previewSource.value = ''
}

const handlePreviewSwitch = (index: number) => {
  previewSource.value = mediaPreviewSources.value[index] ?? ''
}

const handleImageError = () => {
  mediaImageRef.value?.closePreview()
  imageLoadFailed.value = true
  emit('image-error', resolvedMedia.value.src)
}

const retryMessageImage = () => {
  imageLoadFailed.value = false
  mediaImageRef.value?.retry()
}

const handleMarkdownPreviewIndex = (index: number) => {
  markdownPreviewIndex.value = index
  previewSource.value = markdownPreviewSources.value[index] ?? ''
}

const closeMarkdownPreview = () => {
  if (!markdownPreviewVisible.value) return
  markdownPreviewVisible.value = false
  closeImagePreview()
}

const handleMarkdownPreview = (event: MouseEvent): boolean => {
  if (!props.previewable || isDisabled.value || !(event.currentTarget instanceof HTMLElement) || !(event.target instanceof Element)) return false
  const button = event.target.closest<HTMLButtonElement>('.scq-chat-message__markdown-image')
  if (!button || button.closest('.scq-chat-message') !== event.currentTarget) return false
  const image = button.querySelector('img')
  if (!image) return false
  const images = [...event.currentTarget.querySelectorAll<HTMLImageElement>('.scq-chat-message__markdown img')]
    .filter(item => item.closest('.scq-chat-message') === event.currentTarget)
  markdownPreviewSources.value = [...new Set([...props.imagePreviewSources, ...images.map(item => item.getAttribute('src') || '')].filter(Boolean))]
  const index = markdownPreviewSources.value.indexOf(image.getAttribute('src') || '')
  if (index < 0) return false
  event.preventDefault()
  button.focus({ preventScroll: true })
  handleMarkdownPreviewIndex(index)
  markdownPreviewVisible.value = true
  emit('preview-open', previewSource.value)
  return true
}

const handleAttachmentClick = (event: MouseEvent, attachment: NormalizedChatAttachment) => {
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
  if (shouldContinue === false || attachment.disabled || isDisabled.value) {
    event.preventDefault()
  }
}

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
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
    previousFocus?.focus({ preventScroll: true })
  }
}

const getMessageCopyText = (): string => {
  if (props.parts.length) return props.parts.map(part => {
    if (part.type === 'custom') return part.text ?? ''
    if (part.type === 'image' || part.type === 'video') return getMediaSource(part.content)
    if (part.type === 'json') return safeJsonStringify(part.content)
    return props.copyFormat === 'text' && part.type === 'markdown' ? getPlainMarkdownText(String(part.content)) : String(part.content ?? '')
  }).filter(Boolean).join('\n\n')
  if (resolvedContentType.value === 'json') return jsonText.value
  if (resolvedContentType.value === 'image' || resolvedContentType.value === 'video') return resolvedMedia.value.src
  if (resolvedContentType.value !== 'markdown' || props.copyFormat === 'markdown') return String(props.message ?? '')
  return getPlainMarkdownText(String(props.message ?? ''))
}

const getPlainMarkdownText = (content: string): string => {
  const inlineText = (tokens: ReturnType<typeof markdown.parse>): string => tokens.map((token) => {
    if (token.type === 'softbreak' || token.type === 'hardbreak') return '\n'
    if (token.children) return inlineText(token.children)
    return ['text', 'code_inline', 'image'].includes(token.type) ? token.content : ''
  }).join('')

  return markdown.parse(content, {}).map((token) => {
    if (token.type === 'inline') return inlineText(token.children ?? [])
    if (token.type === 'fence' || token.type === 'code_block') return `${token.content}\n`
    if (token.type === 'td_close' || token.type === 'th_close') return '\t'
    return token.block && token.nesting === -1 ? '\n' : ''
  }).join('').replace(/[\t ]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

const localFeedback = ref<ChatMessageFeedback>(null)
const resolvedFeedback = computed(() => props.feedback === undefined ? localFeedback.value : props.feedback)
const activeAction = ref<ChatMessageAction | null>(null)
const actionError = ref('')
const copySucceeded = ref(false)
let actionFeedbackTimer: number | undefined
let disposed = false

const executeMessageAction: ChatMessageActionHandler = async (payload, signal) => {
  if (props.actionHandler && await props.actionHandler(payload, signal) === false) return false
  if (signal.aborted) return false
  if (payload.action === 'copy') await copyText(payload.text ?? '')
}

const messageActionGuard = useAsyncGuard<ChatMessageActionPayload>(
  () => executeMessageAction,
  (error, payload) => {
    actionError.value = payload.action === 'copy'
      ? props.actionTexts.copyFailed || actionTextDefaults.value.copyFailed
      : error instanceof Error && error.message ? error.message : props.actionTexts.failed || actionTextDefaults.value.failed
    emit('action-error', error, payload)
  },
  () => true,
)

const normalizedActions = computed<ChatMessageActionConfig[]>(() => {
  const unique = new Map<ChatMessageAction, ChatMessageActionConfig>()
  for (const entry of props.actions) {
    const action = typeof entry === 'string' ? { name: entry } : entry
    if (!action || !Object.hasOwn(actionIconMap, action.name)) continue
    if (action.name === 'stop' && !isGenerating.value) continue
    if (action.name === 'retry' && props.generationStatus && !['error', 'stopped'].includes(props.generationStatus)) continue
    if (action.name === 'regenerate' && props.generationStatus && props.generationStatus !== 'completed') continue
    unique.set(action.name, action)
  }
  return [...unique.values()]
})

const isFeedbackAction = (name: ChatMessageAction) => name === 'like' || name === 'dislike'
const isMessageActionLoading = (action: ChatMessageActionConfig) => Boolean(action.loading)
  || (messageActionGuard.pending.value && activeAction.value === action.name)
const isMessageActionDisabled = (action: ChatMessageActionConfig) => {
  if (isDisabled.value && action.name !== 'stop') return true
  if (action.disabled || isMessageActionLoading(action)) return true
  if (action.name !== 'stop' && (messageActionGuard.pending.value || normalizedActions.value.some((item) => item.loading))) return true
  if (action.name === 'copy') return !hasMessageContent.value
  if (isFeedbackAction(action.name)) return isGenerating.value || !hasMessageContent.value
  return false
}

const getActionLabel = (action: ChatMessageActionConfig) => {
  if (action.name === 'copy' && copySucceeded.value) return props.actionTexts.copied || actionTextDefaults.value.copied
  return action.label || props.actionTexts[action.name] || actionTextDefaults.value[action.name]
}
const actionFeedbackText = computed(() => actionError.value || (copySucceeded.value ? props.actionTexts.copied || actionTextDefaults.value.copied : ''))

const clearActionFeedback = () => {
  if (actionFeedbackTimer !== undefined) window.clearTimeout(actionFeedbackTimer)
  actionFeedbackTimer = undefined
  copySucceeded.value = false
  actionError.value = ''
}

const handleMessageAction = (name: ChatMessageAction) => {
  const action = normalizedActions.value.find((item) => item.name === name)
  if (!action || isMessageActionDisabled(action)) return
  if (name === 'stop') messageActionGuard.cancel()
  clearActionFeedback()
  const payload: ChatMessageActionPayload = { action: name, message: props.message }
  if (props.parts.length) payload.parts = props.parts
  if (name === 'copy') payload.text = getMessageCopyText()
  if (name === 'like' || name === 'dislike') payload.feedback = resolvedFeedback.value === name ? null : name
  activeAction.value = name
  void messageActionGuard.run(payload, () => {
    if (payload.feedback !== undefined) {
      localFeedback.value = payload.feedback
      emit('update:feedback', payload.feedback)
      emit('feedback-change', payload.feedback)
    }
    if (name === 'copy') {
      copySucceeded.value = true
      actionFeedbackTimer = window.setTimeout(() => {
        copySucceeded.value = false
        actionFeedbackTimer = undefined
      }, CHAT_MESSAGE_DEFAULTS.feedbackDuration)
    }
    emit('action-success', payload)
  }).finally(() => {
    if (!messageActionGuard.pending.value) activeAction.value = null
  })
  emit('action', payload)
  if (name === 'retry' || name === 'regenerate' || name === 'stop') emit(name, payload)
}

watch(() => props.actionHandler, () => {
  messageActionGuard.cancel()
  activeAction.value = null
  clearActionFeedback()
})

const setCodeCopyFeedback = (target: HTMLButtonElement, text: string) => {
  if (disposed) return
  const previousTimer = codeCopyResetTimers.get(target)
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer)
  }

  target.textContent = text
  target.setAttribute('aria-label', text)
  codeCopyAnnouncement.value = text
  const timer = window.setTimeout(() => {
    target.textContent = codeCopyText.value
    target.setAttribute('aria-label', codeCopyText.value)
    codeCopyAnnouncement.value = ''
    codeCopyResetTimers.delete(target)
  }, CHAT_MESSAGE_DEFAULTS.feedbackDuration)
  codeCopyResetTimers.set(target, timer)
}

const handleCodeCopyClick = (event: MouseEvent) => {
  if (isDisabled.value) return
  if (handleMarkdownPreview(event)) return
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.scq-chat-message__code-copy') : null
  if (!target || target.closest('.scq-chat-message') !== event.currentTarget || !target.dataset.code) {
    return
  }

  copyText(target.dataset.code)
    .then(() => setCodeCopyFeedback(target, codeCopiedText.value))
    .catch(() => setCodeCopyFeedback(target, codeCopyFailedText.value))
}

watch(
  () => resolvedMedia.value.src,
  () => {
    mediaImageRef.value?.closePreview()
    imageLoadFailed.value = false
  },
)

watch([() => props.previewable, isDisabled], ([previewable, disabled]) => {
  if (!previewable || disabled) { mediaImageRef.value?.closePreview(); closeMarkdownPreview() }
})

watch(
  [() => props.selection?.id, () => props.selection?.mode, () => props.selection?.allowOther, () => Boolean(props.selection)],
  () => {
    cancelSelectionSubmission()
    syncSelectionValues(true)
  },
  { flush: 'sync' },
)

watch(() => props.selection?.status, cancelSelectionSubmission, { flush: 'sync' })

watch(
  [() => selectionOptions.value, () => props.selection?.selectedValues, () => props.selectionValues],
  () => syncSelectionValues(),
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  disposed = true
  if (streamTimer !== undefined) clearTimeout(streamTimer)
  highlightedCodeCache.clear()
  clearActionFeedback()
  codeCopyResetTimers.forEach((timer) => window.clearTimeout(timer))
  codeCopyResetTimers.clear()
})
</script>