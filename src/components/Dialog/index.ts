import type { App, Plugin } from 'vue'
import Dialog from './Dialog.vue'
import { dialog, type DialogApiOptions, type DialogInstance } from './dialog-method'

type SFCWithInstall<T> = T & Plugin

type DialogWithApi = SFCWithInstall<typeof Dialog> & {
  open: typeof dialog.open
  setGlobalZIndex: typeof dialog.setGlobalZIndex
  destroyAll: typeof dialog.destroyAll
  info: typeof dialog.info
  success: typeof dialog.success
  warning: typeof dialog.warning
  error: typeof dialog.error
  confirm: typeof dialog.confirm
}

const _Dialog = Object.assign(Dialog, dialog) as DialogWithApi

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Dialog.install = (app: App): void => {
  const componentName = _Dialog.name || 'Dialog'
  app.component(getPrefixedName(componentName), _Dialog)
}

export type { DialogApiOptions, DialogInstance }
export default _Dialog
