import type { App, Plugin } from 'vue'
import Icon from './Icon.vue'
import { iconNames, iconPaths, solidIconNames, solidIconPaths } from './icons'

type SFCWithInstall<T> = T & Plugin

const _Icon = Icon as SFCWithInstall<typeof Icon>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Icon.install = (app: App): void => {
  const componentName = _Icon.name || 'Icon'
  app.component(getPrefixedName(componentName), _Icon)
}

export default _Icon
export { iconNames, iconPaths, solidIconNames, solidIconPaths }
export type { IconName, IconVariant } from './icons'