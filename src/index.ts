import type { App, Plugin } from 'vue'
import Button from './components/Button'
import Input from './components/Input'
import ChatMessage from './components/ChatMessage'

const components = [Button, Input, ChatMessage]

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

const install = (app: App): void => {
  components.forEach((component) => {
    const componentName = (component as { name?: string }).name
    if (componentName) {
      app.component(getPrefixedName(componentName), component)
    }
  })
}

const ScqVue: Plugin = {
  install,
}

const ScqButton = Button
const ScqInput = Input
const ScqChatMessage = ChatMessage

export default ScqVue
export { install, Button, Input, ChatMessage, ScqButton, ScqInput, ScqChatMessage }
