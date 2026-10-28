import type { ComponentReference, row as createRow, text as createText } from './reference'
import { sourceExample } from './example-sources'

export const createEnhancementReferences = ({ row, text }: { row: typeof createRow; text: typeof createText }): Record<string, ComponentReference> => {
  const example = (name: string, zh: string, en: string, phone = false) => ({ title: text(zh, en), ...sourceExample(name, phone) })
  const entry = (props: ComponentReference['props'], extra: Partial<ComponentReference> = {}): ComponentReference => ({
    description: text('通过以下配置和示例，了解组件在不同使用场景下的交互方式。', 'Explore the following options and examples to adapt the component to different use cases.'),
    demo: 'basic', examples: [], props, ...extra,
  })
  const guard = row('beforeChange', '(next, signal: AbortSignal) => boolean | void | Promise<boolean | void>', '-', '异步拦截；false 拒绝，失败触发 error；取消、新外部值或替换守卫使旧结果失效', 'Async guard; false rejects, failures emit error; cancellation, newer external state or replacing the guard invalidates old results')
  const closeGuard = row('beforeClose', '(reason, signal: AbortSignal) => boolean | void | Promise<boolean | void>', '-', '关闭前调用，可根据关闭原因决定是否允许关闭', 'Called before closing; use the close reason to decide whether to allow dismissal')
  const pending = row('pending / cancelPending', 'boolean / () => void', '-', '只读等待状态与主动取消；重复操作不会重复执行守卫', 'Readonly pending state and cancellation; repeated actions do not duplicate the guard')
  const error = row('error', '(error: unknown, valueOrReason) => void', '-', '仅报告当前请求失败；取消不报业务错误，未监听时记录错误', 'Report only current failures, not cancellation; unhandled errors are logged')
  const focus = row('initialFocus', 'string | HTMLElement | (() => HTMLElement | null) | false', '-', '打开后初始焦点；false 不自动聚焦，函数返回 null 使用面板', 'Initial focus after opening; false opts out, a null function result uses the panel')
  const layers = [
    row('lockScroll', 'boolean', 'true', '按 Document 引用计数锁定滚动；全部持锁浮层关闭后恢复', 'Reference-counted per-document scroll locking'),
    focus,
    row('destroyOnClose', 'boolean', 'true', '模板模式关闭后销毁；false 保留内部内容状态', 'Destroy template contents on close; false preserves state'),
  ]
  const virtual = [
    row('virtual', 'boolean', 'false', '显式启用共享 VirtualList，不改变选择集合或业务分页', 'Opt in to shared VirtualList rendering without changing selection or business pagination'),
    row('height / itemHeight / overscan', 'number', 'VIRTUAL_LIST_DEFAULTS', '虚拟视口、固定行高和缓冲行数；默认 320 / 44 / 5', 'Virtual viewport, row height and overscan; defaults 320 / 44 / 5'),
  ]
  const fieldNote = text(
    '与 FormItem 搭配时，控件会自动关联标签、帮助和错误提示。Form.disabled 会禁用整个表单，子控件的 disabled=false 不会解除整表禁用；单独使用时可显式覆盖 ConfigProvider 的默认禁用设置。',
    'Within FormItem, controls are associated with their labels, help and error messages. Form.disabled disables the entire form, even when a child sets disabled=false. Outside a disabled form, explicit props can override ConfigProvider defaults.',
  )
  const layoutBreakpoints = row('breakpoints', 'LayoutBreakpoints', 'LAYOUT_BREAKPOINTS', '可覆盖 sm/md/lg/xl 的最小屏宽，必须递增；默认 640/768/1024/1280px，xs 固定为 0', 'Override increasing sm/md/lg/xl minimum viewport widths; defaults 640/768/1024/1280px, with xs fixed at zero')
  const layoutExample = example('LayoutFoundationExample', '响应式布局、栅格与分割线', 'Responsive Layouts, Grid and Dividers')
  const responsiveNote = text('响应式对象从 xs 向上继承已设置值，未设置 xs 时使用组件默认值。命名间距 none/xs/sm/md/lg/xl/xxl 对应 0/4/8/12/16/24/32px，可用 --scq-space-* CSS 变量覆盖。响应式配置在服务端渲染时先使用 xs，挂载后按视口更新，并保留插槽内容状态。', 'Responsive objects inherit earlier values; without xs the component default applies. Spacing tokens none/xs/sm/md/lg/xl/xxl map to 0/4/8/12/16/24/32px and support --scq-space-* CSS overrides. Responsive configurations start at xs during server rendering, then resolve the viewport after mounting while preserving slot state.')
  const references: Record<string, ComponentReference> = {
    card: entry([
      row('clickable / selectable / selected', 'boolean', 'false / false / uncontrolled false', '显式整卡操作与可选 v-model:selected；受控时以业务值为准', 'Opt-in card activation with optional v-model:selected; controlled values remain authoritative'),
      row('disabled / ariaLabel', 'boolean / string', 'provider / header or locale', '禁用整卡入口及其名称，不强制禁用插槽内的独立业务操作', 'Disable/name the card-level action without forcing independent slot controls to be disabled'),
      row('size / mediaRatio', 'ComponentSize / number | string', 'provider / -', '紧凑间距与可选媒体比例；显式 padding/bodyStyle 保持优先级', 'Compact spacing and optional media aspect ratio; explicit padding/bodyStyle retain priority'),
    ], {
      examples: [example('CardEnhancementExample', '可选卡片、内部操作与键盘', 'Selectable Cards, Nested Actions and Keyboard')],
      events: [row('update:selected / select', '(selected) / (selected, MouseEvent)', '-', '请求选中态更新；click.prevent 可拒绝本次选择', 'Request selection changes; click.prevent can cancel selection')],
      slots: [row('actions', '-', '-', '悬停或键盘聚焦时显示操作区，触摸环境始终显示', 'Actions shown on hover/focus, always visible on devices without hover')],
      note: text('设置 clickable 或 selectable 后，可通过鼠标或键盘操作整张卡片。卡片内的链接、按钮、表单控件及 data-card-interactive 区域独立响应，不触发整卡操作。可交互卡片遵守表单禁用状态。加载期间保留内容；可通过 bodyStyle 或 mediaRatio 预留空间，减少布局跳动。数值 padding 必须有限，负值按零处理。', 'Set clickable or selectable to operate the card by mouse or keyboard. Nested links, buttons, form controls and data-card-interactive regions act independently without activating the card. Interactive cards respect form disabling. Content stays mounted while loading; use bodyStyle or mediaRatio to reserve space and reduce layout shifts. Numeric padding must be finite; negative values become zero.'),
    }),
    'chat-message': entry([
      row('generationStatus', 'waiting | generating | completed | stopped | error', '-', '受控生成阶段；auto 字符串固定按 Markdown 渲染，显式 contentType 优先；不修改 message 或解析 SSE', 'Controlled generation phase; auto strings stay Markdown while explicit contentType wins; never mutates message or parses SSE'),
      row('status', 'ChatMessageStatus | null', 'null', '覆盖生成状态的 type/text/loading；visible=false 隐藏，visible=true 可与正文同时显示', 'Override generation type/text/loading; visible=false hides the status and visible=true works alongside content'),
      row('actions', '(ChatMessageAction | ChatMessageActionConfig)[]', '[]', '按配置显示 copy/retry/regenerate/stop/like/dislike；对象支持 name、label、disabled、loading', 'Opt into copy/retry/regenerate/stop/like/dislike; objects accept name, label, disabled and loading'),
      row('actionHandler', '(payload, signal: AbortSignal) => boolean | void | Promise<boolean | void>', '-', '可选异步处理；false 拒绝，抛错显示失败；等待期间防重复，stop 可取消在途操作', 'Optional async handler; false refuses, errors display feedback, pending work blocks duplicates and stop can interrupt it'),
      row('actionTexts', 'ChatMessageActionTexts', '{}', '操作名称及 copied/copyFailed/failed 文案；按钮 label 优先于默认名称', 'Action labels and copied/copyFailed/failed feedback; per-button label overrides defaults'),
      row('feedback', 'like | dislike | null', 'uncontrolled null', '支持 v-model:feedback；重复点击当前评价会取消，异步成功后才请求更新', 'Optional v-model:feedback; clicking the current rating clears it and async acceptance precedes updates'),
      row('copyFormat', 'markdown | text', 'markdown', '复制原始 Markdown 或解析后的纯文本；JSON 复制序列化内容，媒体复制地址', 'Copy raw Markdown or parsed plain text; JSON copies serialized content and media copies its URL'),
      row('selectionSubmit', '(payload, signal: AbortSignal) => boolean | void | Promise<boolean | void>', '-', '自动管理 submitting/submitted/error，失败保留输入；与事件驱动提交二选一，避免重复请求', 'Manage submitting/submitted/error and retain input on failure; choose this or event-driven requests, not both'),
      row('selection.status', 'pending | submitting | submitted | error | expired', 'pending', '外部状态可控制锁定、重试和结果摘要；异步回调模式省略或使用 pending', 'Control locking, retries and summaries externally; omit or use pending with the async callback'),
      row('selection.autoSubmit', 'boolean', 'true', '单选默认点击即提交；false 显示确认按钮，多选始终需要确认', 'Single selection submits immediately by default; false adds confirmation and multiple selection always confirms'),
      row('selection.refreshable', 'boolean', 'false', '过期时显示重新获取入口，触发 selection-refresh；业务负责更新 id/options/status', 'Show a refresh action on expiry and emit selection-refresh; the app updates id/options/status'),
      row('selection.submittingText / errorText / retryText / refreshText', 'string', 'locale defaults', '提交中、失败、重试及刷新文案；errorText 优先于回调错误消息', 'Pending, failure, retry and refresh labels; errorText overrides callback error messages'),
      row('selection.submittedText / limitText', 'string', '已选择：{values} / derived', '结果摘要与数量说明，分别支持 {values}、{min}/{max} 占位符', 'Summary and limit labels support {values} and {min}/{max} placeholders respectively'),
      row('parts', 'ChatMessagePart[]', '[]', '非空时替代 message；每项唯一稳定 id，type 为 text/markdown/json/image/video/custom，标准内容用 content，自定义用 data/text', 'Nonempty parts replace message; each has a unique stable id and text/markdown/json/image/video/custom type, with content or custom data/text'),
      row('sources', 'ChatMessageSource[]', '[]', '引用 title、url、page、excerpt；链接按安全协议过滤，无链接时仍可触发业务查看', 'Source title, url, page and excerpt; unsafe links are filtered and records without links can still emit business events'),
      row('imagePreviewSources / message.width / message.height', 'string[] / number | string / number | string', '[] / 320 / 200', '图片复用 Image 的多图预览、缩放、旋转、重试；尺寸预留加载空间。Markdown 图片也可预览，链接图片保留跳转语义', 'Shared Image gallery, zoom, rotation and retry with reserved dimensions; Markdown images preview too, while linked images retain navigation'),
      row('attachmentActions / attachment.actions', 'ChatAttachmentAction[]', 'preview, download, retry, cancel', '按文件状态过滤操作，可用空数组关闭；失败和上传中附件不会直接导航', 'Filter actions by attachment state; an empty array hides controls, failed/uploading files never navigate directly'),
      row('attachmentActionHandler', '(payload, signal: AbortSignal) => boolean | void | Promise<boolean | void>', '-', '异步鉴权、刷新地址、预览或下载由业务执行；文件名与操作按钮共用处理器，取消和移除隔离旧结果', 'The app owns async authorization, URL refresh, preview and download; filename and action buttons share the handler and cancellation/removal invalidates old work'),
      row('attachmentActionTexts / attachment.disabled', 'ChatAttachmentActionTexts / boolean', '{} / false', '附件操作和错误文案覆盖，以及单个附件禁用', 'Attachment action/error text overrides and per-file disabling'),
      row('syntaxHighlight', 'boolean', 'true', '启用代码语法高亮；代码保持原始换行与缩进，溢出时滚动，复制始终包含完整内容', 'Enable syntax highlighting; preserve original line breaks and indentation, scroll overflow and always copy the complete content'),
      row('streamInterval', 'number', '0', '可选合并更新间隔（毫秒）；完成、停止、失败立即刷新。parts 使用新数组提交增量，0 保持即时更新', 'Optional update coalescing interval in ms; completion, stopping and failure flush immediately. Replace parts arrays for coalescing; zero updates immediately'),
      row('texts / disabled', 'ChatMessageTexts / boolean', '{} / provider', '默认文案、主题、禁用跟随 ConfigProvider；显式文案和禁用优先，停止生成仍可操作', 'Default labels, theme and disabling follow ConfigProvider; explicit overrides win and stopping remains available'),
    ], {
      events: [
        row('action / action-success', '(payload: ChatMessageActionPayload)', '-', '操作请求及接受完成；payload 含 action/message，复制含 text，评价含下一次 feedback', 'Action requests and acceptance; payload contains action/message, copy text or the next feedback value'),
        row('action-error', '(error: unknown, payload: ChatMessageActionPayload)', '-', '当前操作失败；取消、卸载和已失效请求不触发', 'Current action failures only; cancelled, unmounted and obsolete work is ignored'),
        row('retry / regenerate / stop', '(payload: ChatMessageActionPayload)', '-', '独立请求事件；由业务更新生成阶段。使用 actionHandler 时仅作通知，不重复发起请求', 'Distinct request events; the application updates generation state. With actionHandler these are notifications, not additional requests'),
        row('update:feedback / feedback-change', '(feedback: ChatMessageFeedback)', '-', '接受后的评价值，null 表示取消；受控值仍以父级为准', 'Accepted rating, with null meaning cleared; controlled parent values remain authoritative'),
        row('selection-success / selection-error', '(payload) / (error, payload)', '-', 'selectionSubmit 回调成功或失败；返回 false 不提交也不报错', 'selectionSubmit acceptance or failure; false neither submits nor reports an error'),
        row('selection-refresh', '(selection: ChatMessageSelection)', '-', '过期后的重新获取请求，不由组件访问接口', 'Request refreshed expired choices without component-owned networking'),
        row('attachment-action / attachment-action-success', '(payload: ChatAttachmentActionPayload)', '-', '附件操作意图与处理器接受结果；避免同时从意图事件和回调重复发起请求', 'Attachment intent and handler acceptance; do not duplicate requests in the intent event and callback'),
        row('attachment-action-error', '(error: unknown, payload: ChatAttachmentActionPayload)', '-', '仅报告当前附件请求失败，并保留操作入口', 'Report current attachment failures while preserving recovery actions'),
        row('source-click', '(payload: ChatMessageSourcePayload, event: MouseEvent)', '-', '来源查看事件；event.preventDefault() 可阻止链接跳转并打开业务详情', 'Source activation; event.preventDefault() can replace navigation with application details'),
      ],
      slots: [
        row('actions', '{ actions, run, feedback, pending }', '-', '替换默认操作栏，run(name) 执行已配置操作；pending 是当前操作名或 null', 'Replace default actions; run(name) invokes a configured action and pending is its name or null'),
        row('selection-actions', '{ selection, values, disabled, loading, status, confirm }', '-', '自定义确认区域，同时遵守 disabled/loading；confirm 执行相同提交流程', 'Customize confirmation while respecting disabled/loading; confirm uses the same submission lifecycle'),
        row('part', '{ part, index }', '-', '渲染 custom 分段；稳定 id 保留插槽输入状态，text 作为无插槽回退和整条复制内容', 'Render custom parts; stable ids preserve editor state and text provides fallback and whole-message copy content'),
        row('source', '{ source, index }', '-', '替换单条来源内容，业务自行绑定跳转或详情操作', 'Replace an individual source and provide your own navigation/details actions'),
      ],
      note: text('正文和状态独立显示，status 中的显式配置优先；statusTexts 可覆盖默认类型文案。actions 默认关闭，stop 仅在等待/生成时显示；配置 generationStatus 后，retry 仅在失败/停止时显示，regenerate 仅在完成时显示，两者互斥；未配置生成状态时遵循显式 actions 配置。selectionSubmit/actionHandler 可返回 Promise；调用方应遵守 AbortSignal，组件取消不会回滚已经发送的请求。selection-submit/action 始终通知操作意图，使用回调时不要再从事件重复提交。选择 id 变化、外部 status 变化、替换提交回调或卸载会取消旧提交；新一轮选择应更换 id。实时“其他”输入及其受控回写保留来源，selectedOptions 只包含实际勾选项；仅有 values 的首次历史回显优先匹配预设 value，因此推荐预设值使用独立业务标识。同名单选回显无法从字符串推断原始来源。', 'Content and status render independently, explicit status fields take precedence, and statusTexts overrides default type labels. Actions are opt-in: stop is visible while waiting/generating; with generationStatus, retry appears only for error/stopped and regenerate only for completed, never together. Without generationStatus, explicit actions configuration is preserved. Async handlers receive AbortSignal; cancellation cannot undo already-sent requests. selection-submit/action report intent, so do not duplicate callback requests in event listeners. Changing selection id, external status, submit handler or unmounting cancels old submissions; use a new id for a new selection. Live custom input and controlled echoes preserve provenance, and selectedOptions includes actual preset choices only. Initial history with values alone matches preset values first, so distinct business identifiers are recommended; identical strings cannot reveal their original source.'),
    }),
    image: entry([
      row('previewLabel / previewCloseLabel', 'string', 'locale', '覆盖预览区域和关闭按钮的可访问名称', 'Override the gallery and close-button accessible names'),
      row('srcset / sizes / fallbackSrc', 'string / string / string | string[]', '-', '响应式源及备用地址，复用 Avatar 的来源隔离；每次失败继续发出 error(Event)', 'Responsive sources and backup URLs share Avatar source isolation; each failure still emits error(Event)'),
      row('decoding / fetchpriority', 'sync | async | auto / high | low | auto', 'auto / auto', '透传浏览器解码与请求优先级；数值 width/height 必须有限，负值归零并同步为原生尺寸提示', 'Native decoding/request priority; numeric width/height must be finite, clamp to zero, and also provide native size hints'),
      row('previewIndex', 'number', 'uncontrolled', 'v-model:previewIndex，零起始；受控值优先于 showPreview(index) 和 initialIndex', 'Zero-based v-model:previewIndex; controlled state takes precedence over showPreview(index) and initialIndex'),
      row('previewWheelZoom / previewPinchZoom / previewDoubleClickReset', 'boolean', 'false', '显式启用滚轮缩放、双指缩放和双击复位；缩放范围保持 1～5 倍', 'Opt-in wheel zoom, two-pointer pinch and double-click reset; scale remains bounded from 1 to 5'),
    ], {
      examples: [example('ImageEnhancementExample', '响应式图片与可恢复预览', 'Responsive Images and Recoverable Preview')],
      events: [row('update:previewIndex / preview-load', '(index: number) / (event: Event)', '-', '请求索引更新与当前预览图加载完成；旧节点事件隔离', 'Requested index changes and current preview load; stale node events are isolated')],
      slots: [row('toolbar', '{ index, src, scale, rotation, zoomIn, zoomOut, reset, close }', '-', '替换工具栏；保留关闭、上一张/下一张及键盘入口。图片快捷键不拦截编辑控件、输入法、修饰键组合或已被取消的事件', 'Replace toolbar content while retaining close, previous/next and keyboard controls. Gallery shortcuts leave editable controls, composition, modifier combinations and prevented events alone')],
      methods: [row('retry / retryPreview / resetPreview', '() => void', '-', '重试主图/当前预览图，或重置缩放、旋转、平移', 'Retry the main/current preview image or reset scale, rotation and translation')],
      note: text('预览支持加载提示、失败重试及可选的滚轮和双指缩放。使用备用图片时，默认预览也显示该图片。跨源图片的下载或导出需要服务端允许相应访问；触摸手势的体验取决于设备和浏览器。', 'The preview provides loading feedback, retry actions and optional wheel or pinch zoom. When a fallback image is displayed, the default preview uses it too. Downloading or exporting cross-origin images requires server permission; touch behavior depends on the device and browser.'),
    }),
    avatar: entry([
      row('srcset / sizes / fallbackSrc', 'string / string / string | string[]', '-', '响应式图片候选与顺序备用地址；备用图不继承主图 srcset', 'Responsive image candidates and ordered backup URLs; backups do not reuse the primary srcset'),
      row('text / autoSize / gap', 'string / boolean / number', "'' / true / 4", '文本头像自动按实际宽度缩小；gap 为两侧预留像素，autoSize=false 关闭缩放', 'Shrink text to its measured width; gap reserves pixels on each side and autoSize=false disables scaling'),
      row('fallbackOrder', "('image' | 'slot' | 'text' | 'icon')[]", 'image, slot, text, icon', '按第一个可用内容展示；默认仍优先图片，失败后保留原插槽优先级', 'Display the first available content; image remains first and the existing slot priority is preserved after failure'),
    ], {
      examples: [example('AvatarEnhancementExample', '响应式头像、缩放与回退组合', 'Responsive Avatars, Scaling and Fallbacks')],
      methods: [row('retry', '() => void', '-', '重置并重试主图片及备用序列', 'Reset and retry the primary image and fallback sequence')],
      note: text('src/srcset/sizes/备用地址变化后重新尝试图片；旧节点事件不能覆盖新来源。每个失败尝试仍发出原 error(Event)。空白/注释插槽不阻断文本或图标回退；没有可访问名称时不强加 img 角色，保留插槽文本语义。文本/插槽按 DOM 宽度测量，尺寸、字体或内容变化后重新缩放；可配置文本优先。徽标及堆叠示例复用现有组件，不重复朗读姓名。', 'Source, srcset, sizes and backup changes retry the image; obsolete node events cannot override the new source. Each failed attempt still emits error(Event). Empty/comment slots do not block text or icon fallback; unnamed fallback content does not receive an img role that would hide slot text semantics. Text/slots are measured after size, font or content changes. Text-first order, badges and stacks reuse existing capabilities without repeating names.'),
    }),
    watermark: entry([
      row('content', 'string | readonly string[]', "'SCQ VUE'", '多行文字，也可传只读数组；身份及时间由业务提供', 'Multiline text or a readonly array; identity and timestamps come from the application'),
      row('image / imageSize / imageOpacity', 'string / [number, number] / number', "'' / [48,32] / 1", '图片与文字混合；远程图片需 CORS，失败通过 error 报告且保留文字', 'Mix an image with text; remote images require CORS, failures emit error while text remains'),
      row('offset', '[number, number]', '[0,0]', '背景水平和垂直偏移，可为负数', 'Horizontal and vertical background offsets, including negative values'),
      row('fontFamily / fontWeight / lineHeight', 'string / string | number / number', 'Arial, sans-serif / 500 / size × 1.4', '字体、字重和像素行距', 'Font family, weight and line height in pixels'),
      row('container', 'string | HTMLElement', '-', '挂载后解析目标；局部模式需要目标自身可定位，fullscreen 仍覆盖视口', 'Resolve the target after mounting; local targets must be positioned, while fullscreen still covers the viewport'),
      row('print', 'boolean', 'true', 'false 在打印时隐藏；true 请求保留背景，最终受打印设置影响', 'False hides the watermark in print; true requests background preservation, subject to print settings'),
    ], {
      examples: [example('WatermarkEnhancementExample', '混合水印、容器与恢复', 'Mixed Watermarks, Containers and Recovery')],
      events: [row('redraw / restore', '(event: WatermarkRenderEvent)', '-', '属性/图片重绘与实际 DOM 恢复，包含 container/fullscreen/imageLoaded', 'Redraws and actual DOM recovery with container/fullscreen/imageLoaded'), row('error', '(error: unknown)', '-', '当前图片请求、读取或解码失败；取消不报错', 'Current image request, reading or decoding failure; cancellation is not an error')],
      methods: [row('redraw / pending', '() => void / boolean', '-', '主动重绘与图片等待状态', 'Explicit redraw and image pending state')],
      note: text('水印层被移除或隐藏时会尝试恢复，不改变内容容器的显示状态。zIndex 必须为有限数值，小数部分会被截去。前端水印仍可被移除，不能阻止截图或替代访问控制。远程图片需要允许跨域访问，打印效果受浏览器和打印设置影响。', 'The component attempts to restore a removed or hidden watermark without changing the content container visibility. zIndex must be finite and is truncated to an integer. Client-side watermarks can still be removed and cannot prevent screenshots or replace access controls. Remote images require CORS permission; printing depends on browser and print settings.'),
    }),
    space: entry([
      row('size', 'ResponsiveValue<SpacingValue>', '12', '数值、CSS 长度、命名间距、行/列二元组，或响应式对象', 'Number, CSS length, named spacing, row/column pair or responsive object'),
      layoutBreakpoints,
    ], {
      examples: [layoutExample], note: responsiveNote,
      slots: [row('separator', '{ index: number }', '-', '可选装饰分隔内容；忽略空文本、注释和空 Fragment，不为 v-if 隐藏项生成分隔符；index 从 0 开始', 'Optional decorative separators; empty text, comments and empty fragments are ignored, including v-if placeholders; index is zero-based')],
    }),
    divider: entry([
      row('contentPosition', 'left | center | right | start | end', 'center', 'start/end 遵循 dir；left/right 保留物理方向', 'start/end follow dir; left/right retain physical positions'),
      row('--scq-divider-color / --scq-divider-text-color', 'CSS color', 'border / muted', '线条和文字颜色，可通过 style 或样式表覆盖，默认跟随主题', 'Line and text colors, overridable through style or CSS; theme defaults are retained'),
      row('--scq-divider-width / gap / margin / inset', 'CSS length', '1px / 16px / 24px / 24px', '粗细、内容间隔、水平分割线外边距、靠边文字缩进；每项使用完整 --scq-divider- 前缀', 'Thickness, content gap, horizontal-divider margin and edge-label inset; use the full --scq-divider- prefix'),
      row('--scq-divider-text-padding / font-size / text-max-width', 'CSS length / percentage', '4px / 13px / 75%', '文字区域内边距、字号与最大宽度', 'Text padding, font size and maximum width'),
      row('--scq-divider-vertical-height / vertical-margin / vertical-align', 'CSS length', '0.9em / 12px / -0.1em', '纵向分割线高度、行内间距和基线对齐', 'Vertical separator height, inline spacing and baseline alignment'),
    ], {
      examples: [layoutExample],
      note: text('保留 separator 与 aria-orientation。需要可访问名称时传入原生 aria-label；纯装饰插槽内容可标记 aria-hidden，避免重复朗读。', 'Preserves separator and aria-orientation. Supply native aria-label for an accessible name and mark purely decorative slot content aria-hidden to avoid repetition.'),
    }),
    grid: entry([
      row('gap', 'ResponsiveValue<SpacingValue>', '16', '保留原有数值/CSS 长度/行列间距，同时支持命名 token 与响应式对象', 'Keeps numeric/CSS/pair gaps and adds spacing tokens and responsive objects'),
      row('minItemWidth', 'number | string', '-', '显式使用 auto-fill；最小项宽不会超过容器，覆盖 columns 的列数规则', 'Opt in to auto-fill; minimum tracks never exceed the container and take precedence over columns'),
      layoutBreakpoints,
      row('.scq-grid__item CSS variables', '--scq-grid-column-span / --scq-grid-column-start / --scq-grid-row-span / --scq-grid-order', '1 / auto / 1 / 0', '给直接子项添加此类后启用跨列、起始列/偏移、跨行及视觉排序；跨度及起始列受当前列数约束', 'Opt in on direct children to column span/start, row span and visual ordering; column span/start are constrained to the current column count'),
    ], {
      examples: [layoutExample],
      note: text(`${responsiveNote.zh} 默认列断点继续使用原 CSS 媒体查询，保留已有 SSR 行为；自定义断点通过共享响应式规则更新。自动填充模式下工具类的起始列为 auto、列跨度为 1，需要多列跨度时使用 columns。视觉 order 不改写 DOM 或 Tab 顺序，不应用于会造成键盘阅读顺序混乱的交互内容。`, `${responsiveNote.en} Default column breakpoints retain the existing CSS media-query SSR behavior; custom breakpoints use the shared resolver. In auto-fill mode, item utilities use auto start and a single-column span; use columns for multi-column spans. Visual order never rewrites DOM or Tab order; avoid mismatched reading order for interactive content.`),
    }),
    layout: entry([
      row('direction', "ResponsiveValue<'vertical' | 'horizontal'>", 'vertical', '静态方向或按断点切换的方向，保留 reverse 语义', 'Static or responsive direction, preserving reverse semantics'),
      row('gap', 'ResponsiveValue<SpacingValue>', '0', '静态、命名或响应式行/列间距', 'Static, named or responsive row/column spacing'),
      row('align', 'ResponsiveValue<stretch | start | center | end | baseline>', 'stretch', '静态或响应式交叉轴对齐', 'Static or responsive cross-axis alignment'),
      row('justify', 'ResponsiveValue<start | end | center | space-between | space-around | space-evenly>', 'start', '静态或响应式主轴分布', 'Static or responsive main-axis distribution'),
      layoutBreakpoints,
    ], { examples: [layoutExample], note: text(`${responsiveNote.zh} 固定区使用 flex:none，弹性滚动区使用 flex:1、min-height:0 与 overflow:auto；组件不添加页面管理状态。`, `${responsiveNote.en} Use flex:none for fixed regions and flex:1, min-height:0 and overflow:auto for a scrollable region; no page-management state is introduced.`) }),
    link: entry([
      row('to / adapter', 'string / NavigationAdapter', '-', '可选路由目标与适配器；to 必须配合显式或作用域适配器，优先于 href；普通 href 无需路由依赖', 'Optional route path and adapter; to requires an explicit or scoped adapter and takes precedence over href; native href needs no router'),
      row('replace / exact / active', 'boolean', 'false / false / adapter', '替换导航、精确活动匹配、显式覆盖活动状态；活动链接使用 aria-current=page', 'Replacement navigation, exact matching and explicit active override; active links expose aria-current=page'),
      row('NavigationAdapter.resolve / navigate', '(to) => { href, active?, exactActive? } / (to, { replace, signal }) => boolean | void | Promise<...>', '-', 'resolve 提供安全 href 与可响应的活动状态；navigate 返回 false 拒绝，抛错报告失败', 'resolve supplies a safe href and reactive active state; navigate returns false to refuse and throws to report failure'),
      row('suffixIcon / external', 'IconName / boolean', '- / false', '后置图标及显式外链标识；外链说明跟随语言', 'Trailing icon and opt-in external indicator with localized accessible text'),
      row('loading / rel', 'boolean / string', 'false / -', '外部等待状态与原生 rel；新窗口始终合并 noopener noreferrer', 'External busy state and native rel; new-window links always merge noopener noreferrer'),
    ], {
      examples: [example('LinkNavigationExample', '可取消导航适配与原生链接', 'Abortable Navigation and Native Links')],
      events: [row('navigate / error', '(to) / (error, to)', '-', '当前实例的导航接受或失败；取消和返回 false 不作为错误', 'Current-instance navigation acceptance or failure; cancellation and false are not errors')],
      slots: [row('loading', '-', '-', '自定义装饰等待区，原链接仍以 aria-busy 表示状态', 'Custom decorative busy indicator; aria-busy remains on the link')],
      methods: [
        row('provideNavigationAdapter', '(adapter | ref | getter) => void', '-', 'setup 中提供可响应、可嵌套的适配器；显式 adapter 优先，完整/按需入口可混用', 'Provide a reactive, nestable adapter during setup; explicit adapters win and full/individual imports interoperate'),
        row('pending / cancelPending', 'boolean / () => void', '-', '适配器导航的只读等待状态与取消，自动隔离目标/适配器变化和卸载', 'Readonly adapter pending state and cancellation; destination/adapter changes and unmount invalidate pending work'),
      ],
      note: text('保留按钮/链接语义及原生属性。只拦截普通当前窗口路由点击；修饰键、中键、download、新窗口和业务 preventDefault 不被强制接管。连续点击只运行一次在途导航。适配器必须在提交前检查 signal；已经提交的路由不会自动回滚。失败通过 error 反馈，未监听时记录错误。', 'Preserves button/link semantics and native attributes. Only plain same-window route clicks are intercepted; modifiers, middle clicks, download, other targets and application preventDefault remain native. One navigation runs at a time. Adapters must check signal before committing; committed routes are not automatically rolled back. Failures emit error and are logged when unhandled.'),
    }),
    container: entry([
      row('collapsible / collapsed', 'boolean', 'false / uncontrolled false', '显式显示折叠操作，collapsed 可通过 v-model:collapsed 受控；未绑定时内部管理', 'Opt-in collapse controls with optional v-model:collapsed; state is internal when unbound'),
      row('asideMode / asideBreakpoint', 'static | drawer / number', 'static / 768', '静态模式保持原布局；抽屉模式在小于指定屏宽时复用 Drawer', 'Static mode retains the original layout; drawer mode reuses Drawer below the configured viewport width'),
      row('asideOpen / asideTitle', 'boolean / string', 'uncontrolled false / locale', '通过 v-model:asideOpen 管理窄屏抽屉；标题用于抽屉与侧栏的可访问名称', 'Control the narrow-screen drawer with v-model:asideOpen; title labels the drawer and sidebar'),
      row('height / scrollable', 'number | string / boolean', '- / false', '显式限制高度并启用独立正文滚动，保留固定页头/页脚；也可由外部 CSS 约束高度', 'Opt-in bounded height and independent content scrolling with fixed header/footer; height may also come from CSS'),
      row('disabled', 'boolean', 'provider / false', '禁用侧栏操作，显式 false 可覆盖全局禁用；已打开抽屉仍可关闭', 'Disable sidebar controls; explicit false overrides the provider, while an open drawer can still close'),
    ], {
      examples: [example('ContainerLayoutExample', '折叠、抽屉侧栏与独立滚动', 'Collapsible Drawer Sidebar and Independent Scrolling')],
      events: [row('update:collapsed / collapse-change / update:asideOpen / aside-open-change', '(value: boolean)', '-', '用户/实例方法发起状态更新；进入宽屏时请求关闭移动抽屉', 'State changes requested by the user or instance methods; entering a wide viewport requests closing the mobile drawer')],
      slots: [row('aside-toggle', '{ collapsed, open, mobile, toggle }', '-', '替换默认侧栏操作按钮', 'Replace the default sidebar toggle')],
      methods: [row('toggleAside / openAside / closeAside / collapseAside / expandAside', '() => void', '-', '请求切换、打开/关闭移动抽屉或收起/展开静态侧栏', 'Request toggle, mobile drawer opening/closing or static sidebar collapsing/expanding')],
      note: text('折叠侧栏或切换屏幕宽度时，侧栏中的输入内容会保留。窄屏抽屉支持焦点管理、Escape 关闭和滚动锁定。使用 asideWidth 设置侧栏宽度，示例通过 Slider 调整；如需记住布局偏好，请在应用中保存相应状态。', 'Sidebar inputs retain their values when collapsing or changing viewport width. The narrow-screen drawer supports focus management, Escape dismissal and scroll locking. Set asideWidth to control the width; the example adjusts it with Slider. Save the state in your application if layout preferences should persist.'),
    }),
    ...Object.fromEntries(['input', 'radio', 'checkbox', 'input-number', 'date-picker', 'time-picker', 'cascader', 'slider', 'rate', 'search'].map((slug) => [slug, entry([], { note: fieldNote })])),
    dialog: entry([...layers, closeGuard, row('cancelLoading', 'boolean', 'false', '取消操作等待状态', 'Cancel action pending state')], {
      note: text('关闭守卫拒绝后恢复操作焦点；数值 width 必须有限，负值按零处理。共享浮层 Escape 不消费输入法或 Ctrl/Meta/Alt 组合键。', 'A rejected close guard restores action focus. Numeric width must be finite; negative values become zero. Shared Escape handling ignores composition and Ctrl/Meta/Alt shortcuts.'),
      demo: 'overlay', examples: [example('LayerLifecycleExample', '嵌套浮层与焦点', 'Nested Layers and Focus')],
      events: [error], methods: [row('close / pending', '() => Promise<boolean> / boolean', '-', '模板实例关闭及等待状态', 'Template instance close and pending state'), row('options.onConfirm / onCancel / beforeClose', '(signal) / (reason, signal)', '-', '方法调用支持取消信号；错误通过 options.onError(error, reason) 报告', 'Method guards receive cancellation signals; options.onError(error, reason) reports failures')],
    }),
    modal: entry([...layers, closeGuard, row('cancelLoading', 'boolean', 'false', '取消操作等待状态', 'Cancel action pending state')], {
      note: text('关闭守卫拒绝后恢复操作焦点，取消/确认仍保持各自等待语义；数值 width 必须有限，负值按零处理，CSS 长度照常使用。Escape 遵循共享输入法和修饰键保护。', 'A rejected close guard restores action focus, preserving distinct cancel/confirm pending semantics. Numeric width must be finite, negative values become zero, and CSS lengths remain supported. Escape uses shared composition and shortcut protection.'),
      demo: 'overlay', examples: [example('LayerLifecycleExample', '嵌套弹窗与关闭控制', 'Nested Modals and Close Control')], events: [error],
      methods: [row('options.onError', '(error, reason) => void', '-', '方法调用的当前异步失败', 'Current asynchronous method failure')],
    }),
    popup: entry([...layers, closeGuard, row('ariaLabel / ariaLabelledby', 'string', 'locale / -', '弹层名称或已有标签 ID', 'Accessible name or existing label ID')], {
      note: text('打开时移除焦点内容恢复面板焦点；数值 size/roundRadius 必须有限，负值按零处理，保留 CSS 长度。Escape 忽略输入法和修饰键，关闭仍归还原触发器焦点。', 'Removing focused content while open restores panel focus. Numeric size/roundRadius must be finite; negatives become zero and CSS lengths remain supported. Escape ignores composition and modified keys, and closing returns focus to the trigger.'),
      demo: 'overlay', examples: [example('LayerLifecycleExample', '弹层堆叠与归还焦点', 'Stacking and Focus Return')], events: [error],
      methods: [row('close / pending', '() => Promise<boolean> / boolean', '-', '请求关闭与等待状态', 'Request close and inspect pending state')],
    }),
    popover: entry([focus, row('zIndex', 'number', 'auto', '自动高于所属父浮层；显式值保留', 'Automatically above its parent layer; explicit values are preserved')], {
      note: text('保持非模态语义。纯文本引用可使用 Enter/Space，引用内容变化自动更新 Tab 入口，Escape 可归还到引用容器；子浮层不误关父面板。切换触发模式或禁用取消旧延迟，重新启用不自动打开非受控面板。延迟必须在 0～2147483647ms 内，数值宽度必须有限。', 'Remains non-modal. Text-only references support Enter/Space; changing reference content updates its tab stop, and Escape can return focus to the reference wrapper. Child overlays do not dismiss parents. Trigger changes or disabling cancel stale delays; re-enabling does not reopen uncontrolled panels. Delays must be 0–2147483647ms and numeric widths must be finite.'),
    }),
    tooltip: entry([row('zIndex', 'number', 'auto', '接入共享 Escape 和层级管理', 'Shared Escape and stacking management')], {
      note: text('悬停和键盘焦点独立保持提示，二者都离开后才关闭；替换触发元素会重新关联描述，关闭仅移除自身描述 ID，不覆盖外部新增描述。延迟遵循共用有限定时器上限；输入法/修饰 Escape 不关闭。', 'Hover and keyboard focus independently retain the tooltip until both leave. Replacement triggers receive the description; closing removes only the owned ID and preserves external description edits. Delays use the shared finite timer limit; composition/modified Escape does not dismiss.'),
    }),
    drawer: entry([closeGuard, focus], {
      note: text('打开时移除焦点内容会恢复抽屉面板焦点；关闭不抢占归还到触发器的焦点。数值 size 必须有限，负值按零处理，保留 auto/CSS 长度。Escape 忽略输入法和修饰键。', 'Removing focused content while open restores panel focus without interfering with trigger focus on close. Numeric size must be finite; negatives become zero, while auto/CSS lengths remain supported. Escape ignores composition and modified keys.'),
      demo: 'overlay', examples: [example('AsyncInteractionExample', '可取消异步交互', 'Abortable Interactions')],
      methods: [pending], events: [error],
    }),
    switch: entry([guard], { examples: [example('AsyncInteractionExample', '异步切换与取消', 'Async Toggle and Cancellation')], methods: [pending], events: [error], note: fieldNote }),
    steps: entry([guard], { examples: [example('AsyncInteractionExample', '受控步骤异步守卫', 'Controlled Step Guards')], methods: [pending], events: [error] }),
    form: entry([
      row('showErrorSummary / focusOnError / scrollToError', 'boolean', 'false', '错误摘要按控件 ID 区分重复路径；失败后聚焦/滚动均为显式启用，聚焦跳过不可用项', 'Summary entries distinguish repeated paths by control ID; opt-in focus/scroll on failure skips unavailable focus targets'),
      row('FormItem.id / help', 'string', 'auto / empty', '字段容器标识与帮助文案，帮助自动关联到控件', 'Field container ID and associated help text'),
      row('FormItem.dependencies', 'string[]', '[]', '依赖的模型路径变化时校验本字段；自定义校验器可读取完整模型', 'Validate when dependent model paths change; validators receive the full model'),
      row('FormItem.validateDebounce', 'number', '0', '自动变更校验防抖；blur 和手动校验不等待', 'Debounce automatic changes; blur and manual validation are immediate'),
    ], {
      demo: 'form', examples: [example('FormProtocolExample', '表单联动与错误摘要', 'Field Dependencies and Error Summary')],
      methods: [
        row('state / getFieldState / getFieldStates', 'FormState / (prop) => FormFieldState | undefined / () => FormFieldState[]', '-', 'dirty 对比挂载基准；touched 表示失焦或提交；pending 表示校验进行中', 'dirty compares the mounted baseline; touched tracks blur/submit; pending tracks validation'),
        row('focusField / focusFirstError / scrollToField', '(prop, options?) / (options?) / (prop, options?)', '-', '定位真实控件；不存在的字段会明确警告', 'Locate actual controls; missing fields are explicitly warned'),
        row('useFormControl', '(options: FormControlOptions) => control', '-', '自定义组件可复用字段属性、焦点注册及整表禁用', 'Custom controls can reuse field attributes, focus registration and form disabling'),
      ],
      slots: [row('error-summary', '{ errors, focusField, focusError }', '-', '自定义错误摘要；focusError(error) 按控件 ID 定位，区分重复字段路径', 'Custom error summary; focusError(error) targets the control ID, distinguishing repeated field paths'), row('FormItem.default / help', '{ state, controlAttrs, focus, validate, error } / -', '-', '原生/复合控件显式关联出口与帮助区域', 'Explicit binding for native/composite controls and help content')],
      note: text('默认仍以挂载值为重置基准，字段路径改变会重新取基准。v-show 保留的字段仍校验，卸载字段移除注册。模型或依赖变化立即丢弃旧校验错误，不提前执行 blur-only 规则，避免点击提交时按钮因旧错误消失而移动。clearValidate 不清除 dirty/touched；resetFields 会重置它们。手动 error 由调用方清除，独立 FormItem.validate 也返回失败；原生组合控件聚焦可回退到内部可聚焦项。', 'Reset uses the mounted baseline, renewed when the field path changes. v-show fields still validate; unmounted fields unregister. Edits discard stale errors without eagerly running blur-only rules, avoiding submit-button movement. clearValidate preserves dirty/touched; resetFields resets them. Explicit errors remain caller-owned and invalidate standalone FormItem.validate as well. Native group wrappers fall back to focusable descendants.'),
    }),
    select: entry([
      row('remoteMethod', '(query, page, pageSize, signal) => options | { list, total? } | Promise<...>', '-', '仅最新结果生效；取消、关闭和卸载隔离旧请求', 'Only the latest result applies; cancellation, closing and unmount isolate stale requests'),
      row('readonly', 'boolean', 'false', '禁止用户编辑/打开，保留业务 clear() 能力', 'Prevent editing/opening while preserving imperative clear()'),
      row('id / ariaLabel', 'string', 'field / locale', '真实 combobox 的标识与名称', 'Actual combobox ID and accessible name'),
      ...virtual.map((property) => property.name === 'height / itemHeight / overscan' ? { ...property, defaultValue: '274 / 44 / 5' } : property),
    ], {
      demo: 'form', examples: [example('SelectEnhancementExample', '远程交互与一万项虚拟选项', 'Remote Interaction and 10,000 Options')],
      events: [row('error / page-change', '(error) / (page: number)', '-', '当前请求失败、分页变化', 'Current request failure and page changes')],
      methods: [row('retry / refreshRemote / clearCache', '() => Promise<void> / () => Promise<void> / () => void', '-', '强制重试/刷新；clearCache 清除结果和标签缓存，保留 options 中的标签种子', 'Retry/refresh; clearCache removes result and label caches while retaining options seeds')],
      note: text('方向键、Home/End、Enter、Escape、Tab、分页键和不可搜索模式的字符定位均可用；不消费输入法、修饰键和已处理事件。支持只读 options，重复绑定值只显示一个标签且不改写父模型，删除焦点标签后恢复控件焦点。pageSize 必须为正整数，debounce 在 0～2147483647ms 内，height 有限且非负。焦点离开分页区后关闭；外部单选值回写会取消旧搜索。已选标签跨页保留；未知值显示自身值，可用 options 补充标签。remoteMethod 更换会失效缓存，远程数值必须有限。虚拟化只作用于选项，不等同于远程分页或标签折叠。', 'Supports arrows, Home/End, Enter, Escape, Tab, page keys and non-searchable typeahead without consuming composition, modified or handled events. Readonly options are supported; duplicate bound values render one tag without mutating the model, and removing a focused tag restores control focus. pageSize must be a positive integer, debounce is 0–2147483647ms, and height is finite and non-negative. Leaving the pager closes the panel; external single selections cancel old searches. Labels survive pages; options can seed unknown labels. Replacing remoteMethod invalidates caches and remote numeric values must be finite. Virtualization affects options, not pagination or tag folding.'),
    }),
    'auto-complete': entry([
      row('fetchSuggestions', '(query, signal, { page, pageSize }) => options | { list, total? } | Promise<...>', '-', '兼容原有 (query, signal)；远程分页通过第三参数读取页码，并在结果中提供 total；远程结果不再做本地过滤', 'Existing (query, signal) providers remain valid; the third argument supplies pagination and total enables remote pages; remote results bypass local filtering'),
      row('filterMethod', '(query, option) => boolean', '-', '自定义本地过滤；默认按 label 或 value 忽略大小写匹配', 'Customize local filtering; defaults to case-insensitive matching on label or value'),
      row('groupBy', '(option) => string | undefined', '-', '显式启用建议分组；按分组首次出现的顺序展示，undefined 不显示标题；键盘跳过标题', 'Opt-in groups in first-seen order; undefined omits a heading; headings are not keyboard options'),
      row('highlightMatch', 'boolean', 'false', '高亮默认选项内容中的字面匹配，不解析 HTML；default 插槽仍由业务渲染', 'Highlight literal matches in default option content without interpreting HTML; the default slot remains custom-rendered'),
      row('minLength', 'number', '0', '查询所需的最小输入长度；不足时取消请求并关闭面板', 'Minimum input length; shorter values cancel requests and close the panel'),
      row('options / debounce', 'readonly AutoCompleteOption[] / number', '[] / 150', '支持只读建议；防抖不超过定时器上限 2147483647ms。输入法、修饰键与已消费事件不导航或选中；旧选项事件及卸载后 refresh 不生效', 'Readonly suggestions; debounce must not exceed the timer limit of 2147483647ms. Composition, modified and handled keys do not navigate or select; stale option events and refresh after unmount are ignored'),
      row('pagination / pageSize', 'boolean / number', 'false / 10', '可选本地或远程分页；不改变已输入的值；页码从 1 开始', 'Opt-in local or remote pages; pagination never changes the input value; pages are one-based'),
      row('cacheTtl', 'number', '0', '成功查询缓存有效期（毫秒）；0 不缓存完成结果；同查询/页码/页大小的在途请求始终去重', 'Successful-result TTL in milliseconds; zero disables completed-result caching; identical in-flight query/page/pageSize requests are always deduplicated'),
      ...virtual.map((property) => property.name === 'height / itemHeight / overscan' ? { ...property, defaultValue: '260 / 44 / 5' } : property),
    ], {
      demo: 'form', examples: [example('AutoCompleteEnhancementExample', '字段、分组、远程分页与一万项建议', 'Fields, Groups, Remote Pages and 10,000 Suggestions')],
      events: [row('page-change', '(page: number) => void', '-', '用户请求新的有效页码；不会触发 input / change / select', 'Emitted for a new valid user-requested page; does not emit input, change or select')],
      slots: [row('group', '{ group: string }', '-', '分组标题；默认与虚拟模式共用，不能参与选中', 'Group heading shared by normal and virtual modes; not selectable')],
      methods: [
        row('refresh / retry', '() => Promise<boolean>', '-', '打开面板并立即查询当前页，失效该页缓存并跳过防抖；成功应用结果返回 true，失败/取消/禁用返回 false', 'Open the panel, invalidate the current page cache and query immediately without debounce; true means results applied, false means failed, cancelled or unavailable'),
        row('clearCache', '() => void', '-', '清空查询缓存并取消在途请求；不改写输入值', 'Clear cached results and cancel in-flight requests without changing the input value'),
      ],
      note: text(`${fieldNote.zh} 取消、关闭、只读/禁用、外部值变化、替换提供器及卸载均隔离旧请求；当前失败通过 error 和重试状态反馈，未监听时记录错误。翻页时已有活动值仍可用则保留，失效则定位首个可用项；原本无活动项时遵循 highlightFirstItem，不自动提交。提供器、页大小、分页模式或 cacheTtl 改变会失效缓存。缓存仅存在组件实例内，不默认保存历史记录；虚拟分组标题也计入固定行高，height 在普通模式下控制列表最大高度。`, `${fieldNote.en} Cancellation, closing, readonly/disabled state, external values, provider replacement and unmount isolate old requests. Current failures emit error and show retry; unhandled errors are logged. Pagination preserves an available active value or moves to the first enabled option if it disappears. Without an active option, highlightFirstItem applies; paging never commits. Provider, page size, pagination mode or cacheTtl changes invalidate caches. Caches are instance-local, with no automatic history storage. Virtual group headings use the same fixed row height; height controls the maximum list height in normal mode.`),
    }),
    table: entry([
      row('sort / filters / defaultFilters', 'TableSort | null / TableFilters / TableFilters', 'internal / internal / {}', '受控查询状态；sort=null 清除排序', 'Controlled query state; sort=null clears sorting'),
      row('remote', 'boolean', 'false', '服务端查询，不进行本地筛选、排序或分页切片', 'Server queries bypass local filtering, sorting and pagination slicing'),
      row('pagination', 'boolean | TablePaginationOptions', 'false', '复用 Pagination；对象仅配置展示', 'Compose Pagination; the object configures presentation only'),
      row('page / pageSize / defaultPage / defaultPageSize / total', 'number', 'internal / internal / 1 / 10 / data.length', '远程 total 由业务提供；本地使用筛选后数量', 'Supply remote totals; local totals follow filtering'),
      row('rowSelectable', '(row, sourceIndex) => boolean', '-', '排除不可选行；全选只处理当前显示页的可选行', 'Exclude rows; select-all affects eligible displayed rows only'),
      row('TableColumn.filters / filterMultiple / filterMethod', 'TableFilterOption[] / boolean / (value, row) => boolean', '- / true / Object.is', '列筛选配置及自定义匹配', 'Column filters and custom matching'),
      row('TableColumn.fixed', 'left | right', '-', '测量列宽后计算固定偏移，不支持 boolean', 'Measured fixed-column offsets; boolean is not supported'),
      row('resizable / TableColumn.resizable', 'boolean', 'false / inherit', '全表或单列宽度调整', 'Enable resizing globally or per column'),
      row('TableColumn.minWidth / maxWidth', 'number', '64 / 1200', '像素宽度边界', 'Pixel width bounds'),
      row('columnWidths / defaultColumnWidths', 'TableColumnWidths', 'internal / {}', '受控或初始宽度映射', 'Controlled or initial widths'),
      row('columnSettings', 'boolean', 'false', '显示列管理入口', 'Show column visibility controls'),
      row('visibleColumnKeys / defaultVisibleColumnKeys', 'string[]', 'internal / all', '空数组隐藏全部数据列；顺序仍由 columns 决定', 'An empty array hides all data columns; columns controls ordering'),
    ], {
      demo: 'table', examples: [example('TableQueryExample', '受控查询与远程分页', 'Controlled Queries and Remote Pages'), example('TableColumnsExample', '固定列与列管理', 'Fixed Columns and Column Controls')],
      events: [
        row('update:sort / update:filters / filter-change', '(sort) / (filters) / (filters)', '-', '查询状态更新', 'Query state updates'),
        row('update:page / update:pageSize / page-change', '(page) / (pageSize) / (page, pageSize)', '-', '分页更新', 'Page updates'),
        row('query-change', '(query: TableQuery, action: TableQueryAction)', '-', '包含 sort、filters、page、pageSize；action 为 sort/filter/page/page-size', 'Includes sort, filters, page and pageSize; action is sort/filter/page/page-size'),
        row('update:columnWidths / column-resize', '(widths) / ({ key, width })', '-', '拖动中更新，提交或键盘调整时发出 column-resize，取消回滚', 'Live updates; resize commits on pointer/keyboard completion, with cancellation rollback'),
        row('update:visibleColumnKeys / column-visibility-change', '(keys: string[])', '-', '显隐更新', 'Visibility updates'),
      ],
      note: text('支持只读行、列和已选 key。保留跨页/未加载的已选 key；selection-change 的 rows 只包含当前数据中已知行，keys 包含完整选择。列替换或宽度约束变化取消旧拖动，组合键和输入法按键不调整列宽；移除焦点行或列后恢复表格容器焦点。数值尺寸必须有限，负值按零处理。宽度、显隐和查询偏好由业务决定是否持久化。', 'Readonly rows, columns and selected keys are supported. Selected keys survive page/unloaded data changes. selection-change rows contain known current data, while keys contain the full selection. Column replacement or changed width constraints cancel an active drag; composition and browser shortcut keys do not resize columns. Removing a focused row or column restores focus to the table region. Numeric dimensions must be finite; negative values become zero. Persistence remains a business decision.'),
    }),
    'virtual-list': entry([
      row('activeIndex', 'number', '-', '额外保留键盘活动行，不丢失 ARIA 目标', 'Keep the keyboard-active row mounted'),
      row('role / itemRole / tabindex', 'string / string / number', 'list / listitem / 0', '嵌入复合控件时可使用 presentation', 'Use presentation when embedding into composite controls'),
      row('preserveScrollPosition', 'boolean', 'false', '显式启用稳定 key 锚点；必须提供 itemKey', 'Opt in to stable-key anchors; itemKey is required'),
    ], {
      examples: [example('VirtualAnchorExample', '按 key 定位与滚动锚点', 'Keyed Scrolling and Anchors')],
      methods: [row('scrollToKey', '(key, options?: VirtualListScrollOptions) => void', '-', '按稳定 key 定位；保留 number/string 区分', 'Scroll by stable key, preserving number/string identity')],
      note: text('支持只读数据。非法、重复或 bigint key 会明确报告；数值高度必须有限，负值按零处理。动态高度继续使用既有测量能力，关闭后忽略旧动态测量；固定行高的 DOM 上限不套用于动态模式。焦点所在行被回收或删除后恢复到列表容器，不抢占外部焦点。', 'Readonly data is supported. Invalid, duplicate or bigint keys are reported; numeric heights must be finite and negative heights become zero. Dynamic rows retain measurement support; stale dynamic measurements are ignored after disabling it. Fixed-row DOM limits do not apply to dynamic mode. Recycling or removing a focused row restores focus to the viewport without stealing external focus.'),
    }),
    tree: entry(virtual, { examples: [example('TreeVirtualExample', '大数据树与树形选择', 'Large Trees and Tree Selection')], methods: [row('focusKey / scrollToKey', '(key, options?)', '-', '按 key 聚焦或定位，保留选中、勾选和展开规则', 'Focus or scroll by key while preserving selection/check/expansion rules')], note: fieldNote }),
    'tree-select': entry(virtual, { examples: [example('TreeVirtualExample', '虚拟树形选择', 'Virtual Tree Selection')], methods: [row('scrollToKey', '(key, options?)', '-', '转发底层树定位方法', 'Forward keyed tree scrolling')], note: fieldNote }),
    transfer: entry(virtual, { examples: [example('TransferVirtualExample', '双侧虚拟穿梭框', 'Two Virtual Transfer Panes')], methods: [row('focusKey / scrollToKey', '(key, side: TransferSide, options?)', '-', '定位指定侧的选项', 'Locate an item in the specified pane')], note: text(`${fieldNote.zh} 支持只读数据、绑定键和标题；移动结果键去重且保留未知键。禁用时拒绝原生勾选并恢复显示；组合/修饰/已消费按键不导航。`, `${fieldNote.en} Readonly data, bound keys and titles are supported; move results deduplicate keys and retain unknown ones. Rejected disabled checkbox changes restore native state; composition, modified and handled keys do not navigate.`) }),
    upload: entry([row('concurrency', 'number', 'Infinity', '正整数或 Infinity；无效值暂停新派发并报告错误', 'Positive integer or Infinity; invalid values pause dispatch and report configuration errors')], {
      demo: 'form', examples: [example('UploadQueueExample', '上传队列与批量操作', 'Upload Queue and Batch Actions')],
      methods: [row('cancelAll / retryAll / retry / getConfigurationErrors', '() / () / (uid) / ()', '-', '批量取消；重试失败项；重试失败/取消项；读取配置错误', 'Cancel all, retry failed items, retry one failed/cancelled item, or inspect configuration errors')],
      events: [row('configuration-error', '(error: UploadConfigurationError)', '-', '无效并发数和重复 UID；未监听时记录错误', 'Invalid concurrency or duplicate UIDs; unhandled errors are logged')],
      note: text('同一文件的异步移除请求去重，按钮暴露忙碌状态；禁用或 beforeRemove 改变使旧结果失效。移除后恢复可用焦点。queued 为排队状态。已经发出的自定义请求即使收到 abort，也占用容量直到 Promise 结算，以保证真实并发上限。重复 UID 保留首项并报告拒绝项。' + fieldNote.zh, 'Pending removal requests for the same file are deduplicated and expose busy state; disabled-state or beforeRemove changes invalidate old results. Restore available focus after removal. queued represents waiting tasks. Sent custom requests retain capacity until settlement even after abort, preserving the actual concurrency bound. Duplicate UIDs retain the first item and report rejected duplicates. ' + fieldNote.en),
    }),
    picker: entry([
      row('mode', 'list | wheel', 'list', 'wheel 使用原生惯性滚动与居中吸附', 'wheel uses native inertia and centered snapping'),
      row('optionHeight / visibleOptionCount', 'number', '44 / 5', '正高度、正奇数行；禁用项自动跳过', 'Positive height and a positive odd row count; disabled options are skipped'),
    ], { demo: 'mobile', examples: [example('PickerWheelExample', '滚轮选择与联动', 'Wheel Selection and Cascades', true)], note: fieldNote }),
    'pull-refresh': entry([
      row('result', 'success | error', '-', '刷新结束后显示成功或失败状态；省略时不显示结果提示', 'Show success or failure after refreshing; omit to finish without result feedback'),
      row('resultDuration', 'number', '1500', '结果头部停留时间（毫秒）', 'Completion-head duration in milliseconds'),
      row('successText / errorText / retryText', 'string', 'locale', '结果和重试文案', 'Completion and retry labels'),
    ], { demo: 'mobile', examples: [example('RefreshResultExample', '刷新结果与重试', 'Refresh Results and Retry', true)], events: [row('complete / retry', 'see PullRefreshChange', '-', '结束和重试通知；失败头部收起后仍保留重试入口', 'Completion and retry; the retry action remains after the error head retracts')] }),
    'swipe-cell': entry([
      row('group', 'SwipeCellGroup', '-', '应用内显式分组；未设置时保持独立', 'Explicit app-scoped groups; omission keeps cells independent'),
      row('closeOnClickOutside', 'boolean', 'false', '外部点击关闭同样经过守卫', 'Outside dismissal uses the same guard'),
      row('beforeClose', '(context: SwipeCellClose, signal: AbortSignal) => boolean | void | Promise<...>', '-', '同组关闭也经过守卫；等旧项真正关闭后才请求新项打开', 'Group dismissal is guarded; a new open waits for actual close acknowledgement'),
    ], { demo: 'mobile', examples: [example('SwipeCellGroupExample', '同组互斥与关闭守卫', 'Grouped Swipe Cells', true)], methods: [pending], events: [row('group-conflict', '(conflict: SwipeCellGroupConflict)', '-', '外部强制冲突仍以受控值为准并明确通知；未监听时警告', 'Conflicting external state remains authoritative and is reported; unhandled conflicts warn')] }),
    typography: entry([
      row('expandable / expanded / defaultExpanded', 'boolean', 'false / internal / false', '溢出时可展开；支持受控状态，不截断复制内容', 'Expand overflowing content; controlled state is supported and copied content stays complete'),
    ], { examples: [example('TypographyExpandExample', '长文本展开', 'Expandable Text')], events: [row('update:expanded / expand-change', '(expanded: boolean)', '-', '展开状态请求/变化', 'Expansion requests and changes')] }),
    skeleton: entry([
      row('preset', 'article | card | list-item', '-', '选择骨架布局；省略时使用基础行布局', 'Choose a skeleton layout; omit to use the basic row layout'),
      row('rowWidths / title / image / button', 'SkeletonRowWidth[] / boolean / boolean / boolean', 'preset / explicit props', '显式属性优先于预设，保留减少动画设置', 'Explicit props override presets; reduced-motion behavior is preserved'),
    ], {
      examples: [example('SkeletonPresetExample', '骨架预设与覆盖', 'Skeleton Presets and Overrides')],
      note: text('未知预设在渲染占位时明确报错；省略预设保持原默认样式。class、id 等透传属性只应用于加载占位容器；加载完成后默认插槽不增加包装层，也不会把占位属性误传给内容。', 'Unknown presets are explicitly rejected when rendering placeholders; omitting a preset retains defaults. Attributes such as class and id apply only to the loading container; resolved slot content gains neither an extra wrapper nor placeholder attributes.'),
    }),
    icon: entry([
      row('decorative', 'boolean', 'true', '默认装饰图标，不重复朗读；false 开启语义图标', 'Decorative by default; false enables semantic SVGs'),
      row('ariaLabel / title', 'string', '-', '语义图标的可访问名称或 SVG 标题', 'Accessible name or SVG title for a semantic icon'),
    ], { examples: [example('IconSemanticExample', '装饰与语义图标', 'Decorative and Semantic Icons')], events: [row('accessibility-error', '(error: Error)', '-', '语义图标没有名称时保持隐藏并报告，未监听时警告', 'Unlabeled semantic icons stay hidden and report an error, warning when unhandled')] }),
  }
  const featureExamples: [string[], ComponentReference['examples'][number]][] = [
    [['button'], example('ButtonFeaturesExample', '尺寸、加载文案与焦点', 'Sizes, Loading Labels and Focus')],
    [['input'], example('InputFeaturesExample', '组合输入、状态与实例方法', 'Input Groups, States and Instance Methods')],
    [['input-number'], example('InputNumberFeaturesExample', '精度、无按钮输入与只读', 'Precision, Hidden Controls and Readonly Input')],
    [['loading'], example('LoadingTimingExample', '延迟、最短展示与阻塞', 'Delay, Minimum Duration and Blocking')],
    [['alert'], example('AlertActionsExample', '受控关闭与操作插槽', 'Controlled Dismissal and Actions')],
    [['badge'], example('BadgePlacementExample', '位置、偏移与自定义计数', 'Placement, Offset and Custom Counts')],
    [['empty'], example('EmptyImageExample', '图片回退与自定义内容', 'Image Fallbacks and Custom Content')],
    [['pagination'], example('PaginationFeaturesExample', '跳转、未知总数与自定义区域', 'Jumping, Unknown Totals and Custom Regions')],
    [['tabs'], example('TabsLifecycleExample', '销毁策略与切换拦截', 'Panel Lifecycle and Change Guards')],
    [['chat-choice'], example('ChatChoiceStatesExample', '校验、提交状态与插槽', 'Validation, Submission States and Slots')],
    [['dialog', 'modal', 'drawer', 'popup'], example('LayerOptionsExample', '关闭守卫、内容保留与生命周期', 'Close Guards, Preserved Content and Lifecycle')],
    [['nav-bar', 'tabbar', 'action-sheet'], example('MobileGuardExample', '返回、导航与动作拦截', 'Back, Navigation and Action Guards', true)],
    [['popconfirm'], example('PopconfirmStatesExample', '失败重试与自定义操作', 'Retrying Failures and Custom Actions')],
    [['calendar'], example('CalendarModesExample', '单选、多选与日期插槽', 'Single and Multiple Selection with Day Slots')],
    [['search'], example('SearchFormExample', '原生表单与自定义操作', 'Native Forms and Custom Actions')],
    [['tooltip', 'popover'], example('FloatingOptionsExample', '受控浮层、延迟与焦点', 'Controlled Floating Panels, Delays and Focus')],
    [['table'], example('TableStatesExample', '默认查询、加载与空状态', 'Default Queries, Loading and Empty States')],
    [['upload'], example('UploadManualExample', '手动上传与前置校验', 'Manual Uploads and Hooks')],
    [['chat-message'], example('ChatMessageSlotsExample', '生成生命周期、选择恢复与操作插槽', 'Generation Lifecycle, Selection Recovery and Action Slots')],
    [['radio', 'checkbox'], example('SelectionStatesExample', '整组禁用与变化事件', 'Disabled Groups and Change Events')],
    [['cell'], example('CellSlotsExample', '链接、点击行为与内容插槽', 'Links, Actions and Content Slots')],
  ]
  for (const [slugs, feature] of featureExamples) {
    for (const slug of slugs) {
      const reference = references[slug] ?? (references[slug] = entry([]))
      reference.examples.push(feature)
    }
  }
  references.button.props.push(row('loadingText', 'string', "''", '加载期间替换按钮文字', 'Replace the label while loading'))
  references.input.props.push(
    row('status', 'default | success | warning | error', 'default', '输入框校验外观', 'Validation appearance'),
    row('autosize / showWordLimit / maxlength / minlength', 'boolean / boolean / number / number', 'false / false / - / -', '文本域自适应高度与字数限制', 'Autosizing textarea and character limits'),
    row('fullWidth / name / autocomplete / inputStyle / inputClass', 'boolean / string / string / CSSProperties / string', "true / '' / off / '' / ''", '宽度、原生输入属性与输入区域样式', 'Width, native input attributes and input styling'),
  )
  references.input.slots = [row('prepend / append / prefix / suffix', '-', '-', '前后组合区域与输入框内插槽；优先于图标属性', 'Grouped content and inner slots; slots take precedence over icon props')]
  references.input.methods = [row('focus / blur / select / clear', '() => void', '-', '聚焦、失焦、选择文本或清空', 'Focus, blur, select text or clear')]
  references['chat-choice'].methods = [row('submit / validate', '() => void / () => boolean', '-', '提交选择或仅执行校验', 'Submit the answer or validate without submitting')]
  return references
}
