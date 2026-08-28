import type { App, Plugin } from 'vue'
import ChatChoice from './ChatChoice.vue'

type SFCWithInstall<T> = T & Plugin

const _ChatChoice = ChatChoice as SFCWithInstall<typeof ChatChoice>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_ChatChoice.install = (app: App): void => {
  const componentName = _ChatChoice.name || 'ChatChoice'
  app.component(getPrefixedName(componentName), _ChatChoice)
}

export default _ChatChoice
export type {
  ChatChoiceAnswer,
  ChatChoiceMode,
  ChatChoiceOption,
  ChatChoiceValidationError,
  ChatChoiceValidationErrorType,
  ChatChoiceValue,
} from './ChatChoice.vue'