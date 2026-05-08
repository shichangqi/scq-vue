import Button from './Button.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

// 为组件添加install方法，使其能够被Vue.use()使用
Button.install = (app) => {
  app.component(getPrefixedName(Button.name), Button)
}

export default Button
