// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Comment, h, nextTick, ref, shallowRef, Teleport, unref } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import List from '../src/components/List/List.vue'
import Picker from '../src/components/Picker/Picker.vue'
import PullRefresh from '../src/components/PullRefresh/PullRefresh.vue'
import Swipe from '../src/components/Swipe/Swipe.vue'
import SwipeCell from '../src/components/SwipeCell/SwipeCell.vue'
import Calendar from '../src/components/Calendar/Calendar.vue'
import ActionBar from '../src/components/ActionBar/ActionBar.vue'
import CellGroup from '../src/components/Cell/CellGroup.vue'
import Form from '../src/components/Form/Form.vue'
import SwipeExample from '../playground/src/components/examples/SwipeExample.vue'
import { parseDate } from '../src/utils/date'
import { MAX_TIMEOUT_DELAY } from '../src/utils/async'
import { COMPOSITION_KEY_CODE } from '../src/utils/composition'

vi.mock('embla-carousel-vue', () => ({ default: vi.fn() }))

const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('CellGroup content', () => {
  it('omits empty slot headings and descriptions while tracking meaningful dynamic content', async () => {
    const visible = ref(false)
    const wrapper = mount({
      setup: () => () => h(CellGroup, {}, {
        title: () => visible.value ? h('span', 'Settings') : h(Comment),
        description: () => visible.value ? 'Shared help' : '\n ',
        footer: () => visible.value ? 0 : null,
        default: () => h('input'),
      }),
    })
    wrappers.push(wrapper)
    const group = wrapper.getComponent(CellGroup)
    expect(group.find('h3').exists()).toBe(false)
    expect(group.attributes('aria-labelledby')).toBeUndefined()
    expect(group.attributes('aria-describedby')).toBeUndefined()
    visible.value = true
    await nextTick()
    expect(group.attributes('aria-labelledby')).toBe(group.get('h3').attributes('id'))
    expect(group.get('footer').text()).toBe('0')
    expect(group.attributes('aria-describedby')?.split(' ')).toEqual([group.get('p').attributes('id'), group.get('footer').attributes('id')])
    expect(group.get('input').attributes('aria-describedby')).toBeUndefined()
    visible.value = false
    await nextTick()
    expect(group.find('h3').exists()).toBe(false)
    expect(group.find('footer').exists()).toBe(false)
    expect(group.attributes('aria-describedby')).toBeUndefined()
  })

  it('falls back to prop text for blank slots while preserving explicit accessible names', () => {
    const wrapper = mount(CellGroup, {
      props: { title: 'Title', description: 'Help', footer: 'Footer' },
      attrs: { 'aria-label': 'Account', 'aria-describedby': 'external' },
      slots: { title: () => ' ', description: () => h(Comment), footer: () => null },
    })
    wrappers.push(wrapper)
    expect(wrapper.get('h3').text()).toBe('Title')
    expect(wrapper.get('p').text()).toBe('Help')
    expect(wrapper.get('footer').text()).toBe('Footer')
    expect(wrapper.attributes('aria-label')).toBe('Account')
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    expect(wrapper.attributes('aria-describedby')?.split(' ')[0]).toBe('external')
  })
})

describe('List', () => {
  it.each([Infinity, Number.NaN])('rejects non-finite loading offsets: %s', offset => {
    expect(() => mount(List, { props: { offset } })).toThrow('offset must be finite')
  })

  it('checks the exact scroll-parent threshold and rebinds when moved to another container', async () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    first.style.overflowY = second.style.overflowY = 'auto'
    document.body.append(first, second)
    const offset = 20
    const firstBottom = 200
    let secondBottom = 100
    let top = firstBottom + offset + 1
    vi.spyOn(first, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, 100, firstBottom))
    vi.spyOn(second, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, 100, secondBottom))
    const removeListener = vi.spyOn(first, 'removeEventListener')
    const wrapper = mount(List, { attachTo: first, props: { immediateCheck: false, offset } })
    wrappers.push(wrapper)
    vi.spyOn(wrapper.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, top, 100, 1))
    try {
      wrapper.vm.check()
      expect(wrapper.emitted('load')).toBeUndefined()
      top -= 1
      first.dispatchEvent(new Event('scroll'))
      expect(wrapper.emitted('load')).toHaveLength(1)
      await nextTick()
      second.append(wrapper.element)
      wrapper.vm.check()
      expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
      secondBottom = firstBottom
      first.dispatchEvent(new Event('scroll'))
      expect(wrapper.emitted('load')).toHaveLength(1)
      second.dispatchEvent(new Event('scroll'))
      expect(wrapper.emitted('load')).toHaveLength(2)
    } finally {
      wrapper.unmount()
      wrappers.pop()
      first.remove()
      second.remove()
    }
  })

  it('deduplicates retry requests and restores keyboard focus to a recreated retry control', async () => {
    const error = ref(true)
    const loading = ref(false)
    const updateError = vi.fn((value: boolean) => { error.value = value })
    const load = vi.fn()
    const wrapper = mount({
      setup: () => () => h(List, { error: error.value, loading: loading.value, immediateCheck: false,
        'onUpdate:error': updateError, 'onUpdate:loading': (value: boolean) => { loading.value = value }, onLoad: load }),
    }, { attachTo: document.body })
    wrappers.push(wrapper)
    const retry = wrapper.get<HTMLButtonElement>('button').element
    retry.focus()
    retry.click()
    retry.click()
    await flushPromises()
    expect(updateError).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledTimes(1)
    expect(wrapper.attributes('aria-busy')).toBe('true')
    error.value = true
    loading.value = false
    await flushPromises()
    expect(wrapper.get('button').element).not.toBe(retry)
    expect(document.activeElement).toBe(wrapper.get('button').element)
  })

  it('focuses the completed status after a keyboard load without stealing moved focus', async () => {
    const loading = ref(false)
    const finished = ref(false)
    const wrapper = mount({ setup: () => () => h(List, { loading: loading.value, finished: finished.value, immediateCheck: false,
      'onUpdate:loading': (value: boolean) => { loading.value = value } }) }, { attachTo: document.body })
    wrappers.push(wrapper)
    const outside = document.createElement('button')
    document.body.append(outside)
    try {
      const button = wrapper.get<HTMLButtonElement>('button').element
      button.focus()
      button.click()
      await nextTick()
      finished.value = true
      loading.value = false
      await flushPromises()
      expect(document.activeElement).toBe(wrapper.get('[role="status"]').element)
      finished.value = false
      await flushPromises()
      const next = wrapper.get<HTMLButtonElement>('button').element
      next.focus()
      next.click()
      await nextTick()
      outside.focus()
      loading.value = false
      await flushPromises()
      expect(document.activeElement).toBe(outside)
    } finally { outside.remove() }
  })

  it('does not start a load when the loading update disposes its owner', async () => {
    const load = vi.fn()
    let wrapper: VueWrapper
    wrapper = mount(List, { props: { immediateCheck: false, 'onUpdate:loading': () => wrapper.unmount(), onLoad: load } })
    await wrapper.get('button').trigger('click')
    expect(load).not.toHaveBeenCalled()
  })

  it('rechecks when its finite offset changes', async () => {
    const wrapper = mount(List, { props: { offset: 10, immediateCheck: false } })
    wrappers.push(wrapper)
    vi.spyOn(wrapper.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, window.innerHeight + 20, 100, 1))
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toBeUndefined()
    await wrapper.setProps({ offset: 20 })
    await nextTick()
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('associates group descriptions and footer without overwriting external descriptions', async () => {
    const wrapper = mount(CellGroup, { props: { description: 'Group help', footer: 'Footer help' }, attrs: { 'aria-describedby': 'external' }, slots: { title: 'Settings', default: '<input />' } })
    wrappers.push(wrapper)
    const description = wrapper.get('.scq-cell-group__description').attributes('id')
    const footer = wrapper.get('footer').attributes('id')
    expect(wrapper.attributes('aria-describedby')).toBe(`external ${description} ${footer}`)
    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.get('h3').attributes('id'))
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
    await wrapper.setProps({ description: '', footer: '' })
    expect(wrapper.attributes('aria-describedby')).toBe('external')
  })
  it('allows another load after a synchronous cached response', async () => {
    const loading = ref(false)
    const load = vi.fn(() => { loading.value = false })
    const wrapper = mount({ setup: () => () => h(List, { loading: loading.value, immediateCheck: false, 'onUpdate:loading': (value: boolean) => { loading.value = value }, onLoad: load }) })
    wrappers.push(wrapper)
    const list = wrapper.getComponent(List)
    vi.spyOn(list.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockReturnValue({ top: 100, width: 300, height: 1 } as DOMRect)
    list.vm.check()
    await nextTick()
    list.vm.check()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('loads once until the controlled loading cycle finishes', async () => {
    const wrapper = mount(List, { props: { immediateCheck: false } })
    wrappers.push(wrapper)
    vi.spyOn(wrapper.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockReturnValue({ top: 100, width: 300, height: 1 } as DOMRect)
    wrapper.vm.check()
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toHaveLength(1)
    expect(wrapper.emitted('update:loading')).toEqual([[true]])
    await wrapper.setProps({ loading: true })
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toHaveLength(1)
    await wrapper.setProps({ loading: false })
    await nextTick()
    expect(wrapper.emitted('load')).toHaveLength(2)
  })

  it('blocks loading for finished, error and disabled states', async () => {
    const wrapper = mount(List, { props: { finished: true, immediateCheck: false } })
    wrappers.push(wrapper)
    vi.spyOn(wrapper.get('.scq-list__sentinel').element, 'getBoundingClientRect').mockReturnValue({ top: 100, width: 300, height: 1 } as DOMRect)
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toBeUndefined()
    await wrapper.setProps({ finished: false, error: true })
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toBeUndefined()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:error')).toEqual([[false]])
    await wrapper.setProps({ error: false, disabled: true })
    wrapper.vm.check()
    expect(wrapper.emitted('load')).toBeUndefined()
  })
})

describe('Picker', () => {
  it('skips disabled options and resets invalid cascading descendants', async () => {
    const wrapper = mount(Picker, { props: { modelValue: ['a', 'a1'], columns: [
      { label: 'A', value: 'a', children: [{ label: 'A1', value: 'a1' }] },
      { label: 'Disabled', value: 'disabled', disabled: true },
      { label: 'B', value: 'b', children: [{ label: 'B1', value: 'b1' }] },
    ] } })
    wrappers.push(wrapper)
    await wrapper.findAll('[role="listbox"]')[0].trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['b', 'b1']])
    await wrapper.setProps({ modelValue: ['b', 'b1'] })
    await wrapper.get('.scq-picker__confirm').trigger('click')
    expect(wrapper.emitted('confirm')?.[0][0]).toMatchObject({ values: ['b', 'b1'] })
  })

  it('supports independent columns and prevents empty confirmation', async () => {
    const wrapper = mount(Picker, { props: { columns: [[{ label: 'One', value: 1 }], [{ label: 'Two', value: 2 }]] } })
    wrappers.push(wrapper)
    expect(wrapper.vm.getSelected().values).toEqual([1, 2])
    await wrapper.setProps({ columns: [[]] })
    wrapper.vm.confirm()
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })
})

describe('PullRefresh', () => {
  it('refreshes only after a downward pull crosses the threshold', async () => {
    const wrapper = mount(PullRefresh, { props: { pullDistance: 60 } })
    wrappers.push(wrapper)
    await wrapper.trigger('touchstart', { touches: [{ clientX: 30, clientY: 10 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 30, clientY: 80 }] })
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.trigger('touchstart', { touches: [{ clientX: 30, clientY: 10 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 30, clientY: 150 }] })
    await wrapper.trigger('touchend')
    wrapper.vm.refresh()
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.get('.scq-pull-refresh__track').attributes('style')).toContain('translateY(0px)')
  })

  it('does not intercept horizontal, cancelled or disabled gestures', async () => {
    const wrapper = mount(PullRefresh)
    wrappers.push(wrapper)
    await wrapper.trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 200, clientY: 160 }] })
    await wrapper.trigger('touchend')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    await wrapper.setProps({ disabled: true })
    wrapper.vm.refresh()
    expect(wrapper.emitted('refresh')).toBeUndefined()
  })
})

describe('Swipe', () => {
  type SwipeApi = NonNullable<ReturnType<typeof emblaCarouselVue>[1]['value']>
  const items = [{ title: 'First' }, { title: 'Second' }, { title: 'Third' }]
  it('reacts to pauseOnHover changes while the pointer remains inside', async () => {
    vi.useFakeTimers()
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const api = shallowRef<SwipeApi>()
    const engine = { scrollTo: vi.fn(), scrollNext: vi.fn(), selectedScrollSnap: () => 0, canScrollNext: () => true, on: vi.fn().mockReturnThis(), off: vi.fn().mockReturnThis() }
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), api])
    try {
      const wrapper = mount(Swipe, { props: { items, autoplay: 500 } })
      wrappers.push(wrapper)
      api.value = engine as unknown as SwipeApi
      await nextTick()
      await wrapper.trigger('mouseenter')
      expect(wrapper.vm.paused).toBe(true)
      await wrapper.setProps({ pauseOnHover: false })
      expect(wrapper.vm.paused).toBe(false)
      await vi.advanceTimersByTimeAsync(500)
      expect(engine.scrollNext).toHaveBeenCalledTimes(1)
      await wrapper.setProps({ pauseOnHover: true })
      expect(wrapper.vm.paused).toBe(true)
      await vi.advanceTimersByTimeAsync(500)
      expect(engine.scrollNext).toHaveBeenCalledTimes(1)
    } finally { hidden.mockRestore(); vi.useRealTimers() }
  })

  it('moves focus from newly inactive content after selection or keyed reordering', async () => {
    const api = shallowRef<SwipeApi>()
    let selected = 0
    const handlers = new Map<string, () => void>()
    const engine = { scrollTo: vi.fn(), selectedScrollSnap: () => selected,
      on: (name: string, callback: () => void) => { handlers.set(name, callback); return engine }, off: () => engine }
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), api])
    const slides = [{ key: 'first', title: 'First' }, { key: 'second', title: 'Second' }, { key: 'third', title: 'Third' }] as const
    const wrapper = mount(Swipe, { attachTo: document.body, props: { items: slides }, slots: { default: ({ item }) => h('input', { value: item.title }) } })
    wrappers.push(wrapper)
    api.value = engine as unknown as SwipeApi
    await nextTick()
    wrapper.findAll<HTMLInputElement>('input')[0].element.focus()
    selected = 1
    handlers.get('select')!()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('.scq-swipe__viewport').element)
    wrapper.findAll<HTMLInputElement>('input')[1].element.focus()
    await wrapper.setProps({ items: [slides[1], slides[0], slides[2]] })
    expect(document.activeElement).toBe(wrapper.get('.scq-swipe__viewport').element)
    expect(wrapper.get<HTMLInputElement>('.scq-swipe__slide[aria-hidden="false"] input').element.value).toBe('First')
  })

  it('preserves modified, composing and cancelled viewport shortcuts', async () => {
    const api = shallowRef<SwipeApi>()
    const engine = { scrollTo: vi.fn(), scrollNext: vi.fn(), selectedScrollSnap: () => 0, on: vi.fn().mockReturnThis(), off: vi.fn().mockReturnThis() }
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), api])
    const wrapper = mount(Swipe, { props: { items } })
    wrappers.push(wrapper)
    api.value = engine as unknown as SwipeApi
    await nextTick()
    const viewport = wrapper.get('.scq-swipe__viewport')
    for (const flags of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: COMPOSITION_KEY_CODE }]) {
      await viewport.trigger('keydown', { key: 'ArrowRight', ...flags })
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    event.preventDefault()
    viewport.element.dispatchEvent(event)
    expect(engine.scrollNext).not.toHaveBeenCalled()
  })

  it.each([{ height: Infinity }, { gap: Number.NaN }, { autoplay: Number.NaN }, { autoplay: Infinity }, { autoplay: MAX_TIMEOUT_DELAY + 1 }])('rejects invalid dimensions or overflowing timers: %j', props => {
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), shallowRef<SwipeApi>()])
    expect(() => mount(Swipe, { props: { items, ...props } })).toThrow(/finite/)
  })

  it('clamps negative dimensions without changing the non-positive autoplay convention', () => {
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), shallowRef<SwipeApi>()])
    const wrapper = mount(Swipe, { props: { items, height: -10, gap: -20, autoplay: -1 } })
    wrappers.push(wrapper)
    expect(wrapper.attributes('style')).toContain('--scq-swipe-height: 0px')
    expect(wrapper.attributes('style')).toContain('--scq-swipe-gap: 0px')
  })

  it('renders functional autoplay and direction switches inside the real example cells', async () => {
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), shallowRef<SwipeApi>()])
    const wrapper = mount(SwipeExample)
    wrappers.push(wrapper)
    const switches = wrapper.findAll('input[role="switch"]')
    expect(switches).toHaveLength(2)
    await switches[0].setValue(true)
    expect(wrapper.getComponent(Swipe).props('autoplay')).toBeGreaterThan(0)
    await switches[1].setValue(true)
    expect(wrapper.getComponent(Swipe).props('vertical')).toBe(true)
  })
  it('uses the vertical engine axis and keeps explicit pause independent of pointer release', async () => {
    vi.useFakeTimers()
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const api = shallowRef<SwipeApi>()
    const handlers = new Map<string, () => void>()
    const engine = {
      scrollTo: vi.fn(), scrollNext: vi.fn(), scrollPrev: vi.fn(), reInit: vi.fn(), selectedScrollSnap: () => 0, canScrollNext: () => true,
      on: (name: string, callback: () => void) => { handlers.set(name, callback); return engine }, off: () => engine,
    }
    const create = vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), api])
    try {
      const wrapper = mount(Swipe, { props: { items, vertical: true, gap: 12, autoplay: 500 } })
      wrappers.push(wrapper)
      api.value = engine as unknown as SwipeApi
      await nextTick()
      expect(unref(create.mock.calls[0][0])).toMatchObject({ axis: 'y' })
      expect(wrapper.attributes('style')).toContain('--scq-swipe-gap: 12px')
      await wrapper.get('.scq-swipe__viewport').trigger('keydown', { key: 'ArrowDown' })
      expect(engine.scrollNext).toHaveBeenCalledTimes(1)
      wrapper.vm.pause()
      handlers.get('pointerDown')!()
      handlers.get('pointerUp')!()
      await vi.advanceTimersByTimeAsync(1000)
      expect(engine.scrollNext).toHaveBeenCalledTimes(1)
      wrapper.vm.play()
      await nextTick()
      await vi.advanceTimersByTimeAsync(500)
      expect(engine.scrollNext).toHaveBeenCalledTimes(2)
      await wrapper.setProps({ vertical: false, gap: 20 })
      expect(engine.reInit).toHaveBeenCalledTimes(1)
      wrapper.unmount()
      wrappers.pop()
      expect(vi.getTimerCount()).toBe(0)
    } finally { hidden.mockRestore(); vi.useRealTimers() }
  })

  it('clamps active state when slides disappear and provides custom indicators', async () => {
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), shallowRef<SwipeApi>()])
    const wrapper = mount(Swipe, { props: { items, modelValue: 2 }, slots: { indicators: ({ active, count }) => h('span', `${active + 1}/${count}`) } })
    wrappers.push(wrapper)
    expect(wrapper.get('.scq-swipe__indicators').text()).toBe('3/3')
    await wrapper.setProps({ items: items.slice(0, 1) })
    expect(wrapper.emitted('change')).toEqual([[0]])
    expect(wrapper.get('.scq-swipe__slide').attributes('aria-hidden')).toBe('false')
  })

  it('initializes the selected slide without rebuilding options on controlled updates', async () => {
    const api = shallowRef<SwipeApi>()
    const engine = {
      scrollTo: vi.fn(),
      selectedScrollSnap: vi.fn().mockReturnValue(1),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
    }
    const createCarousel = vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), api])
    const wrapper = mount(Swipe, { props: { modelValue: 1, items } })
    wrappers.push(wrapper)
    const options = createCarousel.mock.calls[0][0]
    const initialOptions = unref(options)

    api.value = engine as unknown as SwipeApi
    await nextTick()
    expect(engine.scrollTo).toHaveBeenCalledWith(1, true)
    expect(wrapper.findAll('.scq-swipe__slide')[1].attributes('aria-hidden')).toBe('false')
    expect(wrapper.emitted('change')).toBeUndefined()

    await wrapper.setProps({ modelValue: 2 })
    expect(unref(options)).toBe(initialOptions)
    await wrapper.setProps({ modelValue: 0 })
    expect(unref(options)).toBe(initialOptions)
    expect(engine.scrollTo.mock.calls).toEqual([[1, true], [2], [0]])

    await wrapper.setProps({ disabled: true })
    engine.scrollTo.mockClear()
    await wrapper.setProps({ modelValue: 2 })
    expect(engine.scrollTo).toHaveBeenCalledWith(2)
    engine.scrollTo.mockClear()
    wrapper.vm.swipeTo(0)
    expect(engine.scrollTo).not.toHaveBeenCalled()
  })

  it('wraps custom slide content without changing active and inert states', () => {
    vi.mocked(emblaCarouselVue).mockReset().mockReturnValue([ref<HTMLElement>(), shallowRef<SwipeApi>()])
    const wrapper = mount(Swipe, {
      props: { modelValue: 1, items },
      slots: { default: ({ item, active }: { item: { title: string }; active: boolean }) => h('button', { 'data-active': active }, item.title) },
    })
    wrappers.push(wrapper)
    const content = wrapper.findAll('.scq-swipe__slide > .scq-swipe__content')
    expect(content.map((entry) => entry.get('button').text())).toEqual(['First', 'Second', 'Third'])
    expect(content[1].get('button').attributes('data-active')).toBe('true')
    expect(wrapper.get('.scq-swipe__slide[aria-hidden="false"]').attributes('inert')).toBeUndefined()
    expect(wrapper.findAll('.scq-swipe__slide[aria-hidden="true"]').every((slide) => slide.attributes('inert') !== undefined)).toBe(true)
  })
})

describe('SwipeCell', () => {
  it('supports keyboard opening and asynchronous close cancellation', async () => {
    const beforeClose = vi.fn().mockResolvedValue(false)
    const wrapper = mount(SwipeCell, { props: { rightWidth: 80, beforeClose }, slots: { default: 'Row', right: '<button>Delete</button>' } })
    wrappers.push(wrapper)
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('open')).toEqual([['right']])
    expect(wrapper.get('.scq-swipe-cell__actions--right').attributes('aria-hidden')).toBe('false')
    await wrapper.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.emitted('close')).toBeUndefined()
    beforeClose.mockResolvedValue(true)
    await wrapper.vm.close()
    expect(wrapper.emitted('close')?.[0][0]).toEqual({ position: 'right', reason: 'method' })
  })
})

describe('Calendar', () => {
  it('repairs the roving date when bounds change without selecting a new value', async () => {
    const wrapper = mount(Calendar, { attachTo: document.body, props: { month: '2026-10', modelValue: '2026-10-15' } })
    wrappers.push(wrapper)
    wrapper.get<HTMLButtonElement>('[data-date="2026-10-15"]').element.focus()
    await wrapper.setProps({ minDate: '2026-10-20', maxDate: '2026-10-25' })
    await nextTick()
    expect(wrapper.findAll('[data-date][tabindex="0"]:not(:disabled)')).toHaveLength(1)
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-20')
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ modelValue: '2026-10-01' })
    expect(wrapper.findAll('[data-date][tabindex="0"]:not(:disabled)')).toHaveLength(1)
  })

  it('updates keyboard entry when a reactive disabled-date predicate changes', async () => {
    const blocked = ref(false)
    const wrapper = mount(Calendar, { props: {
      month: '2026-10', modelValue: '2026-10-15', disabledDate: () => blocked.value,
    } })
    wrappers.push(wrapper)
    blocked.value = true
    await nextTick()
    expect(wrapper.findAll('[data-date][tabindex="0"]')).toHaveLength(0)
    blocked.value = false
    await nextTick()
    expect(wrapper.findAll('[data-date][tabindex="0"]:not(:disabled)')).toHaveLength(1)
  })

  it('keeps an enabled spillover day keyboard reachable when the current month is blocked', () => {
    const wrapper = mount(Calendar, { props: { month: '2026-10', disabledDate: (date: Date) => date.getMonth() === 9 } })
    wrappers.push(wrapper)
    expect(wrapper.findAll('[data-date][tabindex="0"]:not(:disabled)')).toHaveLength(1)
  })

  it('starts a new range after changing constraints disables the incomplete start', async () => {
    const wrapper = mount(Calendar, { props: { month: '2026-10', type: 'range', modelValue: ['2026-10-12'] } })
    wrappers.push(wrapper)
    await wrapper.setProps({ minDate: '2026-10-20' })
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.get('[data-date="2026-10-21"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[['2026-10-21']]])
    expect(wrapper.emitted('invalid')).toBeUndefined()
  })

  it('does not navigate or select through exposed methods while disabled', async () => {
    const wrapper = mount(Calendar, { props: { month: '2025-01', disabled: true } })
    wrappers.push(wrapper)
    await wrapper.vm.goToday()
    await wrapper.vm.goToday(true)
    wrapper.vm.selectToday()
    expect(wrapper.emitted('update:month')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('rejects navigation to an out-of-bounds today without changing the view', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 22))
    const wrapper = mount(Calendar, { props: { month: '2025-01', minDate: '2025-01-01', maxDate: '2025-01-31' } })
    wrappers.push(wrapper)
    await wrapper.vm.goToday()
    expect(wrapper.emitted('update:month')).toBeUndefined()
    expect(wrapper.emitted('invalid')).toEqual([['disabled']])
  })

  it.each(['0001-01', '9999-12'])('disables spillover dates outside the supported years in %s', (month) => {
    const wrapper = mount(Calendar, { props: { month, firstDayOfWeek: 0 } })
    wrappers.push(wrapper)
    const outside = wrapper.findAll('.scq-calendar__cell.is-other button').filter((button) => {
      const key = button.attributes('data-date')
      return month === '0001-01' ? key.includes('-12-') : key.startsWith('10000-')
    })
    expect(outside.length).toBeGreaterThan(0)
    for (const button of outside) expect(button.attributes('disabled')).toBeDefined()
  })
  it('previews only valid ranges and applies inclusive minimum spans across leap days', async () => {
    const wrapper = mount(Calendar, { props: { month: '2024-02', type: 'range', modelValue: ['2024-02-28'], minRange: 3, rangePreview: true, showConfirm: true } })
    wrappers.push(wrapper)
    await wrapper.get('[data-date="2024-02-29"]').trigger('click')
    expect(wrapper.emitted('invalid')).toEqual([['min-range']])
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.get('[data-date="2024-03-01"]').trigger('mouseenter')
    expect(wrapper.findAll('.is-preview')).toHaveLength(3)
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({ disabledDate: date => date.getDate() === 29 })
    expect(wrapper.findAll('.is-preview')).toHaveLength(0)
    await wrapper.get('[data-date="2024-03-01"]').trigger('click')
    expect(wrapper.emitted('invalid')?.at(-1)).toEqual(['disabled'])
    await wrapper.setProps({ disabledDate: undefined })
    await wrapper.get('[data-date="2024-03-01"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[['2024-02-28', '2024-03-01']]])
  })

  it('limits additional selected dates but permits deselection and blocks invalid confirmation', async () => {
    const wrapper = mount(Calendar, { props: { month: '2024-02', type: 'multiple', modelValue: ['2024-02-28', '2024-02-29'], maxSelected: 2, showConfirm: true } })
    wrappers.push(wrapper)
    await wrapper.get('[data-date="2024-03-01"]').trigger('click')
    expect(wrapper.emitted('invalid')).toEqual([['max-selected']])
    await wrapper.get('[data-date="2024-02-28"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[['2024-02-29']]])
    await wrapper.setProps({ maxSelected: 1 })
    expect(wrapper.get('.scq-calendar__confirm').element.disabled).toBe(true)
  })
  it('handles leap days without accepting invalid dates or out-of-bounds selection', async () => {
    expect(parseDate('2025-02-29')).toBeUndefined()
    expect(parseDate('2024-02-29')).toBeInstanceOf(Date)
    const wrapper = mount(Calendar, { props: { month: '2024-02', minDate: '2024-02-10', maxDate: '2024-02-29' } })
    wrappers.push(wrapper)
    expect(wrapper.get('[data-date="2024-02-09"]').element.disabled).toBe(true)
    await wrapper.get('[data-date="2024-02-29"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['2024-02-29']])
    expect(wrapper.findAll('.scq-calendar__nav').every((button) => button.element.disabled)).toBe(true)
  })

  it('keeps year and month headings text-only and clickable while retaining navigation arrows', async () => {
    const wrapper = mount(Calendar, { props: { modelValue: '2026-10-15' } })
    wrappers.push(wrapper)
    for (const panel of ['month', 'year']) {
      expect(wrapper.findAll('.scq-calendar__title-button')).toHaveLength(2)
      expect(wrapper.find('.scq-calendar__title .scq-icon').exists()).toBe(false)
      expect(wrapper.findAll('.scq-calendar__nav .scq-icon')).toHaveLength(2)
      await wrapper.get(`[data-panel="${panel}"]`).trigger('click')
      expect(wrapper.find('.scq-calendar__periods').exists()).toBe(true)
      expect(wrapper.find('.scq-calendar__title .scq-icon').exists()).toBe(false)
      await wrapper.get('.scq-calendar__back').trigger('click')
    }
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('uses numeric Chinese months in both the heading and the month grid', async () => {
    const wrapper = mount(Calendar, { props: { modelValue: '2026-10-15' } })
    wrappers.push(wrapper)
    expect(wrapper.get('[data-panel="month"]').text()).toBe('10\u6708')
    await wrapper.get('[data-panel="month"]').trigger('click')
    expect(wrapper.findAll('[data-period]').map((button) => button.text())).toEqual(
      Array.from({ length: 12 }, (_, index) => `${index + 1}\u6708`),
    )
    await wrapper.get('[data-period="2026-12"]').trigger('click')
    expect(wrapper.get('[data-panel="month"]').text()).toBe('12\u6708')
    expect(wrapper.emitted('update:month')).toEqual([['2026-12']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('opens year and month grids from the heading without committing a date', async () => {
    const wrapper = mount(Calendar, { props: { modelValue: '2026-10-15' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-panel="year"]').trigger('click')
    expect(wrapper.find('[data-date]').exists()).toBe(false)
    expect(wrapper.get('[data-period="2026"]').attributes('tabindex')).toBe('0')
    await wrapper.get('[data-period="2027"]').trigger('click')
    expect(wrapper.get('[data-panel="year"]').text()).toContain('2027')
    expect(wrapper.emitted('update:month')).toBeUndefined()
    await wrapper.get('[data-period="2027-02"]').trigger('click')
    expect(wrapper.get('[role="grid"]').attributes('aria-label')).toBe('2027\u5e742\u6708')
    expect(wrapper.emitted('update:month')).toEqual([['2027-02']])
    expect(wrapper.emitted('panel-change')).toEqual([['2027-02']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('[data-date="2027-02-15"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['2027-02-15']])
  })

  it('constrains year and month grids to inclusive partial-year bounds', async () => {
    const wrapper = mount(Calendar, { props: { modelValue: '2026-10-15', minDate: '2025-12-10', maxDate: '2027-02-08' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-panel="year"]').trigger('click')
    expect(wrapper.get('[data-period="2024"]').element.disabled).toBe(true)
    expect(wrapper.get('[data-period="2025"]').element.disabled).toBe(false)
    expect(wrapper.get('[data-period="2027"]').element.disabled).toBe(false)
    expect(wrapper.get('[data-period="2028"]').element.disabled).toBe(true)
    await wrapper.get('[data-period="2024"]').trigger('click')
    expect(wrapper.find('[data-period="2026"]').exists()).toBe(true)
    await wrapper.get('[data-period="2025"]').trigger('click')
    expect(wrapper.findAll('[data-period]:not(:disabled)').map((button) => button.attributes('data-period'))).toEqual(['2025-12'])
    expect(wrapper.findAll('.scq-calendar__nav')[0].element.disabled).toBe(true)
    await wrapper.get('[data-period="2025-12"]').trigger('click')
    expect(wrapper.get('[data-date="2025-12-09"]').element.disabled).toBe(true)
    expect(wrapper.get('[data-date="2025-12-10"]').element.disabled).toBe(false)
    await wrapper.get('[data-panel="month"]').trigger('click')
    await wrapper.findAll('.scq-calendar__nav')[1].trigger('click')
    await wrapper.findAll('.scq-calendar__nav')[1].trigger('click')
    expect(wrapper.findAll('[data-period]:not(:disabled)').map((button) => button.attributes('data-period'))).toEqual(['2027-01', '2027-02'])
    expect(wrapper.findAll('.scq-calendar__nav')[1].element.disabled).toBe(true)
    await wrapper.get('[data-period="2027-02"]').trigger('click')
    expect(wrapper.get('[data-date="2027-02-08"]').element.disabled).toBe(false)
    expect(wrapper.get('[data-date="2027-02-09"]').element.disabled).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('pages through contiguous year groups and returns without changing the visible month', async () => {
    const wrapper = mount(Calendar, { props: { modelValue: '2026-10-15' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-panel="year"]').trigger('click')
    const original = wrapper.findAll('[data-period]').map((button) => Number(button.attributes('data-period')))
    await wrapper.findAll('.scq-calendar__nav')[1].trigger('click')
    expect(Number(wrapper.findAll('[data-period]')[0].attributes('data-period'))).toBe(original.at(-1)! + 1)
    await wrapper.findAll('.scq-calendar__nav')[0].trigger('click')
    expect(wrapper.findAll('[data-period]').map((button) => Number(button.attributes('data-period')))).toEqual(original)
    await wrapper.get('.scq-calendar__back').trigger('click')
    expect(wrapper.find('[data-date="2026-10-15"]').exists()).toBe(true)
    expect(wrapper.emitted('update:month')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('supports roving grid focus, row navigation, paging and Escape without changing selections', async () => {
    const wrapper = mount(Calendar, { attachTo: document.body, props: { modelValue: '2026-10-15', minDate: '2026-03-01', maxDate: '2027-12-31' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-panel="month"]').trigger('click')
    expect(document.activeElement?.getAttribute('data-period')).toBe('2026-10')
    await wrapper.get('[data-period="2026-10"]').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement?.getAttribute('data-period')).toBe('2026-07')
    await wrapper.get('[data-period="2026-07"]').trigger('keydown', { key: 'End' })
    expect(document.activeElement?.getAttribute('data-period')).toBe('2026-09')
    await wrapper.get('[data-period="2026-09"]').trigger('keydown', { key: 'Home' })
    expect(document.activeElement?.getAttribute('data-period')).toBe('2026-07')
    await wrapper.get('[data-period="2026-07"]').trigger('keydown', { key: 'PageDown' })
    expect(document.activeElement?.getAttribute('data-period')).toBe('2027-07')
    await wrapper.get('[data-period="2027-07"]').trigger('keydown', { key: 'ArrowUp' })
    await wrapper.get('[data-period="2027-04"]').trigger('keydown', { key: 'PageUp' })
    await wrapper.get('[data-period="2026-04"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement?.getAttribute('data-period')).toBe('2026-03')
    await wrapper.get('[data-period="2026-03"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement?.getAttribute('data-period')).toBe('2026-03')
    expect(wrapper.findAll('[data-period][tabindex="0"]')).toHaveLength(1)
    await wrapper.get('[data-period="2026-03"]').trigger('keydown', { key: 'Escape' })
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-15')
    expect(wrapper.emitted('update:month')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('moves period focus across years and respects the final page boundary', async () => {
    const wrapper = mount(Calendar, { attachTo: document.body, props: { modelValue: '2026-12-15', maxDate: '2027-12-31' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-panel="month"]').trigger('click')
    await wrapper.get('[data-period="2026-12"]').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement?.getAttribute('data-period')).toBe('2027-01')
    await wrapper.get('[data-period="2027-12"]').trigger('focus')
    await wrapper.get('[data-period="2027-12"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('[data-period="2027-12"]').attributes('tabindex')).toBe('0')
    expect(wrapper.find('[data-period="2028-01"]').exists()).toBe(false)
  })

  it.each(['0001-01', '9999-12'])('never enables unsupported years when browsing %s', async (month) => {
    const wrapper = mount(Calendar, { props: { month } })
    wrappers.push(wrapper)
    await wrapper.get('[data-panel="year"]').trigger('click')
    const enabled = wrapper.findAll('[data-period]:not(:disabled)').map((button) => Number(button.attributes('data-period')))
    expect(enabled.every((year) => parseDate(`${String(year).padStart(4, '0')}-01-01`))).toBe(true)
    expect(wrapper.findAll('.scq-calendar__nav')[month === '0001-01' ? 0 : 1].element.disabled).toBe(true)
  })

  it('closes a period grid when the controlled month changes and disables all navigation when locked', async () => {
    const wrapper = mount(Calendar, { props: { month: '2026-10' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-panel="year"]').trigger('click')
    await wrapper.setProps({ month: '2028-03' })
    expect(wrapper.find('.scq-calendar__periods').exists()).toBe(false)
    expect(wrapper.find('[data-date="2028-03-15"]').exists()).toBe(true)
    await wrapper.setProps({ disabled: true })
    expect(wrapper.findAll('.scq-calendar__header button').every((button) => button.element.disabled)).toBe(true)
    await wrapper.get('[data-panel="month"]').trigger('click')
    expect(wrapper.find('.scq-calendar__periods').exists()).toBe(false)
  })

  it('rejects ranges through disabled days and maximum-range violations', async () => {
    const wrapper = mount(Calendar, { props: { type: 'range', month: '2026-10', modelValue: ['2026-10-10'], disabledDate: (date: Date) => date.getDate() === 12 } })
    wrappers.push(wrapper)
    await wrapper.get('[data-date="2026-10-14"]').trigger('click')
    expect(wrapper.emitted('invalid')).toEqual([['disabled']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ maxRange: 2 })
    await wrapper.get('[data-date="2026-10-14"]').trigger('click')
    expect(wrapper.emitted('invalid')?.[1]).toEqual(['max-range'])
    await wrapper.get('[data-date="2026-10-11"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['2026-10-10', '2026-10-11']])
  })

  it('moves keyboard focus across month boundaries', async () => {
    const wrapper = mount(Calendar, { attachTo: document.body, props: { modelValue: '2026-10-31' } })
    wrappers.push(wrapper)
    await wrapper.get('[data-date="2026-10-31"]').trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(wrapper.emitted('update:month')).toEqual([['2026-11']])
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-11-01')
  })

  it('selects today when clicking footer today button and supports goToday navigation', async () => {
    const wrapper = mount(Calendar, { props: { month: '2025-01' } })
    wrappers.push(wrapper)
    const todayBtn = wrapper.find('.scq-calendar__footer button')
    await todayBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    await wrapper.vm.goToday()
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('omits an empty footer when Today is hidden while preserving back and confirmation actions', async () => {
    const wrapper = mount(Calendar, { props: { modelValue: '2026-10-15', showToday: false } })
    wrappers.push(wrapper)
    expect(wrapper.find('.scq-calendar__footer').exists()).toBe(false)
    await wrapper.get('[data-panel="year"]').trigger('click')
    expect(wrapper.findAll('.scq-calendar__footer button')).toHaveLength(1)
    await wrapper.get('.scq-calendar__back').trigger('click')
    expect(wrapper.find('.scq-calendar__footer').exists()).toBe(false)
    await wrapper.setProps({ showConfirm: true })
    expect(wrapper.findAll('.scq-calendar__footer button')).toHaveLength(1)
    await wrapper.get('.scq-calendar__confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([['2026-10-15']])
  })
})

describe('ActionBar', () => {
  it('enforces Form disabling across Teleport while retaining readonly zero-key actions', async () => {
    const disabled = ref(true)
    const actions = [{ key: 0, label: 'Save' }] as const
    const wrapper = mount({ setup: () => () => h(Form, { model: {}, disabled: disabled.value }, () =>
      h(Teleport, { to: document.body }, h(ActionBar, { actions, disabled: false }))) }, { attachTo: document.body })
    wrappers.push(wrapper)
    const bar = wrapper.getComponent(ActionBar)
    const button = bar.get<HTMLButtonElement>('button')
    expect(button.element.disabled).toBe(true)
    button.element.click()
    expect(bar.emitted('click')).toBeUndefined()
    disabled.value = false
    await nextTick()
    button.element.click()
    expect(bar.emitted('click')).toEqual([[actions[0]]])
    expect(button.attributes('type')).toBe('button')
  })

  it.each([true, false])('restores action keyboard focus when its guard returns %s', async allowed => {
    let complete!: (allowed: boolean) => void
    const wrapper = mount(ActionBar, { attachTo: document.body, props: {
      actions: [{ key: 0, label: 'Save' }], beforeAction: () => new Promise<boolean>(resolve => { complete = resolve }),
    } })
    wrappers.push(wrapper)
    const button = wrapper.get<HTMLButtonElement>('button')
    button.element.focus()
    await button.trigger('click')
    expect(wrapper.vm.pendingKey).toBe(0)
    button.element.blur()
    complete(allowed)
    await flushPromises()
    expect(document.activeElement).toBe(button.element)
    expect(wrapper.emitted('click')?.length ?? 0).toBe(allowed ? 1 : 0)
  })

  it('guards actions once, cancels disabled requests and keeps failures retryable', async () => {
    let done!: (value: boolean) => void
    let signal!: AbortSignal
    const actions = [{ key: 'save', label: 'Save' }, { key: 'next', label: 'Next' }]
    const beforeAction = vi.fn((_action, current: AbortSignal) => { signal = current; return new Promise<boolean>(resolve => { done = resolve }) })
    const wrapper = mount(ActionBar, { props: { actions, beforeAction }, slots: { summary: 'Total: 20' } })
    wrappers.push(wrapper)
    await wrapper.findAll('button')[0].trigger('click')
    await wrapper.findAll('button')[0].trigger('click')
    expect(beforeAction).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.pendingKey).toBe('save')
    expect(wrapper.findAll('button').every(button => button.element.disabled)).toBe(true)
    await wrapper.setProps({ disabled: true })
    expect(signal.aborted).toBe(true)
    done(true)
    await flushPromises()
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.setProps({ disabled: false, beforeAction: () => { throw new Error('Private detail') }, onError: () => {} })
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Private detail')
    expect(wrapper.get('.scq-action-bar__summary').text()).toBe('Total: 20')
    await wrapper.setProps({ beforeAction: () => true })
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()
    expect(wrapper.emitted('click')).toEqual([[actions[0]]])
  })
  it('emits actions while preventing disabled and pending actions', async () => {
    const wrapper = mount(ActionBar, { props: { actions: [{ key: 'save', label: 'Save', type: 'primary' }, { key: 'pending', label: 'Pending', loading: true }, { key: 'blocked', label: 'Blocked', disabled: true }] } })
    wrappers.push(wrapper)
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    await buttons[2].trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('click')?.[0][0]).toMatchObject({ key: 'save' })
  })
})