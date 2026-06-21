import type { App, Plugin } from 'vue'
import Message from './Message.vue'
import { message, type MessageApiOptions, type MessageInstance } from './message-method'

type SFCWithInstall<T> = T & Plugin

type MessageWithApi = SFCWithInstall<typeof Message> & {
  open: typeof message.open
  info: typeof message.info
  success: typeof message.success
  warning: typeof message.warning
  error: typeof message.error
  loading: typeof message.loading
  destroyAll: typeof message.destroyAll
  setGlobalZIndex: typeof message.setGlobalZIndex
}

const _Message = Object.assign(Message, message) as MessageWithApi

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Message.install = (app: App): void => {
  const componentName = _Message.name || 'Message'
  app.component(getPrefixedName(componentName), _Message)
}

export type { MessageApiOptions, MessageInstance }
export type { MessagePlacement, MessageType } from './Message.vue'
export default _Message