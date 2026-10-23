import { sourceExample } from './example-sources'
import { createExtendedReferences } from './reference-extended'
import { createEnhancementReferences } from './reference-enhancements'

export interface DocText { zh: string; en: string }
export interface ApiRow { name: string; type: string; defaultValue: string; description: DocText }
export interface ExampleEntry { title: DocText; code: string; variant?: string; source?: string; files?: Record<string, string> }
export interface ComponentReference {
  description: DocText
  demo: 'basic' | 'form' | 'navigation' | 'overlay' | 'mobile' | 'table' | 'chat-choice'
  examples: ExampleEntry[]
  props: ApiRow[]
  events?: ApiRow[]
  slots?: ApiRow[]
  methods?: ApiRow[]
  note?: DocText
}

export const text = (zh: string, en: string): DocText => ({ zh, en })
export const row = (name: string, type: string, defaultValue: string, zh: string, en: string): ApiRow => ({ name, type, defaultValue, description: text(zh, en) })
export const sample = (template: string, setup = '') => `<template>\n${template}\n</template>${setup ? `\n\n<script setup lang="ts">\nimport { ref, reactive } from 'vue'\n\n${setup}\n<\/script>` : ''}`
const basic = text('基础用法', 'Basic Usage')
const states = text('尺寸与状态', 'Sizes and States')
const modelEvent = row('update:modelValue / change', '(value) => void', '-', '绑定值变化时触发', 'Emitted when the value changes')
const sizeProp = row('size', 'small | default | large', 'provider / default', '尺寸，显式属性优先，否则继承 ConfigProvider', 'Explicit size takes precedence over ConfigProvider')
const disabledProp = row('disabled', 'boolean', 'provider / false', '禁用交互，显式 false 可覆盖 ConfigProvider', 'Disable interaction; explicit false overrides ConfigProvider')
const defaultSlot = row('default', '-', '-', '自定义内容', 'Custom content')

export const componentReferences: Record<string, ComponentReference> = {
  ...createExtendedReferences({ row, text }),
  toast: {
    description: text('移动端轻提示，支持文字、成功、失败、加载和模板控制。', 'Mobile toast notifications with text, success, failure, loading and controlled templates.'),
    demo: 'mobile',
    examples: [
      { title: text('常见反馈与位置', 'Feedback and Position'), ...sourceExample('ToastFeedbackExample', true) },
      { title: text('加载与更新结果', 'Loading and Updating'), ...sourceExample('ToastLoadingExample', true) },
      { title: text('模板受控显示', 'Controlled Template'), ...sourceExample('ToastTemplateExample', true) },
    ],
    props: [
      row('modelValue', 'boolean', 'false', '模板显示状态，支持 v-model', 'Template visibility with v-model'),
      row('message', 'string', "''", '提示内容，支持换行，不解析 HTML', 'Plain text, supports newlines; no HTML parsing'),
      row('type', 'text | success | fail | loading', 'text', '提示类型', 'Notification type'),
      row('position', 'top | middle | bottom', 'middle', '显示位置', 'Placement'),
      row('duration', 'number', '2000 / loading: 0', '毫秒；非正数不自动关闭，必须有限且不超过 2147483647', 'Milliseconds; non-positive values disable dismissal, must be finite and at most 2147483647'),
      row('icon', 'IconName', '-', '自定义状态图标', 'Custom status icon'),
      row('overlay / forbidClick', 'boolean', 'false', '显示遮罩或阻止背景指针操作', 'Show an overlay or block background pointer interaction'),
      row('closeOnClick / closeOnClickOverlay', 'boolean', 'false', '点击内容或遮罩时关闭', 'Dismiss on content or overlay click'),
      row('teleport', 'boolean | string', 'true', '模板挂载目标；方法调用传选择器字符串', 'Template target; method calls accept a selector string'),
      row('zIndex', 'number', '4000', '提示层级', 'Stacking order'),
    ],
    events: [row('update:modelValue', '(visible: boolean) => void', '-', '请求关闭时返回 false', 'Emit false on dismissal'), row('open / opened / close / closed', '() => void', '-', '显示、关闭及过渡完成', 'Visibility and transition lifecycle'), row('click', '(event: MouseEvent) => void', '-', '提示内容点击', 'Toast content clicked')],
    slots: [defaultSlot, row('icon', '-', '-', '自定义图标区域', 'Custom icon area')],
    methods: [
      row('useToast', '() => scoped Toast API', '-', '在 setup 中绑定当前配置；作用域内同一容器替换，卸载时清理', 'Bind configuration in setup; replace within the same scope and target, and dispose on unmount'),
      row('Toast.show / success / fail / loading', '(message | options, appContext?) => ToastInstance', '-', '同一目标替换旧提示，返回实例', 'Replace the toast in the same target and return an instance'),
      row('instance.update', '(options) => void', '-', '更新文字、类型和时长，重新计时；不移动挂载容器', 'Update content, type and duration; restart timer without changing target'),
      row('instance.close / exposed.close', '() => void', '-', '手动关闭', 'Dismiss manually'),
      row('Toast.clear / destroyAll', '(selector?: string) => void', '-', '清理指定容器或全部方法实例', 'Dispose method instances in one target or all targets'),
      row('options.onClose / options.onClosed', '() => void', '-', '关闭开始与实例清理回调', 'Dismissal and disposal callbacks'),
    ],
    note: text('手机示例的 App.vue 和 PhonePreview.vue 源码均可复制。方法调用每个挂载容器只保留一个提示；无效配置或找不到目标明确报错，不替换已有提示；无效 update 不改变原实例，卸载后 close 不再发事件。加载示例仅本地模拟，没有网络请求。', 'Copy both App.vue and PhonePreview.vue for the phone examples. Method calls keep one toast per target; invalid options or missing targets throw without replacing existing feedback. Invalid updates preserve the instance, and close after unmount emits nothing. Loading is simulated locally without network requests.'),
  },
  search: {
    description: text('移动端搜索框，支持中文输入法、清空、取消和键盘搜索。在表单内按 Enter 仅触发搜索，不提交表单。', 'Mobile search with IME support, clearing, cancellation and keyboard search. Pressing Enter inside a form searches without submitting the form.'), demo: 'mobile',
    examples: [{ title: text('文档搜索', 'Document Search'), ...sourceExample('SearchExample', true) }],
    props: [row('modelValue', 'string', "''", '搜索内容', 'Search query'), row('nativeForm', 'boolean', 'auto', '默认独立使用原生 form，在 SCQ Form 内自动使用 div；嵌入普通 HTML form 时设为 false', 'Use a native form standalone and a div inside SCQ Form by default; set false inside a plain HTML form'), row('placeholder / label / ariaLabel', 'string', 'locale / empty', '占位、标签和无障碍名称', 'Placeholder, label and accessible name'), row('id / name', 'string', 'auto / empty', '原生输入标识', 'Native input identification'), row('shape', 'square | round', 'round', '输入区域形状', 'Field shape'), disabledProp, row('readonly', 'boolean', 'false', '只读，禁止清除和编辑', 'Prevent edits and clearing'), row('clearable', 'boolean', 'true', '显示清空按钮', 'Show clear control'), row('showAction', 'boolean', 'false', '显示取消操作', 'Show cancel action'), row('actionText', 'string', 'locale', '取消文字', 'Cancel label'), row('maxlength', 'number', '-', '最大输入长度', 'Maximum input length')],
    events: [row('update:modelValue / input', '(value: string) => void', '-', '输入更新，组合输入结束后提交', 'Input changes, committed after composition ends'), row('search', '(value: string) => void', '-', '提交搜索时触发', 'Search submitted'), row('clear / cancel', '() => void', '-', '清空或取消', 'Cleared or cancelled'), row('focus / blur', '(event: FocusEvent) => void', '-', '焦点事件', 'Focus events')],
    slots: [row('action', '{ cancel }', '-', '自定义右侧操作', 'Custom trailing action')],
    methods: [row('focus / blur / clear', '() => void', '-', '控制输入框', 'Control the input')],
  },
  'notice-bar': {
    description: text('页面内公告通知，支持多行、关闭和按内容宽度滚动。', 'Inline notices with wrapping, dismissal and overflow-aware scrolling.'), demo: 'mobile',
    note: text('modelValue 为可选受控可见性，关闭发出 update:modelValue(false)，可以显式重新显示。paused / update:paused 支持受控暂停；实例 pause()/resume()/play() 仅改变播放状态，不重置滚动位置，悬停和聚焦暂停仍有效。滚动内容按自然宽度观测，内部内容独立变长也会重新检测溢出；减少动画时完整换行。保留无效 speed/delay 的默认回退，计算时长溢出明确报错。', 'modelValue optionally controls visibility; closing emits update:modelValue(false) and the owner can reopen. paused / update:paused control playback; pause()/resume()/play() preserve scroll position. Hover/focus pauses remain effective. Intrinsic width observation detects independently growing content; reduced motion wraps the complete text. Invalid speed/delay retain default normalization; derived duration overflow reports an error.'),
    examples: [{ title: text('公告与服务状态', 'Notices and Service Status'), ...sourceExample('NoticeBarExample', true) }],
    props: [row('modelValue / paused', 'boolean', 'uncontrolled', '可选受控可见性和播放状态', 'Optional controlled visibility and playback'), row('text', 'string', "''", '公告文字', 'Notice text'), row('type', 'info | success | warning | danger', 'warning', '语义状态', 'Semantic status'), row('icon', 'IconName | false', 'bell', '左侧图标，false 隐藏', 'Leading icon; false hides it'), row('closable', 'boolean', 'false', '显示关闭按钮', 'Show dismiss action'), row('wrap', 'boolean', 'true', '多行展示；滚动需关闭此项', 'Wrap text; disable to enable scrolling'), row('scrollable', 'boolean', 'false', '仅溢出时滚动，遵循减少动画设置', 'Scroll only on overflow; respect reduced motion'), row('speed / delay', 'number', '40 / 1000', '滚动速度 px/s 与首次延迟 ms', 'Speed in px/s and initial delay in ms')],
    events: [row('click / close', '(event: MouseEvent) => void', '-', '点击通知或关闭', 'Notice click or dismissal'), row('update:modelValue / update:paused', '(value: boolean) => void', '-', '请求更新可见性/暂停状态', 'Request visibility/pause updates')],
    methods: [row('pause / resume / play / paused', '() => void / boolean', '-', '控制播放并读取手动暂停状态', 'Control playback and read the manual paused state')],
    slots: [defaultSlot, row('right', '-', '-', '未显示关闭按钮时的右侧内容', 'Trailing content when not closable')],
  },
  progress: {
    description: text('展示线性、环形或仪表盘进度，支持状态颜色、自定义文字和不确定进度，颜色可跟随主题或单独设置。', 'Display line, circle or dashboard progress with status colors, custom labels and indeterminate activity. Colors can follow the theme or be set explicitly.'), demo: 'basic',
    note: text('type 支持 line（默认）、circle、dashboard；width 默认 120px，用于环形尺寸。buffer 为缓冲百分比，裁剪到实际进度至 100；不确定模式不显示缓冲。color 也可传 { percentage, color }[]，选择第一个覆盖当前进度的阈值，显式颜色优先于状态色。所有形态沿用同一 aria-valuenow，未知进度不声明虚假数值。', 'type supports line (default), circle and dashboard; width defaults to 120px for circular variants. buffer is clamped between progress and 100 and hidden in indeterminate mode. color also accepts { percentage, color }[] and selects the first threshold covering progress, overriding status colors. All variants share aria-valuenow; unknown progress never reports a fabricated number.'),
    examples: [{ title: text('进度与状态', 'Progress and Status'), ...sourceExample('ProgressExample') }],
    props: [row('type / width', 'line | circle | dashboard / number', 'line / 120', '形态和环形宽度 px', 'Variant and circular width in pixels'), row('buffer', 'number', '-', '缓冲值，至少等于实际进度', 'Buffered percentage, never below actual progress'), row('percentage', 'number', '0', '进度值，规范到 0 至 100', 'Progress normalized to 0-100'), row('status', 'normal | success | warning | exception', 'normal', '状态颜色', 'Status color'), row('strokeWidth', 'number', '8', '轨道高度，单位 px', 'Track height in pixels'), row('color', 'string | ProgressColorStop[]', "''", '自定义颜色或阈值颜色，优先于状态色', 'Custom color or threshold colors, overriding status colors'), row('showText', 'boolean', 'true', '显示进度文字', 'Display progress text'), row('indeterminate', 'boolean', 'false', '未知总进度', 'Indeterminate activity'), row('format', '(percentage: number) => string', '-', '自定义文字', 'Format the text'), row('ariaLabel', 'string', 'locale', '进度条的无障碍名称', 'Accessible progress name')],
    slots: [row('default', '{ percentage }', '-', '自定义右侧内容', 'Custom trailing content')],
  },
  avatar: {
    description: text('图片、文字与图标头像，图片加载失败时自动回退。', 'Image, text and icon avatars with automatic image-error fallback.'), demo: 'basic',
    examples: [{ title: text('尺寸与回退内容', 'Sizes and Fallbacks'), ...sourceExample('AvatarExample') }],
    props: [row('src / alt', 'string', "''", '图片地址与替代文字', 'Image source and alternative text'), row('size', 'number | small | default | large', '40 / provider', '尺寸，可继承全局配置', 'Pixel size or inherited size preset'), row('shape', 'circle | square', 'circle', '头像形状', 'Avatar shape'), row('fit', 'cover | contain | fill | none | scale-down', 'cover', '图片填充方式', 'Image object-fit'), row('icon', 'IconName', 'user', '默认回退图标', 'Fallback icon'), row('loading', 'eager | lazy', 'lazy', '图片加载策略', 'Image loading strategy')],
    events: [row('load / error', '(event: Event) => void', '-', '图片加载或失败', 'Image load or error')], slots: [row('default', '-', '-', '无图片或加载失败时的回退内容', 'Fallback when missing or failed')],
  },
  collapse: {
    description: text('展开或收起相关内容，支持手风琴模式、键盘导航与懒加载。', 'Expand or collapse related content, with accordion mode, keyboard navigation and lazy loading.'), demo: 'basic',
    examples: [{ title: text('展开方式与内容保留', 'Expansion and Preserved Content'), ...sourceExample('CollapseExample') }],
    props: [row('modelValue', 'CollapseName | readonly CollapseName[]', '[]', '展开项，多开接受只读数组并去重，手风琴用单值；数字与字符串名称不混淆', 'Expanded names; multiple mode accepts readonly arrays and deduplicates, accordion uses a scalar; numeric and string names remain distinct'), row('accordion', 'boolean', 'false', '最多展开一项', 'Allow one expanded item'), disabledProp, row('CollapseItem.name', 'string | number', 'auto', '受控使用时应提供稳定唯一标识', 'Use a stable unique name for controlled panels'), row('CollapseItem.title', 'string', "''", '标题文字', 'Header text'), row('CollapseItem.disabled', 'boolean', 'false', '禁用当前项', 'Disable this item'), row('CollapseItem.lazy', 'boolean', 'false', '首次展开后挂载，关闭后保留内容', 'Mount on first expansion and preserve content')],
    events: [modelEvent], slots: [defaultSlot, row('CollapseItem.default', '-', '-', '折叠内容', 'Panel content'), row('CollapseItem.title / extra', '{ expanded }', '-', '自定义标题和辅助内容', 'Custom header and trailing content')],
  },
  'config-provider': {
    description: text('为子组件统一提供语言、尺寸、禁用状态和主题变量。', 'Provide shared locale, size, disabled state and theme tokens to child components.'),
    demo: 'basic',
    examples: [
      {
        title: text('作用域主题', 'Scoped Theme'),
        code: sample('  <scq-config-provider :tokens="{ primary: \'#00875a\' }" size="large">\n    <scq-space>\n      <scq-switch v-model="enabled" aria-label="消息通知" />\n      <scq-input-number v-model="count" aria-label="数量" />\n      <scq-tag type="success">Ready</scq-tag>\n    </scq-space>\n  </scq-config-provider>', "const enabled = ref(true)\nconst count = ref(3)"),
      },
      {
        title: text('暗色与英文', 'Dark Theme and English'),
        variant: 'states',
        code: sample('  <scq-config-provider theme="dark" locale="en-US">\n    <scq-empty />\n  </scq-config-provider>'),
      },
      { title: text('配置继承与作用域提示', 'Configuration Inheritance and Scoped Feedback'), ...sourceExample('ConfigProviderExample') },
    ],
    props: [
      row('locale', 'zh-CN | en-US', 'parent / zh-CN', '组件默认文案；显式文案和业务内容不自动翻译', 'Default UI labels; explicit labels and business content are not translated'),
      sizeProp,
      disabledProp,
      row('theme', 'light | dark', 'parent / unset', '作用域主题；嵌套覆盖，传送内容保持同步', 'Nested theme overrides; teleported content stays in sync'),
      row('tokens', 'ThemeTokens', 'parent / {}', '按键合并 primary、success、warning、danger、text、muted、border、surface、fill、radius；undefined 恢复继承，传送浮层和作用域方法同步', 'Merge primary, success, warning, danger, text, muted, border, surface, fill and radius by key; undefined restores inheritance, including portals and scoped feedback'),
    ],
    slots: [defaultSlot],
    methods: [
      row('useDialog / useModal / useMessage / useToast / useNotification', '() => scoped API', '-', '从组件库或对应组件入口导入；在 Provider 后代的 setup 中调用，已打开实例响应配置更新；不可改绑其他 appContext', 'Import from the library or corresponding component entry; call in setup below the provider; open instances react to updates; rebinding to another appContext is not allowed'),
      row('scoped.destroyAll / clear / closeAll', 'same as component API', '-', '仅清理此调用作用域；所属组件卸载时自动清理，setGlobalZIndex 仍是全局设置', 'Dispose only this invocation scope; owner unmount also disposes it; setGlobalZIndex remains global'),
    ],
    note: text('组件显式属性 > 最近配置作用域 > 默认值；RadioGroup/CheckboxGroup 的组尺寸与整组禁用约束保持不变，Form 的原生 fieldset 禁用约束仍生效。仅标准 small/default/large 尺寸继承，像素尺寸与业务文本不重解释。全局静态方法不会自动捕获局部 Provider，可使用作用域方法或显式 appContext；作用域方法的批量清理不会影响其他作用域。', 'Explicit component props > nearest scope > defaults. RadioGroup/CheckboxGroup size and group-disable constraints remain, as does the native Form fieldset constraint. Only standard small/default/large sizes inherit; pixel dimensions and business content are unchanged. Global static methods do not capture local providers; use scoped methods or an explicit appContext. Scoped cleanup never clears other scopes.'),
  },
  switch: {
    description: text('在两种互斥状态之间切换，支持键盘、加载和禁用状态。', 'Toggle between two states with keyboard, loading and disabled support.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-switch v-model="enabled" active-text="已开启" inactive-text="已关闭" />', "const enabled = ref(true)"),
      },
      {
        title: states,
        variant: 'states',
        code: sample('  <scq-space>\n    <scq-switch :model-value="true" size="small" aria-label="Small" />\n    <scq-switch :model-value="true" aria-label="Default" />\n    <scq-switch :model-value="true" size="large" aria-label="Large" />\n    <scq-switch :model-value="true" loading aria-label="加载中" />\n    <scq-switch disabled aria-label="禁用" />\n  </scq-space>'),
      },
    ],
    props: [
      row('modelValue', 'boolean', 'false', '开关状态', 'Checked state'),
      sizeProp,
      disabledProp,
      row('loading', 'boolean', 'false', '显示加载并阻止切换', 'Show loading and prevent changes'),
      row('activeText / inactiveText', 'string', "''", '打开和关闭时的文字', 'Text for the on and off states'),
      row('name', 'string', "''", '原生输入名称', 'Native input name'),
      row('ariaLabel', 'string', "''", '没有可见文字时的无障碍名称', 'Accessible name when there is no visible label'),
    ],
    events: [modelEvent],
    slots: [defaultSlot],
    methods: [row('focus / blur', '() => void', '-', '管理原生输入焦点', 'Manage native input focus')],
  },
  'input-number': {
    description: text('通过步进按钮或键盘输入数字，支持精度、取值范围、清空、禁用和只读状态。', 'Enter numbers using step controls or the keyboard, with precision, bounds, clearing, disabled and readonly states.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-input-number v-model="count" :min="0" :max="10" aria-label="数量" />', "const count = ref(3)"),
      },
      {
        title: text('小数与禁用', 'Decimals and Disabled'),
        variant: 'states',
        code: sample('  <scq-space>\n    <scq-input-number v-model="price" :step="0.1" :precision="2" :min="0" aria-label="价格" />\n    <scq-input-number :model-value="5" disabled aria-label="禁用" />\n  </scq-space>', "const price = ref(0.2)"),
      },
    ],
    props: [
      row('modelValue', 'number | undefined', 'undefined', '绑定值；清空后为 undefined', 'Bound value; undefined when cleared'),
      row('min / max', 'number', '-Infinity / Infinity', '允许范围', 'Allowed range'),
      row('step', 'number', '1', '正数步长', 'Positive step size'),
      row('precision', 'number', '12', '小数位数，0 至 15 的整数', 'Integer decimal places from 0 to 15'),
      sizeProp,
      disabledProp,
      row('readonly', 'boolean', 'false', '只读状态', 'Read-only state'),
      row('controls', 'boolean', 'true', '显示步进按钮', 'Show step buttons'),
      row('id / name / ariaLabel / placeholder', 'string', "''", '原生输入标识和提示', 'Native input identification and hint'),
    ],
    events: [modelEvent, row('focus / blur', '(event: FocusEvent) => void', '-', '原生焦点事件', 'Native focus events'), row('invalid', '(value: number | undefined, reason: configuration | number) => void', '-', '无效配置或非有限数值；阻止提交并标记 aria-invalid，修正配置/绑定值或成功输入后恢复', 'Invalid configuration or non-finite value; prevents submission and sets aria-invalid, recovering after corrected props or successful input')],
    methods: [row('focus / blur', '() => void', '-', '管理焦点', 'Manage focus')],
  },
  space: {
    description: text('统一组件之间的间距，支持换行、纵向排列和对齐。', 'Arrange components with consistent spacing, wrapping and alignment.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-space :size="16" wrap>\n    <scq-button type="primary">保存</scq-button>\n    <scq-button>取消</scq-button>\n    <scq-tag type="success">就绪</scq-tag>\n  </scq-space>'),
      },
      {
        title: text('纵向排列', 'Vertical Layout'),
        variant: 'states',
        code: sample('  <scq-space direction="vertical" align="stretch" fill :size="12">\n    <scq-input placeholder="姓名" />\n    <scq-input placeholder="邮箱" />\n  </scq-space>'),
      },
    ],
    props: [
      row('size', 'number | [number, number]', '12', '间距；数组为行和列间距', 'Gap; an array sets row and column gaps'),
      row('direction', 'horizontal | vertical', 'horizontal', '排列方向', 'Layout direction'),
      row('align', 'start | end | center | baseline | stretch', 'center', '交叉轴对齐', 'Cross-axis alignment'),
      row('justify', 'start | end | center | space-between | space-around', 'start', '主轴对齐', 'Main-axis alignment'),
      row('wrap', 'boolean', 'true', '空间不足时换行', 'Wrap when space is limited'),
      row('fill', 'boolean', 'false', '填满父容器', 'Fill the parent width'),
    ],
    slots: [defaultSlot],
  },
  divider: {
    description: text('分隔相邻内容，支持文字位置、虚线和纵向分隔，也可适配从右向左的布局。', 'Separate adjacent content with labeled, dashed or vertical dividers and support for right-to-left layouts.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <p>账号信息</p>\n  <scq-divider content-position="left">偏好设置</scq-divider>\n  <p>消息通知</p>'),
      },
      {
        title: text('纵向分割', 'Vertical Divider'),
        variant: 'states',
        code: sample('  <span>概览</span>\n  <scq-divider direction="vertical" />\n  <span>动态</span>\n  <scq-divider dashed />'),
      },
    ],
    props: [
      row('direction', 'horizontal | vertical', 'horizontal', '分割方向', 'Divider direction'),
      row('contentPosition', 'left | center | right', 'center', '文字位置', 'Label position'),
      row('dashed', 'boolean', 'false', '虚线样式', 'Dashed border'),
    ],
    slots: [defaultSlot],
  },
  loading: {
    description: text('提供独立加载指示器，或覆盖仍然挂载的内容区域。', 'Show an inline spinner or mask a content area while keeping it mounted.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-loading text="加载中" />'),
      },
      {
        title: text('区域加载', 'Loading Overlay'),
        variant: 'states',
        code: sample('  <scq-switch v-model="busy" active-text="加载中" inactive-text="已完成" />\n  <scq-loading :loading="busy" text="加载中">\n    <div style="padding: 20px; min-height: 120px;">\n      <p>季度报告</p>\n      <scq-button>导出</scq-button>\n    </div>\n  </scq-loading>', "const busy = ref(true)"),
      },
    ],
    props: [
      row('loading', 'boolean', 'true', '是否显示加载；遮罩内元素暂不可交互', 'Display loading and make masked content inert'),
      row('text', 'string', "''", '加载说明', 'Loading text'),
      row('size', 'number', '24', '有限数值指示器尺寸，单位 px；负值归零', 'Finite spinner size in pixels; negative values clamp to zero'),
      row('delay / minDuration', 'number', '0', '有限毫秒数，负数按 0；卸载清理计时。任务结束立即恢复交互和非忙语义，视觉尾帧不再作为加载状态播报', 'Finite milliseconds, with negative values clamped to zero; timers clean up on unmount. Finished work immediately restores interaction and non-busy semantics; the minimum-duration visual tail is not announced as loading'),
      row('blocking', 'boolean', 'true', '加载期间使内容 inert；结束后恢复原控件焦点，但不抢夺已移开的焦点；false 为非阻塞', 'Make content inert during loading; restore prior control focus afterward without stealing moved focus. False is non-blocking'),
    ],
    slots: [defaultSlot, row('indicator', '{ size, loading }', '-', '自定义指示器', 'Custom indicator')],
  },
  empty: {
    description: text('为空列表和无搜索结果提供占位内容与后续操作。', 'Display an empty state with optional imagery and actions.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-empty />'),
      },
      {
        title: text('自定义文案与操作', 'Description and Actions'),
        variant: 'states',
        code: sample('  <scq-empty preset="search" size="small">\n    <scq-button type="primary" @click="resetFilters">重置筛选</scq-button>\n  </scq-empty>', "const resetFilters = () => {\n  // 执行重置逻辑\n}"),
      },
    ],
    props: [
      row('description', 'string', 'locale', '空状态描述；省略时使用默认文案，显式空字符串隐藏描述', 'Description; omission uses locale text while an explicit empty string hides it'),
      row('image', 'string', "''", '自定义图片地址，失败时显示预设图标并触发 error', 'Custom image URL; failure displays the preset icon and emits error'),
      row('imageSize', 'number', '90', '有限数值图片区域大小，负值归零', 'Finite image-area size in pixels; negative values clamp to zero'),
      row('preset / size', 'default | search | unconfigured / default | small', 'default / default', '显式场景和紧凑布局；文案/图片插槽仍优先，不表示请求错误', 'Opt-in scenario and compact layout; explicit content and slots win, never implies a request error'),
    ],
    slots: [defaultSlot, row('image / description', '-', '-', '替换图片或描述', 'Replace the image or description')],
    events: [row('load / error', '(event: Event) => void', '-', '当前图片的加载或失败；已替换图片的迟到事件被隔离', 'Current image load or failure; late events from replaced images are ignored')],
    methods: [row('retry', '() => void', '-', '重试当前图片；无图片时保留预设图标', 'Retry the current image; without a URL, keep the preset icon')],
  },
  skeleton: {
    description: text('在内容准备完成之前展示结构占位。', 'Show structural placeholders before content is ready.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-skeleton :rows="4" avatar />'),
      },
      {
        title: text('切换加载状态', 'Loading State'),
        variant: 'states',
        code: sample('  <scq-switch v-model="busy" active-text="加载中" inactive-text="已完成" />\n  <scq-skeleton :loading="busy" style="margin-top: 20px;">\n    <p>内容已准备完成。</p>\n  </scq-skeleton>', "const busy = ref(true)"),
      },
    ],
    props: [
      row('loading', 'boolean', 'true', '加载完成后展示默认插槽', 'Show the default slot when loading completes'),
      row('rows', 'number', '3', '占位行数，最大 50', 'Placeholder rows, up to 50'),
      row('animated', 'boolean', 'true', '加载动画，遵循减少动画设置', 'Animation respects reduced-motion preferences'),
      row('avatar', 'boolean', 'false', '圆形头像占位', 'Show an avatar placeholder')],
    slots: [defaultSlot, row('template', '-', '-', '自定义骨架结构', 'Custom skeleton layout')],
  },
  alert: {
    description: text('在页面内展示持久的状态说明，支持关闭和自定义内容。', 'Display persistent inline status messages with optional dismissal.'),
    demo: 'basic',
    examples: [
      {
        title: text('提示类型', 'Alert Types'),
        code: sample('  <scq-space direction="vertical" align="stretch" fill>\n    <scq-alert title="保存成功" type="success" />\n    <scq-alert title="请检查配置" type="warning" />\n    <scq-alert title="连接失败" type="error" />\n  </scq-space>'),
      },
      {
        title: text('详细内容', 'Detailed Content'),
        variant: 'states',
        code: sample('  <scq-alert title="维护计划" description="周五 20:00 - 21:00" :closable="false" />'),
      },
    ],
    props: [
      row('modelValue / closeText', 'boolean / string', "uncontrolled / ''", '可选受控显示与关闭文字；更新内容不会自动重开', 'Optional controlled visibility and close text; updating content does not reopen the alert'),
      row('title / description', 'string', "''", '标题与说明', 'Title and description'),
      row('type', 'success | info | warning | error', 'info', '状态类型', 'Status type'),
      row('closable', 'boolean', 'true', '显示关闭按钮', 'Show dismiss button'),
      row('showIcon', 'boolean', 'true', '显示状态图标', 'Show status icon'),
    ],
    events: [row('close', '(event: MouseEvent) => void', '-', '每次打开仅发出一次关闭请求；受控状态由父级更新', 'One close request per opening; controlled state is updated by the owner'), row('update:modelValue', '(visible: boolean) => void', '-', '请求关闭', 'Request dismissal')],
    slots: [defaultSlot, row('title / icon / actions', '-', '-', '标题、图标与操作区', 'Title, icon and actions')],
  },
  tag: {
    description: text('用于展示分类或状态，支持选择和关闭操作。关闭事件由调用方处理。', 'Display categories or statuses with selection and close actions. The parent handles removal after a close event.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-space>\n    <scq-tag v-model:selected="selected" selectable round icon="check">Vue 3</scq-tag>\n    <scq-tag type="success">已发布</scq-tag>\n    <scq-tag type="warning">待审核</scq-tag>\n    <scq-tag type="danger">失败</scq-tag>\n  </scq-space>', 'const selected = ref(true)'),
      },
      {
        title: text('可移除标签', 'Removable Tags'),
        variant: 'states',
        code: sample('  <scq-space>\n    <scq-tag\n      v-for="tag in tags"\n      :key="tag"\n      closable\n      @close="tags = tags.filter(v => v !== tag)"\n    >\n      {{ tag }}\n    </scq-tag>\n    <scq-button v-if="!tags.length" size="small" @click="tags = [\'Design\', \'Frontend\', \'Mobile\']">重置</scq-button>\n  </scq-space>', "const tags = ref(['Design', 'Frontend', 'Mobile'])"),
      },
    ],
    props: [
      row('type', 'primary | success | warning | danger | info', 'primary', '语义颜色', 'Semantic color'),
      sizeProp,
      row('effect', 'light | dark | plain', 'light', '颜色样式', 'Color effect'),
      row('closable', 'boolean', 'false', '显示移除按钮', 'Show remove button'),
      row('selectable / selected', 'boolean', 'false', '可选择标签及 v-model:selected；选择与关闭独立', 'Selectable tag and v-model:selected; selection and closing are independent'),
      row('disabled', 'boolean', 'provider / false', '禁用选择和关闭，可覆盖 Provider，但不能绕过 Form 禁用', 'Disable selection and closing; overrides Provider but cannot bypass a disabled Form'),
      row('icon / round', 'IconName / boolean', '- / false', '前置图标与圆角外观', 'Leading icon and rounded appearance'),
      row('ariaLabel / closeLabel', 'string', "'' / locale", '选择按钮或普通标签的名称，以及关闭按钮名称；关闭按钮同时描述标签内容', 'Name the selection control or plain tag and the close control; the close control also describes the tag content'),
    ],
    events: [row('close', '(event: MouseEvent) => void', '-', '请求移除，不自动卸载组件', 'Request removal without unmounting itself'), row('update:selected / change', '(selected: boolean) => void', '-', '请求切换受控选中值', 'Request a controlled selection change')],
    slots: [defaultSlot, row('icon', '-', '-', '自定义前置图标', 'Custom leading icon')],
  },
  badge: {
    description: text('显示未读数量、状态文字或提示圆点。', 'Display unread counts, status labels or notification dots.'),
    demo: 'basic',
    examples: [
      {
        title: basic,
        code: sample('  <scq-space :size="32">\n    <scq-badge :value="12"><scq-button>收件箱</scq-button></scq-badge>\n    <scq-badge :value="120"><scq-button>任务</scq-button></scq-badge>\n    <scq-badge is-dot label="有更新"><scq-icon name="settings" :size="24" /></scq-badge>\n  </scq-space>'),
      },
      {
        title: text('独立显示', 'Standalone'),
        variant: 'states',
        code: sample('  <scq-space>\n    <scq-badge :value="0" show-zero />\n    <scq-badge value="NEW" type="success" />\n    <scq-badge :value="8" type="primary" />\n  </scq-space>'),
      },
    ],
    props: [
      row('value', 'string | number', '-', '显示值；数字必须有限，字符串不按数值裁剪', 'Displayed value; numbers must be finite and strings are not numerically capped'),
      row('max', 'number', '99', '非负数字上限，超过显示 max+；Infinity 表示不设上限，无效数值明确报错', 'Non-negative numeric limit; larger values show max+, Infinity disables the cap and invalid numbers are reported explicitly'),
      row('isDot', 'boolean', 'false', '圆点模式', 'Dot mode'),
      row('placement / offset', 'top-right | top-left | bottom-right | bottom-left / [number, number]', 'top-right / [0, 0]', '四角位置；偏移为两个有限的向右/向下像素量，可为负数', 'Corner placement; offsets are two finite right/down pixel amounts and may be negative'),
      row('text / live', 'string / off | polite | assertive', "'' / off", '状态文字及显式更新播报', 'Status text and opt-in live announcements'),
      row('hidden', 'boolean', 'false', '隐藏徽标', 'Hide the badge'),
      row('showZero', 'boolean', 'false', '显示数字 0', 'Display numeric zero'),
      row('label', 'string', "''", '无障碍说明', 'Accessible description'),
      row('type', 'primary | success | warning | danger | info', 'danger', '语义颜色', 'Semantic color'),
    ],
    slots: [defaultSlot, row('content', '{ value, displayValue }', '-', '自定义徽标内容；hidden 仍优先', 'Custom badge content; hidden still takes precedence')],
  },
  form: {
    description: text('组合已有输入组件，提供规则校验、字段校验、重置与响应式布局。', 'Compose existing inputs with rule validation, field validation, reset and responsive layouts.'),
    demo: 'form',
    examples: [
      {
        title: text('校验与提交', 'Validation and Submit'),
        code: sample('  <scq-form ref="formRef" :model="model" :rules="rules" :label-width="84" @submit="submit">\n    <scq-form-item prop="name" label="姓名" for-id="user-name">\n      <scq-input id="user-name" v-model="model.name" placeholder="输入姓名" clearable />\n    </scq-form-item>\n    <scq-form-item prop="email" label="邮箱" for-id="user-email">\n      <scq-input id="user-email" v-model="model.email" type="email" placeholder="name@example.com" />\n    </scq-form-item>\n    <scq-form-item prop="notifications" label="通知">\n      <scq-switch v-model="model.notifications" aria-label="消息通知" />\n    </scq-form-item>\n    <scq-form-item>\n      <scq-space>\n        <scq-button type="primary" native-type="submit">保存</scq-button>\n        <scq-button @click="reset">重置</scq-button>\n      </scq-space>\n    </scq-form-item>\n  </scq-form>\n  <p v-if="result" role="status">{{ result }}</p>', "import type { FormInstance, FormRules } from 'scq-vue'\n\nconst formRef = ref<FormInstance>()\nconst model = reactive({ name: '', email: '', notifications: true })\nconst result = ref('')\n\nconst rules: FormRules = {\n  name: { required: true, message: '请输入姓名', trigger: 'blur' },\n  email: [\n    { required: true, message: '请输入邮箱' },\n    { type: 'email', message: '请输入有效邮箱', trigger: 'blur' },\n  ],\n}\n\nconst submit = (valid: boolean) => {\n  result.value = valid ? '设置已保存' : '请检查表单字段'\n}\n\nconst reset = async () => {\n  await formRef.value?.resetFields()\n  result.value = ''\n}"),
      },
      {
        title: text('禁用与字段校验', 'Disabled State and Field Validation'),
        variant: 'states',
        code: sample('  <scq-switch v-model="disabled" active-text="表单已禁用" inactive-text="表单可编辑" style="margin-bottom: 20px;" />\n\n  <scq-form ref="formRef" :model="model" :rules="rules" :disabled="disabled" label-position="top">\n    <scq-form-item prop="name" label="姓名" for-id="user-name">\n      <scq-input id="user-name" v-model="model.name" placeholder="输入姓名" clearable />\n    </scq-form-item>\n    <scq-form-item>\n      <scq-space>\n        <scq-button type="primary" @click="validateName">校验姓名</scq-button>\n        <scq-button @click="formRef?.clearValidate()">清除校验</scq-button>\n      </scq-space>\n    </scq-form-item>\n  </scq-form>', "import type { FormInstance, FormRules } from 'scq-vue'\n\nconst formRef = ref<FormInstance>()\nconst disabled = ref(false)\nconst model = reactive({ name: '' })\n\nconst rules: FormRules = {\n  name: { required: true, message: '请输入姓名', trigger: 'blur' },\n}\n\nconst validateName = async () => {\n  await formRef.value?.validateField('name')\n}"),
      },
    ],
    props: [
      row('model', 'Record<string, unknown>', 'required', '响应式表单对象', 'Reactive form model'),
      row('rules', 'FormRules', '{}', '基于 async-validator 的字段规则，支持 trigger', 'async-validator field rules with trigger support'),
      row('labelPosition', 'left | right | top', 'right', '标签位置；默认布局在手机上堆叠', 'Label position; default layout stacks on phones'),
      row('labelWidth', 'number | string', '100', '有限数值或 CSS 标签宽度，负数值归零', 'Finite numeric or CSS label width; negative numbers clamp to zero'),
      row('inline', 'boolean', 'false', '行内布局', 'Inline layout'),
      sizeProp,
      row('disabled', 'boolean', 'provider / false', '继承或覆盖配置，并传给子控件；保留原生 fieldset 禁用约束', 'Inherit or override configuration for descendants; retain the native disabled fieldset constraint'),
      row('FormItem.prop', 'string', "''", '字段路径，例如 user.name', 'Field path such as user.name'),
      row('FormItem.label / forId', 'string', "''", '标签与对应的原生输入 id', 'Label and associated native input id'),
      row('FormItem.rules', 'FormRule | FormRule[]', '-', '覆盖当前字段规则', 'Override rules for this field'),
      row('FormItem.required', 'boolean', 'false', '追加必填校验并显示标记', 'Add required validation and indicator'),
      row('FormItem.error', 'string', "''", '外部错误提示', 'External error message'),
      row('FormItem.showMessage', 'boolean', 'true', '显示字段错误', 'Display field errors'),
    ],
    events: [
      row('submit', '(valid: boolean) => void', '-', '阻止原生提交，校验后返回结果', 'Prevent native submission and emit validation result'),
      row('validate', '(valid: boolean) => void', '-', '调用 validate 后触发', 'Emitted after validate'),
    ],
    slots: [
      defaultSlot,
      row('FormItem.label / error', '{ error?: string }', '-', '自定义标签与错误', 'Custom label and error'),
      row('FormItem.default', '{ error, validate }', '-', '字段内容及校验状态', 'Field content and validation state'),
    ],
    methods: [
      row('validate', '() => Promise<boolean>', '-', '校验全部已挂载字段', 'Validate all mounted fields'),
      row('validateField', '(props?: string | string[]) => Promise<boolean>', '-', '校验指定字段', 'Validate selected fields'),
      row('resetFields', '(props?: string | string[]) => Promise<void>', '-', '重置到字段挂载时的值并清空错误', 'Restore mounted initial values and clear errors'),
      row('clearValidate', '(props?: string | string[]) => void', '-', '仅清空错误，不修改模型', 'Clear errors without changing values'),
      row('FormItem.validate / resetField / clearValidate', 'methods', '-', '单字段对应方法', 'Equivalent methods for one field'),
    ],
  },
  table: {
    description: text('在 PC 上展示结构化数据，在移动端保持表格区域独立滚动。', 'Display structured data on desktop with contained horizontal scrolling on mobile.'),
    demo: 'table',
    examples: [
      {
        title: text('排序与选择', 'Sorting and Selection'),
        code: sample('  <scq-table\n    v-model:selected-keys="selected"\n    :data="rows"\n    :columns="columns"\n    row-key="id"\n    selectable\n    aria-label="团队成员"\n  >\n    <template #status="{ row }">\n      <scq-tag :type="row.status === \'Active\' ? \'success\' : \'warning\'">\n        {{ row.status === \'Active\' ? \'活跃\' : \'待审核\' }}\n      </scq-tag>\n    </template>\n  </scq-table>\n  <p>已选择: {{ selected.length }}</p>', "import type { TableColumn, TableRowKey } from 'scq-vue'\n\nconst selected = ref<TableRowKey[]>([])\nconst rows = [\n  { id: 1, name: 'Ada 1', score: 70, status: 'Pending' },\n  { id: 2, name: 'Grace 2', score: 77, status: 'Active' },\n  { id: 3, name: 'Lin 3', score: 84, status: 'Active' },\n  { id: 4, name: 'Alex 4', score: 91, status: 'Pending' },\n]\nconst columns: TableColumn[] = [\n  { key: 'name', label: '姓名' },\n  { key: 'score', label: '分数', sortable: true },\n  { key: 'status', label: '状态' },\n]"),
      },
      {
        title: text('筛选与分页', 'Filtering and Pagination'),
        variant: 'states',
        code: sample('  <div style="display: flex; gap: 16px; margin-bottom: 16px;">\n    <scq-input v-model="query" placeholder="搜索姓名" clearable @input="page = 1" />\n    <span>{{ filteredRows.length }} 条记录</span>\n  </div>\n\n  <scq-table :data="visibleRows" :columns="columns" row-key="id" stripe />\n\n  <scq-pagination v-model="page" :total="filteredRows.length" :page-size="5" style="margin-top: 16px;" />', "import { computed } from 'vue'\nimport type { TableColumn } from 'scq-vue'\n\nconst query = ref('')\nconst page = ref(1)\n\nconst names = ['Ada', 'Grace', 'Lin', 'Alex', 'Jamie', 'Morgan']\nconst rows = Array.from({ length: 26 }, (_, index) => ({\n  id: index + 1,\n  name: `${names[index % names.length]} ${index + 1}`,\n  score: 70 + (index * 7) % 30,\n  status: index % 3 ? 'Active' : 'Pending',\n}))\n\nconst columns: TableColumn[] = [\n  { key: 'name', label: '姓名' },\n  { key: 'score', label: '分数', sortable: true },\n  { key: 'status', label: '状态' },\n]\n\nconst filteredRows = computed(() =>\n  rows.filter((row) => row.name.toLowerCase().includes(query.value.toLowerCase()))\n)\n\nconst visibleRows = computed(() =>\n  filteredRows.value.slice((page.value - 1) * 5, page.value * 5)\n)"),
      },
    ],
    props: [
      row('data', 'TableRow[]', 'required', '数据源，不会被内部排序修改', 'Rows; internal sorting does not mutate them'),
      row('columns', 'TableColumn[]', 'required', 'key、label、width、align、sortable、sortMethod、formatter', 'key, label, width, align, sortable, sortMethod and formatter'),
      row('rowKey', 'string | (row) => string | number', 'id', '稳定行标识；跨页选择时必须唯一', 'Stable row identity; must be unique for cross-page selection'),
      row('selectedKeys', '(string | number)[]', '-', '受控选中键，支持 v-model:selected-keys', 'Controlled selection with v-model:selected-keys'),
      row('selectable / loading / border / stripe', 'boolean', 'false', '选择、加载、边框和斑马纹', 'Selection, loading, borders and striped rows'),
      row('maxHeight', 'number | string', '-', '最大高度，表头在区域内固定', 'Maximum height with a sticky header'),
      row('minWidth', 'number', '480', '表格最小宽度，溢出局部滚动', 'Minimum width for contained overflow'),
      row('defaultSort', 'TableSort', '-', '初始 key 与 ascending / descending 排序', 'Initial key and ascending / descending order'),
      row('emptyText / ariaLabel', 'string', 'locale / Data table', '空状态文案与区域名称', 'Empty text and accessible region name'),
    ],
    events: [
      row('sort-change', '(sort: TableSort) => void', '-', '排序切换，第三次点击取消排序', 'Sort change; a third click clears sorting'),
      row('update:selectedKeys', '(keys) => void', '-', '选择键更新', 'Selected keys updated'),
      row('selection-change', '(rows, keys) => void', '-', '返回当前 data 中的选中行及全部选中键', 'Selected rows from current data and all selected keys'),
      row('row-click', '(row, event) => void', '-', '行点击', 'Row clicked'),
    ],
    slots: [
      row('[column.key]', '{ row, column, index, value }', '-', '自定义单元格', 'Custom cell'),
      row('header-[column.key]', '{ column }', '-', '自定义非排序表头', 'Custom non-sortable header'),
      row('empty', '-', '-', '自定义空状态', 'Custom empty state'),
    ],
    methods: [row('clearSelection', '() => void', '-', '清空选中键', 'Clear selected keys')],
    note: text('支持本地查询与远程受控查询、固定列、列宽调整和列显隐；下面的示例分别演示这些功能。暂不包含树形表格或表格虚拟滚动。', 'Supports local and remote controlled queries, fixed columns, resizing and column visibility, demonstrated below. Tree rows and table virtualization are not included.'),
  },
  tabs: {
    description: text('在相关视图之间切换，支持键盘导航、禁用项和内容懒加载。', 'Switch between related views with keyboard navigation, disabled tabs and lazy-loaded panels.'),
    demo: 'navigation',
    examples: [
      {
        title: basic,
        code: sample('  <scq-tabs v-model="active" :items="items" aria-label="项目视图">\n    <template #overview>\n      <dl style="display: flex; gap: 40px; margin: 0;">\n        <div><dt>项目</dt><dd>SCQ Design</dd></div>\n        <div><dt>状态</dt><dd><scq-tag type="success">进行中</scq-tag></dd></div>\n      </dl>\n    </template>\n    <template #activity>\n      <p>今天 10:30：发布了新版本。</p>\n    </template>\n  </scq-tabs>', "import type { TabItem } from 'scq-vue'\n\nconst active = ref('overview')\nconst items: TabItem[] = [\n  { name: 'overview', label: '概览' },\n  { name: 'activity', label: '动态' },\n  { name: 'locked', label: '归档', disabled: true },\n]"),
      },
      {
        title: text('纵向与懒加载', 'Vertical and Lazy'),
        variant: 'states',
        code: sample('  <scq-tabs v-model="active" :items="items" direction="vertical" lazy>\n    <template #overview>\n      <scq-input v-model="draft" placeholder="项目名称" />\n    </template>\n    <template #activity>\n      <p>今天 10:30：发布了新版本。</p>\n    </template>\n  </scq-tabs>', "import type { TabItem } from 'scq-vue'\n\nconst active = ref('overview')\nconst draft = ref('')\nconst items: TabItem[] = [\n  { name: 'overview', label: '概览' },\n  { name: 'activity', label: '动态' },\n  { name: 'locked', label: '归档', disabled: true },\n]"),
      },
    ],
    props: [
      row('modelValue', 'string | number', 'first enabled', '当前页签，可受控或内部管理；内部默认选择按名称保留，不随列表重排改变', 'Active tab, controlled or internally managed; the internal default selection is preserved by name through reordering'),
      row('items', 'readonly TabItem[]', 'required', 'name、label、disabled，支持不可变数据数组', 'name, label and disabled; accepts immutable arrays'),
      row('direction', 'horizontal | vertical', 'horizontal', '导航方向', 'Navigation direction'),
      row('lazy', 'boolean', 'false', '首次激活后挂载，之后保留', 'Mount on first activation and preserve thereafter'),
      row('destroyInactive', 'boolean', 'false', '销毁非活动面板，优先于 lazy 的保留策略', 'Destroy inactive panels, overriding lazy preservation'),
      row('beforeChange', '(name, signal) => boolean | void | Promise', '-', '拒绝保留当前页；等待时去重，外部值/数据变化取消旧请求', 'Rejection retains the current panel; pending requests deduplicate and external value/data changes cancel stale work'),
      row('ariaLabel / id', 'string', "''", '导航名称或稳定 ID 前缀', 'Accessible name or stable ID prefix'),
    ],
    events: [modelEvent, row('error', '(error, name) => void', '-', '切换拦截失败', 'Tab-change guard failed')],
    methods: [row('cancelPending / pending', '() => void / boolean', '-', '取消等待或读取等待状态', 'Cancel or inspect pending work')],
    slots: [
      row('[item.name]', '{ tab }', '-', '指定页签内容', 'Named tab content'),
      row('label', '{ tab }', '-', '自定义页签标题', 'Custom tab label'),
      row('default', '{ tab }', '-', '未提供命名插槽时的内容', 'Fallback panel content'),
    ],
  },
  pagination: {
    description: text('管理列表页码和每页数量，按总数、每页条数、翻页、跳转排列，窄屏自动使用紧凑布局。', 'Control page number and size with totals, page sizes, navigation and a jumper in order, switching to a compact layout on narrow screens.'),
    demo: 'navigation',
    examples: [
      {
        title: basic,
        code: sample('  <scq-pagination v-model="page" :total="388" show-total />', "const page = ref(3)"),
      },
      {
        title: text('页容量与紧凑模式', 'Page Size and Compact Mode'),
        variant: 'states',
        code: sample('  <scq-pagination\n    v-model="page"\n    v-model:page-size="pageSize"\n    :total="120"\n    :page-sizes="[10, 20, 50]"\n    simple\n    show-total\n  />', "const page = ref(1)\nconst pageSize = ref(10)"),
      },
    ],
    props: [
      row('modelValue', 'number', '1', '当前页，起始为 1', 'Current page, starting at 1'),
      row('total', 'number', '0', '数据总条数', 'Total record count'),
      row('pageSize', 'number', '10', '每页数量，支持 v-model:page-size', 'Page size with v-model:page-size'),
      row('pagerCount', 'number', '7', '桌面页码按钮上限，规范为 5 到 11 的奇数', 'Desktop pager limit, normalized to an odd value from 5 to 11'),
      row('showJumper', 'boolean', 'false', '显示“前往 [当前页] 页”，复用 Input；聚焦选中页码，Enter/失焦提交，越界裁剪，清空或父级拒绝更新时恢复当前页；组合输入不提交，外部页码/页容量/锁定变化清理旧草稿；省略号可大步翻页', 'Show a localized Go to [current page] input using Input; focus selects the value, Enter/blur commits with bounds clamping, and empty or rejected drafts restore the current page; composition does not commit and page/size/lock changes discard drafts; ellipses jump by the visible range'),
      row('unknownTotal / hasNext / loading', 'boolean', 'false', '未知总数仅展示当前页和前后按钮；hasNext 控制下一页，loading 禁用操作', 'Unknown totals show only current page and previous/next; hasNext controls forward navigation and loading blocks actions'),
      row('pageSizes', 'readonly number[]', '[]', '可选正整数页容量，去重并包含规范化当前值；使用 Select 下拉，支持键盘操作，父级拒绝更新时保留当前选择', 'Unique positive integer sizes including the normalized current value; uses the keyboard-accessible Select dropdown and retains the current selection when controlled updates are rejected'),
      disabledProp,
      row('simple / showTotal / hideOnSinglePage', 'boolean', 'false', '紧凑模式、显示总数、单页隐藏', 'Compact mode, total count and single-page hiding'),
    ],
    events: [
      modelEvent,
      row('update:pageSize / size-change', '(size: number) => void', '-', '页容量变化，随后页码回到 1', 'Page size changes, followed by reset to page 1'),
    ],
    slots: [row('prefix / suffix', '{ page }', '-', '前后区域', 'Leading and trailing regions'), row('total', '{ total }', '-', '自定义总数', 'Custom total count')],
  },
  tooltip: {
    description: text('为图标和操作添加文字提示，支持鼠标悬停、键盘焦点和点击触发。', 'Add contextual text to controls with hover, keyboard focus or click triggers.'),
    demo: 'overlay',
    examples: [
      {
        title: basic,
        code: sample('  <scq-tooltip content="账号设置">\n    <scq-button aria-label="设置"><scq-icon name="settings" :size="20" /></scq-button>\n  </scq-tooltip>'),
      },
      {
        title: text('位置与触发方式', 'Placement and Trigger'),
        variant: 'states',
        code: sample('  <scq-space>\n    <scq-tooltip\n      v-for="placement in placements"\n      :key="placement"\n      :placement="placement"\n      content="此处是提示内容"\n      trigger="click"\n    >\n      <scq-button>{{ placement }}</scq-button>\n    </scq-tooltip>\n  </scq-space>', "import type { FloatingPlacement } from 'scq-vue'\n\nconst placements: FloatingPlacement[] = ['top', 'right', 'bottom', 'left']"),
      },
    ],
    props: [
      row('content', 'string', "''", '提示内容', 'Tooltip text'),
      row('modelValue', 'boolean', 'undefined', '可选受控开关', 'Optional controlled visibility'),
      row('placement', 'FloatingPlacement', 'top', 'top、bottom、left、right 及 -start / -end', 'top, bottom, left, right and -start / -end variants'),
      row('shiftCrossAxis', 'boolean', 'false', '空间不足时允许沿放置方向移动以保持浮层在视口内，可能覆盖触发元素', 'Allow shifting along the placement direction to remain in the viewport; may overlap the trigger'),
      row('trigger', 'hover | click | focus', 'hover', '触发方式；移动端建议 click', 'Trigger; click is recommended for touch'),
      row('disabled', 'boolean', 'false', '禁用提示', 'Disable the tooltip'),
      row('showDelay / hideDelay', 'number', '80 / 100', '悬停显示和隐藏延迟，单位毫秒', 'Hover show and hide delays in milliseconds'),
      row('width', 'number | string', '-', '内容宽度', 'Content width'),
      row('teleport', 'boolean | string', 'true', '挂载目标；false 保留原位置', 'Portal target; false keeps the original DOM location'),
      row('ariaLabel', 'string', "''", '浮层无障碍名称', 'Accessible overlay name'),
    ],
    events: [
      row('update:modelValue', '(visible: boolean) => void', '-', '请求显示或隐藏', 'Request a visibility change'),
      row('show / hide', '() => void', '-', '可见状态改变', 'Visibility changed'),
    ],
    slots: [
      row('default', '-', '-', '触发元素', 'Trigger element'),
      row('content', '-', '-', '自定义提示内容', 'Custom tooltip content'),
    ],
  },
  popover: {
    description: text('承载轻量交互内容，点击外部或按 Esc 关闭。', 'Display lightweight interactive content, dismissed by outside clicks or Escape.'),
    demo: 'overlay',
    examples: [
      {
        title: basic,
        code: sample('  <scq-popover title="消息通知" :width="260" aria-label="偏好设置">\n    <template #reference>\n      <scq-button>偏好设置</scq-button>\n    </template>\n    <scq-switch v-model="enabled" active-text="已开启" inactive-text="已关闭" />\n  </scq-popover>', "const enabled = ref(true)"),
      },
      {
        title: text('受控显示', 'Controlled Visibility'),
        variant: 'states',
        code: sample('  <scq-popover v-model="visible" title="导出" :width="260">\n    <template #reference>\n      <scq-button>导出</scq-button>\n    </template>\n    <scq-button type="primary" @click="visible = false">完成</scq-button>\n  </scq-popover>', "const visible = ref(false)"),
      },
    ],
    props: [
      row('title / content', 'string', "''", '标题和内容', 'Title and content'),
      row('modelValue', 'boolean', 'undefined', '可选受控显示', 'Optional controlled visibility'),
      row('placement', 'FloatingPlacement', 'bottom', '浮层位置', 'Overlay placement'),
      row('shiftCrossAxis', 'boolean', 'false', '空间不足时允许沿放置方向移动以保持浮层在视口内，可能覆盖触发元素', 'Allow shifting along the placement direction to remain in the viewport; may overlap the trigger'),
      row('trigger', 'hover | click | focus', 'click', '触发方式', 'Trigger mode'),
      row('width', 'number | string', '240', '内容宽度', 'Content width'),
      row('teleport', 'boolean | string', 'true', '传送目标', 'Portal target'),
      row('disabled', 'boolean', 'false', '禁用浮层', 'Disable the popover'),
      row('showDelay / hideDelay', 'number', '80 / 100', 'hover 模式的延迟', 'Delays for hover mode'),
      row('ariaLabel', 'string', "''", '浮层名称', 'Accessible overlay name'),
    ],
    events: [
      row('update:modelValue', '(visible: boolean) => void', '-', '请求切换显示', 'Request visibility change'),
      row('show / hide', '() => void', '-', '可见状态改变', 'Visibility changed'),
    ],
    slots: [
      row('reference', '{ panelId, visible }', '-', '触发元素，可关联真实浮层 ID 与实际可见状态', 'Trigger element with the real panel ID and resolved visibility for ARIA association'),
      defaultSlot,
    ],
  },
  drawer: {
    description: text('从视口边缘展开的面板，支持焦点管理、滚动锁定与内容保留。', 'A viewport-edge panel with focus management, scroll locking and preserved content.'),
    demo: 'overlay',
    examples: [
      {
        title: text('编辑与嵌套抽屉', 'Editing and Nested Drawers'),
        code: sample('  <scq-button type="primary" @click="visible = true">编辑资料</scq-button>\n\n  <scq-drawer v-model="visible" title="个人资料" :size="360">\n    <label for="user-name" style="display: block; margin-bottom: 8px;">姓名</label>\n    <scq-input id="user-name" v-model="name" />\n\n    <scq-button style="margin-top: 20px;" @click="nested = true">更多设置</scq-button>\n    <scq-drawer v-model="nested" title="更多设置" :size="320">\n      <scq-switch v-model="enabled" active-text="消息通知已开启" inactive-text="消息通知已关闭" />\n    </scq-drawer>\n\n    <template #footer>\n      <scq-button @click="visible = false">取消</scq-button>\n      <scq-button type="primary" @click="visible = false">保存</scq-button>\n    </template>\n  </scq-drawer>', "const visible = ref(false)\nconst nested = ref(false)\nconst enabled = ref(true)\nconst name = ref('Ada')"),
      },
      {
        title: text('展开方向', 'Placement'),
        variant: 'states',
        code: sample('  <scq-space>\n    <scq-button v-for="placement in placements" :key="placement" @click="openDrawer(placement)">\n      {{ placement }}\n    </scq-button>\n  </scq-space>\n\n  <scq-drawer\n    v-model="visible"\n    :position="position"\n    :size="position === \'top\' || position === \'bottom\' ? \'auto\' : 360"\n    title="个人资料"\n  >\n    <p>项目资料与偏好设置</p>\n    <template #footer>\n      <scq-button @click="visible = false">取消</scq-button>\n      <scq-button type="primary" @click="visible = false">保存</scq-button>\n    </template>\n  </scq-drawer>', "import type { DrawerPosition } from 'scq-vue'\n\nconst visible = ref(false)\nconst position = ref<DrawerPosition>('right')\nconst placements: DrawerPosition[] = ['top', 'right', 'bottom', 'left']\n\nconst openDrawer = (p: DrawerPosition) => {\n  position.value = p\n  visible.value = true\n}"),
      },
    ],
    props: [
      row('modelValue', 'boolean', 'false', '受控显示状态', 'Controlled visibility'),
      row('title / ariaLabel', 'string', "''", '标题或无标题时的无障碍名称', 'Title or accessible name for a titleless drawer'),
      row('position', 'left | right | top | bottom', 'right', '展开方向', 'Placement'),
      row('size', 'number | string', '360', '左右为宽度，上下为高度，可用 auto', 'Width for sides, height for top/bottom; accepts auto'),
      row('showClose / closeOnClickOverlay / closeOnPressEscape', 'boolean', 'true', '关闭图标、遮罩关闭与 Esc 关闭', 'Close icon, overlay dismissal and Escape'),
      row('lockScroll', 'boolean', 'true', '引用计数式背景滚动锁', 'Reference-counted background scroll lock'),
      row('destroyOnClose', 'boolean', 'false', '关闭后卸载内容', 'Unmount content when closed'),
      row('teleport', 'boolean | string', 'true', '挂载目标', 'Portal target'),
      row('zIndex', 'number', 'auto', '自定义层级', 'Override stacking order'),
    ],
    events: [
      row('update:modelValue', '(visible: boolean) => void', '-', '请求关闭', 'Request close'),
      row('open / opened / closed', '() => void', '-', '打开和过渡完成事件', 'Open and transition completion events'),
      row('close', '(reason: DrawerCloseReason) => void', '-', 'overlay、esc、close-icon、api', 'overlay, esc, close-icon or api'),
    ],
    slots: [
      defaultSlot,
      row('header / footer', '-', '-', '头部与底部操作', 'Header and footer actions'),
    ],
    methods: [row('close', '() => void', '-', '请求关闭', 'Request close')],
  },
  'action-sheet': {
    description: text('适合触屏操作的底部动作列表，支持危险、禁用与加载状态。', 'A touch-friendly bottom action list with destructive, disabled and loading states.'),
    demo: 'mobile',
    examples: [
      {
        title: basic,
        code: sample('  <!-- 移动端文件详情界面 -->\n  <scq-nav-bar title="文档详情" />\n\n  <div class="file-card">\n    <div class="file-card__badge"><scq-icon name="inbox" :size="36" /></div>\n    <span class="file-card__title">SCQ-VUE-Design-Guide.pdf</span>\n    <span class="file-card__size">18.4 MB · 2026-10-09 10:24</span>\n    <scq-tag type="success" size="small" style="margin-top: 8px;">已审核归档</scq-tag>\n  </div>\n\n  <scq-cell-group title="文件属性" :inset="true">\n    <scq-cell title="所有者" value="Design System" />\n    <scq-cell title="权限" value="公开只读" />\n    <scq-cell title="校验码" value="9a7f...e4b1" />\n  </scq-cell-group>\n\n  <div style="padding: 16px 14px;">\n    <scq-button type="primary" round style="width: 100%; height: 44px;" @click="visible = true">\n      <scq-icon name="settings" :size="16" />\n      <span>文件操作</span>\n    </scq-button>\n  </div>\n\n  <!-- 底部动作面板 -->\n  <scq-action-sheet\n    v-model="visible"\n    title="文件快捷操作"\n    :actions="actions"\n    cancel-text="取消"\n    @select="onSelect"\n  />', "import type { ActionSheetItem } from 'scq-vue'\n\nconst visible = ref(false)\nconst actions: ActionSheetItem[] = [\n  { name: '分享给好友', value: 'share', icon: 'user' },\n  { name: '创建副本', value: 'copy', icon: 'copy' },\n  { name: '重命名文件', value: 'edit', icon: 'settings' },\n  { name: '删除该文件', value: 'delete', danger: true },\n]\n\nconst onSelect = (action: ActionSheetItem) => {\n  console.log('选择操作:', action.name)\n}"),
      },
      {
        title: states,
        variant: 'states',
        code: sample('  <scq-button type="primary" @click="visible = true">打开操作面板</scq-button>\n\n  <scq-action-sheet\n    v-model="visible"\n    title="文件快捷操作"\n    :actions="actions"\n    :close-on-select="false"\n    cancel-text="取消"\n    @select="onSelect"\n  />', "import type { ActionSheetItem } from 'scq-vue'\n\nconst visible = ref(false)\nconst actions: ActionSheetItem[] = [\n  { name: '上传至云端', loading: true },\n  { name: '不可下载', disabled: true },\n  { name: '快速预览', description: '在线查看 PDF 正文', icon: 'search' },\n]\n\nconst onSelect = (action: ActionSheetItem) => {\n  console.log('选择操作:', action.name)\n}"),
      },
    ],
    props: [
      row('modelValue', 'boolean', 'false', '显示状态', 'Visibility'),
      row('actions', 'readonly ActionSheetItem[]', '[]', 'name、value、description、icon、danger、disabled、loading；支持只读数据，旧动作事件不提交', 'name, value, description, icon, danger, disabled and loading; supports readonly data and rejects stale action events'),
      row('beforeSelect', '(action, index, signal) => boolean | void | Promise', '-', '操作完成后才触发 select；拒绝/异常保持打开，取消或关闭隔离旧结果', 'Emit select only after approval; rejection/failure keeps the sheet open, dismissal isolates stale results'),
      row('columns / errorText', 'number / string', "1 / locale", '有限列数裁剪到 1-4；安全失败提示。拒绝后恢复动作焦点，移除焦点动作后恢复面板。action.group 为连续分组标题；action/error 插槽定制内容', 'Finite columns clamp to 1-4; safe failure text. Vetoes restore action focus and removing focused actions restores panel focus. action.group labels consecutive groups; action/error slots customize content'),
      row('title / description', 'string', "''", '标题和说明', 'Title and description'),
      row('cancelText', 'string', 'locale', '取消文字，空字符串隐藏', 'Cancel label; empty string hides it'),
      row('closeOnSelect', 'boolean', 'true', '选择后请求关闭', 'Request close after selection'),
      row('closeOnClickOverlay / closeOnPressEscape', 'boolean', 'true', '遮罩与 Esc 关闭', 'Overlay and Escape dismissal'),
      row('teleport', 'boolean | string', 'true', '挂载目标', 'Portal target'),
    ],
    events: [
      row('update:modelValue', '(visible: boolean) => void', '-', '请求关闭', 'Request close'),
      row('select', '(action, index) => void', '-', '选择可用操作', 'An enabled action was selected'),
      row('error', '(error, action, index) => void', '-', '选择处理失败', 'Selection handler failed'),
      row('cancel', '() => void', '-', '点击取消按钮', 'Cancel button clicked'),
      row('close', '(reason) => void', '-', '关闭来源，含 select 和 cancel', 'Close reason, including select and cancel'),
      row('opened / closed', '() => void', '-', '过渡完成', 'Transition completed'),
    ],
    slots: [defaultSlot, row('action', '{ action, index, pending }', '-', '操作按钮内容', 'Action button content'), row('error', '{ error }', '-', '失败提示', 'Failure content')],
    methods: [row('cancelPending / pending', '() => void / boolean', '-', '取消或读取等待状态', 'Cancel or inspect pending work')],
  },
  modal: {
    description: text('适用于移动端的轻量模态对话框，具备 iOS 拟真交互动效，支持模板受控与命令式方法调用。', 'A lightweight mobile modal dialog with iOS-style interactive feel, supporting template control and imperative methods.'),
    demo: 'mobile',
    examples: [
      {
        title: text('基础用法 (提示弹窗)', 'Basic Usage (Info Alert)'),
        code: sample('  <scq-nav-bar title="版本通知" />\n\n  <div class="modal-feature-card">\n    <div class="modal-feature-card__icon modal-feature-card__icon--blue">\n      <scq-icon name="info" :size="30" />\n    </div>\n    <span class="modal-feature-card__title">系统版本检测</span>\n    <span class="modal-feature-card__desc">发现新版本 v1.1.13，包含移动端设计重构</span>\n  </div>\n\n  <scq-cell-group :inset="true">\n    <scq-cell title="更新渠道" value="Stable" />\n    <scq-cell title="发布日期" value="2026-10-09" />\n  </scq-cell-group>\n\n  <div style="padding: 20px 14px 10px;">\n    <scq-button type="primary" round style="width: 100%; height: 44px;" @click="visible = true">\n      查看升级说明\n    </scq-button>\n  </div>\n\n  <scq-modal\n    v-model="visible"\n    title="系统更新通知"\n    type="info"\n    confirm-button-text="我知道了"\n    @confirm="onConfirm"\n  >\n    <p>新版本已完成移动端组件设计升级，全面支持独立手机 UI 交互体验。</p>\n  </scq-modal>', "const visible = ref(false)\n\nconst onConfirm = () => {\n  console.log('已确认升级说明')\n}"),
      },
      {
        title: text('操作确认 (双按钮)', 'Operation Confirm (Double Action)'),
        variant: 'confirm',
        code: sample('  <scq-nav-bar title="存储管理" />\n\n  <div class="modal-feature-card">\n    <div class="modal-feature-card__icon modal-feature-card__icon--amber">\n      <scq-icon name="inbox" :size="30" />\n    </div>\n    <span class="modal-feature-card__title">本地存储管理</span>\n    <span class="modal-feature-card__desc">当前离线缓存已占用 2.4 GB 空间</span>\n  </div>\n\n  <scq-cell-group :inset="true">\n    <scq-cell title="离线文件" value="1.8 GB" />\n    <scq-cell title="临时草稿" value="614 MB" />\n  </scq-cell-group>\n\n  <div style="padding: 20px 14px 10px;">\n    <scq-button type="danger" plain round style="width: 100%; height: 44px;" @click="visible = true">\n      清空本地缓存\n    </scq-button>\n  </div>\n\n  <scq-modal\n    v-model="visible"\n    title="确认清除缓存？"\n    type="confirm"\n    :show-cancel-button="true"\n    confirm-button-type="danger"\n    confirm-button-text="确认清除"\n    cancel-button-text="取消"\n    @confirm="onConfirm"\n    @cancel="onCancel"\n  >\n    <p>清除后草稿与离线文件将被删除，需重新连接同步。</p>\n  </scq-modal>', "const visible = ref(false)\n\nconst onConfirm = () => {\n  console.log('缓存已清理完成')\n}\n\nconst onCancel = () => {\n  console.log('已取消操作')\n}"),
      },
      {
        title: text('自定义内容与底部插槽', 'Custom Content and Footer Slot'),
        variant: 'slot',
        code: sample('  <scq-nav-bar title="会员服务" />\n\n  <div class="modal-feature-card">\n    <div class="modal-feature-card__icon modal-feature-card__icon--purple">\n      <scq-icon name="settings" :size="30" />\n    </div>\n    <span class="modal-feature-card__title">SCQ Pro Developer</span>\n    <span class="modal-feature-card__desc">解锁专属私有化部署与高速云同步通道</span>\n  </div>\n\n  <scq-cell-group :inset="true">\n    <scq-cell title="当前版本" value="Community Free" />\n    <scq-cell title="特权状态" value="未开通" />\n  </scq-cell-group>\n\n  <div style="padding: 20px 14px 10px;">\n    <scq-button type="primary" round style="width: 100%; height: 44px;" @click="visible = true">\n      查看会员特权\n    </scq-button>\n  </div>\n\n  <scq-modal\n    v-model="visible"\n    title="开通 Pro 特权计划"\n    :show-close="true"\n  >\n    <div class="modal-benefit-box">\n      <p style="font-weight: 600; color: #0f172a; margin: 0 0 8px;">权益清单：</p>\n      <ul>\n        <li>高速云端资产库双向同步</li>\n        <li>企业级私有 NPM 组件分发</li>\n        <li>全套移动端与桌面主题源码</li>\n      </ul>\n    </div>\n    <template #footer="{ cancel, confirm }">\n      <scq-button @click="cancel()">稍后考虑</scq-button>\n      <scq-button type="success" @click="confirm()">立即升级</scq-button>\n    </template>\n  </scq-modal>', "const visible = ref(false)"),
      },
      {
        title: text('命令式方法调用', 'Method Invocation (API)'),
        variant: 'api',
        code: sample('  <scq-nav-bar title="函数调用" />\n\n  <div class="modal-feature-card">\n    <div class="modal-feature-card__icon modal-feature-card__icon--emerald">\n      <scq-icon name="check" :size="30" />\n    </div>\n    <span class="modal-feature-card__title">函数式快速调用</span>\n    <span class="modal-feature-card__desc">无需模板显式声明，一行代码直接触发</span>\n  </div>\n\n  <scq-cell-group title="可用方法" :inset="true">\n    <scq-cell title="信息弹框" value="单确认按钮" is-link @click="triggerApiInfo" />\n    <scq-cell title="确认对话框" value="双按钮拦截" is-link @click="triggerApiConfirm" />\n  </scq-cell-group>\n\n  <div style="padding: 16px 14px 10px; display: flex; gap: 10px;">\n    <scq-button style="flex: 1;" @click="triggerApiInfo">Modal.info</scq-button>\n    <scq-button type="primary" style="flex: 1;" @click="triggerApiConfirm">Modal.confirm</scq-button>\n  </div>', "import { Modal } from 'scq-vue'\n\nconst triggerApiInfo = () => {\n  Modal.info({\n    title: '操作提示',\n    message: '这是通过 Modal.info 直接调用的移动端提示弹窗。',\n    confirmButtonText: '我知道了',\n  })\n}\n\nconst triggerApiConfirm = () => {\n  Modal.confirm({\n    title: '重置安全凭证',\n    message: '确认重置当前设备的凭证密钥吗？此操作无法撤销。',\n    cancelButtonText: '取消',\n    confirmButtonText: '确认重置',\n  })\n}"),
      },
    ],
    props: [
      row('modelValue', 'boolean', 'false', '弹窗是否可见，支持 v-model 双向绑定', 'Whether the modal is visible, supports v-model'),
      row('title', 'string', "''", '弹窗标题', 'Modal title'),
      row('type', 'info | confirm', 'info', '弹窗类型，confirm 默认开启取消按钮', 'Modal type; confirm enables cancel button by default'),
      row('showClose', 'boolean', 'false', '是否显示右上角关闭按钮', 'Whether to show the top-right close button'),
      row('showFooter', 'boolean', 'true', '是否显示底部操作区域', 'Whether to show the footer action area'),
      row('showCancelButton', 'boolean', 'confirm 为 true, info 为 false', '是否显示取消按钮', 'Whether to show the cancel button'),
      row('showConfirmButton', 'boolean', 'true', '是否显示确认按钮', 'Whether to show the confirm button'),
      row('cancelButtonText', 'string', 'locale', '取消按钮文案', 'Cancel button label'),
      row('confirmButtonText', 'string', 'locale', '确认按钮文案', 'Confirm button label'),
      row('confirmButtonType', 'ModalButtonType', 'primary', '确认按钮样式类型', 'Confirm button style variant'),
      row('beforeClose', '(reason: ModalCloseReason) => boolean | Promise<boolean>', '-', '关闭前的钩子函数，返回 false 或 reject 阻止关闭', 'Hook before close; return false or reject to prevent closing'),
      row('closeOnClickModal', 'boolean', 'false', '点击遮罩层是否关闭弹窗', 'Whether to close by clicking the mask overlay'),
      row('closeOnPressEscape', 'boolean', 'true', '按 Esc 键是否关闭弹窗', 'Whether to close on Escape key press'),
      row('teleport', 'boolean | string', 'body', '挂载的 DOM 节点选择器，false 保持原处', 'Portal target selector; false keeps in place'),
    ],
    events: [
      row('update:modelValue', '(value: boolean) => void', '-', '显示状态切换时触发', 'Emitted when visibility changes'),
      row('confirm', '() => void', '-', '点击确定按钮时触发', 'Emitted on confirm button click'),
      row('cancel', '() => void', '-', '点击取消按钮时触发', 'Emitted on cancel button click'),
      row('close', '(reason: ModalCloseReason) => void', '-', '弹窗关闭时触发', 'Emitted when modal closes'),
      row('opened', '() => void', '-', '入场动画播放完成时触发', 'Emitted after enter transition'),
      row('closed', '() => void', '-', '离场动画播放完成时触发', 'Emitted after leave transition'),
    ],
    slots: [
      defaultSlot,
      row('header', '{ close, title }', '-', '自定义头部区域', 'Custom header area'),
      row('title', '{ title }', '-', '自定义标题内容', 'Custom title content'),
      row('footer', '{ cancel, confirm }', '-', '自定义底部按钮操作', 'Custom footer buttons with cancel/confirm helpers'),
    ],
    methods: [
      row('useModal', '() => scoped Modal API', '-', 'setup 中绑定当前配置，默认标题与按钮文案实时同步，卸载自动清理', 'Bind current configuration in setup; default titles and labels stay reactive; dispose on unmount'),
      row('Modal.info', '(options: ModalApiOptions, appContext?) => ModalInstance', '-', '弹出信息提示型模态框', 'Open an informational modal dialog'),
      row('Modal.confirm', '(options: ModalApiOptions, appContext?) => ModalInstance', '-', '弹出确认型双按钮模态框', 'Open a confirmation modal dialog'),
      row('Modal.destroyAll', '() => void', '-', '手动销毁所有命令式弹窗实例', 'Destroy all imperative modal instances'),
    ],
  },
  cell: {
    description: text('移动端列表的基本单元，支持分组、图标、说明和自定义右侧内容。', 'A mobile list row with groups, icons, descriptions and custom trailing content.'),
    demo: 'mobile',
    examples: [
      {
        title: text('分组列表', 'Grouped Cells'),
        code: sample('  <scq-nav-bar title="个人中心" />\n\n  <div class="user-card">\n    <div class="user-card__avatar">\n      <scq-icon name="user" :size="28" />\n    </div>\n    <div class="user-card__info">\n      <div class="user-card__name-row">\n        <span class="user-card__name">Ada Lovelace</span>\n        <scq-tag type="primary" effect="dark" size="small">PRO</scq-tag>\n      </div>\n      <span class="user-card__meta">ID: 809247 · ada@example.com</span>\n    </div>\n  </div>\n\n  <scq-cell-group title="通用设置" :inset="true">\n    <scq-cell title="个人资料" value="已完善" icon="user" is-link />\n    <scq-cell title="消息提醒" label="接收系统关键更新与动态" icon="info">\n      <scq-switch v-model="enabled" aria-label="消息通知" />\n    </scq-cell>\n    <scq-cell title="界面语言" value="简体中文" icon="search" is-link />\n  </scq-cell-group>', "const enabled = ref(true)"),
      },
      {
        title: text('内嵌分组与禁用', 'Inset and Disabled'),
        variant: 'states',
        code: sample('  <scq-cell-group title="安全与服务" :inset="true">\n    <scq-cell title="云端存储" value="12.8 GB / 50 GB" icon="inbox" is-link />\n    <scq-cell title="实验性功能" is-link disabled />\n  </scq-cell-group>'),
      },
    ],
    props: [
      row('title / label', 'string', "''", '标题与辅助说明', 'Title and supporting text'),
      row('value', 'string | number', "''", '右侧内容', 'Trailing value'),
      row('icon', 'IconName', '-', '左侧图标', 'Leading icon'),
      row('isLink / clickable', 'boolean', 'false', '交互状态；isLink 显示箭头', 'Interactive state; isLink shows an arrow'),
      row('href', 'string', "''", '存在时使用原生链接；复用 Link 的协议校验，不支持的地址明确报错', 'Use a native link when provided; shares Link protocol validation and reports unsupported destinations'),
      row('disabled', 'boolean', 'false', '禁用整行操作；Form 禁用不可被显式 false 或 Teleport 绕过', 'Disable the row action; explicit false and Teleport cannot bypass Form disabling'),
      row('border', 'boolean', 'true', '显示底部分隔线', 'Show a bottom divider'),
      row('CellGroup.title', 'string', "''", '分组标题', 'Group title'),
      row('CellGroup.description / footer', 'string', "''", '分组说明和页脚，也支持同名插槽；空白/注释插槽回退到属性，无内容不生成空描述；合并到组级 aria-describedby，不重复关联每行', 'Group description/footer with matching slots; blank/comment slots fall back to props and absent content creates no empty descriptions; merged into group aria-describedby, not repeated on each row'),
      row('CellGroup.inset', 'boolean', 'false', '内嵌分组布局', 'Inset group layout'),
    ],
    events: [row('click', '(event: MouseEvent) => void', '-', '未禁用时的点击', 'Click while enabled')],
    slots: [
      defaultSlot,
      row('title / label / icon / extra', '-', '-', '自定义行内容', 'Custom row content'),
      row('CellGroup.default / title', '-', '-', '分组内容与标题', 'Group content and title'),
    ],
  },
  'nav-bar': {
    description: text('移动端顶部导航，提供返回、标题和右侧操作区域。', 'A mobile top navigation bar with back, title and action areas.'),
    demo: 'mobile',
    examples: [
      {
        title: basic,
        code: sample('  <scq-nav-bar\n    title="配置结算"\n    left-arrow\n    right-text="保存"\n    @click-left="onBack"\n    @click-right="onSave"\n  />\n\n  <div class="status-banner">\n    <div class="status-banner__icon">\n      <scq-icon name="check" :size="24" />\n    </div>\n    <div class="status-banner__text">\n      <span class="status-banner__title">待确认配置</span>\n      <span class="status-banner__desc">请核对服务清单与扣费明细</span>\n    </div>\n  </div>\n\n  <scq-cell-group :inset="true">\n    <scq-cell title="服务方案" value="SCQ VUE Cloud Pro" />\n    <scq-cell title="生效节点" value="ap-east-1" />\n    <scq-cell title="到期时间" value="2027-10-09" />\n    <scq-cell title="自动续订">\n      <scq-switch v-model="autoRenew" aria-label="自动续订" />\n    </scq-cell>\n  </scq-cell-group>\n\n  <div style="padding: 20px 14px 10px;">\n    <scq-button type="primary" round style="width: 100%; height: 44px;" @click="onConfirm">\n      确认并生效\n    </scq-button>\n  </div>', "const autoRenew = ref(true)\n\nconst onBack = () => {\n  console.log('返回')\n}\n\nconst onSave = () => {\n  console.log('已保存')\n}\n\nconst onConfirm = () => {\n  console.log('已确认配置')\n}"),
      },
      {
        title: text('图标操作', 'Icon Actions'),
        variant: 'states',
        code: sample('  <scq-nav-bar\n    title="配置结算"\n    left-arrow\n    right-icon="settings"\n    right-label="设置"\n    @click-left="onBack"\n    @click-right="onSettings"\n  />', "const onBack = () => {\n  console.log('返回')\n}\n\nconst onSettings = () => {\n  console.log('设置')\n}"),
      },
    ],
    props: [
      row('title / leftText / rightText', 'string', "''", '标题和按钮文字', 'Title and button labels'),
      row('leftArrow', 'boolean', 'false', '显示返回图标', 'Show back icon'),
      row('rightIcon', 'IconName', '-', '右侧图标', 'Trailing icon'),
      row('rightLabel', 'string', 'locale', '图标按钮无障碍名称；省略时跟随语言设置', 'Accessible icon-button label; follows the locale when omitted'),
      row('beforeBack', '(event, signal) => boolean | void | Promise', '-', '返回前拦截；拒绝不触发 click-left，禁用/卸载取消旧任务；error 报告异常。左右操作在等待/加载结束后恢复原键盘焦点，不抢占已移动焦点', 'Guard back navigation; rejection suppresses click-left, disabled/unmount cancels stale work, and error reports failures. Actions restore original keyboard focus after guards/loading without stealing moved focus'),
      row('disabled / leftDisabled / rightDisabled / leftLoading / rightLoading', 'boolean', 'provider / false', '整体或分侧状态；左侧自动 pending，实例可 cancelPending()', 'Global/per-side state; the left action automatically tracks pending and exposes cancelPending()'),
      row('fixed', 'boolean', 'false', '固定顶部并自动保留占位', 'Fix to viewport top and preserve layout space'),
      row('border', 'boolean', 'true', '底部分隔线', 'Bottom divider'),
      row('safeAreaInsetTop', 'boolean', 'false', '顶部安全区', 'Top safe-area inset'),
    ],
    events: [
      row('click-left / click-right', '(event: MouseEvent) => void', '-', '两侧按钮点击', 'Leading or trailing action clicked'),
      row('error', '(error) => void', '-', '返回拦截失败', 'Back guard failed'),
    ],
    slots: [row('left', '{ back, pending, disabled }', '-', '自定义返回区域', 'Custom back area'), row('title', '-', '-', '标题', 'Title'), row('right', '{ click, disabled }', '-', '自定义右侧区域', 'Custom trailing area')],
    methods: [row('cancelPending / pending', '() => void / boolean', '-', '取消或读取返回任务', 'Cancel or inspect the back task')],
  },
  tabbar: {
    description: text('移动端主导航，支持图标、徽标、禁用项与底部安全区。', 'Mobile primary navigation with icons, badges, disabled items and bottom safe-area support.'),
    note: text('beforeChange(item, signal) 可异步拦截导航，返回 false 保留当前项；error(error,item) 报告异常，外部值/项目/禁用更新取消旧任务。item.action=true 只发 action(item)，不触发导航或 change。showLabels 默认 true，关闭时按钮保留可访问名称。disabled 可继承 Provider，实例暴露 pending/cancelPending()。', 'beforeChange(item, signal) guards navigation; false retains the current item. error(error,item) reports failures, and external value/items/disabled changes cancel stale work. item.action=true emits only action(item), never navigation/change. showLabels defaults to true; hidden labels retain accessible names. disabled inherits the provider; pending/cancelPending() are exposed.'),
    demo: 'mobile',
    examples: [
      {
        title: basic,
        code: sample('  <scq-nav-bar :title="activeLabel" />\n\n  <!-- 页面内容区域 -->\n  <div v-if="active === \'home\'" class="tab-page">\n    <div class="stat-card">\n      <div class="stat-card__head">\n        <span class="stat-card__label">今日任务</span>\n        <scq-tag type="success" size="small">进行中</scq-tag>\n      </div>\n      <div class="stat-card__num">12 / 16</div>\n      <span class="stat-card__tip">预计今日 18:00 前完成构建发布</span>\n    </div>\n\n    <scq-cell-group title="快捷工具" :inset="true" style="margin-top: 14px;">\n      <scq-cell title="发布部署流水线" value="8 Jobs" is-link />\n      <scq-cell title="设计资产库" value="240 Items" is-link />\n    </scq-cell-group>\n  </div>\n\n  <div v-else-if="active === \'inbox\'" class="tab-page">\n    <scq-cell-group :inset="true">\n      <scq-cell title="系统更新通知" label="scq-vue v1.1.13 已发布" value="10:30" icon="info" is-link />\n      <scq-cell title="团队协作邀请" label="Chauncy 邀请您加入协作" value="09:15" icon="user" is-link />\n    </scq-cell-group>\n  </div>\n\n  <div v-else class="tab-page">\n    <scq-cell-group :inset="true">\n      <scq-cell title="偏好语言" value="中文" is-link />\n      <scq-cell title="账号安全" value="98%" is-link />\n    </scq-cell-group>\n  </div>\n\n  <!-- 底部 Tabbar -->\n  <scq-tabbar v-model="active" :items="tabItems" />', "import { computed } from 'vue'\nimport type { TabbarItem } from 'scq-vue'\n\nconst active = ref('home')\n\nconst tabItems: TabbarItem[] = [\n  { name: 'home', label: '首页', icon: 'home' },\n  { name: 'inbox', label: '消息', icon: 'inbox', badge: 3 },\n  { name: 'profile', label: '我的', icon: 'user' },\n]\n\nconst activeLabel = computed(() =>\n  tabItems.find((item) => item.name === active.value)?.label || ''\n)"),
      },
      {
        title: text('提示与禁用', 'Dots and Disabled'),
        variant: 'states',
        code: sample('  <scq-tabbar v-model="active" :items="tabItems" />', "import type { TabbarItem } from 'scq-vue'\n\nconst active = ref('home')\n\nconst tabItems: TabbarItem[] = [\n  { name: 'home', label: '首页', icon: 'home', dot: true },\n  { name: 'profile', label: '我的', icon: 'user' },\n  { name: 'settings', label: '设置', icon: 'settings', disabled: true },\n]"),
      },
    ],
    props: [
      row('beforeChange', '(item, signal) => boolean | void | Promise', '-', '切换前拦截', 'Guard navigation changes'),
      row('showLabels / disabled', 'boolean', 'true / provider', '标签显隐和禁用', 'Label visibility and disabled state'),
      row('modelValue', 'string | number', 'first enabled', '当前导航项', 'Active navigation item'),
      row('items', 'readonly TabbarItem[]', 'required', 'name、label、icon、activeIcon、badge、dot、disabled；action=true 为非导航操作，不使用活动图标。非受控选择按名称保留，删除后回退首个可用导航项', 'name, label, icon, activeIcon, badge, dot, disabled; action=true is non-navigational and never uses an active icon. Uncontrolled selection stays by name, falling back to the first available navigation item after removal'),
      row('fixed', 'boolean', 'false', '固定底部并保留占位', 'Fix to viewport bottom and preserve layout space'),
      row('safeAreaInsetBottom', 'boolean', 'true', '底部安全区', 'Bottom safe-area inset'),
      row('ariaLabel', 'string', 'locale', '导航区域名称', 'Accessible navigation name'),
    ],
    events: [modelEvent, row('action', '(item) => void', '-', '非导航操作', 'Non-navigation action'), row('error', '(error, item) => void', '-', '切换失败', 'Navigation failed')],
    methods: [row('cancelPending / pending', '() => void / boolean', '-', '取消或读取等待状态', 'Cancel or inspect pending work')],
    slots: [
      row('icon', '{ item, active }', '-', '自定义图标', 'Custom icon'),
      row('label', '{ item }', '-', '自定义文字', 'Custom label'),
    ],
  },
  'chat-choice': {
    description: text('在聊天中提供单选、多选和自定义输入，支持选择数量限制与提交校验。', 'Offer single or multiple choices and custom input in conversations, with selection limits and submission validation.'),
    demo: 'chat-choice',
    examples: [
      {
        title: text('单选提交', 'Single Selection'),
        code: sample('  <scq-chat-choice\n    v-model="answer"\n    :options="options"\n    submit-text="确认"\n    @submit="submitted = $event"\n  />\n  <pre v-if="submitted" class="code">{{ JSON.stringify(submitted, null, 2) }}</pre>', "import type { ChatChoiceAnswer, ChatChoiceOption } from 'scq-vue'\n\nconst answer = ref<ChatChoiceAnswer>({ values: [] })\nconst submitted = ref<ChatChoiceAnswer>()\n\nconst options: ChatChoiceOption[] = [\n  { value: 'online', label: '线上沟通' },\n  { value: 'offline', label: '线下见面' },\n]"),
      },
      {
        title: text('多选与其他输入', 'Multiple and Other Input'),
        variant: 'states',
        code: sample('  <scq-chat-choice\n    v-model="answer"\n    mode="multiple"\n    :options="options"\n    allow-other\n    :max="3"\n    other-label="其他"\n    other-placeholder="输入其他内容"\n    submit-text="确认"\n    @submit="submitted = $event"\n  />\n  <pre v-if="submitted" class="code">{{ JSON.stringify(submitted, null, 2) }}</pre>', "import type { ChatChoiceAnswer, ChatChoiceOption } from 'scq-vue'\n\nconst answer = ref<ChatChoiceAnswer>({ values: [] })\nconst submitted = ref<ChatChoiceAnswer>()\n\nconst options: ChatChoiceOption[] = [\n  { value: 'design', label: '设计' },\n  { value: 'frontend', label: '前端' },\n]"),
      },
    ],
    props: [
      row('modelValue', 'ChatChoiceAnswer', '{ values: [] }', '预设值和自定义文本共享 values 数组', 'Preset values and custom text share the values array'),
      row('mode', 'single | multiple', 'single', '选择模式', 'Selection mode'),
      row('options', 'ChatChoiceOption[]', '[]', 'value、label、disabled 等选项数据', 'Option data including value, label and disabled'),
      row('name', 'string', "''", '原生输入组名称', 'Native input group name'),
      row('allowOther', 'boolean', 'false', '显示其他输入', 'Allow custom input'),
      row('otherLabel / otherPlaceholder / otherMaxlength', 'string / string / number', 'localized / localized / -', '其他输入文字与长度', 'Custom input labels and length'),
      row('required / otherRequired', 'boolean', 'true', '选择与自定义输入必填', 'Require selection and custom text'),
      row('min / max', 'number', '-', '多选数量范围', 'Multiple selection bounds'),
      row('disabled / loading / submitted', 'boolean', 'false', '不可交互状态', 'Non-interactive states'),
      row('submitText / loadingText / submittedText', 'string', 'localized', '按钮状态文案', 'Button state labels'),
      row('requiredMessage / otherRequiredMessage', 'string', 'localized', '校验提示', 'Validation messages'),
    ],
    events: [
      modelEvent,
      row('submit', '(answer: ChatChoiceAnswer) => void', '-', '校验通过后提交', 'Submit after successful validation'),
      row('validation-error', '(error: ChatChoiceValidationError) => void', '-', '校验失败', 'Validation failed'),
    ],
    slots: [
      row('option', '{ option, index, selected, disabled }', '-', '自定义选项', 'Custom option'),
      row('other-label', '{ selected }', '-', '自定义其他标题', 'Custom other label'),
      row('footer', '{ submit, disabled, validationMessage }', '-', '自定义底部操作', 'Custom footer actions'),
    ],
  },
}

export const componentEnhancements = createEnhancementReferences({ row, text })
const mergeRows = (base: ApiRow[] = [], added: ApiRow[] = []) => [...new Map([...base, ...added].map((value) => [value.name, value])).values()]
for (const [slug, enhancement] of Object.entries(componentEnhancements)) {
  const reference = componentReferences[slug]
  if (!reference) continue
  reference.props = mergeRows(reference.props, enhancement.props)
  reference.events = mergeRows(reference.events, enhancement.events)
  reference.methods = mergeRows(reference.methods, enhancement.methods)
  reference.slots = mergeRows(reference.slots, enhancement.slots)
  reference.examples.push(...enhancement.examples)
  if (enhancement.note) reference.note = reference.note
    ? text(`${reference.note.zh}\n${enhancement.note.zh}`, `${reference.note.en}\n${enhancement.note.en}`)
    : enhancement.note
}