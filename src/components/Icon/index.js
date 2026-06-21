import Icon from './Icon.vue'
import { iconNames, iconPaths, solidIconNames, solidIconPaths } from './icons'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

Icon.install = (app) => {
  app.component(getPrefixedName(Icon.name), Icon)
}

export default Icon
export { iconNames, iconPaths, solidIconNames, solidIconPaths }