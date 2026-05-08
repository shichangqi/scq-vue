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
