import Modal from './Modal.vue'
import { modal } from './modal-method'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

const modalWithApi = Object.assign(Modal, modal)

modalWithApi.install = (app) => {
  app.component(getPrefixedName(modalWithApi.name || 'Modal'), modalWithApi)
}

export default modalWithApi
