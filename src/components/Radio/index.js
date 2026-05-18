import Radio from './Radio.vue'
import RadioGroup from './RadioGroup.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

Radio.Group = RadioGroup

Radio.install = (app) => {
  app.component(getPrefixedName(Radio.name || 'Radio'), Radio)
  app.component(getPrefixedName(RadioGroup.name || 'RadioGroup'), RadioGroup)
}

export { RadioGroup }
export default Radio
