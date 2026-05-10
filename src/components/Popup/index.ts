import type { App, Plugin } from 'vue'
import Popup from './Popup.vue'

type SFCWithInstall<T> = T & Plugin

const _Popup = Popup as SFCWithInstall<typeof Popup>

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Popup.install = (app: App): void => {
  const componentName = _Popup.name || 'Popup'
  app.component(getPrefixedName(componentName), _Popup)
}

export type { PopupPosition, PopupOverlayTheme, PopupCloseReason } from './Popup.vue'
export default _Popup
