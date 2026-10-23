import type { ExampleEntry } from './reference'

type ExampleSource = Pick<ExampleEntry, 'code' | 'files'>

const COMPONENT_PREFIX = 'scq-vue/components/'
const STYLE_PREFIX = 'scq-vue/styles/'
const APP_FILE = 'App.vue'
const toPascalCase = (name: string) => name.replace(/(^|-)([a-z])/g, (_, _separator: string, letter: string) => letter.toUpperCase())
const toKebabCase = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const withIndividualImports = (source: string) => {
  const components = new Set<string>()
  const imports = new Set<string>()
  for (const match of source.matchAll(/import\s+(\w+)\s+from\s+['"]scq-vue\/components\/(\w+)['"]/g)) {
    imports.add(match[1])
  }
  // Include method-only entries (such as useToast) in the stylesheet dependencies.
  for (const match of source.matchAll(/from\s+['"]scq-vue\/components\/(\w+)['"]/g)) components.add(match[1])

  const addedImports = new Set<string>()
  for (const match of source.matchAll(/<(scq-[a-z][a-z0-9-]*|Scq[A-Z]\w*)(?=[\s/>])/g)) {
    const name = match[1].startsWith('scq-') ? toPascalCase(match[1].slice('scq-'.length)) : match[1].slice('Scq'.length)
    const binding = `Scq${name}`
    components.add(name)
    if (!imports.has(binding)) addedImports.add(`import ${binding} from '${COMPONENT_PREFIX}${name}'`)
  }
  if (!components.size) return source

  const code = source.replace(/^[ \t]*import\s+['"]scq-vue\/(?:style\.css|styles\/[^'"]+\.css)['"];?[ \t]*\r?\n?/gm, '')
  const script = code.match(/<script setup(?: lang="ts")?>([\s\S]*?)<\/script>/)
  const styles = [...components].map(name => `import '${STYLE_PREFIX}${toKebabCase(name)}.css'`)
  const setup = [...styles, ...addedImports, script?.[1].trim()].filter(Boolean).join('\n')
  const body = script ? code.replace(script[0], '').trim() : code.trim()
  return `<script setup lang="ts">\n${setup}\n</script>\n\n${body}`
}

export const createOnDemandExample = ({ code, files }: ExampleSource): ExampleSource => {
  const individualFiles = Object.fromEntries(Object.entries(files || { [APP_FILE]: code })
    .map(([name, source]) => [name, name.endsWith('.vue') ? withIndividualImports(source) : source]))
  return { code: withIndividualImports(code), files: individualFiles }
}
