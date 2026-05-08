import type { App, Plugin } from 'vue'
import Button from './Button.vue'

type SFCWithInstall<T> = T & Plugin

const _Button = Button as SFCWithInstall<typeof Button>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Button.install = (app: App): void => {
  const componentName = _Button.name || 'Button'
  app.component(getPrefixedName(componentName), _Button)
}

export default _Button
