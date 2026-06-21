import type { App, Plugin } from 'vue'
import Button from './components/Button'
import Input from './components/Input'
import Icon from './components/Icon'
import ChatMessage from './components/ChatMessage'
import Dialog from './components/Dialog/index'
import Modal from './components/Modal/index'
import Message from './components/Message/index'
import Popup from './components/Popup/index'
import Radio, { RadioGroup } from './components/Radio'
import Checkbox, { CheckboxGroup } from './components/Checkbox'
import Watermark from './components/Watermark'
import Select from './components/Select'

const components = [Button, Input, Icon, ChatMessage, Dialog, Modal, Message, Popup, Radio, RadioGroup, Checkbox, CheckboxGroup, Watermark, Select]

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

export default ScqVue
export {
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
  ScqWatermark,
  ScqCheckboxGroup,
  ScqSelect,
}
export type { IconName, IconVariant } from './components/Icon'
export { iconNames, iconPaths, solidIconNames, solidIconPaths } from './components/Icon'
export type { DialogApiOptions, DialogInstance } from './components/Dialog/index'
export type { ModalApiOptions, ModalInstance } from './components/Modal/index'
export type { MessageApiOptions, MessageInstance, MessagePlacement, MessageType } from './components/Message/index'
export type { PopupPosition, PopupOverlayTheme, PopupCloseReason } from './components/Popup/index'
export type { RadioDirection, RadioSize, RadioValue } from './components/Radio'
export type { CheckboxDirection, CheckboxSize, CheckboxValue } from './components/Checkbox'
export type { ChatAttachment, ChatAttachmentClickPayload, ChatAttachmentStatus, ChatAttachmentType, ChatContentType, ChatMediaMessage, ChatMediaType, ChatMessageStatus, ChatRole, ChatStatusType, ChatVideoPreload } from './components/ChatMessage'
