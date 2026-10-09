import { defineAsyncComponent, type Component } from 'vue'
import phoneSource from '../components/PhonePreview.vue?raw'

const sources = import.meta.glob<string>('../components/examples/*Example.vue', { eager: true, query: '?raw', import: 'default' })
const loaders = import.meta.glob<{ default: Component }>('../components/examples/*Example.vue')

export const sourceComponents = Object.fromEntries(Object.entries(loaders).map(([path, loader]) => [
  path.slice(path.lastIndexOf('/') + 1, -4),
  defineAsyncComponent(loader),
]))

export const sourceExample = (name: string, phone = false) => {
  const source = sources[`../components/examples/${name}.vue`]
  if (!source) throw new Error(`Missing example source: ${name}`)
  const code = source
    .replace("from '../../../../src/index'", "from 'scq-vue'")
    .replace("from '../PhonePreview.vue'", "from './PhonePreview.vue'")
    .replace('<script setup lang="ts">', '<script setup lang="ts">\nimport \'scq-vue/style.css\'')
  const files: Record<string, string> = { 'App.vue': code }
  if (phone) files['PhonePreview.vue'] = phoneSource
  return { source: name, code, files }
}