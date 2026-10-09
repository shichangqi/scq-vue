// @vitest-environment jsdom

import { flushPromises, mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import DocsNavigation from '../playground/src/components/DocsNavigation.vue'
import DocExample from '../playground/src/components/DocExample.vue'
import { componentDocs } from '../playground/src/docs/catalog'
import { componentReferences } from '../playground/src/docs/reference'
import FormExamples from '../playground/src/components/examples/FormExamples.vue'
import TableExamples from '../playground/src/components/examples/TableExamples.vue'
import MobileExamples from '../playground/src/components/examples/MobileExamples.vue'
import ScqVue from '../src/index'
import ComponentDocView from '../playground/src/views/ComponentDocView.vue'
import App from '../playground/src/App.vue'
import documentationRouter from '../playground/src/router'
import { createMemoryHistory, createRouter } from 'vue-router'

const wrappers: VueWrapper[] = []
beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => vi.unstubAllGlobals())
afterEach(() => { wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.restoreAllMocks() })

describe('Playground documentation', () => {
  it('contains each action sheet inside its own phone preview', async () => {
    const wrapper = mount({ components: { MobileExamples }, template: '<div><MobileExamples kind="action-sheet" /><MobileExamples kind="action-sheet" variant="states" /></div>' }, { global: { plugins: [ScqVue] }, attachTo: document.body })
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
    const wrapper = mount(ComponentDocView, { props: { slug: 'modal' }, global: { plugins: [ScqVue] }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()

    const screens = wrapper.findAll('.phone-preview__screen')
    expect(screens).toHaveLength(4)

    // 代码默认折叠
    const codeWraps = wrapper.findAll('.doc-example__code-wrap')
    expect(codeWraps).toHaveLength(4)
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
    const wrapper = mount(App, { global: { plugins: [ScqVue, router] }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.get('h1').text()).toContain('Form')
    expect(wrapper.findAll('.docs-toc a').length).toBeGreaterThan(3)
    await wrapper.get('.docs-menu-toggle').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"] .docs-navigation').exists()).toBe(false)
    const navigation = document.querySelector<HTMLAnchorElement>('.scq-drawer-layer a[href="/components/tabbar"]')
    expect(navigation).not.toBeNull()
    navigation!.click()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/components/tabbar')
    expect(wrapper.get('h1').text()).toContain('Tabbar')
    expect(wrapper.get('.docs-menu-toggle').attributes('aria-expanded')).toBe('false')
  })

  it.each(Object.keys(componentReferences))('renders every example and API for %s', async (slug) => {
    const wrapper = mount(ComponentDocView, { props: { slug }, global: { plugins: [ScqVue] }, attachTo: document.body })
    wrappers.push(wrapper)
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.get('h1').text()).toContain(componentDocs.find((entry) => entry.slug === slug)!.name)
    const examples = wrapper.findAll('.doc-example__viewport')
    expect(examples).toHaveLength(componentReferences[slug].examples.length)
    expect(examples.every((example) => example.element.children.length > 0)).toBe(true)
    expect(wrapper.findAll('.prop-table tbody tr').length).toBeGreaterThan(0)
  })

  it('runs the form validation and reset workflow', async () => {
    const wrapper = mount(FormExamples, { global: { plugins: [ScqVue] }, attachTo: document.body })
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
    const wrapper = mount(TableExamples, { props: { variant: 'states' }, global: { plugins: [ScqVue] }, attachTo: document.body })
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