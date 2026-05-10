import Popup from './Popup.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

Popup.install = (app) => {
  app.component(getPrefixedName(Popup.name || 'Popup'), Popup)
}

export default Popup
