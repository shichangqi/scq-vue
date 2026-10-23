// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick, type Component } from 'vue'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { componentEnhancements, componentReferences } from '../playground/src/docs/reference'
import PaginationExample from '../playground/src/components/examples/PaginationFeaturesExample.vue'
import InputExample from '../playground/src/components/examples/InputFeaturesExample.vue'
import LoadingExample from '../playground/src/components/examples/LoadingTimingExample.vue'
import AlertExample from '../playground/src/components/examples/AlertActionsExample.vue'
import TabsExample from '../playground/src/components/examples/TabsLifecycleExample.vue'
import LayerExample from '../playground/src/components/examples/LayerOptionsExample.vue'
import MobileExample from '../playground/src/components/examples/MobileGuardExample.vue'
import ChatChoiceExample from '../playground/src/components/examples/ChatChoiceStatesExample.vue'
import ChatMessageExample from '../playground/src/components/examples/ChatMessageSlotsExample.vue'
import UploadExample from '../playground/src/components/examples/UploadManualExample.vue'
import SearchExample from '../playground/src/components/examples/SearchFormExample.vue'
import TableExample from '../playground/src/components/examples/TableStatesExample.vue'
import CalendarExample from '../playground/src/components/examples/CalendarModesExample.vue'
import PopconfirmExample from '../playground/src/components/examples/PopconfirmStatesExample.vue'
import Checkbox from '../src/components/Checkbox'
import ChatChoice from '../src/components/ChatChoice'
import Dialog from '../src/components/Dialog'
import Drawer from '../src/components/Drawer'
import Input from '../src/components/Input'
import Loading from '../src/components/Loading'
import Modal from '../src/components/Modal'
import Pagination from '../src/components/Pagination'
import Popconfirm from '../src/components/Popconfirm'
import Popup from '../src/components/Popup'
import RadioGroup from '../src/components/RadioGroup'
import Select from '../src/components/Select'
import Table from '../src/components/Table'
import Tabs from '../src/components/Tabs'
import Upload from '../src/components/Upload'

vi.mock('@floating-ui/dom', () => ({
  autoUpdate: (_reference: Element, _panel: Element, update: () => void) => { update(); return () => {} },
  computePosition: async () => ({ x: 0, y: 0, strategy: 'fixed' }),
  offset: vi.fn(), flip: vi.fn(), shift: vi.fn(),
}))

const wrappers: VueWrapper[] = []
const containers: HTMLElement[] = []
const render = (component: Component) => {
  const container = document.createElement('div')
  document.body.append(container)
  containers.push(container)
  const wrapper = mount(component, { attachTo: container })
  wrappers.push(wrapper)
  return wrapper
}
const click = async (wrapper: VueWrapper, text: string) => {
  const button = wrapper.findAll('button').find(button => button.text() === text)
  expect(button, text).toBeDefined()
  await button!.trigger('click')
  await flushPromises()
}
const toggle = async (wrapper: VueWrapper, text: string, checked = true) => {
  const checkbox = wrapper.findAllComponents(Checkbox).find(checkbox => checkbox.text() === text)
  expect(checkbox, text).toBeDefined()
  await checkbox!.get('input').setValue(checked)
}
const settleTimers = async () => {
  await flushPromises()
  await vi.runOnlyPendingTimersAsync()
  await flushPromises()
}
beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => vi.unstubAllGlobals())
afterEach(async () => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  await flushPromises()
  containers.splice(0).forEach(container => container.remove())
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Playground feature coverage', () => {
  const coverage = [
    ['ButtonFeaturesExample', ['button']],
    ['InputFeaturesExample', ['input']],
    ['InputNumberFeaturesExample', ['input-number']],
    ['LoadingTimingExample', ['loading']],
    ['AlertActionsExample', ['alert']],
    ['BadgePlacementExample', ['badge']],
    ['EmptyImageExample', ['empty']],
    ['PaginationFeaturesExample', ['pagination']],
    ['TabsLifecycleExample', ['tabs']],
    ['ChatChoiceStatesExample', ['chat-choice']],
    ['LayerOptionsExample', ['dialog', 'modal', 'drawer', 'popup']],
    ['MobileGuardExample', ['nav-bar', 'tabbar', 'action-sheet']],
    ['PopconfirmStatesExample', ['popconfirm']],
    ['CalendarModesExample', ['calendar']],
    ['SearchFormExample', ['search']],
    ['FloatingOptionsExample', ['tooltip', 'popover']],
    ['TableStatesExample', ['table']],
    ['UploadManualExample', ['upload']],
    ['ChatMessageSlotsExample', ['chat-message']],
    ['SelectionStatesExample', ['radio', 'checkbox']],
    ['CellSlotsExample', ['cell']],
  ] as const

  it.each(coverage)('publishes live, copyable %s examples on every relevant page', (source, slugs) => {
    for (const slug of slugs) {
      const reference = componentReferences[slug] ?? componentEnhancements[slug]
      const example = reference.examples.find(example => example.source === source)
      expect(example, slug).toBeDefined()
      expect(example!.files?.['App.vue']).toBe(example!.code)
      expect(example!.title.zh).toBeTruthy()
      expect(example!.title.en).toBeTruthy()
      expect(example!.code).not.toContain('../../../../src/')
      if (example!.code.includes("from './LocalDraft.vue'")) {
        expect(example!.files?.['LocalDraft.vue']).toContain('v-model="draft"')
        expect(example!.files?.['LocalDraft.vue']).toContain("from 'scq-vue/components/Input'")
      }
    }
  })

  it('demonstrates page clamping, size resets, unknown totals, disabled states and slots', async () => {
    const wrapper = render(PaginationExample)
    const [known, unknown] = wrapper.findAllComponents(Pagination)
    const jumper = known.get('.scq-pagination__jumper input')
    await jumper.setValue(999)
    await jumper.trigger('keydown', { key: 'Enter' })
    const lastPage = Math.ceil(known.props('total')! / known.props('pageSize')!)
    expect(known.props('modelValue')).toBe(lastPage)
    expect(known.text()).toContain(`当前第 ${lastPage} 页`)
    known.getComponent(Select).vm.$emit('update:modelValue', 20)
    await nextTick()
    expect(known.props()).toMatchObject({ modelValue: 1, pageSize: 20 })
    expect(unknown.find('.scq-pagination__pages').exists()).toBe(false)
    expect(unknown.find('.scq-pagination__jumper').exists()).toBe(false)
    await unknown.findAll('button').at(-1)!.trigger('click')
    expect(unknown.props('modelValue')).toBe(2)
    await toggle(wrapper, '还有下一页', false)
    expect(unknown.findAll('button').at(-1)!.attributes('disabled')).toBeDefined()
    await toggle(wrapper, '加载中')
    expect(known.get('.scq-pagination__jumper input').attributes('disabled')).toBeDefined()
    expect(known.findAll('button').every(button => button.attributes('disabled') !== undefined)).toBe(true)
    await toggle(wrapper, '单页时隐藏', false)
    expect(wrapper.findAll('.scq-pagination')).toHaveLength(3)
  })

  it('connects input methods, slots, readonly state and textarea limits', async () => {
    const wrapper = render(InputExample)
    const input = wrapper.findAllComponents(Input)[0]
    await click(wrapper, '聚焦')
    expect(document.activeElement).toBe(input.get('input').element)
    expect(input.text()).toContain('https://')
    expect(input.text()).toContain('.example')
    await click(wrapper, '清空')
    expect(input.props('modelValue')).toBe('')
    await toggle(wrapper, '只读')
    expect(input.get('input').attributes('readonly')).toBeDefined()
    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('maxlength')).toBeTruthy()
    expect(textarea.classes()).toContain('is-autosize')
  })

  it('shows loading only after the delay and retains it for the exact minimum duration', async () => {
    vi.useFakeTimers()
    const wrapper = render(LoadingExample)
    const loading = wrapper.getComponent(Loading)
    const delay = loading.props('delay')!
    const minimum = loading.props('minDuration')!
    await click(wrapper, '慢速完成（最短展示）')
    await vi.advanceTimersByTimeAsync(delay - 1)
    expect(loading.find('.scq-loading__indicator').exists()).toBe(false)
    expect(loading.get('.scq-loading__content').attributes('inert')).toBeDefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(loading.find('.scq-loading__indicator').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(minimum - 1)
    expect(loading.props('loading')).toBe(false)
    expect(loading.get('.scq-loading__content').attributes('inert')).toBeUndefined()
    expect(loading.find('.scq-loading__indicator').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(loading.find('.scq-loading__indicator').exists()).toBe(false)
    await click(wrapper, '快速完成（不闪烁）')
    await vi.advanceTimersByTimeAsync(delay)
    expect(loading.find('.scq-loading__indicator').exists()).toBe(false)
  })

  it('closes and reopens the controlled alert without losing its custom actions', async () => {
    const wrapper = render(AlertExample)
    await click(wrapper, '配置通知')
    expect(wrapper.get('output').text()).toContain('已选择配置通知')
    await click(wrapper, '暂不处理')
    expect(wrapper.find('.scq-alert').exists()).toBe(false)
    await click(wrapper, '重新显示')
    expect(wrapper.get('.scq-alert').text()).toContain('配置通知')
  })

  it('actually preserves and destroys local tab drafts and rejects blocked changes', async () => {
    vi.useFakeTimers()
    const wrapper = render(TabsExample)
    const tabs = wrapper.getComponent(Tabs)
    const changeTab = async (label: string) => { await click(tabs, label); await settleTimers() }
    await tabs.get('input').setValue('Local draft')
    await click(tabs, '预览 · preview')
    expect(tabs.vm.pending).toBe(true)
    await click(wrapper, '取消等待')
    await settleTimers()
    expect(tabs.props('modelValue')).toBe('draft')
    expect(tabs.vm.pending).toBe(false)
    await changeTab('预览 · preview')
    await changeTab('草稿 · draft')
    expect(tabs.get<HTMLInputElement>('input').element.value).toBe('Local draft')
    await toggle(wrapper, '销毁非活动面板')
    await changeTab('预览 · preview')
    await changeTab('草稿 · draft')
    expect(tabs.get<HTMLInputElement>('input').element.value).toBe('')
    await toggle(wrapper, '阻止切换')
    await changeTab('预览 · preview')
    expect(tabs.props('modelValue')).toBe('draft')
    expect(wrapper.get('output').text()).toContain('切换被拒绝')
    await toggle(wrapper, '模拟失败')
    await changeTab('预览 · preview')
    expect(wrapper.get('output').text()).toContain('当前不允许切换')
  })

  it.each([
    ['Dialog', Dialog], ['Modal', Modal], ['Drawer', Drawer], ['Popup', Popup],
  ] as const)('renders a real %s, retains its draft and honors the close guard', async (name, component) => {
    vi.useFakeTimers()
    const wrapper = render(LayerExample)
    wrapper.getComponent(RadioGroup).vm.$emit('update:modelValue', name)
    await nextTick()
    await click(wrapper, `打开 ${name}`)
    await settleTimers()
    const layer = wrapper.getComponent(component)
    const input = document.body.querySelector<HTMLInputElement>('.layer-options-draft input')!
    expect(input).not.toBeNull()
    input.value = 'Preserved draft'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    await toggle(wrapper, '阻止关闭')
    const refused = layer.vm.close()
    await settleTimers()
    expect(await refused).toBe(false)
    expect(layer.props('modelValue')).toBe(true)
    await toggle(wrapper, '阻止关闭', false)
    const closed = layer.vm.close()
    await settleTimers()
    expect(await closed).toBe(true)
    await click(wrapper, `打开 ${name}`)
    await settleTimers()
    expect(document.body.querySelector<HTMLInputElement>('.layer-options-draft input')!.value).toBe('Preserved draft')
  })

  it('keeps mobile action items out of navigation and allows guard cancellation and retry', async () => {
    vi.useFakeTimers()
    const wrapper = render(MobileExample)
    await settleTimers()
    await click(wrapper, '设置')
    await settleTimers()
    expect(wrapper.get('[role="status"]').text()).toContain('页面：settings')
    await toggle(wrapper, '模拟失败')
    await click(wrapper, '首页')
    await settleTimers()
    expect(wrapper.get('[role="status"]').text()).toContain('操作失败')
    await toggle(wrapper, '模拟失败', false)
    await click(wrapper, '首页')
    await click(wrapper, '取消等待')
    await settleTimers()
    expect(wrapper.get('.scq-tabbar__item.is-active').text()).toBe('设置')
    await wrapper.get('.scq-tabbar__item:last-child').trigger('click')
    await settleTimers()
    expect(wrapper.get('.scq-tabbar__item.is-active').text()).toBe('设置')
    await click(wrapper, '保存草稿')
    await settleTimers()
    expect(wrapper.get('[role="status"]').text()).toContain('已选择：保存草稿')
  })

  it('validates ChatChoice limits and locks the submitted answer', async () => {
    const wrapper = render(ChatChoiceExample)
    expect(wrapper.getComponent(ChatChoice).vm.validate()).toBe(false)
    await nextTick()
    expect(wrapper.get('output').text()).toMatch(/required|min/)
    const choices = wrapper.findAll('.scq-chat-choice input[type="checkbox"]')
    await choices[0].setValue(true)
    await choices[1].setValue(true)
    await click(wrapper, '确认技能')
    expect(wrapper.get('output').text()).toContain('提交成功')
    expect(wrapper.getComponent(ChatChoice).props('submitted')).toBe(true)
    expect(choices.every(choice => choice.attributes('disabled') !== undefined)).toBe(true)
    await click(wrapper, '重置选择')
    expect(wrapper.getComponent(ChatChoice).props('modelValue')).toEqual({ values: [] })
  })

  it('submits ChatMessage choices through the actual selection-submit event', async () => {
    const wrapper = render(ChatMessageExample)
    await wrapper.get('.scq-chat-message__selection-option').trigger('click')
    await click(wrapper, '确认 1 项')
    expect(wrapper.get('output').text()).toBe('["design"]')
    await toggle(wrapper, '禁用选择')
    expect(wrapper.get('.scq-chat-message__selection-option').attributes('disabled')).toBeDefined()
  })

  it('demonstrates manual upload hooks, request metadata and guarded removal without networking', async () => {
    const wrapper = render(UploadExample)
    const upload = wrapper.getComponent(Upload)
    await click(wrapper, '添加示例文件')
    expect(upload.props('fileList')?.[0].status).toBe('ready')
    await toggle(wrapper, '允许上传', false)
    await click(wrapper, '提交上传')
    expect(wrapper.get('output').text()).toContain('hook')
    await toggle(wrapper, '允许上传')
    await click(wrapper, '提交上传')
    expect(upload.props('fileList')?.[0].status).toBe('success')
    expect(JSON.parse(wrapper.get('output').text())).toMatchObject({ method: 'PUT', field: 'document', headers: { 'X-Example': 'playground' }, data: { category: 'documents' } })
    await toggle(wrapper, '允许移除', false)
    await click(wrapper, '清空文件')
    expect(upload.props('fileList')).toHaveLength(1)
    await toggle(wrapper, '允许移除')
    await click(wrapper, '清空文件')
    expect(upload.props('fileList')).toHaveLength(0)
  })

  it('keeps native search forms unnested and separates search from outer submission', async () => {
    const wrapper = render(SearchExample)
    expect(wrapper.findAll('form')).toHaveLength(1)
    const input = wrapper.get('input[type="search"]')
    await input.setValue('Vue')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.get('output').text()).toBe('搜索：Vue')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('output').text()).toBe('外部表单已提交')
    await click(wrapper, '重置')
    expect(input.element).toHaveProperty('value', '')
  })

  it('applies default table sorting/filtering and recovers from its custom empty state', async () => {
    const wrapper = render(TableExample)
    const table = wrapper.getComponent(Table)
    const rows = table.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Grace')
    expect(rows[1].text()).toContain('Ada')
    await toggle(wrapper, '空数据')
    expect(table.text()).toContain('没有成员数据')
    await click(wrapper, '恢复数据')
    expect(table.findAll('tbody tr')).toHaveLength(2)
  })

  it('enforces the demonstrated calendar multiple-selection limit', async () => {
    const wrapper = render(CalendarExample)
    const calendars = wrapper.findAll('.scq-calendar')
    const multiple = calendars[1]
    const dates = multiple.findAll('button[data-date]:not(:disabled)').slice(0, 4)
    for (const date of dates) await date.trigger('click')
    expect(wrapper.get('output').text()).toContain('max-selected')
    expect(multiple.findAll('[aria-selected="true"]')).toHaveLength(3)
  })

  it('retains failed confirmations, then retries successfully with the custom action slot', async () => {
    vi.useFakeTimers()
    const wrapper = render(PopconfirmExample)
    await toggle(wrapper, '自定义操作区')
    await click(wrapper, '删除草稿')
    await settleTimers()
    const confirmation = document.body.querySelector<HTMLButtonElement>('.scq-popconfirm__actions button:last-child')!
    confirmation.click()
    await settleTimers()
    expect(wrapper.getComponent(Popconfirm).props('modelValue')).toBe(true)
    expect(wrapper.get('output').text()).toBe('模拟删除失败')
    await toggle(wrapper, '模拟失败', false)
    confirmation.click()
    await settleTimers()
    expect(wrapper.getComponent(Popconfirm).props('modelValue')).toBe(false)
    expect(wrapper.get('output').text()).toContain('已确认删除')
  })
})
