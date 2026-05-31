import type { App, Plugin } from 'vue'
import Button from './components/Button'
import Input from './components/Input'
import ChatMessage from './components/ChatMessage'
import Dialog from './components/Dialog/index'
import Modal from './components/Modal/index'
import Popup from './components/Popup/index'
import Radio, { RadioGroup } from './components/Radio'
import Checkbox, { CheckboxGroup } from './components/Checkbox'
import Watermark from './components/Watermark'
import Select from './components/Select'

const components = [Button, Input, ChatMessage, Dialog, Modal, Popup, Radio, RadioGroup, Checkbox, CheckboxGroup, Watermark, Select]

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

const install = (app: App): void => {
  components.forEach((component) => {
    const componentName = (component as { name?: string }).name
    if (componentName) {
      app.component(getPrefixedName(componentName), component)
    }
  })
}

const ScqVue: Plugin = {
  install,
}

const ScqButton = Button
const ScqInput = Input
const ScqChatMessage = ChatMessage
const ScqDialog = Dialog
const ScqModal = Modal
const ScqPopup = Popup
const ScqRadio = Radio
const ScqRadioGroup = RadioGroup
const ScqCheckbox = Checkbox
const ScqCheckboxGroup = CheckboxGroup
const ScqWatermark = Watermark
const ScqSelect = Select

export default ScqVue
export {
  install,
  Button,
  Input,
  ChatMessage,
  Dialog,
  Modal,
  Popup,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Watermark,
  Select,
  ScqButton,
  ScqInput,
  ScqChatMessage,
  ScqDialog,
  ScqModal,
  ScqPopup,
  ScqRadio,
  ScqRadioGroup,
  ScqCheckbox,
  ScqWatermark,
  ScqCheckboxGroup,
  ScqSelect,
}
export type { DialogApiOptions, DialogInstance } from './components/Dialog/index'
export type { ModalApiOptions, ModalInstance } from './components/Modal/index'
export type { PopupPosition, PopupOverlayTheme, PopupCloseReason } from './components/Popup/index'
export type { RadioDirection, RadioSize, RadioValue } from './components/Radio'
export type { CheckboxDirection, CheckboxSize, CheckboxValue } from './components/Checkbox'
