// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { componentReferences } from '../playground/src/docs/reference'
import { compileScript, compileStyle, compileTemplate, parse } from 'vue/compiler-sfc'

describe('Documentation Example Code Integrity', () => {
  const sourceExamples = Object.values(componentReferences).flatMap((reference) => reference.examples).filter((example) => example.source)

  it.each(sourceExamples)('compiles the actual displayed source for $source', (example) => {
    expect(example.code).not.toContain('../../../../src/')
    expect(example.code).toContain("import 'scq-vue/style.css'")
    for (const [filename, code] of Object.entries(example.files!)) {
      const { descriptor, errors } = parse(code, { filename })
      expect(errors, filename).toEqual([])
      expect(descriptor.template, filename).not.toBeNull()
      const script = compileScript(descriptor, { id: `source-${example.source}` })
      const template = compileTemplate({ source: descriptor.template!.content, filename, id: `source-${example.source}`, compilerOptions: { bindingMetadata: script.bindings } })
      expect(template.errors, filename).toEqual([])
      for (const style of descriptor.styles) expect(compileStyle({ source: style.content, filename, id: `source-${example.source}`, scoped: style.scoped }).errors).toEqual([])
      for (const imported of Object.values(script.imports || {})) {
        if (imported.source.startsWith('./')) expect(example.files![imported.source.slice(2)], imported.source).toBeTruthy()
      }
    }
  })

  it('ensures every reference example code is a complete and valid Vue SFC', () => {
    for (const [slug, comp] of Object.entries(componentReferences)) {
      expect(comp.examples.length, `${slug} should have examples`).toBeGreaterThan(0)

      for (let i = 0; i < comp.examples.length; i++) {
        const example = comp.examples[i]
        const code = example.code
        const ctx = `${slug} example[${i}] (${example.title.zh})`

        // 1. 必须包含 <template> 和 </template>
        expect(code, `${ctx} must contain <template>`).toContain('<template>')
        expect(code, `${ctx} must contain </template>`).toContain('</template>')

        // 2. 检查模板内部是否使用了 v-model 或 ref 变量
        const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
        expect(templateMatch, `${ctx} valid template match`).not.toBeNull()
        const templateContent = templateMatch ? templateMatch[1] : ''

        // 3. 提取 v-model="xxx" 中的变量
        const vModelMatches = [...templateContent.matchAll(/v-model(?::[a-zA-Z0-9_-]+)?="([^"]+)"/g)]
        for (const match of vModelMatches) {
          const varName = match[1].trim().split(/[.[]/)[0]
          // 变量名必须在 script 中定义
          expect(code, `${ctx} v-model variable "${varName}" must be declared in script`).toContain(varName)
        }

        // 4. 如果包含 script setup，必须有对应的闭合标签
        if (code.includes('<script')) {
          expect(code, `${ctx} must close <script> properly`).toContain('</script>')
          expect(code, `${ctx} should use setup in script`).toContain('setup')
        }

        // 5. 关键组件特定断言
        if (slug === 'modal') {
          if (example.variant === 'api') {
            expect(code, `${ctx} modal api should import Modal and call methods`).toMatch(/Modal\.(info|confirm)/)
          } else {
            expect(code, `${ctx} modal should show scq-modal`).toContain('<scq-modal')
          }
        }
        if (slug === 'action-sheet') {
          expect(code, `${ctx} action-sheet should show scq-action-sheet`).toContain('<scq-action-sheet')
        }
        if (slug === 'form') {
          expect(code, `${ctx} form should show scq-form`).toContain('<scq-form')
          expect(code, `${ctx} form should import FormRules or FormInstance`).toMatch(/FormRules|FormInstance/)
        }
        if (slug === 'table') {
          expect(code, `${ctx} table should show scq-table`).toContain('<scq-table')
        }
      }
    }
  })

  it('ensures all standalone doc views provide complete and matched example codes', () => {
    const viewsDir = path.resolve(__dirname, '../playground/src/views')
    const standaloneViews = [
      'ButtonDocView.vue',
      'InputDocView.vue',
      'IconDocView.vue',
      'RadioDocView.vue',
      'CheckboxDocView.vue',
      'ChatMessageDocView.vue',
      'DialogDocView.vue',
      'MessageDocView.vue',
      'PopupDocView.vue',
      'WatermarkDocView.vue',
      'SelectDocView.vue',
    ]

    for (const viewName of standaloneViews) {
      const filePath = path.join(viewsDir, viewName)
      const content = fs.readFileSync(filePath, 'utf-8')

      // 提取所有 <DocExample :code="xxx"
      const docExampleMatches = [...content.matchAll(/<DocExample[^>]*:code="([^"]+)"/g)]
      expect(docExampleMatches.length, `${viewName} should have DocExample items`).toBeGreaterThan(0)

      for (const match of docExampleMatches) {
        const codeVar = match[1]
        // 查找 const codeVar = `<template> ... </script>`
        const startMarker = `const ${codeVar} = \``
        const startIndex = content.indexOf(startMarker)
        expect(startIndex, `${viewName} must define ${codeVar}`).toBeGreaterThan(-1)

        const codeStart = startIndex + startMarker.length
        const afterStart = content.slice(codeStart)
        // 代码必须包含 </template>
        const templateEndPos = afterStart.indexOf('</template>')
        expect(templateEndPos, `${viewName} ${codeVar} must contain </template>`).toBeGreaterThan(-1)

        // 寻找包含 </script> 或 </template> 之后的闭合反引号
        let searchFrom = templateEndPos
        const scriptPos = afterStart.indexOf('<script', templateEndPos)
        if (scriptPos > -1) {
          const scriptEndPos = afterStart.indexOf('script>', scriptPos)
          if (scriptEndPos > -1) {
            searchFrom = scriptEndPos
          }
        }
        const closingBacktick = afterStart.indexOf('`', searchFrom)
        expect(closingBacktick, `${viewName} ${codeVar} must have closing backtick`).toBeGreaterThan(-1)

        const codeString = afterStart.slice(0, closingBacktick)

        // 必须有 <template>
        expect(codeString, `${viewName} ${codeVar} must contain <template>`).toContain('<template>')
        expect(codeString, `${viewName} ${codeVar} must contain </template>`).toContain('</template>')

        // 如果有 script，必须正确闭合
        if (codeString.includes('<script')) {
          expect(codeString, `${viewName} ${codeVar} must close script tag`).toMatch(/<\/?\\?\/script>/)
        }
      }
    }
  })
})

