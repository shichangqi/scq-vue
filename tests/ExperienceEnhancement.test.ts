// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import Icon from '../src/components/Icon/Icon.vue'
import Skeleton from '../src/components/Skeleton/Skeleton.vue'
import { SKELETON_DEFAULT_ROWS, SKELETON_MAX_ROWS } from '../src/components/Skeleton/constants'
import Typography from '../src/components/Typography/Typography.vue'
import { TYPOGRAPHY_COPY_FEEDBACK_MS } from '../src/components/Typography/constants'
// Resolve full-entry example dependencies during collection, not within interaction timeouts.
import IconSemanticExample from '../playground/src/components/examples/IconSemanticExample.vue'
import SkeletonPresetExample from '../playground/src/components/examples/SkeletonPresetExample.vue'
import TypographyExpandExample from '../playground/src/components/examples/TypographyExpandExample.vue'

const wrappers: VueWrapper[] = []
const skeletonStyles = readFileSync(resolve(__dirname, '..', 'styles', 'skeleton.css'), 'utf8')
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
const settle = async () => { await flushPromises(); await nextTick() }
const resize = async () => { window.dispatchEvent(new Event('resize')); await settle() }
const contentMetrics = (wrapper: VueWrapper, vertical = false) => {
  const metrics = { clientWidth: 100, scrollWidth: vertical ? 100 : 300, clientHeight: 20, scrollHeight: vertical ? 60 : 20 }
  const content = wrapper.get('.scq-typography__content').element
  for (const key of Object.keys(metrics) as (keyof typeof metrics)[]) {
    Object.defineProperty(content, key, { configurable: true, get: () => metrics[key] })
  }
  return metrics
}
const clipboard = (writeText = vi.fn().mockResolvedValue(undefined)) => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  return writeText
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

describe('Typography expansion', () => {
  it.each([{ lines: Infinity }, { lines: Number.NaN }, { size: Infinity }, { size: Number.NaN }])('rejects non-finite typography dimensions: %j', props => {
    expect(() => mount(Typography, { props })).toThrow('must be finite')
  })

  it('normalizes line limits while retaining zero as an untruncated mode', async () => {
    const wrapper = track(mount(Typography, { props: { content: 'Text', lines: 2.8, size: '1.5rem' } }))
    expect(wrapper.element.style.getPropertyValue('--scq-typography-lines')).toBe('2')
    expect(wrapper.element.style.fontSize).toBe('1.5rem')
    await wrapper.setProps({ lines: -1 })
    expect(wrapper.classes()).not.toContain('is-clamped')
    expect(wrapper.element.style.getPropertyValue('--scq-typography-lines')).toBe('0')
  })
  it('allows one clipboard write at a time and ignores feedback for replaced content', async () => {
    let finish!: () => void
    const writeText = clipboard(vi.fn(() => new Promise<void>(resolve => { finish = resolve })))
    const wrapper = track(mount(Typography, { props: { content: 'Original', copyable: true } }))
    await wrapper.get('.scq-typography__copy').trigger('click')
    await wrapper.get('.scq-typography__copy').trigger('click')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(wrapper.get('.scq-typography__copy').attributes('aria-busy')).toBe('true')
    await wrapper.setProps({ content: 'Replacement' })
    finish()
    await settle()
    expect(wrapper.emitted('copy')).toBeUndefined()
    expect(wrapper.get('.scq-typography__copy').attributes('aria-label')).toBe('复制')
    writeText.mockResolvedValue(undefined)
    await wrapper.get('.scq-typography__copy').trigger('click')
    await settle()
    expect(wrapper.emitted('copy')).toEqual([['Replacement']])
  })

  it('clears copied feedback when nested slot text changes without expansion enabled', async () => {
    clipboard()
    const content = ref('Original')
    const Child = defineComponent({ setup: () => () => h('strong', content.value) })
    const wrapper = track(mount(Typography, { props: { copyable: true }, slots: { default: () => h(Child) } }))
    await wrapper.get('.scq-typography__copy').trigger('click')
    await settle()
    expect(wrapper.get('.scq-typography__copy').attributes('aria-label')).toBe('已复制')
    content.value = 'Replacement'
    await settle()
    expect(wrapper.get('.scq-typography__copy').attributes('aria-label')).toBe('复制')
    expect(wrapper.emitted('copy')).toEqual([['Original']])
  })

  it('does not revive feedback after copying is disabled and re-enabled while a write is pending', async () => {
    let finish!: () => void
    clipboard(vi.fn(() => new Promise<void>(resolve => { finish = resolve })))
    const wrapper = track(mount(Typography, { props: { content: 'Original', copyable: true } }))
    await wrapper.get('.scq-typography__copy').trigger('click')
    await wrapper.setProps({ copyable: false })
    await wrapper.setProps({ copyable: true })
    finish()
    await settle()
    expect(wrapper.emitted('copy')).toBeUndefined()
    expect(wrapper.get('.scq-typography__copy').attributes('aria-label')).toBe('复制')
  })

  it.each([false, true])('restores copy-button focus without stealing focus (moved=%s)', async (moved) => {
    let finish!: () => void
    clipboard(vi.fn(() => new Promise<void>(resolve => { finish = resolve })))
    const wrapper = track(mount(Typography, { attachTo: document.body, props: { content: 'Original', copyable: true } }))
    const button = wrapper.get<HTMLButtonElement>('.scq-typography__copy')
    const outside = document.createElement('button')
    document.body.append(outside)
    try {
      button.element.focus()
      await button.trigger('click')
      button.element.blur()
      if (moved) outside.focus()
      finish()
      await settle()
      expect(document.activeElement).toBe(moved ? outside : button.element)
    } finally {
      outside.remove()
    }
  })
  it('preserves the default structure, truncation classes and copy content without opting in', async () => {
    const writeText = clipboard()
    const wrapper = track(mount(Typography, { props: { content: 'Full content', ellipsis: true, lines: 2, copyable: true, expanded: true } }))
    contentMetrics(wrapper)
    await resize()
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-ellipsis', 'is-clamped']))
    expect(wrapper.find('.scq-typography__toggle').exists()).toBe(false)
    expect(wrapper.get('.scq-typography__content').attributes('title')).toBeUndefined()
    expect(wrapper.get('.scq-typography__content').attributes('id')).toBeUndefined()
    await wrapper.get('.scq-typography__copy').trigger('click')
    await settle()
    expect(writeText).toHaveBeenCalledWith('Full content')
  })

  it.each([false, true])('measures %s vertical overflow, expands and retains a collapse control', async (vertical) => {
    const wrapper = track(mount(Typography, { props: { content: 'Full content', expandable: true, ellipsis: !vertical, lines: vertical ? 2 : 0 } }))
    const metrics = contentMetrics(wrapper, vertical)
    await resize()
    const content = wrapper.get('.scq-typography__content')
    const toggle = wrapper.get('.scq-typography__toggle')
    expect(toggle.attributes('type')).toBe('button')
    expect(toggle.attributes('aria-controls')).toBe(content.attributes('id'))
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(content.attributes('title')).toBe('Full content')
    await toggle.trigger('click')
    expect(wrapper.classes()).toContain('is-expanded')
    expect(wrapper.classes()).not.toContain('is-clamped')
    expect(wrapper.classes()).not.toContain('is-ellipsis')
    expect(content.attributes('title')).toBeUndefined()
    metrics.scrollWidth = metrics.clientWidth
    metrics.scrollHeight = metrics.clientHeight
    await resize()
    expect(toggle.text()).toBe('收起')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    await toggle.trigger('click')
    await settle()
    expect(wrapper.find('.scq-typography__toggle').exists()).toBe(false)
    expect(wrapper.emitted('update:expanded')).toEqual([[true], [false]])
    expect(wrapper.emitted('expand-change')).toEqual([[true], [false]])
  })

  it('does not show controls or full-text hints for fitting, hidden or untruncated content', async () => {
    const wrapper = track(mount(Typography, { props: { content: 'Short', expandable: true, ellipsis: true } }))
    const metrics = contentMetrics(wrapper)
    metrics.scrollWidth = metrics.clientWidth
    await resize()
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('.scq-typography__content').attributes('title')).toBeUndefined()
    metrics.clientWidth = 0
    metrics.clientHeight = 0
    await resize()
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ ellipsis: false })
    metrics.clientWidth = 10
    metrics.clientHeight = 20
    await resize()
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('keeps controlled values authoritative, then retains the newest external state when released', async () => {
    const wrapper = track(mount(Typography, { props: { expandable: true, ellipsis: true, content: 'Full content', expanded: false, defaultExpanded: true } }))
    contentMetrics(wrapper)
    await resize()
    await wrapper.get('.scq-typography__toggle').trigger('click')
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
    expect(wrapper.classes()).not.toContain('is-expanded')
    await wrapper.setProps({ expanded: true })
    await wrapper.get('.scq-typography__toggle').trigger('click')
    expect(wrapper.classes()).toContain('is-expanded')
    await wrapper.setProps({ expanded: false })
    await wrapper.setProps({ expanded: undefined })
    expect(wrapper.classes()).not.toContain('is-expanded')
    await wrapper.get('.scq-typography__toggle').trigger('click')
    expect(wrapper.classes()).toContain('is-expanded')
    await wrapper.setProps({ expanded: false })
    expect(wrapper.classes()).not.toContain('is-expanded')
    await wrapper.setProps({ expanded: true })
    await wrapper.setProps({ expanded: undefined })
    expect(wrapper.classes()).toContain('is-expanded')
  })

  it('honors defaultExpanded only initially and allows collapse even for short text', async () => {
    const wrapper = track(mount(Typography, { props: { content: 'Short', expandable: true, lines: 2, defaultExpanded: true } }))
    expect(wrapper.get('button').text()).toBe('收起')
    await wrapper.get('button').trigger('click')
    await settle()
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ defaultExpanded: false })
    await wrapper.setProps({ defaultExpanded: true })
    expect(wrapper.classes()).not.toContain('is-expanded')
  })

  it('remeasures reactive content props and independently updated slot children', async () => {
    const wrapper = track(mount(Typography, { props: { content: 'Long content', expandable: true, ellipsis: true } }))
    const metrics = contentMetrics(wrapper)
    await resize()
    expect(wrapper.get('.scq-typography__content').attributes('title')).toBe('Long content')
    metrics.scrollWidth = metrics.clientWidth
    await wrapper.setProps({ content: 'Short' })
    await settle()
    expect(wrapper.find('button').exists()).toBe(false)

    const slotText = ref('Long slot content')
    const Child = defineComponent({ setup: () => () => h('strong', slotText.value) })
    const slotted = track(mount(Typography, { props: { expandable: true, lines: 2 }, slots: { default: () => h(Child) } }))
    const slotMetrics = contentMetrics(slotted, true)
    await resize()
    expect(slotted.get('.scq-typography__content').attributes('title')).toBe('Long slot content')
    slotText.value = 'Updated full slot content'
    await settle()
    expect(slotted.get('.scq-typography__content').attributes('title')).toBe('Updated full slot content')
    slotMetrics.scrollHeight = slotMetrics.clientHeight
    slotText.value = 'Short'
    await settle()
    expect(slotted.find('button').exists()).toBe(false)
    expect(slotted.get('.scq-typography__content').attributes('title')).toBeUndefined()
  })

  it('observes layout replacements and disconnects all measurement work when disabled or unmounted', async () => {
    class ResizeObserverMock {
      static instances: ResizeObserverMock[] = []
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(public callback: ResizeObserverCallback) { ResizeObserverMock.instances.push(this) }
    }
    let frameId = 0
    const frames = new Map<number, FrameRequestCallback>()
    const requestFrame = vi.fn((callback: FrameRequestCallback) => { frameId += 1; frames.set(frameId, callback); return frameId })
    const cancelFrame = vi.fn((id: number) => { frames.delete(id) })
    const flushFrames = async () => {
      const callbacks = [...frames.values()]
      frames.clear()
      callbacks.forEach((callback) => callback(performance.now()))
      await settle()
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)
    const mutationDisconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const wrapper = track(mount(Typography, { props: { content: 'Content', expandable: true, ellipsis: true } }))
    const metrics = contentMetrics(wrapper)
    const observer = ResizeObserverMock.instances[0]
    expect(observer.observe).toHaveBeenCalledWith(wrapper.element)
    expect(observer.observe).toHaveBeenCalledWith(wrapper.get('.scq-typography__content').element)
    observer.callback([], observer as unknown as ResizeObserver)
    await flushFrames()
    expect(wrapper.find('button').exists()).toBe(true)
    metrics.scrollWidth = metrics.clientWidth
    observer.callback([], observer as unknown as ResizeObserver)
    observer.callback([], observer as unknown as ResizeObserver)
    expect(requestFrame).toHaveBeenCalledTimes(2)
    await flushFrames()
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ as: 'p' })
    expect(observer.disconnect).toHaveBeenCalledOnce()
    const replacement = ResizeObserverMock.instances[1]
    expect(replacement.observe).toHaveBeenCalledWith(wrapper.element)
    await wrapper.setProps({ expandable: false })
    expect(replacement.disconnect).toHaveBeenCalledOnce()
    await wrapper.setProps({ expandable: true })
    const current = ResizeObserverMock.instances[2]
    current.callback([], current as unknown as ResizeObserver)
    wrapper.unmount()
    expect(current.disconnect).toHaveBeenCalledOnce()
    expect(mutationDisconnect).toHaveBeenCalledTimes(3)
    expect(cancelFrame).toHaveBeenCalledWith(frameId)
    expect(frames.size).toBe(0)
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function))
    current.callback([], current as unknown as ResizeObserver)
    await settle()
    expect(wrapper.emitted('update:expanded')).toBeUndefined()
  })

  it('preserves full slot copying and explicit empty copyText while cleaning feedback timers', async () => {
    vi.useFakeTimers()
    const writeText = clipboard()
    const wrapper = track(mount(Typography, { props: { expandable: true, ellipsis: true, copyable: true }, slots: { default: '<strong>Exact</strong> full text' } }))
    contentMetrics(wrapper)
    await nextTick()
    await nextTick()
    await wrapper.get('.scq-typography__copy').trigger('click')
    await nextTick()
    expect(writeText).toHaveBeenLastCalledWith('Exact full text')
    expect(wrapper.get('.scq-typography__copy').attributes('aria-label')).toBe('已复制')
    await wrapper.get('.scq-typography__toggle').trigger('click')
    await wrapper.get('.scq-typography__copy').trigger('click')
    expect(writeText).toHaveBeenLastCalledWith('Exact full text')
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(TYPOGRAPHY_COPY_FEEDBACK_MS)
    expect(wrapper.get('.scq-typography__copy').attributes('aria-label')).toBe('复制')
    await wrapper.setProps({ copyText: '' })
    await wrapper.get('.scq-typography__copy').trigger('click')
    expect(writeText).toHaveBeenLastCalledWith('')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves copy errors and ignores late clipboard completion after unmount', async () => {
    Reflect.deleteProperty(navigator, 'clipboard')
    const onCopy = vi.fn()
    const onCopyError = vi.fn()
    const wrapper = track(mount(Typography, { props: { copyable: true, content: 'Content', onCopy, onCopyError } }))
    await wrapper.get('button').trigger('click')
    expect(onCopyError).toHaveBeenCalledWith(expect.any(Error))
    let finish!: () => void
    const writeText = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    clipboard(writeText)
    await wrapper.get('button').trigger('click')
    wrapper.unmount()
    finish()
    await settle()
    expect(onCopy).not.toHaveBeenCalled()
    expect(onCopyError).toHaveBeenCalledOnce()
  })

  it('inherits live locale labels and keeps content IDs distinct within an app', async () => {
    const wrapper = track(mount(ConfigProvider, {
      props: { locale: 'en-US' },
      slots: { default: () => [h(Typography, { expandable: true, defaultExpanded: true, copyable: true, content: 'One' }), h(Typography, { expandable: true, defaultExpanded: true, content: 'Two' })] },
    }))
    const items = wrapper.findAllComponents(Typography)
    const ids = items.map((item) => item.get('.scq-typography__content').attributes('id'))
    expect(new Set(ids).size).toBe(items.length)
    expect(items[0].get('.scq-typography__toggle').text()).toBe('Collapse')
    expect(items[0].get('.scq-typography__copy').attributes('aria-label')).toBe('Copy')
    await wrapper.setProps({ locale: 'zh-CN' })
    expect(items[0].get('.scq-typography__toggle').text()).toBe('收起')
    expect(items[0].get('.scq-typography__copy').attributes('aria-label')).toBe('复制')
  })
})

describe('Skeleton presets', () => {
  it.each(['constructor', 'unknown'])('reports an unsupported preset instead of silently rendering another layout: %s', preset => {
    expect(() => mount(Skeleton, { attrs: { preset } })).toThrow('Unknown Skeleton preset')
  })

  it.each([false, true])('keeps placeholder attributes scoped without warnings after revealing slot content (multiple=%s)', async multiple => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = track(mount(Skeleton, {
      attrs: { id: 'placeholder', class: 'placeholder-style' },
      slots: { default: () => multiple ? [h('button', 'Ready'), h('span', 'Extra')] : [h('button', 'Ready')] },
    }))
    expect(wrapper.attributes('id')).toBe('placeholder')
    expect(wrapper.classes()).toContain('placeholder-style')
    await wrapper.setProps({ loading: false })
    expect(wrapper.get('button').attributes('id')).toBeUndefined()
    expect(warn).not.toHaveBeenCalled()
  })

  it('removes obsolete preset shapes and row widths when returning to the default mode', async () => {
    const wrapper = track(mount(Skeleton, { props: { preset: 'card' } }))
    expect(wrapper.find('.scq-skeleton__image').exists()).toBe(true)
    await wrapper.setProps({ preset: undefined })
    expect(wrapper.find('.scq-skeleton__image').exists()).toBe(false)
    expect(wrapper.find('.scq-skeleton__title').exists()).toBe(false)
    expect(wrapper.find('.scq-skeleton__button').exists()).toBe(false)
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(SKELETON_DEFAULT_ROWS)
    expect(wrapper.findAll('.scq-skeleton__row').every(row => (row.element as HTMLElement).style.width === '')).toBe(true)
  })
  it('preserves no-preset rows, avatar default, animation and accessible loading state', () => {
    const wrapper = track(mount(Skeleton))
    expect(wrapper.classes()).toEqual(['scq-skeleton', 'is-animated'])
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(SKELETON_DEFAULT_ROWS)
    expect(wrapper.element.children).toHaveLength(1)
    expect(wrapper.get('.scq-skeleton__lines').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.scq-skeleton__row').every((row) => row.attributes('style') === undefined)).toBe(true)
    expect(wrapper.find('.scq-skeleton__avatar').exists()).toBe(false)
  })

  it.each([
    ['article', SKELETON_DEFAULT_ROWS, false, false, false],
    ['card', 2, false, true, true],
    ['list-item', 2, true, false, false],
  ] as const)('renders the %s composition', (preset, rows, avatar, image, button) => {
    const wrapper = track(mount(Skeleton, { props: { preset } }))
    expect(wrapper.classes()).toContain(`scq-skeleton--${preset}`)
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(rows)
    expect(wrapper.find('.scq-skeleton__title').exists()).toBe(true)
    expect(wrapper.find('.scq-skeleton__avatar').exists()).toBe(avatar)
    expect(wrapper.find('.scq-skeleton__image').exists()).toBe(image)
    expect(wrapper.find('.scq-skeleton__button').exists()).toBe(button)
    expect(wrapper.findAll('.scq-skeleton__row').every((row) => Boolean(row.attributes('style')))).toBe(true)
  })

  it('never overrides explicit false, zero or empty-array props when presets change', async () => {
    const wrapper = track(mount(Skeleton, { props: { preset: 'card', rows: 0, avatar: true, title: false, image: false, button: false, animated: false, rowWidths: [] } }))
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(0)
    expect(wrapper.find('.scq-skeleton__avatar').exists()).toBe(true)
    expect(wrapper.find('.scq-skeleton__title').exists()).toBe(false)
    expect(wrapper.find('.scq-skeleton__image').exists()).toBe(false)
    expect(wrapper.find('.scq-skeleton__button').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('is-animated')
    await wrapper.setProps({ preset: 'list-item', rows: 1, avatar: false })
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(1)
    expect(wrapper.get('.scq-skeleton__row').attributes('style')).toBeUndefined()
    expect(wrapper.find('.scq-skeleton__avatar').exists()).toBe(false)
    expect(wrapper.find('.scq-skeleton__title').exists()).toBe(false)
    await wrapper.setProps({ rows: undefined, avatar: undefined })
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(2)
    expect(wrapper.find('.scq-skeleton__avatar').exists()).toBe(true)
  })

  it('uses pixel or CSS row widths and ignores invalid numeric widths without changing row count', async () => {
    const wrapper = track(mount(Skeleton, { props: { rows: 5, rowWidths: [120, '75%', 0, -1, NaN] } }))
    const rows = wrapper.findAll('.scq-skeleton__row')
    expect(rows.map((row) => (row.element as HTMLElement).style.width)).toEqual(['120px', '75%', '0px', '', ''])
    await wrapper.setProps({ rowWidths: [] })
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(5)
    expect(rows.every((row) => (row.element as HTMLElement).style.width === '')).toBe(true)
  })

  it.each([[NaN, SKELETON_DEFAULT_ROWS], [Infinity, SKELETON_DEFAULT_ROWS], [-2, 0], [1000, SKELETON_MAX_ROWS], [2.9, 2]])('retains row normalization for %s', (rows, expected) => {
    const wrapper = track(mount(Skeleton, { props: { rows } }))
    expect(wrapper.findAll('.scq-skeleton__row')).toHaveLength(expected)
  })

  it('preserves template/default slots and live loading locale with presets', async () => {
    const loading = ref(true)
    const wrapper = track(mount(ConfigProvider, {
      props: { locale: 'en-US' },
      slots: { default: () => h(Skeleton, { preset: 'card', loading: loading.value }, { template: () => h('div', { class: 'custom-placeholder' }, 'Custom'), default: () => h('button', 'Ready') }) },
    }))
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe('Loading')
    expect(wrapper.find('.custom-placeholder').exists()).toBe(true)
    expect(wrapper.find('.scq-skeleton__image').exists()).toBe(false)
    await wrapper.setProps({ locale: 'zh-CN' })
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe('加载中')
    loading.value = false
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('button').text()).toBe('Ready')
  })

  it('disables animation for every preset shape under reduced-motion preferences', () => {
    const reducedMotion = skeletonStyles.slice(skeletonStyles.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reducedMotion).toContain('animation: none')
    for (const shape of ['row', 'avatar', 'title', 'image', 'button']) expect(reducedMotion).toContain(`.scq-skeleton__${shape}`)
  })
})

describe('Icon semantics', () => {
  it('keeps default icons decorative even when labels or conflicting native roles are supplied', () => {
    const wrapper = track(mount(Icon, { props: { name: 'check', ariaLabel: 'Done', title: 'Completed' }, attrs: { role: 'img', 'aria-hidden': 'false', 'aria-labelledby': 'external-label' } }))
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('svg').attributes('role')).toBeUndefined()
    expect(wrapper.get('svg').attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('svg').attributes('focusable')).toBe('false')
    expect(wrapper.emitted('accessibility-error')).toBeUndefined()
  })

  it('places an explicit accessible label on the semantic SVG and preserves wrapper attributes', async () => {
    const onClick = vi.fn()
    const state = ref('ready')
    const host = track(mount(defineComponent({
      setup: () => () => h(Icon, { name: 'check', decorative: false, ariaLabel: ' Completed ', id: 'result-icon', class: 'custom-icon', size: 32, color: 'blue', style: { '--scq-icon-size': '2em', color: 'red' }, 'data-state': state.value, onClick }),
    })))
    const wrapper = host.getComponent(Icon)
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.attributes('id')).toBe('result-icon')
    expect(wrapper.classes()).toContain('custom-icon')
    expect((wrapper.element as HTMLElement).style.color).toBe('red')
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--scq-icon-size')).toBe('2em')
    expect(wrapper.get('svg').attributes('role')).toBe('img')
    expect(wrapper.get('svg').attributes('aria-label')).toBe('Completed')
    expect(wrapper.get('svg').attributes('aria-hidden')).toBeUndefined()
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
    state.value = 'updated'
    await nextTick()
    expect(wrapper.attributes('data-state')).toBe('updated')
  })

  it('associates unique SVG titles and gives an explicit label precedence over title text', async () => {
    const title = ref('Wechat notifications enabled')
    const wrapper = track(mount(defineComponent({
      setup: () => () => h('div', [h(Icon, { name: 'wechat', decorative: false, title: title.value }), h(Icon, { name: 'check', decorative: false, title: 'Completed', ariaLabel: 'Done' })]),
    })))
    const icons = wrapper.findAllComponents(Icon)
    const titleIds = icons.map((icon) => icon.get('title').attributes('id'))
    expect(new Set(titleIds).size).toBe(icons.length)
    expect(icons[0].get('svg').attributes('aria-labelledby')).toBe(titleIds[0])
    expect(icons[0].get('svg').attributes('aria-label')).toBeUndefined()
    expect(icons[1].get('svg').attributes('aria-labelledby')).toBeUndefined()
    expect(icons[1].get('svg').attributes('aria-label')).toBe('Done')
    title.value = 'Wechat notifications disabled'
    await nextTick()
    expect(icons[0].get('title').text()).toBe(title.value)
    expect(icons[0].get('title').attributes('id')).toBe(titleIds[0])
  })

  it('reports invalid unnamed semantic usage once per invalid transition and stays hidden', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = track(mount(Icon, { props: { name: 'check', decorative: false, ariaLabel: ' ', title: '\n' } }))
    expect(wrapper.emitted('accessibility-error')?.[0][0]).toBeInstanceOf(Error)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('non-empty ariaLabel or title')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('svg').attributes('role')).toBeUndefined()
    expect(wrapper.find('title').exists()).toBe(false)
    await wrapper.setProps({ name: 'copy' })
    expect(warn).toHaveBeenCalledOnce()
    await wrapper.setProps({ ariaLabel: 'Copy' })
    expect(wrapper.get('svg').attributes('role')).toBe('img')
    await wrapper.setProps({ ariaLabel: '' })
    expect(warn).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('accessibility-error')).toHaveLength(2)
    await wrapper.setProps({ decorative: true })
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('allows applications to handle accessibility errors instead of duplicate console warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onAccessibilityError = vi.fn()
    const wrapper = track(mount(Icon, { props: { name: 'check', decorative: false, onAccessibilityError } }))
    expect(onAccessibilityError).toHaveBeenCalledWith(expect.any(Error))
    expect(warn).not.toHaveBeenCalled()
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
  })
})

describe('Experience composition examples', () => {
  it('demonstrates external typography state and runtime content replacement', async () => {
    const wrapper = track(mount(TypographyExpandExample))
    const controls = wrapper.findAll('input[type="checkbox"]')
    await controls[0].setValue(true)
    expect(wrapper.findAllComponents(Typography)[0].classes()).toContain('is-expanded')
    await controls[1].setValue(true)
    expect(wrapper.findAllComponents(Typography)[0].get('.scq-typography__content').text()).toBe('评审已经通过。')
    await wrapper.get('.scq-typography__toggle').trigger('click')
    expect((controls[0].element as HTMLInputElement).checked).toBe(false)
  })

  it('switches both skeleton compositions to their resolved content', async () => {
    const wrapper = track(mount(SkeletonPresetExample))
    expect(wrapper.findAll('[role="status"]')).toHaveLength(2)
    expect(wrapper.find('.scq-skeleton__image').exists()).toBe(true)
    expect(wrapper.find('.scq-skeleton__avatar').exists()).toBe(false)
    await wrapper.get('input').setValue(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('组件体验更新')
    expect(wrapper.text()).toContain('交付评审已通过')
  })

  it('keeps button icons decorative and standalone status icons named', async () => {
    const wrapper = track(mount(IconSemanticExample))
    expect(wrapper.findAll('svg[role="img"]')).toHaveLength(2)
    const buttons = wrapper.findAll('button')
    expect(buttons[1].attributes('aria-label')).toBe('刷新任务列表')
    expect(buttons.every((button) => button.get('.scq-icon').attributes('aria-hidden') === 'true')).toBe(true)
    await buttons[1].trigger('click')
    expect(wrapper.get('[role="status"]').text()).toBe('已刷新 1 次')
  })
})
