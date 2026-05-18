import Checkbox from './Checkbox.vue'
import CheckboxGroup from './CheckboxGroup.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

Checkbox.Group = CheckboxGroup

Checkbox.install = (app) => {
  app.component(getPrefixedName(Checkbox.name || 'Checkbox'), Checkbox)
  app.component(getPrefixedName(CheckboxGroup.name || 'CheckboxGroup'), CheckboxGroup)
}

export { CheckboxGroup }
export default Checkbox
