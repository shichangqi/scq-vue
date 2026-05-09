// 导入所有组件
import Button from './components/Button'
import Input from './components/Input'
import ChatMessage from './components/ChatMessage'
import Dialog from './components/Dialog'
import Modal from './components/Modal'

// 组件列表
const components = [
  Button,
  Input,
  ChatMessage,
  Dialog,
  Modal
]

const getPrefixedName = (name) => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

// 定义install方法，接收Vue实例作为参数
const install = (app) => {
  // 遍历注册所有组件
  components.forEach(component => {
    app.component(getPrefixedName(component.name), component)
  })
}

// 判断是否直接通过script标签引入，如果是，会自动安装
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

const ScqButton = Button
const ScqInput = Input
const ScqChatMessage = ChatMessage
const ScqDialog = Dialog
const ScqModal = Modal

// 导出install方法和所有组件
export default {
  install,
  Button,
  Input,
  ChatMessage,
  Dialog,
  Modal,
  ScqButton,
  ScqInput,
  ScqChatMessage,
  ScqDialog,
  ScqModal
}

// 按需导出各个组件
export {
  Button,
  Input,
  ChatMessage,
  Dialog,
  Modal,
  ScqButton,
  ScqInput,
  ScqChatMessage,
  ScqDialog,
  ScqModal
}
