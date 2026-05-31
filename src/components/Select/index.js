import Select from './Select.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

Select.install = (app) => {
  app.component(getPrefixedName(Select.name), Select)
}

export default Select