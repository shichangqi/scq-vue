// 导入所有组件
import Button from './components/Button'
import Input from './components/Input'
import Icon, { iconNames, iconPaths, solidIconNames, solidIconPaths } from './components/Icon'
import ChatMessage from './components/ChatMessage'
import Dialog from './components/Dialog'
import Modal from './components/Modal'
import Message from './components/Message'
import Popup from './components/Popup'
import Radio, { RadioGroup } from './components/Radio'
import Checkbox, { CheckboxGroup } from './components/Checkbox'
import Watermark from './components/Watermark'
import Select from './components/Select'

// 组件列表
const components = [
  Button,
  Input,
  Icon,
  ChatMessage,
  Dialog,
  Modal,
  Message,
  Popup,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Watermark,
  Select
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
const ScqIcon = Icon
const ScqChatMessage = ChatMessage
const ScqDialog = Dialog
const ScqModal = Modal
const ScqMessage = Message
const ScqPopup = Popup
const ScqRadio = Radio
const ScqRadioGroup = RadioGroup
const ScqCheckbox = Checkbox
const ScqCheckboxGroup = CheckboxGroup
const ScqWatermark = Watermark
const ScqSelect = Select

// 导出install方法和所有组件
export default {
  install,
  Button,
  Input,
  Icon,
  ChatMessage,
  Dialog,
  Modal,
  Message,
  Popup,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Watermark,
  Select,
  iconNames,
  iconPaths,
  solidIconNames,
  solidIconPaths,
  ScqButton,
  ScqInput,
  ScqIcon,
  ScqChatMessage,
  ScqDialog,
  ScqModal,
  ScqMessage,
  ScqPopup,
  ScqRadio,
  ScqRadioGroup,
  ScqCheckbox,
  ScqCheckboxGroup,
  ScqWatermark,
  ScqSelect
}

// 按需导出各个组件
export {
  Button,
  Input,
  Icon,
  ChatMessage,
  Dialog,
  Modal,
  Message,
  Popup,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Select,
  ScqButton,
  ScqInput,
  ScqIcon,
  ScqChatMessage,
  ScqDialog,
  ScqModal,
  ScqMessage,
  ScqPopup,
  ScqRadio,
  ScqRadioGroup,
  ScqCheckbox,
  ScqCheckboxGroup,
  ScqWatermark,
  ScqSelect
}
