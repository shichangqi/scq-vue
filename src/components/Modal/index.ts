import type { App, Plugin } from 'vue'
import Modal from './Modal.vue'
import { modal, type ModalApiOptions, type ModalInstance } from './modal-method'

type SFCWithInstall<T> = T & Plugin

type ModalWithApi = SFCWithInstall<typeof Modal> & {
  open: typeof modal.open
  setGlobalZIndex: typeof modal.setGlobalZIndex
  destroyAll: typeof modal.destroyAll
  info: typeof modal.info
  confirm: typeof modal.confirm
}

const _Modal = Object.assign(Modal, modal) as ModalWithApi

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Modal.install = (app: App): void => {
  const componentName = _Modal.name || 'Modal'
  app.component(getPrefixedName(componentName), _Modal)
}

export type { ModalApiOptions, ModalInstance }
export default _Modal
