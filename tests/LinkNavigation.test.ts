// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Link from '../src/components/Link/Link.vue'
import ConfigProvider from '../src/components/ConfigProvider/ConfigProvider.vue'
import { provideNavigationAdapter, type NavigationAdapter, type NavigationOptions } from '../src/utils/navigation'

const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T): T => { wrappers.push(wrapper); return wrapper }
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const resolve = (to: string) => ({ href: `#${to}` })
afterEach(async () => {
  wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount())
  await flushPromises()
  vi.restoreAllMocks()
})

describe('Link semantics', () => {
  it('switches between commands and native links without retaining obsolete semantics', async () => {
    const wrapper = track(mount(Link, { attrs: { id: 'dynamic-link', 'aria-label': 'Dynamic action' }, slots: { default: 'Action' } }))
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    await wrapper.setProps({ href: '#guide' })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.attributes('href')).toBe('#guide')
    expect(wrapper.attributes('role')).toBe('link')
    await wrapper.setProps({ href: '' })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBe('Dynamic action')
    expect(wrapper.attributes('id')).toBe('dynamic-link')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })

  it('re-evaluates native download intent before deciding whether to use an adapter', async () => {
    const download = ref<string>()
    const navigate = vi.fn(() => true)
    const adapter: NavigationAdapter = { resolve, navigate }
    const wrapper = track(mount(defineComponent({
      setup: () => () => h(Link, { to: '/guide', adapter, download: download.value }),
    })))
    download.value = 'guide.html'
    await nextTick()
    wrapper.element.addEventListener('click', event => event.preventDefault(), { once: true })
    await wrapper.trigger('click')
    await flushPromises()
    expect(navigate).not.toHaveBeenCalled()
    download.value = undefined
    await nextTick()
    await wrapper.trigger('click')
    await flushPromises()
    expect(navigate).toHaveBeenCalledTimes(1)
  })
  it('preserves native commands, attributes, suffix icons and custom loading content', async () => {
    const wrapper = track(mount(Link, { props: { type: 'primary', suffixIcon: 'arrowRight' }, attrs: { id: 'action', 'aria-label': 'Run command' }, slots: { default: 'Run', loading: () => h('span', 'Waiting') } }))
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toContain('scq-link--primary')
    expect(wrapper.attributes('id')).toBe('action')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ loading: true })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.get('.scq-link__loading').text()).toBe('Waiting')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('merges safe new-window rel tokens and localizes the external-link announcement', async () => {
    const wrapper = track(mount(ConfigProvider, { props: { locale: 'en-US' }, slots: {
      default: () => h(Link, { href: 'https://example.com', target: '_blank', rel: 'nofollow noopener', external: true }, { default: () => 'Documentation' }),
    } }))
    const link = wrapper.get('a')
    expect(link.attributes('rel')).toBe('nofollow noopener noreferrer')
    expect(link.attributes('role')).toBe('link')
    expect(link.text()).toContain('Opens in a new window')
    await wrapper.setProps({ locale: 'zh-CN' })
    expect(link.text()).toContain('\u5728\u65b0\u7a97\u53e3\u6253\u5f00')
  })

  it('forwards changing native attributes without relying on reactive useAttrs', async () => {
    const label = ref('Original')
    const tabindex = ref(0)
    const wrapper = track(mount(defineComponent({
      setup: () => () => h(Link, { href: '#guide', 'aria-label': label.value, tabindex: tabindex.value }),
    })))
    label.value = 'Updated'
    tabindex.value = 2
    await nextTick()
    expect(wrapper.get('a').attributes('aria-label')).toBe('Updated')
    expect(wrapper.get('a').attributes('tabindex')).toBe('2')
  })

  it('reports unsafe URLs and blocks disabled activation', async () => {
    const onError = vi.fn()
    const wrapper = track(mount(Link, { props: { href: 'javascript:alert(1)', onError } }))
    expect(wrapper.attributes('href')).toBeUndefined()
    await wrapper.trigger('click')
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError), 'javascript:alert(1)')
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.setProps({ href: '#guide', disabled: true })
    await wrapper.trigger('click')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('Optional navigation adapters', () => {
  it('tracks current and exact routes while honoring explicit active state', async () => {
    const current = ref('/guide/example')
    const adapter: NavigationAdapter = {
      resolve: (to) => ({ href: `#${to}`, active: current.value.startsWith(to), exactActive: current.value === to }),
      navigate: (to) => { current.value = to },
    }
    const wrapper = track(mount(Link, { props: { to: '/guide', adapter } }))
    expect(wrapper.attributes('aria-current')).toBe('page')
    await wrapper.setProps({ exact: true })
    expect(wrapper.attributes('aria-current')).toBeUndefined()
    current.value = '/guide'
    await nextTick()
    expect(wrapper.attributes('aria-current')).toBe('page')
    await wrapper.setProps({ active: false })
    expect(wrapper.attributes('aria-current')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('is-active')
  })

  it('uses scoped adapters, supports reactive replacement and prioritizes explicit adapters', async () => {
    const first = vi.fn().mockResolvedValue(true)
    const second = vi.fn().mockResolvedValue(true)
    const third = vi.fn().mockResolvedValue(true)
    const adapter = shallowRef<NavigationAdapter>({ resolve, navigate: first })
    const wrapper = track(mount(defineComponent({
      setup() {
        provideNavigationAdapter(adapter)
        return () => h('div', [h(Link, { to: '/first' }), h(Link, { to: '/explicit', adapter: { resolve, navigate: third } })])
      },
    })))
    await wrapper.findAll('a')[0].trigger('click')
    await flushPromises()
    expect(first).toHaveBeenCalledTimes(1)
    adapter.value = { resolve, navigate: second }
    await nextTick()
    await wrapper.findAll('a')[0].trigger('click')
    await wrapper.findAll('a')[1].trigger('click')
    await flushPromises()
    expect(second).toHaveBeenCalledTimes(1)
    expect(third).toHaveBeenCalledTimes(1)
    const isolated = track(mount(Link, { props: { href: '#native' } }))
    expect(isolated.attributes('href')).toBe('#native')
  })

  it('runs one in-flight navigation and emits acceptance only after completion', async () => {
    const pending = deferred<boolean>()
    const navigate = vi.fn((_to: string, _options: NavigationOptions) => pending.promise)
    const wrapper = track(mount(Link, { props: { to: '/guide', replace: true, adapter: { resolve, navigate } } }))
    for (let index = 0; index < 10; index += 1) await wrapper.trigger('click')
    await flushPromises()
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate.mock.calls[0][1]).toMatchObject({ replace: true, signal: expect.any(AbortSignal) })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.vm.pending).toBe(true)
    pending.resolve(true)
    await flushPromises()
    expect(wrapper.emitted('navigate')).toEqual([['/guide']])
    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.attributes('href')).toBe('#/guide')
  })

  it('distinguishes refusal from failure and allows retry', async () => {
    const failure = new Error('Navigation failed')
    const onError = vi.fn()
    const navigate = vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(failure).mockResolvedValue(true)
    const wrapper = track(mount(Link, { props: { to: '/guide', adapter: { resolve, navigate }, onError } }))
    await wrapper.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('navigate')).toBeUndefined()
    expect(onError).not.toHaveBeenCalled()
    await wrapper.trigger('click')
    await flushPromises()
    expect(onError).toHaveBeenCalledWith(failure, '/guide')
    await wrapper.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('navigate')).toEqual([['/guide']])
  })

  it.each(['cancel', 'to', 'adapter', 'disabled', 'loading', 'unmount'] as const)('cancels old results on %s', async (action) => {
    const pending = deferred<boolean>()
    const onError = vi.fn()
    const navigate = vi.fn((_to: string, _options: NavigationOptions) => pending.promise)
    const wrapper = track(mount(Link, { props: { to: '/old', adapter: { resolve, navigate }, onError } }))
    await wrapper.trigger('click')
    await flushPromises()
    const signal = navigate.mock.calls[0][1].signal
    if (action === 'cancel') wrapper.vm.cancelPending()
    else if (action === 'to') await wrapper.setProps({ to: '/new' })
    else if (action === 'adapter') await wrapper.setProps({ adapter: { resolve, navigate: () => true } })
    else if (action === 'unmount') wrapper.unmount()
    else await wrapper.setProps({ [action]: true })
    expect(signal.aborted).toBe(true)
    pending.reject(new Error('Late rejection'))
    await flushPromises()
    expect(onError).not.toHaveBeenCalled()
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { button: 1 }])('preserves native modified activation: %j', async (settings) => {
    const navigate = vi.fn()
    const wrapper = track(mount(Link, { props: { to: '/guide', adapter: { resolve, navigate } } }))
    let prevented: boolean | undefined
    wrapper.element.addEventListener('click', (event) => { prevented = event.defaultPrevented; event.preventDefault() }, { once: true })
    await wrapper.trigger('click', settings)
    await flushPromises()
    expect(prevented).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })

  it.each(['target', 'download', 'listener'] as const)('preserves %s behavior without forcing router navigation', async (mode) => {
    const navigate = vi.fn()
    const wrapper = track(mount(Link, {
      props: { to: '/guide', adapter: { resolve, navigate }, ...(mode === 'target' ? { target: '_blank' as const } : {}), ...(mode === 'listener' ? { onClick: (event: MouseEvent) => event.preventDefault() } : {}) },
      attrs: mode === 'download' ? { download: 'guide.html' } : {},
    }))
    wrapper.element.addEventListener('click', (event) => event.preventDefault(), { once: true })
    await wrapper.trigger('click')
    await flushPromises()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('bridges Vue Router through the public adapter without requiring it inside Link', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/first', component: { render: () => null } }, { path: '/second', component: { render: () => null } },
    ] })
    await router.push('/first')
    const adapter: NavigationAdapter = {
      resolve: (to) => ({ href: router.resolve(to).href, exactActive: router.currentRoute.value.path === to }),
      navigate: async (to, { replace, signal }) => {
        if (signal.aborted) return false
        const failure = await (replace ? router.replace(to) : router.push(to))
        return !failure && !signal.aborted
      },
    }
    const wrapper = track(mount(Link, { props: { to: '/second', adapter } }))
    await wrapper.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/second')
    expect(wrapper.attributes('aria-current')).toBe('page')
    expect(wrapper.emitted('navigate')).toEqual([['/second']])
  })

  it('rejects missing adapters and unsafe resolved destinations explicitly', () => {
    expect(() => mount(Link, { props: { to: '/guide' } })).toThrow('requires an adapter')
    expect(() => mount(Link, { props: { to: '/guide', adapter: { resolve: () => ({ href: 'javascript:alert(1)' }), navigate: () => true } } })).toThrow('safe href')
    expect(() => provideNavigationAdapter({ resolve, navigate: () => true })).toThrow('during setup')
  })
})
