import type { App, Plugin } from 'vue'
import Input from './Input.vue'

type SFCWithInstall<T> = T & Plugin

const _Input = Input as SFCWithInstall<typeof Input>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Input.install = (app: App): void => {
  const componentName = _Input.name || 'Input'
  app.component(getPrefixedName(componentName), _Input)
}

export default _Input
