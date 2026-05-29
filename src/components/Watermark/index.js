import Watermark from './Watermark.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

Watermark.install = (app) => {
  const componentName = Watermark.name || 'Watermark'
  app.component(getPrefixedName(componentName), Watermark)
}

export default Watermark