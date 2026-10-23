// @vitest-environment jsdom

import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { mount, shallowMount, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import { compileScript, compileStyle, compileTemplate, parse } from 'vue/compiler-sfc'
import OnDemandExample from '../playground/src/components/OnDemandExample.vue'
import DocExample from '../playground/src/components/DocExample.vue'
import InputDocView from '../playground/src/views/InputDocView.vue'
import CheckboxDocView from '../playground/src/views/CheckboxDocView.vue'
import ComponentDocView from '../playground/src/views/ComponentDocView.vue'
import { componentDocs } from '../playground/src/docs/catalog'
import { componentEnhancements, componentReferences } from '../playground/src/docs/reference'
import { createOnDemandExample } from '../playground/src/docs/on-demand'
import { locale } from '../playground/src/i18n'

const ROOT = path.resolve(__dirname, '..')
const VIEWS = path.join(ROOT, 'playground/src/views')
const standaloneExamples = componentDocs.flatMap(entry => {
  const filename = path.join(VIEWS, `${entry.name}DocView.vue`)
  if (!fs.existsSync(filename)) return []
  const source = fs.readFileSync(filename, 'utf8')
  const { descriptor } = parse(source, { filename })
  const binding = descriptor.template!.content.match(/<OnDemandExample :code="(\w+)"/)?.[1]
  if (!binding) throw new Error(`Missing on-demand example in ${filename}`)
  const script = ts.createSourceFile(filename, descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  for (const statement of script.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(script) !== binding) continue
      if (!declaration.initializer || !ts.isStringLiteralLike(declaration.initializer)) throw new Error(`Expected a literal example: ${filename} ${binding}`)
      return [{ ...entry, filename, source, binding, code: declaration.initializer.text }]
    }
  }
  throw new Error(`Missing example source: ${filename} ${binding}`)
})

const examples = [
  ...Object.entries(componentReferences).map(([slug, reference]) => ({ slug, ...reference.examples[0] })),
  ...standaloneExamples,
]

const docViews = import.meta.glob<{ default: Component }>('../playground/src/views/*DocView.vue')
const expectExamplesBeforeApi = (wrapper: VueWrapper) => {
  const sections = wrapper.findAll('on-demand-example-stub, doc-example-stub, table.prop-table')
    .map(section => section.element.matches('table') ? 'api' : 'example')
  expect(sections).toContain('example')
  expect(sections).toContain('api')
  expect(sections).toEqual([
    ...sections.filter(section => section === 'example'),
    ...sections.filter(section => section === 'api'),
  ])
}

describe('Documentation section order', () => {
  it.each(Object.keys(componentReferences))('groups all %s reference examples before API tables', slug => {
    const wrapper = shallowMount(ComponentDocView, { props: { slug } })
    try {
      expectExamplesBeforeApi(wrapper)
    } finally {
      wrapper.unmount()
    }
  })

  it.each(standaloneExamples)('groups all $slug standalone examples before API tables without losing content', async ({ name, slug, source }) => {
    const { default: view } = await docViews[`../playground/src/views/${name}DocView.vue`]()
    const wrapper = shallowMount(view, { global: { stubs: { ComponentDocView: false } } })
    try {
      expectExamplesBeforeApi(wrapper)
      const template = parse(source).descriptor.template!.content.replace(/<!--[\s\S]*?-->/g, '')
      const enhancement = template.includes('<ComponentDocView') ? componentEnhancements[slug] : undefined
      const baseExamples = template.match(/<(?:OnDemandExample|DocExample)\b/g) || []
      const baseTables = template.match(/<table class="prop-table">/g) || []
      const addedTables = enhancement
        ? [enhancement.props, enhancement.events, enhancement.slots, enhancement.methods].filter(rows => rows?.length)
        : []
      expect(wrapper.findAll('on-demand-example-stub, doc-example-stub')).toHaveLength(baseExamples.length + (enhancement?.examples.length || 0))
      expect(wrapper.findAll('table.prop-table')).toHaveLength(baseTables.length + addedTables.length)
    } finally {
      wrapper.unmount()
    }
  })
})

describe('On-demand documentation examples', () => {
  it('covers every catalog component and keeps the first section before existing examples', () => {
    expect(new Set(examples.map(example => example.slug))).toEqual(new Set(componentDocs.map(entry => entry.slug)))
    const generic = fs.readFileSync(path.join(VIEWS, 'ComponentDocView.vue'), 'utf8')
    expect(generic).toContain('<OnDemandExample v-if="!supplement"')
    expect(generic.indexOf('<OnDemandExample')).toBeLessThan(generic.indexOf('<template v-for='))
    expect(generic.match(/<OnDemandExample[^>]*>([\s\S]+?)<\/OnDemandExample>/)?.[1]).toContain('<component')
    for (const { source, filename, binding } of standaloneExamples) {
      expect(source.indexOf('<OnDemandExample'), filename).toBeLessThan(source.indexOf('<h2'))
      if (source.includes('<DocExample')) expect(source.indexOf('<OnDemandExample'), filename).toBeLessThan(source.indexOf('<DocExample'))
      expect(source.match(/<OnDemandExample[^>]*>([\s\S]+?)<\/OnDemandExample>/)?.[1], filename).toMatch(/<scq-/)
      const bindings = [...source.matchAll(/<(?:DocExample|OnDemandExample)\b[^>]*:code="(\w+)"/g)].map(match => match[1])
      expect(bindings.filter(value => value === binding), filename).toEqual([binding])
    }
  })

  it.each(Object.entries(componentReferences))('renders the basic %s example only once and preserves other examples and anchors', (slug, reference) => {
    const wrapper = shallowMount(ComponentDocView, { props: { slug } })
    try {
      expect(wrapper.findAllComponents(OnDemandExample)).toHaveLength(1)
      expect(wrapper.getComponent(OnDemandExample).props('code')).toBe(reference.examples[0].code)
      expect(wrapper.findAllComponents(DocExample).map(example => example.props('code'))).toEqual(reference.examples.slice(1).map(example => example.code))
      expect(wrapper.find('#example-1').exists()).toBe(false)
      reference.examples.forEach((_example, index) => {
        if (index > 0) expect(wrapper.find(`#example-${index + 1}`).exists()).toBe(true)
      })
    } finally {
      wrapper.unmount()
    }
  })

  it.each(Object.entries(componentEnhancements))('preserves every %s enhancement example', (slug, reference) => {
    const wrapper = shallowMount(ComponentDocView, { props: { slug, supplement: true } })
    try {
      expect(wrapper.findComponent(OnDemandExample).exists()).toBe(false)
      expect(wrapper.findAllComponents(DocExample).map(example => example.props('code'))).toEqual(reference.examples.map(example => example.code))
      expect(wrapper.find('#enhancement-example-1').exists()).toBe(reference.examples.length > 0)
    } finally {
      wrapper.unmount()
    }
  })

  it.each(examples)('provides complete individual imports and compilable files for $slug', example => {
    const result = createOnDemandExample(example)
    const entry = componentDocs.find(entry => entry.slug === example.slug)!
    expect(result.code).toContain(`from 'scq-vue/components/${entry.name}'`)
    expect(result.code).toContain(`import 'scq-vue/styles/${entry.slug}.css'`)
    expect(result.code).not.toContain("import 'scq-vue/styles/tokens.css'")
    expect(result.code).not.toContain("import 'scq-vue/style.css'")
    expect(result.code).not.toContain('/src/')
    expect(createOnDemandExample(result)).toEqual(result)
    expect(result.files!['App.vue']).toBe(result.code)
    for (const [filename, code] of Object.entries(result.files!)) {
      const { descriptor, errors } = parse(code, { filename })
      expect(errors, filename).toEqual([])
      expect(descriptor.template, filename).not.toBeNull()
      const script = descriptor.scriptSetup || descriptor.script ? compileScript(descriptor, { id: filename }) : undefined
      const template = compileTemplate({ source: descriptor.template!.content, filename, id: filename, compilerOptions: { bindingMetadata: script?.bindings } })
      expect(template.errors, filename).toEqual([])
      for (const match of descriptor.template!.content.matchAll(/<(scq-[a-z][a-z0-9-]*|Scq[A-Z]\w*)(?=[\s/>])/g)) {
        const binding = match[1].replace(/(^|-)([a-z])/g, (_, _separator: string, letter: string) => letter.toUpperCase())
        expect(script?.bindings[binding], `${filename}: ${binding}`).toBeTruthy()
      }
      for (const imported of Object.values(script?.imports || {})) {
        if (imported.source === 'scq-vue') expect(imported.isType, `${filename}: ${imported.local}`).toBe(true)
        if (imported.source.startsWith('scq-vue/components/')) {
          const name = imported.source.slice('scq-vue/components/'.length)
          expect(fs.existsSync(path.join(ROOT, 'src/components', name, 'index.ts')), imported.source).toBe(true)
          if (!imported.isType) {
            const style = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
            expect(code).toContain(`import 'scq-vue/styles/${style}.css'`)
            expect(fs.existsSync(path.join(ROOT, 'styles', `${style}.css`)), style).toBe(true)
          }
        }
        if (imported.source.startsWith('./')) expect(result.files![imported.source.slice('./'.length)], imported.source).toBeTruthy()
      }
      for (const style of descriptor.styles) expect(compileStyle({ source: style.content, filename, id: filename, scoped: style.scoped }).errors).toEqual([])
    }
  })

  it('adds setup for template-only snippets and includes companion component styles', () => {
    const { code } = createOnDemandExample({ code: '<template><scq-collapse><scq-collapse-item name="intro">Intro</scq-collapse-item></scq-collapse></template>' })
    expect(code).toContain("import ScqCollapse from 'scq-vue/components/Collapse'")
    expect(code).toContain("import ScqCollapseItem from 'scq-vue/components/CollapseItem'")
    expect(code).toContain("import 'scq-vue/styles/collapse-item.css'")
  })

  it('removes redundant manual token imports from existing snippets and the guide', () => {
    const source = `<script setup lang="ts">
import ScqButton from 'scq-vue/components/Button'
import 'scq-vue/styles/tokens.css'
import 'scq-vue/style.css'
</script>
<template><ScqButton>Save</ScqButton></template>`
    const { code } = createOnDemandExample({ code: source })
    expect(code).not.toContain("import 'scq-vue/styles/tokens.css'")
    expect(code).not.toContain("import 'scq-vue/style.css'")
    expect(code).toContain("import 'scq-vue/styles/button.css'")
    expect(fs.readFileSync(path.join(VIEWS, 'GuideView.vue'), 'utf8')).not.toContain("import 'scq-vue/styles/tokens.css'")
  })

  it('preserves companion files without adding unrelated styles', () => {
    const source = componentReferences.toast.examples[0]
    const result = createOnDemandExample(source)
    expect(result.files!['PhonePreview.vue']).toBe(source.files!['PhonePreview.vue'])
    expect(result.code).toContain("from './PhonePreview.vue'")
    expect(result.code).toContain("import 'scq-vue/styles/toast.css'")
    expect(result.code).not.toContain("import 'scq-vue/styles/dialog.css'")
  })

  it('shows a preview with collapsed code and supports expanding, collapsing and language changes', async () => {
    const originalLocale = locale.value
    const wrapper = mount(OnDemandExample, {
      attachTo: document.body,
      props: { code: '<template><scq-button>Save</scq-button></template>' },
      slots: { default: '<button type="button">Live demo</button>' },
    })
    try {
      const example = wrapper.getComponent(DocExample)
      expect(example.props()).toMatchObject({ showDemo: true, defaultExpanded: false, collapsible: true })
      expect(wrapper.get('.doc-example__demo button').text()).toBe('Live demo')
      expect(wrapper.get('.doc-example__demo').isVisible()).toBe(true)
      const code = wrapper.get('.doc-example__code-wrap')
      const toggle = wrapper.get('.doc-example__toggle')
      expect(code.isVisible()).toBe(false)
      expect(toggle.attributes('aria-expanded')).toBe('false')
      await toggle.trigger('click')
      expect(code.isVisible()).toBe(true)
      expect(toggle.attributes('aria-expanded')).toBe('true')
      expect(code.text()).toContain("from 'scq-vue/components/Button'")
      await toggle.trigger('click')
      expect(code.isVisible()).toBe(false)
      locale.value = 'en-US'
      await wrapper.vm.$nextTick()
      expect(wrapper.get('#on-demand').text()).toBe('On-demand Import')
      locale.value = 'zh-CN'
      await wrapper.vm.$nextTick()
      expect(wrapper.get('#on-demand').text()).toBe('按需引入')
    } finally {
      wrapper.unmount()
      locale.value = originalLocale
    }
  })

  it('keeps basic controls interactive without duplicate demos or changes to other examples', async () => {
    const input = mount(InputDocView, { global: { stubs: { ComponentDocView: true } } })
    const checkbox = mount(CheckboxDocView, { global: { stubs: { ComponentDocView: true } } })
    try {
      const inputExamples = input.findAll('.doc-example')
      expect(inputExamples).toHaveLength(1)
      await inputExamples[0].get('input').setValue('On-demand input')
      expect(inputExamples[0].get('input').element.value).toBe('On-demand input')
      const checkboxExamples = checkbox.findAll('.doc-example')
      const group = checkboxExamples[1].findAll('input')
      const checkedBefore = group.map(control => control.element.checked)
      await checkboxExamples[0].get('input').setValue(false)
      expect(checkboxExamples[0].get('input').element.checked).toBe(false)
      expect(group.map(control => control.element.checked)).toEqual(checkedBefore)
    } finally {
      input.unmount()
      checkbox.unmount()
    }
  })
})
