// @vitest-environment jsdom

import { createApp, createSSRApp, h, type Component, type Plugin } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'vue/compiler-sfc'
import ScqVue, { Button, Calendar, Divider, Form, FormItem, Input, Switch, ConfigProvider, Tabs, ScqSwitch } from '../src/index'

type InstallableComponent = Component & Plugin & { name: string }
const componentEntries = import.meta.glob<{ default: InstallableComponent }>('../src/components/*/index.ts', { eager: true })
const componentNames = Object.values(componentEntries).map((entry) => entry.default.name)
const libraryEntries = import.meta.glob<{ default: Plugin; [name: string]: unknown }>('../src/index.{js,ts}', { eager: true })
const stylesDirectory = resolve(__dirname, '../styles')
const styles = Object.fromEntries(readdirSync(stylesDirectory)
  .filter((name) => name.endsWith('.css'))
  .map((name) => [`../styles/${name}`, readFileSync(resolve(stylesDirectory, name), 'utf8')]))
const styleDependencies: Record<string, string[]> = {
  calendar: ['tokens', 'icon'],
  swipe: ['icon'],
  'action-bar': ['icon', 'loading', 'badge'],
  'date-picker': ['field', 'calendar', 'popover'],
  'time-picker': ['field', 'icon', 'popover'],
  'date-time-picker': ['tokens', 'field', 'calendar', 'time-picker', 'popover'],
  upload: ['icon', 'progress'],
  rate: ['icon'],
  'auto-complete': ['field', 'icon', 'popover', 'virtual-list'],
  cascader: ['field', 'icon', 'popover'],
  'tree-select': ['field', 'tree', 'popover'],
  transfer: ['icon', 'virtual-list'],
  menu: ['icon', 'popover'],
  dropdown: ['menu'],
  breadcrumb: ['link'],
  steps: ['icon'],
  image: ['icon'],
  card: ['skeleton'],
  tree: ['icon', 'loading', 'virtual-list'],
  notification: ['icon'],
  popconfirm: ['popover', 'icon', 'loading'],
  result: ['icon'],
  link: ['icon', 'loading'],
  divider: ['tokens'],
  container: ['drawer', 'icon'],
  typography: ['icon'],
  toast: ['icon'],
  search: ['icon'],
  'notice-bar': ['icon'],
  avatar: ['icon'],
  collapse: ['icon'],
  'collapse-item': ['collapse'],
  input: ['icon'],
  'input-number': ['icon'],
  'chat-choice': ['button', 'input', 'radio', 'checkbox'],
  'chat-message': ['icon'],
  alert: ['icon'],
  empty: ['icon'],
  tag: ['icon'],
  pagination: ['icon'],
  cell: ['icon'],
  'nav-bar': ['icon'],
  tabbar: ['badge', 'icon'],
  drawer: ['icon'],
  'action-sheet': ['drawer', 'loading', 'icon'],
  table: ['empty', 'loading', 'icon', 'pagination', 'popover'],
  select: ['virtual-list'],
  'form-item': ['form'],
  'cell-group': ['cell'],
  'radio-group': ['radio'],
  'checkbox-group': ['checkbox'],
  'config-provider': ['tokens'],
}

describe('Library integration', () => {
  it.each([['success', 'success'], ['warning', 'warning'], ['exception', 'danger']])('keeps %s progress gradients and shadows connected to theme tokens', (status, token) => {
    const rule = styles['../styles/progress.css'].match(new RegExp(`\\.scq-progress--${status} \\.scq-progress__fill \\{([^}]+)\\}`))?.[1]
    expect(rule).toContain('var(--scq-progress-color)')
    expect(rule).toContain(`var(--scq-color-${token}-hover,`)
    expect(rule).toContain(`var(--scq-color-${token}-shadow,`)
  })
  it.each([false, true])('keeps unlabeled dividers continuous (empty slot=%s)', (emptySlot) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = styles['../styles/divider.css']
    document.head.append(stylesheet)
    const wrapper = mount(Divider, { attachTo: document.body, slots: emptySlot ? { default: () => [] } : {} })
    try {
      expect(parseFloat(getComputedStyle(wrapper.element).gap)).toBe(0)
      const label = wrapper.find('.scq-divider__text')
      if (label.exists()) expect(getComputedStyle(label.element).display).toBe('none')
      expect(styles['../styles/divider.css']).toContain('margin-inline: var(--scq-divider-gap)')
    } finally {
      wrapper.unmount()
      stylesheet.remove()
    }
  })
  it.each([
    ['individual', styles['../styles/button.css']],
    ['component', parse(readFileSync(resolve(__dirname, '../src/components/Button/Button.vue'), 'utf8')).descriptor.styles.map(style => style.content).join('\n')],
  ])('keeps circular loading names accessible and respects reduced motion in %s styles', (_name, css) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = css
    document.head.append(stylesheet)
    const wrapper = mount(Button, { props: { circle: true, loading: true }, slots: { default: 'Save' }, attachTo: document.body })
    try {
      const content = getComputedStyle(wrapper.get('.my-btn__content').element)
      expect(content.display).not.toBe('none')
      expect(content.visibility).not.toBe('hidden')
      expect(content.clipPath).toBe('inset(50%)')
      expect(css).toContain('@media (prefers-reduced-motion: reduce)')
      expect(css).toMatch(/\.my-btn__loading-svg\s*\{[^}]*animation:\s*none;/)
    } finally {
      wrapper.unmount()
      stylesheet.remove()
    }
  })
  it('keeps calendar visibility immediate so positioned panels can receive focus', () => {
    const transition = styles['../styles/calendar.css'].match(/\.scq-calendar button \{[^}]*transition:\s*([^;]+);/)?.[1]
    expect(transition).toContain('transform var(--scq-transition-fast)')
    expect(transition).toContain('background-color var(--scq-transition-fast)')
    expect(transition).not.toMatch(/\ball\b|\bvisibility\b/)
  })
  it('keeps time-option visibility immediate and shares visual transitions with footer actions', () => {
    const css = styles['../styles/time-picker.css']
    const transition = css.match(/\.scq-time-picker__cell,\s*\.scq-time-picker__btn \{[^}]*transition:\s*([^;]+);/)?.[1]
    expect(transition).toContain('background-color var(--scq-transition-fast)')
    expect(transition).not.toMatch(/\ball\b|\bvisibility\b/)
    expect(css).not.toMatch(/transition:\s*all\b/)
  })
  it.each([
    ['individual', styles['../styles/input.css']],
    ['component', parse(readFileSync(resolve(__dirname, '../src/components/Input/Input.vue'), 'utf8')).descriptor.styles.map(style => style.content).join('\n')],
  ])('allows full-width inputs to shrink without collapsing controls in %s styles', (_name, css) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = css
    document.head.append(stylesheet)
    const wrapper = mount(Input, { props: { modelValue: 'Draft', clearable: true }, slots: { prefix: 'Prefix', suffix: 'Suffix' }, attachTo: document.body })
    try {
      for (const element of [wrapper.element, wrapper.get('.scq-input__wrapper').element, wrapper.get('input').element]) {
        expect(parseFloat(getComputedStyle(element).minWidth)).toBe(0)
      }
      expect(getComputedStyle(wrapper.element).maxWidth).toBe('100%')
      for (const control of wrapper.findAll('.scq-input__prefix, .scq-input__suffix, .scq-input__clear')) {
        expect(getComputedStyle(control.element).flexShrink).toBe('0')
      }
    } finally {
      wrapper.unmount()
      stylesheet.remove()
    }
  })

  it.each([
    ['individual', styles['../styles/input.css']],
    ['component', parse(readFileSync(resolve(__dirname, '../src/components/Input/Input.vue'), 'utf8')).descriptor.styles.map(style => style.content).join('\n')],
  ])('keeps input focus inset with semantic borders in %s styles', async (_name, css) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = css
    document.head.append(stylesheet)
    try {
      const rules = Array.from(stylesheet.sheet!.cssRules).filter((rule): rule is CSSStyleRule => 'selectorText' in rule)
      const rootRule = rules.find(rule => rule.selectorText === '.scq-input')
      expect(rootRule?.style.getPropertyValue('--scq-input-border-width')).toBe('var(--scq-control-border-width, 1px)')
      expect(rootRule?.style.getPropertyValue('--scq-input-border-radius')).toBe('var(--scq-control-radius, 4px)')
      const surfaceRule = rules.find(rule => rule.selectorText === '.scq-input__wrapper')
      expect(surfaceRule?.style.getPropertyValue('border')).toBe('none')
      expect(surfaceRule?.style.getPropertyValue('padding')).toBe('var(--scq-input-border-width)')
      expect(surfaceRule?.style.getPropertyValue('border-radius')).toBe('var(--scq-input-border-radius)')
      const hoverRule = rules.find(rule => rule.selectorText === '.scq-input__wrapper:hover')
      expect(hoverRule?.style.getPropertyValue('--scq-input-border-color')).toContain('var(--scq-border-hover,')
      const focusRule = rules.find(rule => rule.selectorText === '.scq-input.is-focus .scq-input__wrapper')
      expect(focusRule?.style.getPropertyValue('--scq-input-border-color')).toContain('var(--scq-primary,')
      for (const [status, token] of [['success', 'success'], ['warning', 'warning'], ['error', 'danger']]) {
        const statusRule = rules.find(rule => rule.selectorText === `.scq-input.scq-input--${status} .scq-input__wrapper`)
        expect(statusRule?.style.getPropertyValue('--scq-input-border-color')).toContain(`var(--scq-${token},`)
      }
      for (const type of ['text', 'textarea'] as const) {
        for (const status of ['default', 'success', 'warning', 'error'] as const) {
          const wrapper = mount(Input, { props: { type, status }, attachTo: document.body })
          try {
            const surface = wrapper.get('.scq-input__wrapper').element
            const control = wrapper.get('input, textarea')
            const insetBorder = '0 0 0 var(--scq-input-border-width) var(--scq-input-border-color) inset'
            const statusToken = { default: 'primary', success: 'success', warning: 'warning', error: 'danger' }[status]
            expect(getComputedStyle(surface).boxShadow).toBe(insetBorder)
            await control.trigger('focus')
            expect(wrapper.classes()).toContain('is-focus')
            expect(getComputedStyle(surface).boxShadow).toBe(insetBorder)
            expect(getComputedStyle(surface).getPropertyValue('--scq-input-border-color')).toContain(`var(--scq-${statusToken},`)
            await wrapper.setProps({ disabled: true })
            expect(getComputedStyle(surface).boxShadow).toBe(insetBorder)
            expect(getComputedStyle(surface).getPropertyValue('--scq-input-border-color')).toContain('var(--scq-border,')
            await wrapper.setProps({ disabled: false })
            await control.trigger('blur')
            expect(wrapper.classes()).not.toContain('is-focus')
            expect(getComputedStyle(surface).boxShadow).toBe(insetBorder)
          } finally {
            wrapper.unmount()
          }
        }
      }
    } finally {
      stylesheet.remove()
    }
  })

  it.each([
    ['field', '.scq-field'], ['form', '.scq-form-item.is-error'],
    ['select', '.scq-select__control'], ['input-number', '.scq-input-number'],
    ['search', '.scq-search__field'], ['cascader', '.scq-cascader__filter'],
    ['tree-select', '.scq-tree-select__filter'], ['transfer', '.scq-transfer__search'],
  ])('keeps %s control borders inset without colored halos', (name, selector) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = styles[`../styles/${name}.css`]
    document.head.append(stylesheet)
    try {
      const rules = Array.from(stylesheet.sheet!.cssRules).filter((rule): rule is CSSStyleRule => 'selectorText' in rule)
      const shadows = rules.filter(rule => rule.selectorText.includes(selector)).map(rule => rule.style.getPropertyValue('box-shadow')).filter(Boolean)
      expect(shadows.length).toBeGreaterThan(0)
      for (const shadow of shadows) {
        expect(shadow).toContain('var(--scq-control-border-width, 1px)')
        expect(shadow).toContain('inset')
        expect(shadow).not.toContain('rgba(')
      }
      if (name === 'form') expect(shadows[0]).toContain('var(--scq-danger,')
    } finally {
      stylesheet.remove()
    }
  })

  it.each(['checkbox', 'radio', 'switch', 'slider', 'action-bar', 'calendar', 'pagination', 'popconfirm', 'upload', 'steps', 'dropdown', 'transfer'])('keeps %s keyboard focus visible with a solid inset border', (name) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = styles[`../styles/${name}.css`]
    document.head.append(stylesheet)
    try {
      const rules = Array.from(stylesheet.sheet!.cssRules).filter((rule): rule is CSSStyleRule => 'selectorText' in rule)
      const focusRules = rules.filter(rule => rule.selectorText.includes(':focus-visible') && rule.style.getPropertyValue('box-shadow'))
      expect(focusRules.length).toBeGreaterThan(0)
      for (const rule of focusRules) {
        expect(rule.style.getPropertyValue('box-shadow')).toContain('var(--scq-control-border-width, 1px)')
        expect(rule.style.getPropertyValue('box-shadow')).toContain('inset')
        expect(rule.style.getPropertyValue('box-shadow')).not.toContain('rgba(')
      }
    } finally {
      stylesheet.remove()
    }
  })

  it.each([
    ['individual', styles['../styles/button.css']],
    ['component', parse(readFileSync(resolve(__dirname, '../src/components/Button/Button.vue'), 'utf8')).descriptor.styles.map(style => style.content).join('\n')],
  ])('keeps all button colors and variants focused without halos in %s styles', (_name, css) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = css
    document.head.append(stylesheet)
    try {
      for (const type of ['default', 'primary', 'success', 'warning', 'info', 'danger']) {
        for (const variant of ['', 'is-plain', 'is-text', 'is-link']) {
          const button = document.createElement('button')
          button.className = `my-btn my-btn--${type} ${variant}`
          document.body.append(button)
          try {
            expect(button.matches(':focus-visible')).toBe(false)
            button.focus()
            expect(getComputedStyle(button).boxShadow).toContain('var(--scq-control-border-width, 1px)')
            expect(getComputedStyle(button).boxShadow).toContain('inset')
            expect(getComputedStyle(button).getPropertyValue('--btn-focus-ring-color')).toBe(type === 'default' ? 'var(--scq-primary, #2563eb)' : 'currentColor')
            button.classList.add('is-disabled')
            expect(getComputedStyle(button).boxShadow).toBe('none')
          } finally {
            button.remove()
          }
        }
      }
    } finally {
      stylesheet.remove()
    }
  })

  it('keeps zero-offset focus rings inset in distributed and component styles', () => {
    const sources = [
      ...Object.entries(styles),
      ...['Button', 'Input', 'Select'].map(name => [name, parse(readFileSync(resolve(__dirname, `../src/components/${name}/${name}.vue`), 'utf8')).descriptor.styles.map(style => style.content).join('\n')]),
    ]
    for (const [name, css] of sources) {
      const stylesheet = document.createElement('style')
      stylesheet.textContent = css
      document.head.append(stylesheet)
      try {
        const checkRules = (rules: CSSRuleList) => {
          for (const rule of Array.from(rules)) {
            if ('style' in rule) {
              const declaration = (rule as CSSStyleRule).style
              for (const property of ['box-shadow', '--scq-focus-ring']) {
                const shadow = declaration.getPropertyValue(property)
                if (shadow.startsWith('0 0 0 ')) expect(shadow, `${name}: ${rule.cssText}`).toContain('inset')
              }
            }
            if ('cssRules' in rule) checkRules((rule as CSSGroupingRule).cssRules)
          }
        }
        checkRules(stylesheet.sheet!.cssRules)
      } finally {
        stylesheet.remove()
      }
    }
  })

  it('keeps grid placement opt-in and clamps both bounds of explicit column starts', () => {
    const css = styles['../styles/grid.css']
    expect(css).toContain('.scq-grid > .scq-grid__item')
    expect(css).toContain('grid-column-start: min(max(1, var(--scq-grid-column-start, auto)),')
    expect(css).toContain('grid-column-end: span min(max(1, var(--scq-grid-column-span, 1)), var(--scq-grid-columns))')
    const generalRule = css.match(/\.scq-grid > \* \{([^}]+)\}/)?.[1]
    expect(generalRule).toBeDefined()
    expect(generalRule).not.toMatch(/grid-column|grid-row|order:/)
  })

  it.each(Object.entries(libraryEntries))('exports and globally registers every component through %s', (_path, entry) => {
    const app = createApp({ render: () => null })
    app.use(entry.default)
    expect(new Set(componentNames).size).toBe(componentNames.length)
    for (const name of componentNames) {
      const component = entry[name] as InstallableComponent
      expect(component, name).toBeDefined()
      expect(entry[`Scq${name}`], name).toBe(component)
      expect(typeof component.install, name).toBe('function')
      const registeredName = `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
      expect(app.component(registeredName), name).toBe(component)
    }
    for (const name of ['Dialog', 'Modal', 'Message', 'Toast', 'Notification']) {
      expect(typeof entry[`use${name}`]).toBe('function')
    }
    expect(typeof entry.provideNavigationAdapter).toBe('function')
    expect(entry.LAYOUT_BREAKPOINTS).toEqual({ xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 })
    expect(entry.SPACING_TOKENS).toEqual({ none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 })
  })

  it.each(componentNames)('provides an independently installable entry for %s', (name) => {
    const entry = componentEntries[`../src/components/${name}/index.ts`]
    expect(entry, name).toBeDefined()
    expect(entry.default.name).toBe(name)
    expect(typeof entry.default.install).toBe('function')
    const app = createApp({ render: () => null })
    app.use(entry.default)
    const registeredName = `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
    expect(app.component(registeredName)).toBe(entry.default)
  })

  it.each(componentNames)('provides an individual stylesheet for %s', (name) => {
    const styleName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    expect(styles[`../styles/${styleName}.css`], name).toBeTruthy()
  })

  it.each(['primary', 'success', 'warning', 'info', 'danger'])('keeps %s gradients off plain, text, and link buttons', async (type) => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = styles['../styles/button.css']
    document.head.append(stylesheet)
    const wrapper = mount(Button, { props: { type }, attachTo: document.body })
    try {
      const gradientRules = Array.from(stylesheet.sheet!.cssRules)
        .filter((rule): rule is CSSStyleRule => 'selectorText' in rule && rule.style.cssText.includes('gradient('))
      const matchingGradients = () => gradientRules.filter((rule) => wrapper.element.matches(rule.selectorText))
      if (type !== 'info') {
        for (const rule of gradientRules.filter((rule) => rule.selectorText.includes(`.my-btn--${type}:`))) {
          expect(rule.style.background).toContain(`var(--scq-color-${type}`)
        }
      }
      // jsdom does not resolve CSS variables inside gradients.
      expect(matchingGradients()).toHaveLength(1)
      for (const variant of ['plain', 'text', 'link'] as const) {
        await wrapper.setProps({ plain: false, text: false, link: false, [variant]: true })
        expect(wrapper.classes()).toContain(`is-${variant}`)
        expect(matchingGradients().map((rule) => rule.selectorText), variant).toEqual([])
        expect(getComputedStyle(wrapper.element).backgroundImage, variant).not.toContain('gradient(')
      }
      await wrapper.setProps({ link: false })
      expect(matchingGradients()).toHaveLength(1)
    } finally {
      wrapper.unmount()
      stylesheet.remove()
    }
  })

  it.each(['single', 'multiple', 'range'] as const)('keeps Calendar %s selections readable on hover', async (type) => {
    const hoverAttribute = 'data-hovered'
    const stylesheet = document.createElement('style')
    // jsdom cannot drive :hover; an attribute preserves its selector specificity.
    stylesheet.textContent = styles['../styles/calendar.css'].replaceAll(':hover', `[${hoverAttribute}]`)
    document.head.append(stylesheet)
    const wrapper = mount(Calendar, {
      props: { type, month: '2026-10', showConfirm: true, disabledDate: (date: Date) => date.getDay() === 0 },
      attachTo: document.body,
    })
    try {
      await wrapper.get('[data-date="2026-10-15"]').trigger('click')
      if (type !== 'single') await wrapper.get('[data-date="2026-10-17"]').trigger('click')
      const selected = wrapper.findAll('.scq-calendar__cell.is-selected button')
      expect(selected).toHaveLength(type === 'single' ? 1 : 2)
      for (const button of [...selected, wrapper.get('.scq-calendar__confirm')]) {
        const normal = getComputedStyle(button.element)
        expect(normal.backgroundImage).toContain('linear-gradient(')
        button.element.setAttribute(hoverAttribute, '')
        const hovered = getComputedStyle(button.element)
        expect(hovered.backgroundImage).toBe(normal.backgroundImage)
        expect(hovered.color).toBe(normal.color)
        expect(hovered.transform).not.toContain('scale(')
      }
      const available = wrapper.get('[data-date="2026-10-16"]')
      const normalTransform = getComputedStyle(available.element).transform
      available.element.setAttribute(hoverAttribute, '')
      expect(getComputedStyle(available.element).transform).not.toBe(normalTransform)
      const disabled = wrapper.get('[data-date="2026-10-18"]')
      expect(disabled.element.disabled).toBe(true)
      const disabledStyle = getComputedStyle(disabled.element)
      disabled.element.setAttribute(hoverAttribute, '')
      const hoveredDisabled = getComputedStyle(disabled.element)
      expect(hoveredDisabled.background).toBe(disabledStyle.background)
      expect(hoveredDisabled.transform).toBe(disabledStyle.transform)
    } finally {
      wrapper.unmount()
      stylesheet.remove()
    }
  })

  it.each(Object.entries(styleDependencies))('includes internal style dependencies for %s', (name, dependencies) => {
    for (const dependency of dependencies) {
      expect(styles[`../styles/${name}.css`]).toContain(`@import './${dependency}.css';`)
      expect(styles[`../styles/${dependency}.css`], dependency).toBeTruthy()
    }
  })

  it('lets DateTimePicker manage popup height without inheriting the generic popover cap', () => {
    const stylesheet = styles['../styles/date-time-picker.css']
    expect(stylesheet).toMatch(/\.scq-floating-panel:has\(> \.scq-date-time-picker__panel\)\s*\{[^}]*max-height:\s*none;/)
    expect(stylesheet).toContain('max-height: calc(100dvh - var(--scq-picker-viewport-gap) * 2)')
    expect(stylesheet).toMatch(/\.scq-date-time-picker__footer\s*\{[^}]*position:\s*sticky;[^}]*bottom:\s*0;/)
    expect(stylesheet).toMatch(/\.scq-date-time-picker__time \.scq-time-picker__columns\s*\{[^}]*flex:\s*1 1 0;/)
  })

  it('reserves fixed space for Swipe indicators throughout marker transitions', () => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = styles['../styles/swipe.css']
    document.head.append(stylesheet)
    try {
      const rules = Array.from(stylesheet.sheet!.cssRules)
      const getStyle = (selector: string) => {
        const rule = rules.find((entry): entry is CSSStyleRule => 'selectorText' in entry && entry.selectorText === selector)
        expect(rule).toBeDefined()
        return rule!.style
      }
      const button = getStyle('.scq-swipe__indicators:not(.is-custom) button')
      const marker = getStyle('.scq-swipe__indicators:not(.is-custom) button::after')
      const activeMarker = getStyle('.scq-swipe__indicators:not(.is-custom) button[aria-current]::after')
      const maximumMarkerWidth = Math.max(parseFloat(marker.width), parseFloat(activeMarker.width))
      expect(parseFloat(button.width)).toBeGreaterThanOrEqual(maximumMarkerWidth)
      expect(button.flex).toBe(`0 0 ${button.width}`)
      expect(button.display).toBe('grid')
      expect(button.getPropertyValue('place-items')).toBe('center')
    } finally {
      stylesheet.remove()
    }
  })

  it('preserves original registrations and installs the new components', () => {
    const app = createApp({ render: () => null })
    app.use(ScqVue)
    for (const name of ['button', 'input', 'icon', 'dialog', 'modal', 'popup', 'message', 'select', 'radio', 'checkbox', 'chat-message', 'chat-choice', 'watermark', 'form', 'form-item', 'switch', 'tabs', 'pagination', 'empty', 'tooltip', 'popover', 'drawer', 'action-sheet', 'cell', 'cell-group', 'nav-bar', 'tabbar', 'table']) {
      expect(app.component(`scq-${name}`), name).toBeTruthy()
    }
    expect(ScqSwitch).toBe(Switch)
  })

  it('supports individual component installation with form children', () => {
    const app = createApp({ render: () => null })
    expect(Form).toBeDefined()
    expect(FormItem).toBeDefined()
    app.use(Form)
    expect(app.component('scq-form')).toBe(Form)
    expect(app.component('scq-form-item')).toBe(FormItem)
  })

  it('installs FormItem independently without registering Form', () => {
    const app = createApp({ render: () => null })
    expect(typeof FormItem.install).toBe('function')
    app.use(FormItem)
    expect(app.component('scq-form-item')).toBe(FormItem)
    expect(app.component('scq-form')).toBeUndefined()
  })

  it('renders new controls on the server with deterministic tab ids per app', async () => {
    const render = () => renderToString(createSSRApp({
      render: () => h(ConfigProvider, { locale: 'en-US' }, { default: () => [h(Switch, { modelValue: true, ariaLabel: 'Enabled' }), h(Tabs, { items: [{ name: 'first', label: 'First' }] })] }),
    }))
    const first = await render()
    expect(first).toContain('role="switch"')
    expect(first).toContain('aria-checked="true"')
    expect(await render()).toBe(first)
  })
})