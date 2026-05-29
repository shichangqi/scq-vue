import type { App, Plugin } from 'vue'
import Watermark from './Watermark.vue'

type SFCWithInstall<T> = T & Plugin

const _Watermark = Watermark as SFCWithInstall<typeof Watermark>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Watermark.install = (app: App): void => {
  const componentName = _Watermark.name || 'Watermark'
  app.component(getPrefixedName(componentName), _Watermark)
}

export default _Watermark