import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp, createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { build } from 'vite'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const require = createRequire(import.meta.url)
const fullLibrary = require(manifest.name)
const fullApp = createApp({ render: () => null })
fullApp.use(fullLibrary.default)

const directories = await readdir(resolve(root, 'src/components'), { withFileTypes: true })
const postcss = createRequire(import.meta.resolve('vite/package.json'))('postcss')
const tokensPath = require.resolve(`${manifest.name}/styles/tokens.css`)
const tokenRules = postcss.parse(await readFile(tokensPath, 'utf8')).nodes.filter(node => node.type === 'rule')
const assertThemeTokens = (css, label) => {
  const stylesheet = postcss.parse(css)
  for (const rule of tokenRules) {
    rule.walkDecls(/^--/, token => {
      const values = new Set()
      stylesheet.walkRules(rule.selector, outputRule => {
        outputRule.walkDecls(token.prop, declaration => {
          assert(declaration.value.trim(), `${label}: ${token.prop} must have a value`)
          values.add(declaration.value)
        })
      })
      assert.equal(values.size, 1, `${label}: ${rule.selector} ${token.prop} must have a consistent definition`)
    })
  }
}
for (const filename of (await readdir(resolve(root, 'styles'))).filter(name => name.endsWith('.css'))) {
  const stylesheet = postcss.parse(await readFile(resolve(root, 'styles', filename), 'utf8'))
  let contentSeen = false
  for (const node of stylesheet.nodes) {
    if (node.type === 'comment') continue
    if (node.type === 'atrule' && ['charset', 'import'].includes(node.name)) assert(!contentSeen, `${filename}: @${node.name} must precede style rules`)
    else contentSeen = true
  }
}
const names = directories.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
const scopeIds = new Map()
const scopedMethods = ['Dialog', 'Modal', 'Message', 'Toast', 'Notification']
const individualLibrary = {}
const kebabCase = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const renderProps = {
  Form: { model: {} },
  Table: { data: [], columns: [] },
  Tabs: { items: [] },
  Tabbar: { items: [] },
  ChatMessage: { message: 'Package check', showTime: false },
  Message: { modelValue: false },
}

for (const name of names) {
  const entry = await import(`${manifest.name}/components/${name}`)
  individualLibrary[name] = entry.default
  assert.equal(entry.default.name, name, `${name}: component name`)
  if (entry.default.__scopeId) scopeIds.set(name, entry.default.__scopeId)
  assert.equal(typeof entry.default.install, 'function', `${name}: standalone install`)
  assert.equal(fullLibrary[name], fullLibrary[`Scq${name}`], `${name}: named alias`)
  assert.equal(typeof fullLibrary[name]?.install, 'function', `${name}: main export`)
  if (scopedMethods.includes(name)) {
    assert.equal(typeof entry[`use${name}`], 'function', `${name}: scoped individual method`)
    assert.equal(typeof fullLibrary[`use${name}`], 'function', `${name}: scoped full method`)
  }
  if (name === 'Form') {
    assert.equal(typeof entry.useFormControl, 'function', 'Form: individual field helper')
    assert.equal(typeof fullLibrary.useFormControl, 'function', 'Form: full field helper')
  }
  if (name === 'VirtualList') assert.deepEqual(entry.VIRTUAL_LIST_DEFAULTS, fullLibrary.VIRTUAL_LIST_DEFAULTS, 'VirtualList: shared public defaults')
  if (['Space', 'Grid', 'Layout'].includes(name)) {
    assert.deepEqual(entry.LAYOUT_BREAKPOINTS, fullLibrary.LAYOUT_BREAKPOINTS, `${name}: shared breakpoints`)
    assert.deepEqual(entry.SPACING_TOKENS, fullLibrary.SPACING_TOKENS, `${name}: shared spacing tokens`)
  }
  if (name === 'Link') {
    const adapter = { resolve: () => ({ href: '#guide', exactActive: true }), navigate: () => true }
    for (const [provideAdapter, Link] of [[fullLibrary.provideNavigationAdapter, entry.default], [entry.provideNavigationAdapter, fullLibrary.Link]]) {
      assert.equal(typeof provideAdapter, 'function', 'Link: navigation provider export')
      const html = await renderToString(createSSRApp({ setup() { provideAdapter(adapter); return () => h(Link, { to: '/guide' }) } }))
      assert(html.includes('href="#guide"') && html.includes('aria-current="page"'), 'Link: mixed full/individual navigation scope')
    }
  }
  assert.equal(fullApp.component(`scq-${kebabCase(name)}`), fullLibrary[name], `${name}: full installation`)

  const app = createApp({ render: () => null })
  app.use(entry.default)
  assert.equal(app.component(`scq-${kebabCase(name)}`), entry.default, `${name}: individual installation`)

  const declaration = await readFile(resolve(root, `dist/types/components/${name}/index.d.ts`), 'utf8')
  assert(declaration.length > 0, `${name}: declaration`)
  const stylesheet = require.resolve(`${manifest.name}/styles/${kebabCase(name)}.css`)
  const styleSource = await readFile(stylesheet, 'utf8')
  const firstStyleNode = postcss.parse(styleSource).nodes[0]
  assert.equal(firstStyleNode?.type, 'atrule', `${name}: shared tokens must load first`)
  assert.equal(firstStyleNode.name, 'import', `${name}: shared token import`)
  assert.equal(resolve(dirname(stylesheet), firstStyleNode.params.replace(/^['"]|['"]$/g, '')), tokensPath, `${name}: shared token stylesheet`)

  const warnings = []
  const serverApp = createSSRApp({ render: () => h(entry.default, renderProps[name] || {}) })
  serverApp.config.warnHandler = (message) => warnings.push(message)
  await renderToString(serverApp)
  assert.deepEqual(warnings, [], `${name}: server-rendering warnings`)
}

for (const [label, providers, controls] of [
  ['full provider / individual controls', fullLibrary, individualLibrary],
  ['individual provider / full controls', individualLibrary, fullLibrary],
]) {
  const html = await renderToString(createSSRApp({
    render: () => h(providers.ConfigProvider, { size: 'large', disabled: true }, {
      default: () => [h(controls.Button), h(controls.Button, { size: 'small', disabled: false })],
    }),
  }))
  const buttons = html.match(/<button[^>]+>/g) || []
  assert.equal(buttons.length, 2, `${label}: controls rendered`)
  assert.match(buttons[0], /my-btn--large/, `${label}: inherited size`)
  assert.match(buttons[0], /aria-disabled="true"/, `${label}: inherited disabled`)
  assert.match(buttons[1], /my-btn--small/, `${label}: explicit size`)
  assert.match(buttons[1], /aria-disabled="false"/, `${label}: explicit enabled`)

  for (const name of ['Radio', 'Checkbox']) {
    const groupHtml = await renderToString(createSSRApp({
      render: () => h(providers.ConfigProvider, { size: 'large' }, {
        default: () => h(providers[`${name}Group`], {
          modelValue: name === 'Checkbox' ? ['selected'] : 'selected',
          size: 'small', disabled: true,
        }, { default: () => h(controls[name], { value: 'selected', size: 'large', disabled: false }) }),
      }),
    }))
    const input = groupHtml.match(/<input[^>]+>/)?.[0] || ''
    assert(groupHtml.includes(`scq-${name.toLowerCase()}--small`), `${label}: ${name} group size`)
    assert(input.includes(' checked'), `${label}: ${name} group model`)
    assert(input.includes(' disabled'), `${label}: ${name} group disabled`)
  }

  const collapseHtml = await renderToString(createSSRApp({
    render: () => h(providers.Collapse, { modelValue: ['open'], disabled: true }, {
      default: () => h(controls.CollapseItem, { name: 'open', disabled: false }),
    }),
  }))
  assert(collapseHtml.includes('is-expanded'), `${label}: expanded collapse item`)
  assert(collapseHtml.includes('is-disabled'), `${label}: disabled collapse item`)

  const formHtml = await renderToString(createSSRApp({
    render: () => h(providers.Form, { model: { value: '' }, disabled: true }, {
      default: () => h(controls.FormItem, { prop: 'value', label: 'Value', error: 'Required' }, {
        default: () => h(providers.Input, { disabled: false }),
      }),
    }),
  }))
  const fieldInput = formHtml.match(/<input[^>]+>/)?.[0] || ''
  assert(fieldInput.includes(' disabled'), `${label}: form-wide disabling`)
  assert(fieldInput.includes('aria-invalid="true"'), `${label}: field error association`)
  const fieldId = fieldInput.match(/\sid="([^"]+)"/)?.[1]
  assert(fieldId && formHtml.includes(`for="${fieldId}"`), `${label}: automatic field label`)
}
console.log('Verified configuration and group constraints across mixed full/individual package imports.')

const consumerFile = resolve(root, '__package_consumer__.ts')
const continuedConsumers = {
  Tag: "{ selectable: true, selected: false, disabled: true, icon: 'check', round: true }",
  Badge: "{ placement: 'bottom-left', offset: [-4, 6], text: 'Online', live: 'polite' }",
  Empty: "{ preset: 'search', size: 'small' }",
  Tabs: "{ items: [{ name: 'first', label: 'First' }], destroyInactive: true, beforeChange: (name, signal) => !signal.aborted }",
  Pagination: '{ showJumper: true, unknownTotal: true, hasNext: true, loading: false }',
  Menu: "{ key: 'save', label: 'Save', description: 'Store a draft', shortcut: 'Ctrl+S' }",
  Dropdown: '{ split: true }',
  Breadcrumb: "{ collapseMode: 'menu', maxItems: 3 }",
  Loading: '{ delay: 50, minDuration: 100, blocking: false }',
  Progress: "{ type: 'dashboard', width: 120, buffer: 70, color: [{ percentage: 100, color: 'green' }] }",
  Alert: "{ modelValue: true, closeText: 'Dismiss' }",
  Popconfirm: "{ danger: true, errorText: 'Retry', allowCancelWhilePending: false }",
  Result: "{ preset: true, size: 'small' }",
  CellGroup: "{ description: 'Preferences', footer: 'Changes sync' }",
  NoticeBar: '{ modelValue: true, paused: false }',
  NavBar: '{ leftLoading: true, rightDisabled: true, beforeBack: (event, signal) => !signal.aborted }',
  Tabbar: "{ items: [{ name: 'create', label: 'Create', action: true }], showLabels: false, beforeChange: (item, signal) => !signal.aborted }",
  ActionSheet: "{ actions: [{ name: 'Save', group: 'Files' }], columns: 2, beforeSelect: (item, index, signal) => !signal.aborted }",
  Swipe: '{ vertical: true, gap: 12 }',
  Calendar: '{ minRange: 2, maxSelected: 3, rangePreview: true }',
  ActionBar: '{ beforeAction: (action, signal) => !signal.aborted }',
}
const consumerSource = [
  "import { createApp } from 'vue'",
  `import ScqVue, { ${names.map((name) => `Scq${name}`).join(', ')} } from '${manifest.name}'`,
  ...names.map((name) => `import ${name} from '${manifest.name}/components/${name}'`),
  ...scopedMethods.map((name) => `import { use${name} } from '${manifest.name}/components/${name}'`),
  `import { ${scopedMethods.map((name) => `use${name} as useFull${name}`).join(', ')} } from '${manifest.name}'`,
  'const app = createApp({ render: () => null })',
  'app.use(ScqVue)',
  ...names.flatMap((name) => [`app.use(${name})`, `app.use(Scq${name})`]),
  ...Object.entries(continuedConsumers).flatMap(([name, expression]) => {
    const type = name === 'Menu' ? 'MenuItemOption' : `${name}Props`
    return [
      `import type { ${type} as Continued${name} } from 'scq-vue'`,
      `import type { ${type} as IndividualContinued${name} } from 'scq-vue/components/${name}'`,
      `const continued${name}: Continued${name} = ${expression}`,
      `const individualContinued${name}: IndividualContinued${name} = continued${name}`,
    ]
  }),
  "const toast = Toast.loading({ message: 'Loading', forbidClick: true })",
  "toast.update({ type: 'success', message: 'Ready', duration: 1000 })",
  'toast.close()',
  'Toast.clear()',
  "const notice = Notification.success({ id: 'saved', title: 'Saved', message: 'Upload complete' })",
  "notice.update({ message: 'Ready', duration: 1000 })",
  'notice.close()',
  'Notification.closeAll()',
  'const checkScopedMethods = () => {',
  "  useDialog().confirm({ message: 'Confirm', showFooter: true, showConfirmButton: true })",
  "  useModal().info({ message: 'Notice' })",
  "  useMessage().success('Saved').close()",
  "  useToast().loading({ message: 'Loading' }).update({ type: 'success' })",
  "  useNotification().show({ id: 'notice', message: 'Ready' }).update({ title: 'Saved' })",
  ...scopedMethods.map((name) => `  useFull${name}().destroyAll()`),
  '}',
  "import type { PickerOption, TreeNode, UploadRequestOptions } from 'scq-vue'",
  "import { VIRTUAL_LIST_DEFAULTS, useFormControl, type FormInstance, type UploadExpose, type VirtualListExpose, type TreeExpose, type TransferExpose, type TransferSide, type TableQuery, type TableFilters, type SelectRemoteMethod, type IconProps, type SkeletonProps, type TypographyProps } from 'scq-vue'",
  "import { VIRTUAL_LIST_DEFAULTS as individualVirtualDefaults } from 'scq-vue/components/VirtualList'",
  "import { useFormControl as individualFormControl } from 'scq-vue/components/Form'",
  'const virtualDefaults: typeof VIRTUAL_LIST_DEFAULTS = individualVirtualDefaults',
  'const fieldControl: typeof useFormControl = individualFormControl',
  'const inspectQuery = (query: TableQuery) => { const page: number = query.page; const filters: TableFilters = query.filters }',
  "const remoteOptions: SelectRemoteMethod = async (query, page, pageSize, signal) => { if (signal.aborted) return []; return { list: [{ label: query, value: page }], total: pageSize } }",
  "import type { AutoCompleteFetchSuggestions, AutoCompleteProps, AutoCompleteExpose } from 'scq-vue'",
  "import type { AutoCompleteFetchSuggestions as IndividualSuggestions, AutoCompleteProps as IndividualAutoCompleteProps, AutoCompleteExpose as IndividualAutoCompleteExpose } from 'scq-vue/components/AutoComplete'",
  "const suggestions: AutoCompleteFetchSuggestions = (query, signal, { page, pageSize }) => ({ list: signal.aborted ? [] : [{ value: query, label: String(page) }], total: pageSize })",
  'const individualSuggestions: IndividualSuggestions = suggestions',
  "const legacySuggestions: AutoCompleteFetchSuggestions = (query, signal) => signal.aborted ? [] : [{ value: query }]",
  'const autoCompleteProps: AutoCompleteProps = { fetchSuggestions: individualSuggestions, virtual: true, minLength: 2, cacheTtl: 1000, groupBy: (option) => option.label }',
  'const individualAutoCompleteProps: IndividualAutoCompleteProps = autoCompleteProps',
  'const inspectSuggestions = (control: AutoCompleteExpose) => { const individual: IndividualAutoCompleteExpose = control; const result: Promise<boolean> = individual.retry(); individual.clearCache() }',
  "import { LAYOUT_BREAKPOINTS, SPACING_TOKENS, provideNavigationAdapter, type SpaceProps, type LayoutProps, type GridProps, type LayoutBreakpoints, type NavigationAdapter, type LinkExpose, type ContainerProps, type ContainerExpose } from 'scq-vue'",
  "import { LAYOUT_BREAKPOINTS as individualBreakpoints, SPACING_TOKENS as individualSpacing, type SpaceProps as IndividualSpaceProps } from 'scq-vue/components/Space'",
  "import { provideNavigationAdapter as provideIndividualNavigation, type NavigationAdapter as IndividualNavigationAdapter } from 'scq-vue/components/Link'",
  "import type { ContainerExpose as IndividualContainerExpose } from 'scq-vue/components/Container'",
  'const layoutBreakpoints: typeof LAYOUT_BREAKPOINTS = individualBreakpoints',
  'const spacingTokens: typeof SPACING_TOKENS = individualSpacing',
  "const customBreakpoints: LayoutBreakpoints = { md: 900 }",
  "const spaceProps: SpaceProps = { size: { xs: 'sm', md: ['md', 'lg'] }, breakpoints: customBreakpoints }",
  'const individualSpaceProps: IndividualSpaceProps = spaceProps',
  "const responsiveLayout: LayoutProps = { direction: { xs: 'vertical', md: 'horizontal' }, gap: { xs: 8, md: 24 } }",
  "const autoGrid: GridProps = { minItemWidth: 180, gap: '1rem' }",
  "const navigationAdapter: NavigationAdapter = { resolve: (to) => ({ href: '#' + to, exactActive: true }), navigate: async (to, { replace, signal }) => !signal.aborted }",
  'const individualNavigationAdapter: IndividualNavigationAdapter = navigationAdapter',
  'const provideLayoutNavigation = () => { provideNavigationAdapter(individualNavigationAdapter); provideIndividualNavigation(navigationAdapter) }',
  "const containerProps: ContainerProps = { asideMode: 'drawer', collapsed: false, scrollable: true, height: 400 }",
  'const inspectFoundation = (container: ContainerExpose, link: LinkExpose) => { const individual: IndividualContainerExpose = container; individual.toggleAside(); individual.closeAside(); const pending: boolean = link.pending; link.cancelPending() }',
  "import type { WatermarkProps, WatermarkRenderEvent, AvatarProps, ImageProps, ImageExpose, ImageToolbar, CardProps } from 'scq-vue'",
  "import type { WatermarkProps as IndividualWatermarkProps } from 'scq-vue/components/Watermark'",
  "import type { AvatarProps as IndividualAvatarProps } from 'scq-vue/components/Avatar'",
  "import type { ImageExpose as IndividualImageExpose } from 'scq-vue/components/Image'",
  "import type { CardProps as IndividualCardProps } from 'scq-vue/components/Card'",
  "const watermarkProps: WatermarkProps = { content: ['Project', 'Member'], image: '/logo.svg', offset: [12, 0], lineHeight: 24, print: false }",
  'const individualWatermarkProps: IndividualWatermarkProps = watermarkProps',
  'const inspectWatermark = (event: WatermarkRenderEvent) => { const host: HTMLElement = event.container; const loaded: boolean = event.imageLoaded }',
  "const avatarProps: AvatarProps = { srcset: '/avatar.png 1x', fallbackSrc: ['/backup.png'], text: 'AL', fallbackOrder: ['image', 'text', 'icon'], autoSize: true }",
  'const individualAvatarProps: IndividualAvatarProps = avatarProps',
  "const imageProps: ImageProps = { srcset: '/photo.jpg 1x', sizes: '320px', fallbackSrc: '/backup.jpg', previewIndex: 0, previewPinchZoom: true }",
  'const inspectImage = (image: ImageExpose, toolbar: ImageToolbar) => { const individual: IndividualImageExpose = image; individual.retryPreview(); individual.resetPreview(); toolbar.zoomIn(); toolbar.reset() }',
  "const cardProps: CardProps = { selectable: true, selected: false, size: 'small', mediaRatio: '16 / 9' }",
  'const individualCardProps: IndividualCardProps = cardProps',
  "import type { DescriptionsProps, DescriptionItem, DescriptionFormatter, DescriptionValue } from 'scq-vue'",
  "import type { DescriptionsProps as IndividualDescriptionsProps, DescriptionItem as IndividualDescriptionItem, DescriptionFormatter as IndividualDescriptionFormatter, DescriptionValue as IndividualDescriptionValue } from 'scq-vue/components/Descriptions'",
  'const descriptionValue: DescriptionValue = false',
  'const individualDescriptionValue: IndividualDescriptionValue = descriptionValue',
  'const descriptionFormatter: DescriptionFormatter = (value, item, index) => value ?? item.label + index',
  'const individualDescriptionFormatter: IndividualDescriptionFormatter = descriptionFormatter',
  "const descriptionItem: DescriptionItem = { label: 'Status', value: individualDescriptionValue, labelWidth: '6rem', labelAlign: 'end', formatter: individualDescriptionFormatter }",
  'const individualDescriptionItem: IndividualDescriptionItem = descriptionItem',
  "const descriptionsProps: DescriptionsProps = { items: [individualDescriptionItem], columns: { xs: 1, md: 3 }, emptyText: 'N/A', formatter: descriptionFormatter }",
  'const individualDescriptionsProps: IndividualDescriptionsProps = descriptionsProps',
  "const semanticIcon: IconProps = { name: 'info', decorative: false, ariaLabel: 'Information' }",
  "const skeletonPreset: Partial<SkeletonProps> = { preset: 'card' }",
  'const expandingText: Partial<TypographyProps> = { expandable: true, expanded: false }',
  'const enhancedInstances = (form: FormInstance, upload: UploadExpose, list: VirtualListExpose, tree: TreeExpose, transfer: TransferExpose, side: TransferSide) => {',
  "  form.focusField('name'); form.focusFirstError(); form.getFieldStates(); const dirty: boolean = form.state.dirty",
  "  upload.cancelAll(); upload.retryAll(); upload.getConfigurationErrors()",
  "  list.scrollToKey('row'); list.scrollToIndex(0); tree.focusKey('node'); transfer.scrollToKey('item', side)",
  '}',
  "import type { DateTimePickerValue, DateTimePickerShortcut, DateTimePickerRole } from 'scq-vue'",
  "const schedule: DateTimePickerValue = ['2026-10-13 09:00', '2026-10-14 18:00']",
  "const dateTimeShortcuts: DateTimePickerShortcut[] = [{ label: 'Schedule', value: () => schedule }]",
  "const dateTimeRole: DateTimePickerRole = 'end'",
  "const pickerOptions: PickerOption[] = [{ label: 'A', value: 1 }]",
  "const treeNodes: TreeNode[] = [{ key: 'root', label: 'Root', children: [] }]",
  'const uploadRequest = async (options: UploadRequestOptions) => { options.onProgress(100); return { size: options.file.size } }',
].join('\n')
const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
}
const host = ts.createCompilerHost(compilerOptions)
const getSourceFile = host.getSourceFile.bind(host)
const fileExists = host.fileExists.bind(host)
host.getSourceFile = (filename, languageVersion, onError, shouldCreateNewSourceFile) => {
  return resolve(filename) === consumerFile
    ? ts.createSourceFile(filename, consumerSource, languageVersion, true)
    : getSourceFile(filename, languageVersion, onError, shouldCreateNewSourceFile)
}
host.fileExists = (filename) => resolve(filename) === consumerFile || fileExists(filename)
const program = ts.createProgram([consumerFile], compilerOptions, host)
const diagnostics = ts.getPreEmitDiagnostics(program)
assert.equal(diagnostics.length, 0, ts.formatDiagnostics(diagnostics, {
  getCanonicalFileName: (filename) => filename,
  getCurrentDirectory: () => root,
  getNewLine: () => '\n',
}))

const bundleConsumer = async (name, additionalStyles = []) => {
  const entryId = `\0scq-package-consumer-${name || 'full'}`
  const modulePath = name ? `${manifest.name}/components/${name}` : manifest.name
  const stylePath = name ? `${manifest.name}/styles/${kebabCase(name)}.css` : `${manifest.name}/style.css`
  const styleImports = [stylePath, ...additionalStyles.map(component => `${manifest.name}/styles/${kebabCase(component)}.css`)]
    .map(style => `import ${JSON.stringify(style)};`).join('\n')
  const result = await build({
    configFile: false,
    root,
    logLevel: 'error',
    plugins: [{
      name: 'scq-package-consumer',
      resolveId: (id) => id === entryId ? id : undefined,
      load: (id) => id === entryId
        ? `import Component from ${JSON.stringify(modulePath)}; ${styleImports} export default Component;`
        : undefined,
    }],
    build: {
      write: false,
      minify: false,
      cssMinify: false,
      rollupOptions: {
        input: entryId,
        external: ['vue'],
        preserveEntrySignatures: 'strict',
        output: { format: 'es' },
      },
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) => output.output)
  const css = outputs.filter((output) => output.type === 'asset' && output.fileName.endsWith('.css')).map((output) => String(output.source)).join('\n')
  const modules = outputs.filter((output) => output.type === 'chunk').flatMap((output) => Object.keys(output.modules))
  return { css, modules }
}

const fullBundle = await bundleConsumer()
assertThemeTokens(fullBundle.css, 'Full bundle')
const combinedStyles = ['Input', 'Switch']
const combinedBundle = await bundleConsumer('Button', combinedStyles)
assertThemeTokens(combinedBundle.css, 'Combined individual styles')
for (const name of combinedStyles) assert(combinedBundle.css.includes(`.scq-${kebabCase(name)}`), `${name}: combined consumer stylesheet`)
const sharedSelectors = {
  Button: '.my-btn',
  Tooltip: '.scq-floating-panel--tooltip',
  Popover: '.scq-floating-panel--popover',
}
for (const name of names) {
  const selector = sharedSelectors[name] || `.scq-${kebabCase(name)}`
  assert(fullBundle.css.includes(selector), `${name}: full-bundle stylesheet`)
}

const isolatedConsumers = {
  Tag: ['.scq-tag__select', '.scq-icon'],
  Badge: ['.scq-badge--bottom-left', '.scq-badge__text'],
  Empty: ['.scq-empty--small', '.scq-icon'],
  Tabs: ['.scq-tabs__panel'],
  Pagination: ['.scq-pagination__jumper', '.scq-input__wrapper', '.scq-icon', '.scq-select__control', '.scq-select__panel', '.scq-virtual-list'],
  Menu: ['.scq-menu__description', '.scq-menu__shortcut', '.scq-floating-panel', '.scq-icon'],
  Breadcrumb: ['.scq-breadcrumb', '.scq-dropdown', '.scq-menu', '.scq-floating-panel', '.scq-link', '.scq-icon'],
  Loading: ['.scq-loading.is-nonblocking'],
  Progress: ['.scq-progress__ring', '.scq-progress__buffer'],
  Alert: ['.scq-alert__actions', '.scq-alert__close.has-text', '.scq-icon'],
  Result: ['.scq-result--small', '.scq-result--full', '.scq-icon'],
  CellGroup: ['.scq-cell-group__description', '.scq-cell-group__footer'],
  NoticeBar: ['.scq-notice-bar.is-paused', '.scq-icon'],
  NavBar: ['.scq-nav-bar', '.scq-loading', '.scq-icon'],
  Tabbar: ['.scq-tabbar', '.scq-badge', '.scq-loading', '.scq-icon'],
  Watermark: ['.scq-watermark', '.is-print-hidden'],
  Avatar: ['.scq-avatar', '.scq-avatar__text', '.scq-icon'],
  Card: ['.scq-card', '.scq-card__control', '.scq-skeleton'],
  Descriptions: ['.scq-descriptions', '.scq-descriptions:not(.is-responsive)', '--scq-descriptions-label-align'],
  Space: ['.scq-space'],
  Divider: ['.scq-divider', '--scq-divider-width'],
  Grid: ['.scq-grid', '.scq-grid__item'],
  Layout: ['.scq-layout'],
  Link: ['.scq-link', '.scq-icon', '.scq-loading'],
  Container: ['.scq-container', '.scq-drawer', '.scq-icon'],
  Button: ['.my-btn'],
  Input: ['.scq-input', '.scq-icon'],
  Select: ['.scq-select', '.scq-virtual-list'],
  Table: ['.scq-table', '.scq-pagination', '.scq-floating-panel'],
  Transfer: ['.scq-transfer', '.scq-virtual-list'],
  Switch: ['.scq-switch'],
  FormItem: ['.scq-form-item'],
  RadioGroup: ['.scq-radio-group'],
  ChatChoice: ['.scq-chat-choice', '.my-btn', '.scq-input', '.scq-radio', '.scq-checkbox', '.scq-icon'],
  ActionSheet: ['.scq-action-sheet', '.scq-drawer', '.scq-loading', '.scq-icon'],
  Toast: ['.scq-toast', '.scq-toast-layer', '.scq-icon'],
  Search: ['.scq-search', '.scq-icon'],
  CollapseItem: ['.scq-collapse-item', '.scq-icon'],
  Picker: ['.scq-picker'],
  Calendar: ['.scq-calendar', '.scq-icon'],
  Swipe: ['.scq-swipe', '.scq-icon'],
  ActionBar: ['.scq-action-bar', '.scq-badge', '.scq-loading', '.scq-icon'],
  DatePicker: ['.scq-date-picker', '.scq-calendar', '.scq-field', '.scq-floating-panel', '.scq-icon'],
  TimePicker: ['.scq-time-picker', '.scq-field', '.scq-floating-panel', '.scq-icon'],
  DateTimePicker: ['.scq-date-time-picker', '.scq-calendar', '.scq-time-picker__columns', '.scq-field', '.scq-floating-panel', '.scq-icon'],
  Upload: ['.scq-upload', '.scq-progress', '.scq-icon'],
  AutoComplete: ['.scq-auto-complete', '.scq-field', '.scq-floating-panel', '.scq-icon', '.scq-virtual-list'],
  Cascader: ['.scq-cascader', '.scq-field', '.scq-floating-panel', '.scq-icon'],
  TreeSelect: ['.scq-tree-select', '.scq-tree', '.scq-field', '.scq-floating-panel', '.scq-loading', '.scq-icon', '.scq-virtual-list'],
  Dropdown: ['.scq-dropdown', '.scq-menu', '.scq-floating-panel', '.scq-icon'],
  Tree: ['.scq-tree', '.scq-loading', '.scq-icon', '.scq-virtual-list'],
  VirtualList: ['.scq-virtual-list'],
  Image: ['.scq-image', '.scq-image-viewer', '.scq-icon'],
  Notification: ['.scq-notification', '.scq-icon'],
  Popconfirm: ['.scq-popconfirm', '.scq-floating-panel', '.scq-loading', '.scq-icon'],
}
const scopedDependencies = {
  Tag: ['Icon'],
  Empty: ['Icon'],
  Pagination: ['Icon', 'Select', 'VirtualList'],
  Menu: ['Popover', 'Icon'],
  Breadcrumb: ['Dropdown', 'Menu', 'Popover', 'Link', 'Icon', 'Loading'],
  Alert: ['Icon'],
  Result: ['Icon'],
  NoticeBar: ['Icon'],
  NavBar: ['Icon', 'Loading'],
  Tabbar: ['Icon', 'Badge', 'Loading'],
  Avatar: ['Icon'],
  Card: ['Skeleton'],
  Link: ['Icon', 'Loading'],
  Container: ['Drawer', 'Icon'],
  Input: ['Icon'],
  ChatChoice: ['Button', 'Input', 'Radio', 'RadioGroup', 'Checkbox', 'CheckboxGroup', 'Icon'],
  ActionSheet: ['Drawer', 'Loading', 'Icon'],
  Toast: ['Icon'],
  Search: ['Icon'],
  CollapseItem: ['Icon'],
  Calendar: ['Icon'],
  Swipe: ['Icon'],
  ActionBar: ['Badge', 'Loading', 'Icon'],
  DatePicker: ['Calendar', 'Popover', 'Icon'],
  TimePicker: ['Popover', 'Icon'],
  DateTimePicker: ['Calendar', 'Popover', 'Icon'],
  Upload: ['Progress', 'Icon'],
  AutoComplete: ['Popover', 'Icon', 'VirtualList'],
  Cascader: ['Popover', 'Icon'],
  TreeSelect: ['Tree', 'Popover', 'Loading', 'Icon'],
  Dropdown: ['Menu', 'Popover', 'Icon'],
  Tree: ['Loading', 'Icon'],
  Image: ['Icon'],
  Notification: ['Icon'],
  Popconfirm: ['Popover', 'Loading', 'Icon'],
}
for (const [name, selectors] of Object.entries(isolatedConsumers)) {
  const bundle = await bundleConsumer(name)
  assertThemeTokens(bundle.css, name)
  if (name === 'Link') assert(!bundle.modules.some((id) => id.includes('vue-router')), 'Link: router must remain an optional adapter dependency')
  for (const selector of selectors) assert(bundle.css.includes(selector), `${name}: dependency style ${selector}`)
  for (const componentName of [name, ...scopedDependencies[name] || []]) {
    const scopeId = scopeIds.get(componentName)
    if (scopeId) assert(bundle.css.includes(`[${scopeId}]`), `${name}: scoped style for ${componentName}`)
  }
  assert(!bundle.css.includes('.scq-chat-message'), `${name}: unrelated chat styles were bundled`)
  assert(!bundle.modules.some((filename) => filename.endsWith('/dist/scq-vue.es.js')), `${name}: full registry was bundled`)
  assert(!bundle.modules.some((filename) => filename.includes('/dist/components/ChatMessage/')), `${name}: unrelated chat component was bundled`)
}

console.log(`Verified ${names.length} components: full and individual imports, declarations, installation and SSR with overlays closed.`)
console.log(`Verified full CSS and ${Object.keys(isolatedConsumers).length} isolated consumer bundles with dependency styles.`)
console.log('Verified automatic shared theme tokens in every stylesheet entry, full and isolated consumers, and consistent definitions across combined styles.')