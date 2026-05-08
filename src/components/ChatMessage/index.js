import ChatMessage from './ChatMessage.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

ChatMessage.install = (app) => {
  app.component(getPrefixedName(ChatMessage.name), ChatMessage)
}

export default ChatMessage
