// @vitest-environment jsdom

import { createApp, createSSRApp, h, type Component, type Plugin } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import ScqVue, { Form, FormItem, Switch, ConfigProvider, Tabs, ScqSwitch } from '../src/index'

type InstallableComponent = Component & Plugin & { name: string }
const componentEntries = import.meta.glob<{ default: InstallableComponent }>('../src/components/*/index.ts', { eager: true })
const componentNames = Object.values(componentEntries).map((entry) => entry.default.name)
const libraryEntries = import.meta.glob<{ default: Plugin; [name: string]: unknown }>('../src/index.{js,ts}', { eager: true })
const stylesDirectory = resolve(__dirname, '../styles')
const styles = Object.fromEntries(readdirSync(stylesDirectory)
  .filter((name) => name.endsWith('.css'))
  .map((name) => [`../styles/${name}`, readFileSync(resolve(stylesDirectory, name), 'utf8')]))
const styleDependencies: Record<string, string[]> = {
  calendar: ['icon'],
  swipe: ['icon'],
  'action-bar': ['icon', 'loading', 'badge'],
  'date-picker': ['field', 'calendar', 'popover'],
  'time-picker': ['field', 'icon'],
  upload: ['icon', 'progress'],
  rate: ['icon'],
  'auto-complete': ['field', 'icon', 'popover'],
  cascader: ['field', 'icon', 'popover'],
  'tree-select': ['field', 'tree', 'popover'],
  transfer: ['icon'],
  menu: ['icon', 'popover'],
  dropdown: ['menu'],
  breadcrumb: ['link'],
  steps: ['icon'],
  image: ['icon'],
  card: ['skeleton'],
  tree: ['icon', 'loading'],
  notification: ['icon'],
  popconfirm: ['popover', 'icon', 'loading'],
  result: ['icon'],
  link: ['icon'],
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
  table: ['empty', 'loading', 'icon'],
  'form-item': ['form'],
  'cell-group': ['cell'],
  'radio-group': ['radio'],
  'checkbox-group': ['checkbox'],
  'config-provider': ['tokens'],
}

describe('Library integration', () => {
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

  it.each(Object.entries(styleDependencies))('includes internal style dependencies for %s', (name, dependencies) => {
    for (const dependency of dependencies) {
      expect(styles[`../styles/${name}.css`]).toContain(`@import './${dependency}.css';`)
      expect(styles[`../styles/${dependency}.css`], dependency).toBeTruthy()
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