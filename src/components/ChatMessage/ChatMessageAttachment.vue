<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useAsyncGuard } from '../../utils/async'
import { useLocale } from '../ConfigProvider/context'
import { useChatLocale } from './locale'
import type { ChatAttachmentAction, ChatAttachmentActionHandler, ChatAttachmentActionPayload, ChatAttachmentActionTexts, NormalizedChatAttachment } from './ChatMessage.vue'

const props = defineProps<{ item: NormalizedChatAttachment; actions: ChatAttachmentAction[]; handler?: ChatAttachmentActionHandler; labels?: ChatAttachmentActionTexts; disabled?: boolean }>()
const emit = defineEmits<{
  (event: 'click', nativeEvent: MouseEvent): void
  (event: 'action' | 'success', payload: ChatAttachmentActionPayload): void
  (event: 'error', error: unknown, payload: ChatAttachmentActionPayload): void
}>()
const { text: chatText } = useChatLocale()
const text = useLocale()
const ICON_SIZE = 16
const icons: Record<ChatAttachmentAction, string> = { preview: 'eye', download: 'download', retry: 'refresh', cancel: 'close' }
const active = ref<ChatAttachmentAction>()
const errorMessage = ref('')
const labels = computed(() => ({ preview: text('preview'), download: chatText('download'), retry: text('retryAction'), cancel: text('cancel'), ...props.labels }))
const guard = useAsyncGuard<ChatAttachmentActionPayload>(() => props.handler, (error, payload) => {
  errorMessage.value = props.labels?.error || (error instanceof Error ? error.message : text('confirmationFailed'))
  emit('error', error, payload)
}, () => true)
watch([() => props.item.raw.disabled, () => props.disabled], ([fileDisabled, disabled]) => {
  if (!fileDisabled && !disabled) return
  guard.cancel()
  errorMessage.value = ''
})
const actions = computed(() => [...new Set(props.item.raw.actions ?? props.actions)].filter(action => {
  if (!Object.hasOwn(icons, action)) return false
  if (action === 'cancel') return props.item.status === 'uploading'
  if (action === 'retry') return props.item.status === 'error'
  return Boolean(props.item.url) && !props.item.disabled
}))
const unavailable = (action: ChatAttachmentAction) => props.disabled || props.item.raw.disabled
  || (guard.pending.value && (action !== 'cancel' || active.value === 'cancel'))
const nativeLink = (action: ChatAttachmentAction) => !props.handler && (action === 'preview' || action === 'download')
const run = (event: MouseEvent, action: ChatAttachmentAction) => {
  if (unavailable(action)) { event.preventDefault(); return }
  if (!nativeLink(action)) event.preventDefault()
  if (action === 'cancel') guard.cancel()
  errorMessage.value = ''
  active.value = action
  const { index, name, url, type, label, sizeText, status, statusText, progress } = props.item
  const payload: ChatAttachmentActionPayload = { action, attachment: props.item.raw, index, name, url, type, label, sizeText, status, statusText, progress }
  if (props.handler) void guard.run(payload, () => emit('success', payload))
  emit('action', payload)
}
const activateFile = (event: MouseEvent) => {
  if (guard.pending.value || props.disabled || props.item.disabled) { event.preventDefault(); return }
  emit('click', event)
  if (event.defaultPrevented || !props.handler) return
  const action = actions.value.includes('preview') ? 'preview' : actions.value.includes('download') ? 'download' : undefined
  if (action) run(event, action)
}
</script>

<template>
  <div class="scq-chat-message__attachment" :class="[`is-${item.type}`, `is-${item.status}`]" :aria-busy="guard.pending.value || item.status === 'uploading' || undefined">
    <component :is="handler ? 'button' : 'a'" :type="handler ? 'button' : undefined" class="scq-chat-message__attachment-link" :href="item.disabled || disabled || guard.pending.value || handler ? undefined : item.url" :target="handler ? undefined : item.target" :rel="handler ? undefined : item.rel" :download="handler ? undefined : item.download" :disabled="handler && (item.disabled || disabled || guard.pending.value)" :aria-disabled="item.disabled || disabled || guard.pending.value ? 'true' : undefined" @click="activateFile">
      <span class="scq-chat-message__attachment-icon" aria-hidden="true">{{ item.icon }}</span>
      <span class="scq-chat-message__attachment-main">
        <span class="scq-chat-message__attachment-name">{{ item.name }}</span>
        <span class="scq-chat-message__attachment-meta"><span>{{ item.label }}</span><span v-if="item.sizeText">{{ item.sizeText }}</span><span v-if="item.statusText">{{ item.statusText }}</span></span>
        <span v-if="item.progress !== null" class="scq-chat-message__attachment-progress" role="progressbar" :aria-label="`${item.name} ${text('progress')}`" :aria-valuenow="item.progress" :aria-valuemin="0" :aria-valuemax="100"><span :style="{ width: `${item.progress}%` }" /></span>
      </span>
    </component>
    <div v-if="actions.length" class="scq-chat-message__attachment-actions">
      <component :is="nativeLink(action) ? 'a' : 'button'" v-for="action in actions" :key="action" :type="nativeLink(action) ? undefined : 'button'" class="scq-chat-message__action is-default" :data-attachment-action="action" :href="nativeLink(action) && !unavailable(action) ? item.url : undefined" :target="nativeLink(action) ? item.target : undefined" :rel="nativeLink(action) ? item.rel : undefined" :download="action === 'download' && nativeLink(action) ? (typeof item.download === 'string' ? item.download : item.name) : undefined" :disabled="unavailable(action)" :aria-disabled="unavailable(action) || undefined" :aria-label="`${labels[action]} ${item.name}`" :title="labels[action]" @click="run($event, action)">
        <Icon :name="guard.pending.value && active === action ? 'refresh' : icons[action]" class="scq-chat-message__action-icon" :class="{ 'is-loading': guard.pending.value && active === action }" :size="ICON_SIZE" />
      </component>
    </div>
    <div v-if="errorMessage" class="scq-chat-message__attachment-error" role="alert">{{ errorMessage }}</div>
  </div>
</template>
