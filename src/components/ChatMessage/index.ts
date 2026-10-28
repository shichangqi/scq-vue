import type { App, Plugin } from 'vue'
import ChatMessage from './ChatMessage.vue'

type SFCWithInstall<T> = T & Plugin

const _ChatMessage = ChatMessage as SFCWithInstall<typeof ChatMessage>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_ChatMessage.install = (app: App): void => {
  const componentName = _ChatMessage.name || 'ChatMessage'
  app.component(getPrefixedName(componentName), _ChatMessage)
}

export default _ChatMessage
export type { ChatAttachmentAction, ChatAttachmentActionHandler, ChatAttachmentActionPayload, ChatAttachmentActionTexts, ChatMessagePart, ChatMessageSource, ChatMessageSourcePayload, ChatMessageTexts } from './ChatMessage.vue'
export type { ChatAttachment, ChatAttachmentClickPayload, ChatAttachmentStatus, ChatAttachmentType, ChatContentType, ChatGenerationStatus, ChatMediaMessage, ChatMediaType, ChatMessageAction, ChatMessageActionConfig, ChatMessageActionHandler, ChatMessageActionPayload, ChatMessageActionTexts, ChatMessageCopyFormat, ChatMessageFeedback, ChatMessageSelection, ChatMessageSelectionMode, ChatMessageSelectionOption, ChatMessageSelectionPayload, ChatMessageSelectionStatus, ChatMessageSelectionSubmit, ChatMessageSelectionValue, ChatMessageStatus, ChatRole, ChatStatusTexts, ChatStatusType, ChatVideoPreload } from './ChatMessage.vue'
