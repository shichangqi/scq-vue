// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IconDocView from '../playground/src/views/IconDocView.vue'
import { locale, t, type Locale } from '../playground/src/i18n'
import Message from '../src/components/Message'

const LOCALES: Locale[] = ['zh-CN', 'en-US']
const ICON_CASES = [
  { variant: 'outline', code: '<scq-icon name="copy" />' },
  { variant: 'solid', code: '<scq-icon name="copy" variant="solid" />' },
] as const
const wrappers: VueWrapper[] = []
const writeText = vi.fn<(text: string) => Promise<void>>()

const mountIcons = () => {
  const wrapper = mount(IconDocView, {
    global: {
      stubs: {
        DocExample: { template: '<div><slot /></div>' },
        OnDemandExample: true,
        ComponentDocView: true,
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers()
  writeText.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
})

afterEach(async () => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  Message.destroyAll()
  await flushPromises()
  vi.runAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  locale.value = 'zh-CN'
})

describe.each(LOCALES)('Icon copy feedback in %s', language => {
  beforeEach(() => { locale.value = language })

  it.each(ICON_CASES)('copies $variant code and shows success feedback', async ({ variant, code }) => {
    const wrapper = mountIcons()
    const icon = wrapper.get(`.icon-item:has(.scq-icon--${variant})`)
    await icon.trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith(code)
    expect(icon.classes()).toContain('icon-item--copied')
    expect(document.querySelector('.scq-message.is-success')?.textContent).toContain(t('icon.copied'))
    expect(document.querySelector('.scq-message.is-error')).toBeNull()
  })

  it('shows failure feedback without marking the icon as copied', async () => {
    writeText.mockRejectedValue(new Error('Clipboard permission denied'))
    const wrapper = mountIcons()
    await wrapper.get('.icon-item').trigger('click')
    await flushPromises()

    expect(document.querySelector('.scq-message.is-error')?.textContent).toContain(t('icon.copyFailed'))
    expect(document.querySelector('.scq-message.is-success')).toBeNull()
    expect(wrapper.find('.icon-item--copied').exists()).toBe(false)
  })
})

it('waits for the clipboard write before showing success', async () => {
  let finishCopy!: () => void
  writeText.mockReturnValue(new Promise<void>(resolve => { finishCopy = resolve }))
  const wrapper = mountIcons()
  await wrapper.get('.icon-item').trigger('click')
  await flushPromises()

  expect(document.querySelector('.scq-message')).toBeNull()
  expect(wrapper.find('.icon-item--copied').exists()).toBe(false)

  finishCopy()
  await flushPromises()
  expect(document.querySelector('.scq-message.is-success')?.textContent).toContain(t('icon.copied'))
})

it('shows failure feedback when the Clipboard API is unavailable', async () => {
  vi.stubGlobal('navigator', {})
  const wrapper = mountIcons()
  await wrapper.get('.icon-item').trigger('click')
  await flushPromises()

  expect(document.querySelector('.scq-message.is-error')?.textContent).toContain(t('icon.copyFailed'))
  expect(document.querySelector('.scq-message.is-success')).toBeNull()
})
