import Dialog from './Dialog.vue'
import { dialog } from './dialog-method'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

const dialogWithApi = Object.assign(Dialog, dialog)

dialogWithApi.install = (app) => {
  app.component(getPrefixedName(dialogWithApi.name || 'Dialog'), dialogWithApi)
}

export default dialogWithApi
