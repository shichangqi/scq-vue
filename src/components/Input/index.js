 import Input from './Input.vue'

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

// 为组件添加install方法，使其能够被Vue.use()使用
Input.install = (app) => {
  app.component(getPrefixedName(Input.name), Input)
}

export default Input
