// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Icon from '../src/components/Icon/Icon.vue'
import { brandIconPaths, solidBrandIconPaths } from '../src/components/Icon/brands'
import { iconNames, iconPaths, solidIconNames, solidIconPaths, type IconName } from '../src/components/Icon/icons'

const wrappers: VueWrapper[] = []
const brands = ['wechat', 'alipay', 'qq', 'weibo', 'douyin', 'bilibili', 'zhihu', 'baidu', 'taobao', 'tmall', 'jd', 'pinduoduo', 'xiaohongshu', 'meituan', 'ctrip', 'amap', 'dingding', 'feishu'] as const
const outlineStrokeWidths: Partial<Record<IconName, number>> = { tmall: 1.5, jd: 1.25, pinduoduo: 1.5, ctrip: 1.25, amap: 1.5, feishu: 1.5 }

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('Icon brand artwork', () => {
  it.each(['constructor', 'toString', '__proto__', 'valueOf'])('treats inherited object keys as unknown icon names: %s', name => {
    const wrapper = mount(Icon, { props: { name } })
    wrappers.push(wrapper)
    expect(wrapper.classes()).toContain('scq-icon--file')
    expect(wrapper.findAll('path').map(path => path.attributes('d'))).toEqual(iconPaths.file)
  })

  it.each([Number.NaN, Infinity, -Infinity])('rejects non-finite numeric dimensions: %s', size => {
    expect(() => mount(Icon, { props: { name: 'check', size } })).toThrow('must be finite')
  })

  it('normalizes negative dimensions while preserving valid CSS dimensions', async () => {
    const wrapper = mount(Icon, { props: { name: 'check', size: -1 } })
    wrappers.push(wrapper)
    expect(wrapper.element.style.getPropertyValue('--scq-icon-size')).toBe('0px')
    await wrapper.setProps({ size: '1.5em' })
    expect(wrapper.element.style.getPropertyValue('--scq-icon-size')).toBe('1.5em')
  })
  it('keeps all 18 brand names available in both public registries', () => {
    expect(Object.keys(brandIconPaths)).toEqual(brands)
    expect(Object.keys(solidBrandIconPaths)).toEqual(brands)
    expect(iconNames).toEqual(expect.arrayContaining(brands))
    expect(solidIconNames).toEqual(expect.arrayContaining(brands))
  })

  it.each(brands)('renders separate outline and solid drawings for %s', async (name) => {
    const wrapper = mount(Icon, { props: { name } })
    wrappers.push(wrapper)
    const svg = wrapper.get('svg')
    const strokeWidth = outlineStrokeWidths[name] ?? 0

    expect(wrapper.classes()).toContain(`scq-icon--${name}`)
    expect(wrapper.classes()).toContain('scq-icon--outline')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(svg.attributes('fill')).toBe(strokeWidth ? 'none' : 'currentColor')
    expect(svg.attributes('stroke')).toBe(strokeWidth ? 'currentColor' : 'none')
    expect(svg.attributes('stroke-width')).toBe(String(strokeWidth))
    expect(wrapper.findAll('path').map((node) => node.attributes('d'))).toEqual(iconPaths[name])

    await wrapper.setProps({ variant: 'solid' })
    expect(wrapper.classes()).toContain('scq-icon--solid')
    expect(svg.attributes('fill')).toBe('currentColor')
    expect(svg.attributes('stroke')).toBe('none')
    expect(svg.attributes('stroke-width')).toBe('0')
    expect(wrapper.findAll('path').map((node) => node.attributes('d'))).toEqual(solidIconPaths[name])
    expect(solidIconPaths[name]).not.toEqual(iconPaths[name])
  })

  it.each(['qq', 'tmall', 'jd', 'pinduoduo', 'xiaohongshu', 'meituan', 'ctrip', 'amap', 'feishu'] as const)('preserves transparent cutouts for %s', (name) => {
    const wrapper = mount(Icon, { props: { name, variant: 'solid' } })
    wrappers.push(wrapper)
    expect(wrapper.get('svg').attributes('fill-rule')).toBe('evenodd')
    expect(wrapper.findAll('path').every((node) => node.attributes('fill') === undefined)).toBe(true)
  })

  it('retains size and color customization across both variants', async () => {
    const wrapper = mount(Icon, { props: { name: 'wechat', size: 32, color: '#07c160' } })
    wrappers.push(wrapper)
    expect(wrapper.element.style.getPropertyValue('--scq-icon-size')).toBe('32px')
    expect(wrapper.element.style.color).toBe('rgb(7, 193, 96)')

    await wrapper.setProps({ variant: 'solid', size: '1.5em', color: '' })
    expect(wrapper.element.style.getPropertyValue('--scq-icon-size')).toBe('1.5em')
    expect(wrapper.element.style.color).toBe('')
    expect(wrapper.get('svg').attributes('fill')).toBe('currentColor')
  })

  it('does not leak brand rendering settings into ordinary icons', async () => {
    const wrapper = mount(Icon, { props: { name: 'qq' } })
    wrappers.push(wrapper)
    await wrapper.setProps({ name: 'copy' })
    expect(wrapper.get('svg').attributes('fill')).toBe('none')
    expect(wrapper.get('svg').attributes('fill-rule')).toBeUndefined()
    expect(wrapper.get('svg').attributes('stroke')).toBe('currentColor')
    expect(wrapper.get('svg').attributes('stroke-width')).toBe('2')
    expect(wrapper.findAll('path').map((node) => node.attributes('d'))).toEqual(iconPaths.copy)

    await wrapper.setProps({ variant: 'solid' })
    expect(wrapper.get('svg').attributes('fill')).toBe('currentColor')
    expect(wrapper.findAll('path').map((node) => node.attributes('d'))).toEqual(solidIconPaths.copy)

    await wrapper.setProps({ name: 'ctrip', variant: 'outline' })
    expect(wrapper.get('svg').attributes('stroke-width')).toBe('1.25')
    expect(wrapper.get('svg').attributes('fill')).toBe('none')
  })

  it('preserves the unknown-name and unavailable-solid fallbacks', () => {
    const unknown = mount(Icon, { props: { name: 'not-an-icon' } })
    wrappers.push(unknown)
    expect(unknown.classes()).toContain('scq-icon--file')
    expect(unknown.findAll('path').map((node) => node.attributes('d'))).toEqual(iconPaths.file)

    const name = iconNames.find((candidate) => !solidIconPaths[candidate])
    expect(name).toBeDefined()
    if (!name) throw new Error('An outline-only icon is required to exercise the fallback')
    const outlineOnly = mount(Icon, { props: { name, variant: 'solid' } })
    wrappers.push(outlineOnly)
    expect(outlineOnly.classes()).toContain('scq-icon--outline')
    expect(outlineOnly.get('svg').attributes('fill')).toBe('none')
    expect(outlineOnly.get('svg').attributes('stroke-width')).toBe('2')
    expect(outlineOnly.findAll('path').map((node) => node.attributes('d'))).toEqual(iconPaths[name])
  })
})

describe('Icon file type artwork', () => {
  const fileTypes = ['file', 'file-pdf', 'file-word', 'file-excel', 'file-zip'] as const
  const outlineFileTypes = [...fileTypes, 'file-audio', 'file-video', 'file-image'] as const

  it.each(fileTypes)('renders %s as one compound path instead of same-color overlays', async (name) => {
    const wrapper = mount(Icon, { props: { name, variant: 'solid', size: 22, color: '#4f46e5' } })
    wrappers.push(wrapper)

    expect(wrapper.classes()).toContain('scq-icon--solid')
    expect(wrapper.get('svg').attributes('fill')).toBe('currentColor')
    expect(wrapper.get('svg').attributes('stroke')).toBe('none')
    expect(wrapper.get('svg').attributes('fill-rule')).toBeUndefined()
    expect(wrapper.findAll('path')).toHaveLength(1)
    expect(wrapper.get('path').attributes('fill')).toBeUndefined()
    expect(wrapper.get('path').attributes('d').match(/[Mm]/g)!.length).toBeGreaterThan(name === 'file' ? 1 : 2)
    expect(wrapper.element.style.getPropertyValue('--scq-icon-size')).toBe('22px')
    expect(wrapper.element.style.color).toBe('rgb(79, 70, 229)')

    await wrapper.setProps({ variant: 'outline' })
    expect(wrapper.classes()).toContain('scq-icon--outline')
    expect(wrapper.get('svg').attributes('fill')).toBe('none')
    expect(wrapper.get('svg').attributes('stroke')).toBe('currentColor')
    expect(wrapper.findAll('path').map((node) => node.attributes('d'))).toEqual(iconPaths[name])
  })

  it('changes the compound drawing when the file type changes', async () => {
    const wrapper = mount(Icon, { props: { name: 'file', variant: 'solid' } })
    wrappers.push(wrapper)
    const drawings = new Set<string>()

    for (const name of fileTypes) {
      await wrapper.setProps({ name })
      expect(solidIconNames).toContain(name)
      const drawing = wrapper.get('path').attributes('d')
      expect(drawings.has(drawing)).toBe(false)
      drawings.add(drawing)
    }
    expect(drawings.size).toBe(fileTypes.length)
  })

  it.each(outlineFileTypes)('aligns the %s fold with the document edge', (name) => {
    expect(iconPaths[name].slice(0, 2)).toEqual(['M6 3h8l4 4v14H6z', 'M14 3v4h4'])
  })
})
