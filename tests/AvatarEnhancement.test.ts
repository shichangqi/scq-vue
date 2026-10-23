// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { Comment, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Avatar from '../src/components/Avatar/Avatar.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'

const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
afterEach(() => { wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount()); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Avatar sources and fallback order', () => {
  it('does not let an empty conditional slot block text or icon fallback', async () => {
    const shown = ref(false)
    const wrapper = track(mount(Avatar, { props: { text: 'Fallback' }, slots: {
      default: () => shown.value ? h('strong', 'Custom') : [h(Comment), ' '],
    } }))
    expect(wrapper.text()).toBe('Fallback')
    shown.value = true
    await nextTick()
    expect(wrapper.text()).toBe('Custom')
    shown.value = false
    await nextTick()
    await wrapper.setProps({ text: '' })
    expect(wrapper.find('.scq-icon--user').exists()).toBe(true)
  })

  it('keeps unnamed slot text readable instead of hiding it beneath an unnamed image role', async () => {
    const label = ref<string>()
    const wrapper = track(mount(defineComponent({
      setup: () => () => h(Avatar, { 'aria-label': label.value }, { default: () => 'AL' }),
    })))
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.text()).toBe('AL')
    label.value = 'Ada'
    await nextTick()
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Ada')
    label.value = undefined
    await nextTick()
    expect(wrapper.attributes('role')).toBeUndefined()
  })
  it('preserves image-to-slot-to-icon defaults and native events', async () => {
    const wrapper = track(mount(Avatar, { props: { src: '/avatar.png', alt: 'Member' }, slots: { default: 'AL' } }))
    await wrapper.get('img').trigger('error')
    expect(wrapper.text()).toBe('AL')
    expect(wrapper.attributes('aria-label')).toBe('Member')
    expect(wrapper.emitted('error')).toHaveLength(1)
    const icon = track(mount(Avatar))
    expect(icon.find('.scq-icon').exists()).toBe(true)
    await wrapper.setProps({ src: '/new.png' })
    await wrapper.get('img').trigger('load')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('forwards responsive sources and resets failed state when they change', async () => {
    const wrapper = track(mount(Avatar, { props: { src: '/one.png', srcset: '/one.png 1x, /two.png 2x', sizes: '40px', text: 'AL' } }))
    expect(wrapper.get('img').attributes('srcset')).toContain('/two.png 2x')
    expect(wrapper.get('img').attributes('sizes')).toBe('40px')
    await wrapper.get('img').trigger('error')
    expect(wrapper.get('.scq-avatar__text').text()).toBe('AL')
    await wrapper.setProps({ srcset: '/three.png 1x', sizes: '56px' })
    expect(wrapper.get('img').attributes('srcset')).toBe('/three.png 1x')
    expect(wrapper.get('img').attributes('sizes')).toBe('56px')
  })

  it('deduplicates fallback URLs and removes srcset for backup sources', async () => {
    const wrapper = track(mount(Avatar, { props: { src: '/one.png', srcset: '/one.png 1x', fallbackSrc: ['/one.png', '/backup.png', '/backup.png'], text: 'Fallback' } }))
    const first = wrapper.get('img')
    await first.trigger('error')
    expect(wrapper.get('img').attributes('src')).toBe('/backup.png')
    expect(wrapper.get('img').attributes('srcset')).toBeUndefined()
    first.element.dispatchEvent(new Event('load'))
    expect(wrapper.emitted('load')).toBeUndefined()
    await wrapper.get('img').trigger('error')
    expect(wrapper.text()).toBe('Fallback')
    expect(wrapper.emitted('error')).toHaveLength(2)
    wrapper.vm.retry()
    await nextTick()
    expect(wrapper.get('img').attributes('src')).toBe('/one.png')
  })

  it('ignores obsolete load/error events after an external source replacement', async () => {
    const wrapper = track(mount(Avatar, { props: { src: '/old.png', fallbackSrc: '/backup.png' } }))
    const old = wrapper.get('img')
    await wrapper.setProps({ src: '/new.png' })
    await old.trigger('error')
    await old.trigger('load')
    expect(wrapper.get('img').attributes('src')).toBe('/new.png')
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.emitted('load')).toBeUndefined()
  })

  it('supports srcset without a base src', async () => {
    const wrapper = track(mount(Avatar, { props: { srcset: '/retina.png 2x', alt: 'Retina' } }))
    expect(wrapper.get('img').attributes('srcset')).toBe('/retina.png 2x')
    await wrapper.get('img').trigger('load')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('respects explicit fallback order and responds to slot removal', async () => {
    const slot = ref(true)
    const wrapper = track(mount(defineComponent({
      setup: () => () => h(Avatar, { src: '/image.png', text: 'Text', fallbackOrder: ['slot', 'text', 'image', 'icon'] }, slot.value ? { default: () => 'Slot' } : {}),
    })))
    expect(wrapper.text()).toBe('Slot')
    expect(wrapper.find('img').exists()).toBe(false)
    slot.value = false
    await nextTick()
    expect(wrapper.text()).toBe('Text')
  })

  it('uses one accessible image name across text and image states', async () => {
    const wrapper = track(mount(Avatar, { props: { text: 'Ada' } }))
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Ada')
    await wrapper.setProps({ src: '/ada.png' })
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('img').attributes('alt')).toBe('Ada')
  })
})

describe('Avatar text measurement', () => {
  it('shrinks text to the measured available width and can opt out', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(40)
    const textWidth = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(160)
    const wrapper = track(mount(Avatar, { props: { text: 'Development team', gap: 4 } }))
    await flushPromises()
    expect(wrapper.get('.scq-avatar__text').attributes('style')).toContain('scale(0.2)')
    textWidth.mockReturnValue(16)
    await wrapper.setProps({ text: 'AL' })
    await flushPromises()
    expect(wrapper.get('.scq-avatar__text').attributes('style')).toContain('scale(1)')
    textWidth.mockReturnValue(160)
    await wrapper.setProps({ autoSize: false })
    expect(wrapper.get('.scq-avatar__text').attributes('style')).toContain('scale(1)')
  })

  it('reacts to resize observations and disconnects on unmount', async () => {
    const callbacks: ResizeObserverCallback[] = []
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { callbacks.push(callback) }
      observe() {}
      unobserve() {}
      disconnect = disconnect
    })
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(40)
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(100)
    const wrapper = track(mount(Avatar, { props: { text: 'Long name' } }))
    await nextTick()
    expect(wrapper.get('.scq-avatar__text').attributes('style')).toContain('scale(0.32)')
    width.mockReturnValue(56)
    callbacks[0]([], {} as ResizeObserver)
    await nextTick()
    expect(wrapper.get('.scq-avatar__text').attributes('style')).toContain('scale(0.48)')
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('inherits provider sizes and keeps explicit pixels authoritative', async () => {
    const size = ref<number>()
    const wrapper = track(mount(ConfigProvider, { props: { size: 'large' }, slots: { default: () => h(Avatar, { text: 'AL', size: size.value }) } }))
    expect(wrapper.get('.scq-avatar').attributes('style')).toContain('56px')
    size.value = 80
    await nextTick()
    expect(wrapper.get('.scq-avatar').attributes('style')).toContain('80px')
  })
})
