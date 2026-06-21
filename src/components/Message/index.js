import Message from './Message.vue'
import { message } from './message-method'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

const messageWithApi = Object.assign(Message, message)

messageWithApi.install = (app) => {
  app.component(getPrefixedName(messageWithApi.name || 'Message'), messageWithApi)
}

export default messageWithApi