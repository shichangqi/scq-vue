// @vitest-environment jsdom

import { flushPromises, mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Typography from '../src/components/Typography/Typography.vue'
import CellGroup from '../src/components/Cell/CellGroup.vue'
import NoticeBar from '../src/components/NoticeBar/NoticeBar.vue'
import Cascader from '../src/components/Cascader/Cascader.vue'
import ChatMessage from '../src/components/ChatMessage/ChatMessage.vue'
import CascaderExample from '../playground/src/components/examples/CascaderExample.vue'
import DocsNavigation from '../playground/src/components/DocsNavigation.vue'
import DocExample from '../playground/src/components/DocExample.vue'
import { componentDocs } from '../playground/src/docs/catalog'
import { componentEnhancements, componentReferences } from '../playground/src/docs/reference'
import { locale, t, type Locale } from '../playground/src/i18n'
import FormExamples from '../playground/src/components/examples/FormExamples.vue'
import TableExamples from '../playground/src/components/examples/TableExamples.vue'
import MobileExamples from '../playground/src/components/examples/MobileExamples.vue'
import DateTimePickerExample from '../playground/src/components/examples/DateTimePickerExample.vue'
import DateTimePickerOptionsExample from '../playground/src/components/examples/DateTimePickerOptionsExample.vue'
import ToastTemplateExample from '../playground/src/components/examples/ToastTemplateExample.vue'
import ChatMessageDocView from '../playground/src/views/ChatMessageDocView.vue'
import ComponentDocView from '../playground/src/views/ComponentDocView.vue'
import GuideView from '../playground/src/views/GuideView.vue'
import App from '../playground/src/App.vue'
import documentationRouter from '../playground/src/router'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('@floating-ui/dom', () => ({
  autoUpdate: (_reference: unknown, _panel: unknown, update: () => void) => { update(); return () => {} },
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  offset: vi.fn(), flip: vi.fn(), shift: vi.fn(),
}))

const wrappers: VueWrapper[] = []
const INTERNAL_COPY = /本轮(?:新增|增强)|旧控件继承|未提交的 Select|正在调用 pnpm run build|真实触摸设备矩阵|physical-device certification|防篡改水印|anti-tamper watermark|Legacy Controls|业务持有请求结果|完成态不改变旧事件|发送测试消息|验证禁用规则|欢迎随时提出/
const DOCUMENT_LOCALES: Locale[] = ['zh-CN', 'en-US']
const standaloneViews = Object.entries(import.meta.glob<{ default: Component }>('../playground/src/views/*DocView.vue'))
  .filter(([path]) => !path.endsWith('/ComponentDocView.vue'))
beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => vi.unstubAllGlobals())
afterEach(() => { wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); locale.value = 'zh-CN'; vi.restoreAllMocks() })

describe('Playground documentation', () => {
  it('keeps internal delivery language out of reference copy and displayed examples', () => {
    for (const [slug, reference] of Object.entries({ ...componentReferences, ...Object.fromEntries(Object.entries(componentEnhancements).map(([key, value]) => [`${key}-advanced`, value])) })) {
      const copy = [
        reference.description, reference.note,
        ...reference.examples.flatMap(example => [example.title, example.code]),
        ...[reference.props, reference.events, reference.slots, reference.methods].flatMap(rows => rows?.map(row => row.description) || []),
      ]
      expect(JSON.stringify(copy), slug).not.toMatch(INTERNAL_COPY)
    }
  })

  it.each(DOCUMENT_LOCALES)('uses visitor-facing headings and guidance in %s', (language) => {
    locale.value = language
    const supplement = mount(ComponentDocView, { props: { slug: 'card', supplement: true }, global: { stubs: { DocExample: true } } })
    const guide = mount(GuideView, { global: { stubs: { DocExample: true } } })
    wrappers.push(supplement, guide)
    expect(supplement.get('h2').text()).toBe(`Card · ${t('doc.advanced')}`)
    expect(supplement.text()).not.toMatch(INTERNAL_COPY)
    expect(guide.text()).not.toMatch(/新增组件|既有组件|new components|Existing component styles/)
    expect(guide.text()).toContain(language === 'zh-CN' ? '自定义文案和示例内容不会自动翻译' : 'Custom labels and example content are not translated automatically')
    expect(t('watermark.lead')).not.toMatch(INTERNAL_COPY)
    expect(t('watermark.lead')).toContain(language === 'zh-CN' ? '不能阻止截图' : 'cannot prevent screenshots')
  })

  it('uses neutral chat content and shares the markdown payload with its code sample', () => {
    const wrapper = mount(ChatMessageDocView, {
      global: { stubs: { DocExample: { props: ['code'], template: '<div><slot /></div>' }, OnDemandExample: true } },
    })
    wrappers.push(wrapper)
    const messages = wrapper.findAllComponents(ChatMessage)
    const table = messages.find(message => String(message.props('message')).startsWith('# 项目协作计划'))
    expect(table).toBeDefined()
    const payload = table!.props('message')
    expect(typeof payload).toBe('string')
    expect(table!.findAll('tbody tr')).toHaveLength(4)
    const codes = wrapper.findAllComponents(DocExample).map(example => String(example.props('code')))
    expect(codes.some(code => code.includes(`const markdownTablePayload = ${JSON.stringify(payload)}`))).toBe(true)
    expect(messages.some(message => message.props('status')?.text === '正在查询资料')).toBe(true)
    expect(messages.some(message => message.props('status')?.text === '暂时无法处理，请稍后重试')).toBe(true)
    expect(wrapper.text()).not.toMatch(INTERNAL_COPY)
    expect(codes.join('\n')).not.toMatch(INTERNAL_COPY)
    expect(wrapper.text()).not.toContain('截至 2024 年')
  })

  it('previews a toast without claiming to send a message', async () => {
    const wrapper = mount(ToastTemplateExample, { attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    const preview = wrapper.findAll('button').find(button => button.text() === '预览消息提示')
    expect(preview).toBeDefined()
    await preview!.trigger('click')
    await flushPromises()
    expect(wrapper.get('.scq-toast').text()).toContain('这是一条消息提示')
    expect(wrapper.text()).not.toMatch(/发送测试消息|新消息已送达/)
  })

  it('uses the picker validation feedback instead of exposing raw error reasons', async () => {
    const wrapper = mount(DateTimePickerOptionsExample, { attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('.scq-field__trigger').trigger('click')
    await flushPromises()
    const shortcut = document.body.querySelector<HTMLButtonElement>('.scq-date-time-picker__shortcuts button:last-child')
    expect(shortcut?.textContent).toContain('午休时段（不可预约）')
    shortcut!.click()
    await flushPromises()
    const alert = document.body.querySelector('.scq-date-time-picker__status[role="alert"]')
    expect(alert?.textContent?.trim()).toBeTruthy()
    expect(alert?.textContent).not.toMatch(/disabled-date|disabled-time|out-of-range/)
    expect(wrapper.text()).not.toContain('最近拦截原因')
  })

  it('keeps scrollable notice content measurable before overflow is detected', () => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = readFileSync(resolve(__dirname, '..', 'styles', 'notice-bar.css'), 'utf8')
    document.head.append(stylesheet)
    const wrapper = mount(NoticeBar, { attachTo: document.body, props: { text: 'Short', wrap: false, scrollable: true } })
    wrappers.push(wrapper)
    try {
      expect(wrapper.classes()).not.toContain('is-scrolling')
      const content = wrapper.get('.scq-notice-bar__content').element
      expect(getComputedStyle(content).width).toBe('max-content')
      expect(getComputedStyle(content).minWidth).toBe('100%')
    } finally { stylesheet.remove() }
  })

  it('keeps documentation heading styles out of component previews', () => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = ['styles/typography.css', 'styles/cell.css', 'playground/src/playground.css']
      .map(filename => readFileSync(resolve(__dirname, '..', filename), 'utf8')).join('\n')
    document.head.append(stylesheet)
    const wrapper = mount({
      components: { Typography, CellGroup },
      template: '<section class="doc-block"><h3>API</h3><div class="doc-example__demo"><Typography as="h3">Preview heading</Typography><CellGroup title="Preferences" /></div></section>',
    }, { attachTo: document.body })
    wrappers.push(wrapper)
    try {
      expect(getComputedStyle(wrapper.get('.doc-block > h3').element).fontSize).toBe('17px')
      expect(getComputedStyle(wrapper.get('.scq-typography').element).fontSize).toBe('20px')
      expect(getComputedStyle(wrapper.get('.scq-cell-group__title').element).fontSize).toBe('13px')
    } finally { stylesheet.remove() }
  })

  it('starts the leaf-only cascader example with a selectable leaf', () => {
    const wrapper = mount(CascaderExample)
    wrappers.push(wrapper)
    const cascader = wrapper.getComponent(Cascader)
    expect(cascader.props('changeOnSelect')).toBe(false)
    let options = cascader.props('options')
    const value = cascader.props('modelValue')
    expect(Array.isArray(value)).toBe(true)
    if (!Array.isArray(value)) throw new Error('The cascader example must use a full path')
    for (const key of value) {
      const selected = options.find(option => option.value === key)
      expect(selected).toBeDefined()
      options = selected?.children || []
    }
    expect(options).toHaveLength(0)
  })

  it('renders setup guidance without a component catalog', () => {
    const wrapper = mount(GuideView, { global: { stubs: { DocExample: true, RouterLink: RouterLinkStub } } })
    wrappers.push(wrapper)
    expect(wrapper.findAllComponents(DocExample)).toHaveLength(7)
    expect(wrapper.find('#individual-registration').exists()).toBe(true)
    expect(wrapper.find('#configuration').exists()).toBe(true)
    expect(wrapper.find('#mobile').exists()).toBe(true)
    expect(wrapper.find('#catalog').exists()).toBe(false)
    expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(0)
  })

  it('contains each action sheet inside its own phone preview', async () => {
    const wrapper = mount({ components: { MobileExamples }, template: '<div><MobileExamples kind="action-sheet" /><MobileExamples kind="action-sheet" variant="states" /></div>' }, { attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    const screens = wrapper.findAll('.phone-preview__screen')
    expect(screens).toHaveLength(2)
    expect(screens[0].attributes('id')).not.toBe(screens[1].attributes('id'))
    await screens[0].get('.mobile-example__body button').trigger('click')
    await flushPromises()
    expect(screens[0].get('.scq-drawer-layer').element.closest('.phone-preview__screen')).toBe(screens[0].element)
    expect(screens[0].get('.scq-drawer-layer').element.closest('.phone-preview__content')).toBeNull()
    expect(screens[1].find('.scq-drawer-layer').exists()).toBe(false)
    await screens[0].get('.scq-action-sheet__cancel').trigger('click')
    await flushPromises()
    expect(screens[0].get('.scq-drawer-layer').isVisible()).toBe(false)
  })

  it('renders multiple independent phone previews for modal component with collapsible code', async () => {
    const wrapper = mount(ComponentDocView, { props: { slug: 'modal' }, attachTo: document.body })
    wrappers.push(wrapper)
    await vi.dynamicImportSettled()
    await flushPromises()

    const screens = wrapper.findAll('.phone-preview__screen')
    expect(screens).toHaveLength(4)

    // 代码默认折叠
    const codeWraps = wrapper.findAll('.doc-example__code-wrap')
    expect(codeWraps).toHaveLength(componentReferences.modal.examples.length)
    expect(codeWraps.every((el) => !el.isVisible())).toBe(true)

    // 点击展开代码
    await wrapper.findAll('.doc-example__toggle')[0].trigger('click')
    expect(codeWraps[0].isVisible()).toBe(true)

    // 触发第一个手机内的 Modal 弹窗
    await screens[0].get('.mobile-example__body button').trigger('click')
    await flushPromises()
    expect(screens[0].find('.scq-modal').exists()).toBe(true)
    expect(screens[1].find('.scq-modal').exists()).toBe(false)

    // 关闭弹窗
    await screens[0].get('.scq-modal__action--confirm').trigger('click')
    await flushPromises()
    expect(screens[0].find('.scq-modal').exists()).toBe(false)
  })

  it('connects categorized navigation, mobile drawer and page anchors in the app', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: documentationRouter.options.routes })
    for (const entry of componentDocs) expect(router.resolve(`/components/${entry.slug}`).name, entry.slug).toBe(entry.slug)
    await router.push('/components/form')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
    wrappers.push(wrapper)
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.get('h1').text()).toContain('Form')
    expect(wrapper.findAll('.docs-toc a').length).toBeGreaterThan(3)
    await wrapper.get('.docs-menu-toggle').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"] .docs-navigation').exists()).toBe(false)
    const navigation = document.querySelector<HTMLAnchorElement>('.scq-drawer-layer a[href="/components/tabbar"]')
    expect(navigation).not.toBeNull()
    navigation!.click()
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/components/tabbar')
    expect(wrapper.get('h1').text()).toContain('Tabbar')
    expect(wrapper.get('.docs-menu-toggle').attributes('aria-expanded')).toBe('false')
  })

  it('runs the DateTimePicker source example as a single integrated draft/confirm workflow', async () => {
    const wrapper = mount(ComponentDocView, { props: { slug: 'date-time-picker' }, attachTo: document.body })
    wrappers.push(wrapper)
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.get('h1').text()).toContain('DateTimePicker')
    expect(wrapper.findAll('.doc-example__viewport')).toHaveLength(4)
    const example = wrapper.getComponent(DateTimePickerExample)
    const trigger = example.get('.scq-field__trigger')
    await trigger.trigger('click')
    await flushPromises()
    const panel = document.querySelector('.scq-date-time-picker__panel')!
    expect(panel.querySelector('.scq-calendar')).not.toBeNull()
    expect(panel.querySelector('.scq-time-picker__columns')).not.toBeNull()
    expect(panel.querySelector('.scq-calendar__footer')).toBeNull()
    expect(panel.querySelector('.scq-date-time-picker__status')).toBeNull()
    expect(panel.querySelector('.scq-date-time-picker__extra')).toBeNull()
    panel.querySelector<HTMLButtonElement>('[data-date]:not(:disabled)')!.click()
    await flushPromises()
    expect(example.get('.datetime-example__result').text()).toContain('未提交')
    panel.querySelector<HTMLButtonElement>('.scq-date-time-picker__confirm')!.click()
    await flushPromises()
    expect(example.get('.datetime-example__result').text()).not.toContain('未提交')
    expect(trigger.text()).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
    expect(document.querySelector('.scq-date-time-picker__panel')).toBeNull()
  })

  it('skips to the content without leaving the current document', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: documentationRouter.options.routes })
    await router.push('/components/tabs')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
    wrappers.push(wrapper)
    await vi.dynamicImportSettled()
    await flushPromises()
    const main = wrapper.get<HTMLElement>('#docs-content')
    const scrollIntoView = vi.fn()
    main.element.scrollIntoView = scrollIntoView
    expect(wrapper.get('.docs-skip-link').attributes('href')).toBe('#/components/tabs#docs-content')
    await wrapper.get('.docs-skip-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/components/tabs')
    expect(router.currentRoute.value.hash).toBe('#docs-content')
    expect(document.activeElement).toBe(main.element)
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it.each(Object.keys(componentReferences))('renders every example and API for %s', async (slug) => {
    const warnings: string[] = []
    const wrapper = mount(ComponentDocView, { props: { slug }, global: { config: { warnHandler: (message) => warnings.push(message) } }, attachTo: document.body })
    wrappers.push(wrapper)
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.get('h1').text()).toContain(componentDocs.find((entry) => entry.slug === slug)!.name)
    const examples = wrapper.findAll('.doc-example__viewport')
    expect(examples).toHaveLength(componentReferences[slug].examples.length)
    expect(examples.every((example) => example.element.children.length > 0)).toBe(true)
    expect(wrapper.findAll('.prop-table tbody tr').length).toBeGreaterThan(0)
    expect(warnings.filter((message) => message.includes('Failed to resolve component'))).toEqual([])
    expect(wrapper.findAll('*').some((element) => element.element.localName.startsWith('scq-'))).toBe(false)
  })

  it.each(standaloneViews)('renders standalone %s without installing the entire library', async (_path, load) => {
    const warnings: string[] = []
    const { default: View } = await load()
    const wrapper = mount(View, { global: { config: { warnHandler: (message) => warnings.push(message) } }, attachTo: document.body })
    wrappers.push(wrapper)
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(warnings.filter((message) => message.includes('Failed to resolve component'))).toEqual([])
    expect(wrapper.findAll('*').some((element) => element.element.localName.startsWith('scq-'))).toBe(false)
  })

  it('runs the form validation and reset workflow', async () => {
    const wrapper = mount(FormExamples, { attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('[role="alert"]').length).toBeGreaterThan(0)
    await wrapper.get('input[type="text"]').setValue('Ada')
    await wrapper.get('input[type="email"]').setValue('ada@example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.form-example__result.is-success').exists()).toBe(true)
    await wrapper.findAll('.scq-form-item button').at(-1)!.trigger('click')
    await flushPromises()
    expect(wrapper.get('input[type="text"]').element.value).toBe('')
  })

  it('filters the table example without leaving empty pagination behind', async () => {
    const wrapper = mount(TableExamples, { props: { variant: 'states' }, attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue('Ada')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.findAll('tbody tr').every((entry) => entry.text().includes('Ada'))).toBe(true)
  })

  it('provides examples and API references for every new document route', () => {
    expect(new Set(componentDocs.map((entry) => entry.slug)).size).toBe(componentDocs.length)
    for (const [slug, reference] of Object.entries(componentReferences)) {
      expect(componentDocs.some((entry) => entry.slug === slug), slug).toBe(true)
      expect(reference.examples.length, slug).toBeGreaterThan(0)
      expect(reference.props.length, slug).toBeGreaterThan(0)
      expect(reference.examples.every((example) => example.code.includes('<template>')), slug).toBe(true)
    }
  })

  it('filters component navigation by name and platform', async () => {
    const wrapper = mount(DocsNavigation, { props: { query: 'radio', platform: 'all' }, global: { stubs: { RouterLink: RouterLinkStub } } })
    wrappers.push(wrapper)
    expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(1)
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/components/radio')
    await wrapper.setProps({ query: 'dialog', platform: 'mobile' })
    expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(0)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('groups mobile-specific overlays in the mobile section', () => {
    for (const slug of ['action-sheet', 'modal']) {
      expect(componentDocs.find((entry) => entry.slug === slug)).toMatchObject({ group: 'mobile', platform: 'mobile' })
    }
  })

  it('shows only mobile-specific components in the mobile filter', () => {
    const wrapper = mount(DocsNavigation, { props: { query: '', platform: 'mobile' }, global: { stubs: { RouterLink: RouterLinkStub } } })
    wrappers.push(wrapper)
    const routes = wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to')).filter((route) => route !== '/guide')
    expect(routes).toEqual(componentDocs.filter((entry) => entry.group === 'mobile').map((entry) => `/components/${entry.slug}`))
  })

  it('preserves code toggling and copies the unmodified source', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const code = '<scq-button>Save</scq-button>'
    const wrapper = mount(DocExample, { props: { code }, slots: { default: '<button>Save</button>' }, attachTo: document.body })
    wrappers.push(wrapper)
    expect(wrapper.get('.doc-example__code-wrap').isVisible()).toBe(false)
    await wrapper.get('.doc-example__toggle').trigger('click')
    expect(wrapper.get('.doc-example__toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.doc-example__code-wrap').isVisible()).toBe(true)
    await wrapper.findAll('.doc-example__tool')[0].trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(code)
    expect(wrapper.find('.doc-example__widths').exists()).toBe(false)
    expect(wrapper.get('.doc-example__viewport').classes()).not.toContain('is-narrow')
  })

  it('copies the selected dependency file and supports keyboard file navigation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const example = componentReferences.toast.examples[0]
    const wrapper = mount(DocExample, { props: { code: example.code, files: example.files, defaultExpanded: true }, attachTo: document.body })
    wrappers.push(wrapper)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    await tabs[0].trigger('keydown', { key: 'ArrowRight' })
    expect(tabs[1].attributes('aria-selected')).toBe('true')
    await wrapper.get('.doc-example__tool').trigger('click')
    expect(writeText).toHaveBeenCalledWith(example.files!['PhonePreview.vue'])
    expect(wrapper.get('[role="tabpanel"]').text()).toContain('phone-preview__screen')
  })
})