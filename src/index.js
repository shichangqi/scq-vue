// 导入所有组件
import Button from './components/Button'
import Input from './components/Input'
import Icon, { iconNames, iconPaths, solidIconNames, solidIconPaths } from './components/Icon'
import ChatMessage from './components/ChatMessage'
import ChatChoice from './components/ChatChoice'
import Dialog from './components/Dialog'
import Modal from './components/Modal'
import Message from './components/Message'
import Popup from './components/Popup'
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

// 组件列表
const components = [
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
  ConfigProvider, Switch, InputNumber, Form, FormItem, Space, Divider,
  Loading, Empty, Skeleton, Alert, Tag, Badge, Tabs, Pagination,
  Tooltip, Popover, Drawer, ActionSheet, Cell, CellGroup, NavBar, Tabbar, Table,
  Toast, Search, NoticeBar, Progress, Avatar, Collapse, CollapseItem,
  Picker, List, PullRefresh, Swipe, SwipeCell, Calendar, ActionBar,
  DatePicker, TimePicker, Upload, Slider, Rate, AutoComplete, Cascader, TreeSelect, Transfer,
  Menu, Dropdown, Breadcrumb, Steps, Image, Card, Descriptions, Tree, VirtualList,
  Notification, Popconfirm, Result, Link, Typography, Grid, Layout, Container
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

// 导出install方法和所有组件
export default {
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
  iconNames,
  iconPaths,
  solidIconNames,
  solidIconPaths,
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
  ScqCheckboxGroup,
  ScqWatermark,
  ScqSelect,
  ConfigProvider, Switch, InputNumber, Form, FormItem, Space, Divider,
  Loading, Empty, Skeleton, Alert, Tag, Badge, Tabs, Pagination,
  ScqConfigProvider: ConfigProvider, ScqSwitch: Switch, ScqInputNumber: InputNumber,
  ScqForm: Form, ScqFormItem: FormItem, ScqSpace: Space, ScqDivider: Divider,
  ScqLoading: Loading, ScqEmpty: Empty, ScqSkeleton: Skeleton, ScqAlert: Alert,
  ScqTag: Tag, ScqBadge: Badge, ScqTabs: Tabs, ScqPagination: Pagination,
  Tooltip, Popover, Drawer, ActionSheet, Cell, CellGroup, NavBar, Tabbar, Table,
  ScqTooltip: Tooltip, ScqPopover: Popover, ScqDrawer: Drawer, ScqActionSheet: ActionSheet,
  ScqCell: Cell, ScqCellGroup: CellGroup, ScqNavBar: NavBar, ScqTabbar: Tabbar, ScqTable: Table,
  Toast, Search, NoticeBar, Progress, Avatar, Collapse, CollapseItem,
  ScqToast: Toast, ScqSearch: Search, ScqNoticeBar: NoticeBar, ScqProgress: Progress,
  ScqAvatar: Avatar, ScqCollapse: Collapse, ScqCollapseItem: CollapseItem,
  Picker, List, PullRefresh, Swipe, SwipeCell, Calendar, ActionBar,
  DatePicker, TimePicker, Upload, Slider, Rate, AutoComplete, Cascader, TreeSelect, Transfer,
  Menu, Dropdown, Breadcrumb, Steps, Image, Card, Descriptions, Tree, VirtualList,
  Notification, Popconfirm, Result, Link, Typography, Grid, Layout, Container,
  ScqPicker: Picker, ScqList: List, ScqPullRefresh: PullRefresh, ScqSwipe: Swipe,
  ScqSwipeCell: SwipeCell, ScqCalendar: Calendar, ScqActionBar: ActionBar,
  ScqDatePicker: DatePicker, ScqTimePicker: TimePicker, ScqUpload: Upload,
  ScqSlider: Slider, ScqRate: Rate, ScqAutoComplete: AutoComplete,
  ScqCascader: Cascader, ScqTreeSelect: TreeSelect, ScqTransfer: Transfer,
  ScqMenu: Menu, ScqDropdown: Dropdown, ScqBreadcrumb: Breadcrumb, ScqSteps: Steps,
  ScqImage: Image, ScqCard: Card, ScqDescriptions: Descriptions, ScqTree: Tree,
  ScqVirtualList: VirtualList, ScqNotification: Notification, ScqPopconfirm: Popconfirm,
  ScqResult: Result, ScqLink: Link, ScqTypography: Typography,
  ScqGrid: Grid, ScqLayout: Layout, ScqContainer: Container
}

// 按需导出各个组件
export {
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
  ScqCheckboxGroup,
  ScqWatermark,
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
  Container, Container as ScqContainer
}
