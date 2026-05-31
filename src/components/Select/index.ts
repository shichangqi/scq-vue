import type { App, Plugin } from 'vue'
import Select from './Select.vue'

type SFCWithInstall<T> = T & Plugin

const _Select = Select as SFCWithInstall<typeof Select>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Select.install = (app: App): void => {
  const componentName = _Select.name || 'Select'
  app.component(getPrefixedName(componentName), _Select)
}

export default _Select