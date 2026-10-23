// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import Image from '../src/components/Image/Image.vue'

const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
const open = async (props: Partial<InstanceType<typeof Image>['$props']> = {}) => {
  const wrapper = track(mount(Image, { props: { src: '/one.png', preview: true, teleport: false, ...props }, attachTo: document.body }))
  await wrapper.get('img').trigger('load')
  await wrapper.get('.scq-image__preview-trigger').trigger('click')
  await flushPromises()
  return wrapper
}
afterEach(async () => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  await flushPromises()
  document.body.replaceChildren()
})

describe('Image sources and preview state', () => {
  it('leaves editing and owned keyboard events to custom toolbar controls', async () => {
    const wrapper = track(mount(Image, {
      attachTo: document.body, props: { src: '/one.png', previewSrcList: ['/one.png', '/two.png'], teleport: false },
      slots: { toolbar: () => [
        h('input', { value: 'Notes' }), h('div', { contenteditable: 'true' }, 'Editable'),
        h('button', { type: 'button', onKeydown: (event: KeyboardEvent) => event.preventDefault() }, 'Owned'),
      ] },
    }))
    await wrapper.get('img').trigger('load')
    wrapper.vm.showPreview()
    await flushPromises()
    await wrapper.get('.scq-image-viewer input').trigger('keydown', { key: 'ArrowRight' })
    await wrapper.get('[contenteditable]').trigger('keydown', { key: '+' })
    await wrapper.get('.scq-image-viewer__toolbar button').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('switch')).toBeUndefined()
    expect(wrapper.get('.scq-image-viewer__stage img').attributes('style')).toContain('scale(1)')
  })

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }])('preserves modified and composition shortcuts: %j', async flags => {
    const wrapper = await open({ previewSrcList: ['/one.png', '/two.png'] })
    for (const key of ['ArrowRight', '+']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...flags })
      wrapper.get('.scq-image-viewer').element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
    await nextTick()
    expect(wrapper.emitted('switch')).toBeUndefined()
    expect(wrapper.get('output').text()).toBe('100%')
  })

  it('clears a previous session capture flag before reopening the preview', async () => {
    const wrapper = await open()
    await wrapper.get('.scq-image-viewer').trigger('keydown', { key: '+' })
    await wrapper.get('.scq-image-viewer__stage img').trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 20, clientY: 20 })
    wrapper.vm.closePreview()
    await flushPromises()
    wrapper.vm.showPreview()
    await flushPromises()
    await wrapper.get('.scq-image-viewer__stage').trigger('click')
    expect(wrapper.find('.scq-image-viewer').exists()).toBe(false)
  })

  it.each([{ width: Infinity }, { height: Number.NaN }])('rejects non-finite dimensions: %j', props => {
    expect(() => mount(Image, { props })).toThrow('must be finite')
  })

  it('keeps native dimension hints consistent with clamped CSS dimensions', () => {
    const wrapper = track(mount(Image, { props: { src: '/one.png', width: -10, height: -20 } }))
    expect(wrapper.attributes('style')).toContain('width: 0px')
    expect(wrapper.attributes('style')).toContain('height: 0px')
    expect(wrapper.get('img').attributes('width')).toBe('0')
    expect(wrapper.get('img').attributes('height')).toBe('0')
  })
  it('forwards responsive attributes and dimensions while reporting each fallback failure', async () => {
    const wrapper = track(mount(Image, { props: {
      src: '/one.png', srcset: '/one.png 1x, /two.png 2x', sizes: '320px',
      fallbackSrc: ['/backup.png', '/backup.png'], width: 320, height: 200, decoding: 'async', fetchpriority: 'high',
    } }))
    const primary = wrapper.get('img')
    expect(primary.attributes()).toMatchObject({ srcset: '/one.png 1x, /two.png 2x', sizes: '320px', width: '320', height: '200', decoding: 'async', fetchpriority: 'high' })
    await primary.trigger('error')
    expect(wrapper.get('img').attributes('src')).toBe('/backup.png')
    expect(wrapper.get('img').attributes('srcset')).toBeUndefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.get('img').trigger('load')
    expect(wrapper.attributes('aria-busy')).toBe('false')
    await primary.trigger('error')
    expect(wrapper.emitted('error')).toHaveLength(1)
    wrapper.vm.retry()
    await nextTick()
    expect(wrapper.get('img').attributes('src')).toBe('/one.png')
  })

  it('uses the successful backup as the default preview image', async () => {
    const wrapper = track(mount(Image, { props: { src: '/one.png', fallbackSrc: '/backup.png', preview: true, teleport: false } }))
    await wrapper.get('img').trigger('error')
    await wrapper.get('img').trigger('load')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.scq-image-viewer__stage img').attributes('src')).toBe('/backup.png')
  })

  it('keeps a controlled index authoritative and isolates stale preview events', async () => {
    const wrapper = await open({ previewSrcList: ['/one.png', '/two.png'], previewIndex: 1 })
    const old = wrapper.get('.scq-image-viewer__stage img')
    expect(old.attributes('src')).toBe('/two.png')
    await wrapper.get('.scq-image-viewer__next').trigger('click')
    expect(wrapper.emitted('update:previewIndex')?.at(-1)).toEqual([0])
    expect(wrapper.get('.scq-image-viewer__stage img').attributes('src')).toBe('/two.png')
    await wrapper.setProps({ previewIndex: 0 })
    await old.trigger('error')
    expect(wrapper.emitted('preview-error')).toBeUndefined()
    expect(wrapper.get('.scq-image-viewer__stage img').attributes('src')).toBe('/one.png')
  })

  it('shows a pending state, reports failed previews and retries the same image', async () => {
    const wrapper = await open()
    expect(wrapper.get('.scq-image-viewer').attributes('aria-busy')).toBe('true')
    const first = wrapper.get('.scq-image-viewer__stage img')
    await first.trigger('error')
    expect(wrapper.get('.scq-image-viewer [role="alert"]').exists()).toBe(true)
    expect(wrapper.emitted('preview-error')).toHaveLength(1)
    await wrapper.get('.scq-image-viewer [role="alert"] button').trigger('click')
    const retried = wrapper.get('.scq-image-viewer__stage img')
    expect(retried.element).not.toBe(first.element)
    expect(retried.attributes('src')).toBe('/one.png')
    await retried.trigger('load')
    expect(wrapper.find('.scq-image-viewer [role="alert"]').exists()).toBe(false)
    expect(wrapper.get('.scq-image-viewer').attributes('aria-busy')).toBeUndefined()
    expect(wrapper.emitted('preview-load')).toHaveLength(1)
  })

  it('resets transforms on real image changes and handles a shrinking list', async () => {
    const wrapper = await open({ previewSrcList: ['/one.png', '/two.png'], initialIndex: 1 })
    await wrapper.get('.scq-image-viewer').trigger('keydown', { key: '+' })
    expect(wrapper.get('output').text()).toBe('125%')
    await wrapper.get('.scq-image-viewer__previous').trigger('click')
    expect(wrapper.get('output').text()).toBe('100%')
    await wrapper.setProps({ previewSrcList: ['/remaining.png'] })
    expect(wrapper.get('.scq-image-viewer__stage img').attributes('src')).toBe('/remaining.png')
    expect(wrapper.find('.scq-image-viewer__next').exists()).toBe(false)
  })

  it('keeps wheel and double-click behavior opt-in and clamps zoom', async () => {
    const wrapper = await open()
    const stage = wrapper.get('.scq-image-viewer__stage')
    await stage.trigger('wheel', { deltaY: -1 })
    expect(wrapper.get('output').text()).toBe('100%')
    await wrapper.setProps({ previewWheelZoom: true, previewDoubleClickReset: true })
    await stage.trigger('wheel', { deltaY: -1 })
    expect(wrapper.get('output').text()).toBe('125%')
    for (let index = 0; index < 25; index += 1) await stage.trigger('wheel', { deltaY: -1 })
    expect(wrapper.get('output').text()).toBe('500%')
    await stage.trigger('dblclick')
    expect(wrapper.get('output').text()).toBe('100%')
    await stage.trigger('wheel', { deltaY: 1 })
    expect(wrapper.get('output').text()).toBe('100%')
  })

  it('pinches with two touch pointers and clears gesture state on switching', async () => {
    const wrapper = await open({ previewPinchZoom: true, previewSrcList: ['/one.png', '/two.png'] })
    const stage = wrapper.get('.scq-image-viewer__stage')
    await stage.get('img').trigger('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0, button: 0 })
    await stage.trigger('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 100, clientY: 0, button: 0 })
    await stage.trigger('pointermove', { pointerId: 2, pointerType: 'touch', clientX: 200, clientY: 0 })
    expect(wrapper.get('output').text()).toBe('200%')
    await wrapper.get('.scq-image-viewer__next').trigger('click')
    expect(wrapper.get('output').text()).toBe('100%')
    await stage.trigger('pointermove', { pointerId: 2, pointerType: 'touch', clientX: 300, clientY: 0 })
    expect(wrapper.get('output').text()).toBe('100%')
  })

  it('preserves one-pointer pan and resets it on double click', async () => {
    const wrapper = await open({ previewDoubleClickReset: true })
    await wrapper.get('.scq-image-viewer').trigger('keydown', { key: '+' })
    const stage = wrapper.get('.scq-image-viewer__stage')
    await stage.get('img').trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 20, clientY: 20, button: 0 })
    await stage.trigger('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 60, clientY: 70 })
    expect(stage.get('img').attributes('style')).toContain('translate(40px, 50px)')
    await stage.trigger('pointerup', { pointerId: 1 })
    await stage.trigger('dblclick')
    expect(stage.get('img').attributes('style')).toContain('translate(0px, 0px)')
  })

  it('exposes the toolbar state without losing the close control', async () => {
    const wrapper = track(mount(Image, { props: { src: '/one.png', preview: true, teleport: false }, slots: {
      toolbar: ({ scale, zoomIn, reset }) => [h('output', `${scale}`), h('button', { class: 'custom-zoom', onClick: zoomIn }, '+'), h('button', { class: 'custom-reset', onClick: reset }, 'Reset')],
    } }))
    await wrapper.get('img').trigger('load')
    wrapper.vm.showPreview()
    await flushPromises()
    await wrapper.get('.custom-zoom').trigger('click')
    expect(wrapper.get('output').text()).toBe('1.25')
    await wrapper.get('.custom-reset').trigger('click')
    expect(wrapper.get('output').text()).toBe('1')
    await wrapper.get('.scq-image-viewer__close').trigger('click')
    expect(wrapper.find('.scq-image-viewer').exists()).toBe(false)
    expect(document.body.style.overflow).toBe('')
  })

  it('does not treat a captured image click as a backdrop click', async () => {
    const wrapper = await open({ previewDoubleClickReset: true })
    await wrapper.get('.scq-image-viewer').trigger('keydown', { key: '+' })
    const stage = wrapper.get('.scq-image-viewer__stage')
    await stage.get('img').trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 20, clientY: 20, button: 0 })
    await stage.trigger('pointerup', { pointerId: 1 })
    await stage.trigger('click')
    expect(wrapper.find('.scq-image-viewer').exists()).toBe(true)
    await stage.trigger('dblclick')
    expect(wrapper.get('output').text()).toBe('100%')
    await stage.trigger('pointerdown', { pointerId: 2, pointerType: 'mouse', clientX: 0, clientY: 0, button: 0 })
    await stage.trigger('click')
    expect(wrapper.find('.scq-image-viewer').exists()).toBe(false)
  })
})
