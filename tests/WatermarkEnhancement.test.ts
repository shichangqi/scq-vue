// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Watermark from '../src/components/Watermark/Watermark.vue'

const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T) => { wrappers.push(wrapper); return wrapper }
const settle = async () => { await nextTick(); await flushPromises() }
const svg = (layer: HTMLElement) => {
  const match = layer.style.backgroundImage.match(/data:image\/svg\+xml;charset=UTF-8,([^"]+)/)
  if (!match) throw new Error('Watermark SVG is missing')
  return decodeURIComponent(match[1].replace(/"\)$/, ''))
}
const sources: FakeImage[] = []
class FakeImage {
  src = ''
  onload: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  constructor() { sources.push(this) }
  removeAttribute(name: string) { if (name === 'src') this.src = '' }
}
afterEach(async () => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  await settle()
  sources.splice(0)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Watermark rendering and recovery', () => {
  it('preserves defaults and lets content receive interactions', async () => {
    const click = vi.fn()
    const wrapper = track(mount(Watermark, { slots: { default: () => h('button', { onClick: click }, 'Action') } }))
    await settle()
    const layer = wrapper.get<HTMLElement>('.scq-watermark__layer')
    expect(layer.element.style.backgroundSize).toBe('120px 120px')
    expect(layer.element.style.pointerEvents).toBe('none')
    expect(layer.attributes('aria-hidden')).toBe('true')
    expect(svg(layer.element)).toContain('rotate(-22')
    expect(svg(layer.element)).toContain('SCQ VUE')
    await wrapper.get('button').trigger('click')
    expect(click).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('redraw')).toHaveLength(1)
  })

  it('escapes mixed content and honors offsets, fonts and explicit line height', async () => {
    const wrapper = track(mount(Watermark, { props: {
      content: ['<script>&', 'Second'], fontFamily: 'A"B', fontWeight: 700,
      lineHeight: 30, offset: [-10, 20], gap: [200, 160], rotate: 0,
    } }))
    await settle()
    const layer = wrapper.get<HTMLElement>('.scq-watermark__layer').element
    const content = svg(layer)
    expect(content).toContain('&lt;script&gt;&amp;')
    expect(content).toContain('font-family="A&quot;B"')
    expect(content).toContain('font-weight="700"')
    expect(content).toContain('dy="30"')
    expect(layer.style.backgroundPosition).toBe('-10px 20px')
    expect(layer.style.backgroundSize).toBe('200px 160px')
  })

  it('recovers a removed or altered layer once without observing business descendants', async () => {
    const wrapper = track(mount(Watermark, { attachTo: document.body, slots: { default: () => h('div', { class: 'business' }, [h('input')]) } }))
    await settle()
    const layer = wrapper.get<HTMLElement>('.scq-watermark__layer').element
    layer.remove()
    await settle()
    expect(layer.parentElement).toBe(wrapper.element)
    expect(wrapper.emitted('restore')).toHaveLength(1)
    layer.style.opacity = '0'
    layer.style.pointerEvents = 'auto'
    layer.className = 'removed'
    layer.removeAttribute('aria-hidden')
    layer.append(document.createElement('button'))
    await settle()
    expect(layer.style.opacity).toBe('')
    expect(layer.style.pointerEvents).toBe('none')
    expect(layer.className).toBe('scq-watermark__layer')
    expect(layer.getAttribute('aria-hidden')).toBe('true')
    expect(layer.childNodes).toHaveLength(0)
    expect(wrapper.emitted('restore')).toHaveLength(2)
    wrapper.get<HTMLElement>('.business').element.style.background = 'red'
    wrapper.get('.business').element.append(document.createElement('p'))
    await settle()
    expect(wrapper.emitted('restore')).toHaveLength(2)
    expect(wrapper.emitted('redraw')).toHaveLength(1)
  })

  it('recovers the layer hidden attribute without altering business visibility or looping', async () => {
    const wrapper = track(mount(Watermark, { attachTo: document.body }))
    await settle()
    const layer = wrapper.get<HTMLElement>('.scq-watermark__layer').element
    layer.hidden = true
    await settle()
    expect(layer.hasAttribute('hidden')).toBe(false)
    expect(wrapper.emitted('restore')).toHaveLength(1)
    wrapper.element.setAttribute('hidden', '')
    await settle()
    expect(wrapper.attributes('hidden')).toBe('')
    expect(wrapper.emitted('restore')).toHaveLength(1)
    expect(wrapper.emitted('redraw')).toHaveLength(1)
  })

  it('renders readonly content and finite fractional stacking order', async () => {
    const content = ['First', 'Second'] as const
    const wrapper = track(mount(Watermark, { props: { content, zIndex: 3.8 } }))
    await settle()
    const layer = wrapper.get<HTMLElement>('.scq-watermark__layer').element
    expect(svg(layer)).toContain('First')
    expect(svg(layer)).toContain('Second')
    expect(layer.style.zIndex).toBe('3')
  })

  it('moves one layer between custom containers, body and the local wrapper', async () => {
    const first = document.createElement('div'), second = document.createElement('div')
    first.id = 'watermark-host'
    document.body.append(first, second)
    const wrapper = track(mount(Watermark, { props: { container: '#watermark-host' }, attachTo: document.body }))
    await settle()
    const layer = first.querySelector<HTMLElement>('.scq-watermark__layer')!
    expect(layer).not.toBeNull()
    await wrapper.setProps({ container: second })
    await settle()
    expect(layer.parentElement).toBe(second)
    expect(first.children).toHaveLength(0)
    await wrapper.setProps({ container: undefined, fullscreen: true })
    await settle()
    expect(layer.parentElement).toBe(document.body)
    expect(layer.style.position).toBe('fixed')
    await wrapper.setProps({ fullscreen: false })
    await settle()
    expect(layer.parentElement).toBe(wrapper.element)
    expect(document.querySelectorAll('.scq-watermark__layer')).toHaveLength(1)
  })

  it('isolates recovery of two fullscreen instances and releases observers on unmount', async () => {
    const first = track(mount(Watermark, { props: { fullscreen: true }, attachTo: document.body }))
    const second = track(mount(Watermark, { props: { fullscreen: true }, attachTo: document.body }))
    await settle()
    const [firstLayer, secondLayer] = document.querySelectorAll('.scq-watermark__layer')
    firstLayer.remove()
    await settle()
    expect(first.emitted('restore')).toHaveLength(1)
    expect(second.emitted('restore')).toBeUndefined()
    first.unmount()
    await settle()
    expect(firstLayer.isConnected).toBe(false)
    expect(secondLayer.isConnected).toBe(true)
    secondLayer.remove()
    await settle()
    expect(second.emitted('restore')).toHaveLength(1)
  })

  it('distinguishes redraw requests from recovery and supports print opt-out', async () => {
    const wrapper = track(mount(Watermark))
    await settle()
    await wrapper.setProps({ content: 'Updated', print: false })
    await settle()
    expect(wrapper.get('.scq-watermark__layer').classes()).toContain('is-print-hidden')
    expect(wrapper.emitted('restore')).toBeUndefined()
    expect(wrapper.emitted('redraw')).toHaveLength(2)
    wrapper.vm.redraw()
    expect(wrapper.emitted('redraw')).toHaveLength(3)
  })

  it('renders deterministic text during SSR without touching the document', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(Watermark, { content: 'Server text' }) }))
    expect(html).toContain('scq-watermark')
    expect(html).toContain('Server%20text')
    expect(html).toContain('aria-hidden="true"')
  })

  it.each([{ gap: 0 }, { size: -1 }, { lineHeight: 0 }, { imageOpacity: 2 }, { zIndex: Infinity }, { zIndex: NaN }])('rejects invalid dimensions or opacity: %j', (props) => {
    expect(() => mount(Watermark, { props })).toThrow('Watermark requires')
  })
})

describe('Watermark image requests', () => {
  const DATA = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E'

  it('decodes and embeds images alongside text without a canvas or external SVG references', async () => {
    vi.stubGlobal('Image', FakeImage)
    const wrapper = track(mount(Watermark, { props: { image: DATA, content: 'Member', imageOpacity: .2 } }))
    await settle()
    expect(wrapper.vm.pending).toBe(true)
    sources[0].onload?.(new Event('load'))
    await settle()
    const content = svg(wrapper.get<HTMLElement>('.scq-watermark__layer').element)
    expect(content).toContain(`<image href="${DATA}"`)
    expect(content).toContain('opacity="0.2"')
    expect(content).toContain('Member')
    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.emitted('redraw')?.at(-1)?.[0]).toMatchObject({ imageLoaded: true })
  })

  it('isolates replaced and unmounted image decoders', async () => {
    vi.stubGlobal('Image', FakeImage)
    const onError = vi.fn()
    const wrapper = track(mount(Watermark, { props: { image: DATA, onError } }))
    await settle()
    const late = sources[0].onload
    await wrapper.setProps({ image: `${DATA}new` })
    await settle()
    expect(sources[0].src).toBe('')
    late?.(new Event('load'))
    await settle()
    expect(svg(wrapper.get<HTMLElement>('.scq-watermark__layer').element)).not.toContain('<image')
    wrapper.unmount()
    expect(sources[1].src).toBe('')
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports decode errors while retaining the text watermark', async () => {
    vi.stubGlobal('Image', FakeImage)
    const onError = vi.fn()
    const wrapper = track(mount(Watermark, { props: { image: DATA, content: 'Visible text', onError } }))
    await settle()
    sources[0].onerror?.(new Event('error'))
    await settle()
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    const content = svg(wrapper.get<HTMLElement>('.scq-watermark__layer').element)
    expect(content).toContain('Visible text')
    expect(content).not.toContain('<image')
  })

  it('cancels fetches and rejects unsuccessful responses explicitly', async () => {
    const pending = new Promise<Response>(() => {})
    const fetch = vi.fn().mockReturnValueOnce(pending).mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', fetch)
    const onError = vi.fn()
    const wrapper = track(mount(Watermark, { props: { image: '/first.svg', onError } }))
    await settle()
    const signal: AbortSignal = fetch.mock.calls[0][1].signal
    await wrapper.setProps({ image: '/missing.svg' })
    await settle()
    expect(signal.aborted).toBe(true)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('404') }))
  })

  it('reads successful remote image blobs before embedding them', async () => {
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, blob: async () => new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], { type: 'image/svg+xml' }),
    }))
    const wrapper = track(mount(Watermark, { props: { image: '/logo.svg' } }))
    await vi.waitFor(() => expect(sources).toHaveLength(1))
    expect(sources[0].src).toMatch(/^data:image\/svg\+xml;base64,/)
    sources[0].onload?.(new Event('load'))
    await settle()
    expect(svg(wrapper.get<HTMLElement>('.scq-watermark__layer').element)).toContain('<image href="data:image/svg+xml;base64,')
  })

  it('rejects non-image response types rather than embedding an error page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, blob: async () => new Blob(['Error'], { type: 'text/html' }),
    }))
    const onError = vi.fn()
    track(mount(Watermark, { props: { image: '/logo.svg', onError } }))
    await settle()
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError))
  })
})
