import type { App, Plugin } from 'vue'
import '../styles/index.css'
import Button from './components/Button'
import Input from './components/Input'
import Icon from './components/Icon'
import ChatMessage from './components/ChatMessage'
import ChatChoice from './components/ChatChoice'
import Dialog from './components/Dialog/index'
import Modal from './components/Modal/index'
import Message from './components/Message/index'
import Popup from './components/Popup/index'
import Radio, { RadioGroup } from './components/Radio'
import Checkbox, { CheckboxGroup } from './components/Checkbox'
import Watermark from './components/Watermark'
import Select from './components/Select'
import ConfigProvider from './components/ConfigProvider'
import Switch from './components/Switch'
import InputNumber from './components/InputNumber'
import Form, { FormItem } from './components/Form'
import Space from './components/Space'
import Divider from './components/Divider'
import Loading from './components/Loading'
import Empty from './components/Empty'
import Skeleton from './components/Skeleton'
import Alert from './components/Alert'
import Tag from './components/Tag'
import Badge from './components/Badge'
import Tabs from './components/Tabs'
import Pagination from './components/Pagination'
import Tooltip from './components/Tooltip'
import Popover from './components/Popover'
import Drawer from './components/Drawer'
import ActionSheet from './components/ActionSheet'
import Cell, { CellGroup } from './components/Cell'
import NavBar from './components/NavBar'
import Tabbar from './components/Tabbar'
import Table from './components/Table'
import Toast from './components/Toast'
import Search from './components/Search'
import NoticeBar from './components/NoticeBar'
import Progress from './components/Progress'
import Avatar from './components/Avatar'
import Collapse, { CollapseItem } from './components/Collapse'
import Picker from './components/Picker'
import List from './components/List'
import PullRefresh from './components/PullRefresh'
import Swipe from './components/Swipe'
import SwipeCell from './components/SwipeCell'
import Calendar from './components/Calendar'
import ActionBar from './components/ActionBar'
import DatePicker from './components/DatePicker'
import TimePicker from './components/TimePicker'
import Upload from './components/Upload'
import Slider from './components/Slider'
import Rate from './components/Rate'
import AutoComplete from './components/AutoComplete'
import Cascader from './components/Cascader'
import TreeSelect from './components/TreeSelect'
import Transfer from './components/Transfer'
import Menu from './components/Menu'
import Dropdown from './components/Dropdown'
import Breadcrumb from './components/Breadcrumb'
import Steps from './components/Steps'
import Image from './components/Image'
import Card from './components/Card'
import Descriptions from './components/Descriptions'
import Tree from './components/Tree'
import VirtualList from './components/VirtualList'
import Notification from './components/Notification'
import Popconfirm from './components/Popconfirm'
import Result from './components/Result'
import Link from './components/Link'
import Typography from './components/Typography'
import Grid from './components/Grid'
import Layout from './components/Layout'
import Container from './components/Container'

const components = [Button, Input, Icon, ChatMessage, ChatChoice, Dialog, Modal, Message, Popup, Radio, RadioGroup, Checkbox, CheckboxGroup, Watermark, Select, ConfigProvider, Switch, InputNumber, Form, FormItem, Space, Divider, Loading, Empty, Skeleton, Alert, Tag, Badge, Tabs, Pagination, Tooltip, Popover, Drawer, ActionSheet, Cell, CellGroup, NavBar, Tabbar, Table, Toast, Search, NoticeBar, Progress, Avatar, Collapse, CollapseItem,
  Picker, List, PullRefresh, Swipe, SwipeCell, Calendar, ActionBar,
  DatePicker, TimePicker, Upload, Slider, Rate, AutoComplete, Cascader, TreeSelect, Transfer,
  Menu, Dropdown, Breadcrumb, Steps, Image, Card, Descriptions, Tree, VirtualList,
  Notification, Popconfirm, Result, Link, Typography, Grid, Layout, Container]

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
const ScqChatChoice = ChatChoice
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
  ChatChoice,
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
  ScqChatChoice,
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
  ConfigProvider, ConfigProvider as ScqConfigProvider,
  Switch, Switch as ScqSwitch,
  InputNumber, InputNumber as ScqInputNumber,
  Form, Form as ScqForm,
  FormItem, FormItem as ScqFormItem,
  Space, Space as ScqSpace,
  Divider, Divider as ScqDivider,
  Loading, Loading as ScqLoading,
  Empty, Empty as ScqEmpty,
  Skeleton, Skeleton as ScqSkeleton,
  Alert, Alert as ScqAlert,
  Tag, Tag as ScqTag,
  Badge, Badge as ScqBadge,
  Tabs, Tabs as ScqTabs,
  Pagination, Pagination as ScqPagination,
  Tooltip, Tooltip as ScqTooltip,
  Popover, Popover as ScqPopover,
  Drawer, Drawer as ScqDrawer,
  ActionSheet, ActionSheet as ScqActionSheet,
  Cell, Cell as ScqCell,
  CellGroup, CellGroup as ScqCellGroup,
  NavBar, NavBar as ScqNavBar,
  Tabbar, Tabbar as ScqTabbar,
  Table, Table as ScqTable,
  Toast, Toast as ScqToast,
  Search, Search as ScqSearch,
  NoticeBar, NoticeBar as ScqNoticeBar,
  Progress, Progress as ScqProgress,
  Avatar, Avatar as ScqAvatar,
  Collapse, Collapse as ScqCollapse,
  CollapseItem, CollapseItem as ScqCollapseItem,
  Picker, Picker as ScqPicker,
  List, List as ScqList,
  PullRefresh, PullRefresh as ScqPullRefresh,
  Swipe, Swipe as ScqSwipe,
  SwipeCell, SwipeCell as ScqSwipeCell,
  Calendar, Calendar as ScqCalendar,
  ActionBar, ActionBar as ScqActionBar,
  DatePicker, DatePicker as ScqDatePicker,
  TimePicker, TimePicker as ScqTimePicker,
  Upload, Upload as ScqUpload,
  Slider, Slider as ScqSlider,
  Rate, Rate as ScqRate,
  AutoComplete, AutoComplete as ScqAutoComplete,
  Cascader, Cascader as ScqCascader,
  TreeSelect, TreeSelect as ScqTreeSelect,
  Transfer, Transfer as ScqTransfer,
  Menu, Menu as ScqMenu,
  Dropdown, Dropdown as ScqDropdown,
  Breadcrumb, Breadcrumb as ScqBreadcrumb,
  Steps, Steps as ScqSteps,
  Image, Image as ScqImage,
  Card, Card as ScqCard,
  Descriptions, Descriptions as ScqDescriptions,
  Tree, Tree as ScqTree,
  VirtualList, VirtualList as ScqVirtualList,
  Notification, Notification as ScqNotification,
  Popconfirm, Popconfirm as ScqPopconfirm,
  Result, Result as ScqResult,
  Link, Link as ScqLink,
  Typography, Typography as ScqTypography,
  Grid, Grid as ScqGrid,
  Layout, Layout as ScqLayout,
  Container, Container as ScqContainer,
}
export type { PickerValue, PickerOption, PickerSelection } from './components/Picker'
export type { PullRefreshStatus } from './components/PullRefresh'
export type { SwipeItem } from './components/Swipe'
export type { SwipeCellPosition, SwipeCellClose } from './components/SwipeCell'
export type { CalendarValue, CalendarType } from './components/Calendar'
export type { ActionBarItem } from './components/ActionBar'
export type { DatePickerValue } from './components/DatePicker'
export type { TimePickerValue } from './components/TimePicker'
export type { UploadStatus, UploadFile, UploadRequestOptions } from './components/Upload'
export type { SliderValue } from './components/Slider'
export type { AutoCompleteOption } from './components/AutoComplete'
export type { CascaderOption, CascaderValue } from './components/Cascader'
export type { TreeSelectValue } from './components/TreeSelect'
export type { TransferKey, TransferItem } from './components/Transfer'
export type { MenuKey, MenuItemOption } from './components/Menu'
export type { DropdownItem } from './components/Dropdown'
export type { BreadcrumbItem } from './components/Breadcrumb'
export type { StepStatus, StepItem } from './components/Steps'
export type { DescriptionItem } from './components/Descriptions'
export type { TreeKey, TreeNode, TreeCheck, TreeEntry } from './components/Tree'
export type { NotificationType, NotificationPosition, NotificationOptions, NotificationInstance } from './components/Notification'
export type { ResultStatus } from './components/Result'
export type { GridBreakpoints } from './components/Grid'
export type { ToastType, ToastPosition, ToastApiOptions, ToastInstance } from './components/Toast'
export type { NoticeBarType } from './components/NoticeBar'
export type { ProgressStatus } from './components/Progress'
export type { CollapseName, CollapseValue } from './components/Collapse'
export type { ComponentConfig, ComponentLocale, ComponentSize, ThemeTokens } from './components/ConfigProvider'
export type { FormInstance, FormLabelPosition, FormModel, FormRule, FormRules, FormTrigger } from './components/Form'
export type { TabItem } from './components/Tabs'
export type { FloatingProps, FloatingPlacement } from './components/Tooltip'
export type { DrawerPosition, DrawerCloseReason } from './components/Drawer'
export type { ActionSheetItem } from './components/ActionSheet'
export type { TabbarItem } from './components/Tabbar'
export type { TableColumn, TableRow, TableRowKey, TableSort } from './components/Table'
export type { IconName, IconVariant } from './components/Icon'
export { iconNames, iconPaths, solidIconNames, solidIconPaths } from './components/Icon'
export type { DialogApiOptions, DialogInstance } from './components/Dialog/index'
export type { ModalApiOptions, ModalInstance } from './components/Modal/index'
export type { MessageApiOptions, MessageInstance, MessagePlacement, MessageType } from './components/Message/index'
export type { PopupPosition, PopupOverlayTheme, PopupCloseReason } from './components/Popup/index'
export type { RadioDirection, RadioSize, RadioValue } from './components/Radio'
export type { CheckboxDirection, CheckboxSize, CheckboxValue } from './components/Checkbox'
export type { ChatAttachment, ChatAttachmentClickPayload, ChatAttachmentStatus, ChatAttachmentType, ChatContentType, ChatMediaMessage, ChatMediaType, ChatMessageSelection, ChatMessageSelectionMode, ChatMessageSelectionOption, ChatMessageSelectionPayload, ChatMessageSelectionStatus, ChatMessageSelectionValue, ChatMessageStatus, ChatRole, ChatStatusTexts, ChatStatusType, ChatVideoPreload } from './components/ChatMessage'
export type { ChatChoiceAnswer, ChatChoiceMode, ChatChoiceOption, ChatChoiceValidationError, ChatChoiceValidationErrorType, ChatChoiceValue } from './components/ChatChoice'
