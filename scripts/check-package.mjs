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
const names = directories.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
const scopeIds = new Map()
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
  assert.equal(entry.default.name, name, `${name}: component name`)
  if (entry.default.__scopeId) scopeIds.set(name, entry.default.__scopeId)
  assert.equal(typeof entry.default.install, 'function', `${name}: standalone install`)
  assert.equal(fullLibrary[name], fullLibrary[`Scq${name}`], `${name}: named alias`)
  assert.equal(typeof fullLibrary[name]?.install, 'function', `${name}: main export`)
  assert.equal(fullApp.component(`scq-${kebabCase(name)}`), fullLibrary[name], `${name}: full installation`)

  const app = createApp({ render: () => null })
  app.use(entry.default)
  assert.equal(app.component(`scq-${kebabCase(name)}`), entry.default, `${name}: individual installation`)

  const declaration = await readFile(resolve(root, `dist/types/components/${name}/index.d.ts`), 'utf8')
  assert(declaration.length > 0, `${name}: declaration`)
  const stylesheet = require.resolve(`${manifest.name}/styles/${kebabCase(name)}.css`)
  assert((await readFile(stylesheet, 'utf8')).length > 0, `${name}: stylesheet`)

  const warnings = []
  const serverApp = createSSRApp({ render: () => h(entry.default, renderProps[name] || {}) })
  serverApp.config.warnHandler = (message) => warnings.push(message)
  await renderToString(serverApp)
  assert.deepEqual(warnings, [], `${name}: server-rendering warnings`)
}

const consumerFile = resolve(root, '__package_consumer__.ts')
const consumerSource = [
  "import { createApp } from 'vue'",
  `import ScqVue, { ${names.map((name) => `Scq${name}`).join(', ')} } from '${manifest.name}'`,
  ...names.map((name) => `import ${name} from '${manifest.name}/components/${name}'`),
  'const app = createApp({ render: () => null })',
  'app.use(ScqVue)',
  ...names.flatMap((name) => [`app.use(${name})`, `app.use(Scq${name})`]),
  "const toast = Toast.loading({ message: 'Loading', forbidClick: true })",
  "toast.update({ type: 'success', message: 'Ready', duration: 1000 })",
  'toast.close()',
  'Toast.clear()',
  "const notice = Notification.success({ id: 'saved', title: 'Saved', message: 'Upload complete' })",
  "notice.update({ message: 'Ready', duration: 1000 })",
  'notice.close()',
  'Notification.closeAll()',
  "import type { PickerOption, TreeNode, UploadRequestOptions } from 'scq-vue'",
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

const bundleConsumer = async (name) => {
  const entryId = `\0scq-package-consumer-${name || 'full'}`
  const modulePath = name ? `${manifest.name}/components/${name}` : manifest.name
  const stylePath = name ? `${manifest.name}/styles/${kebabCase(name)}.css` : `${manifest.name}/style.css`
  const result = await build({
    configFile: false,
    root,
    logLevel: 'error',
    plugins: [{
      name: 'scq-package-consumer',
      resolveId: (id) => id === entryId ? id : undefined,
      load: (id) => id === entryId
        ? `import Component from ${JSON.stringify(modulePath)}; import ${JSON.stringify(stylePath)}; export default Component;`
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
  Button: ['.my-btn'],
  Input: ['.scq-input', '.scq-icon'],
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
  TimePicker: ['.scq-time-picker', '.scq-field', '.scq-icon'],
  Upload: ['.scq-upload', '.scq-progress', '.scq-icon'],
  AutoComplete: ['.scq-auto-complete', '.scq-field', '.scq-floating-panel', '.scq-icon'],
  Cascader: ['.scq-cascader', '.scq-field', '.scq-floating-panel', '.scq-icon'],
  TreeSelect: ['.scq-tree-select', '.scq-tree', '.scq-field', '.scq-floating-panel', '.scq-loading', '.scq-icon'],
  Dropdown: ['.scq-dropdown', '.scq-menu', '.scq-floating-panel', '.scq-icon'],
  Tree: ['.scq-tree', '.scq-loading', '.scq-icon'],
  VirtualList: ['.scq-virtual-list'],
  Image: ['.scq-image', '.scq-image-viewer', '.scq-icon'],
  Notification: ['.scq-notification', '.scq-icon'],
  Popconfirm: ['.scq-popconfirm', '.scq-floating-panel', '.scq-loading', '.scq-icon'],
}
const scopedDependencies = {
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
  TimePicker: ['Icon'],
  Upload: ['Progress', 'Icon'],
  AutoComplete: ['Popover', 'Icon'],
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