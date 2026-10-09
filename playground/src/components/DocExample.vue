<template>
  <div class="doc-example">
    <div v-if="props.showDemo" class="doc-example__demo">
      <div class="doc-example__viewport"><slot /></div>
    </div>

    <div class="doc-example__toolbar">
      <span class="doc-example__copy-state" role="status">{{ copyState === 'done' ? label('已复制', 'Copied') : copyState === 'error' ? label('复制失败', 'Copy failed') : '' }}</span>
      <button type="button" class="doc-example__tool" :title="label('复制代码', 'Copy code')" :aria-label="label('复制代码', 'Copy code')" @click="copyCode"><Icon :name="copyState === 'done' ? 'check' : 'copy'" /></button>
      <button v-if="props.collapsible" type="button" class="doc-example__tool doc-example__toggle" :title="expanded ? t('example.collapse') : t('example.expand')" :aria-label="expanded ? t('example.collapse') : t('example.expand')" :aria-expanded="expanded" @click="expanded = !expanded"><Icon name="code" /></button>
    </div>

    <div v-show="props.collapsible ? expanded : true" class="doc-example__code-wrap">
      <div v-if="fileNames.length > 1" ref="filesRef" class="doc-example__files" role="tablist" :aria-label="label('示例文件', 'Example files')" @keydown="handleFileKeydown">
        <button v-for="(name, index) in fileNames" :id="`${codeId}-tab-${index}`" :key="name" type="button" role="tab" :aria-selected="name === activeFile" :aria-controls="codeId" :tabindex="name === activeFile ? 0 : -1" @click="selectFile(name)">{{ name }}</button>
      </div>
      <pre :id="codeId" class="doc-example__code" :role="fileNames.length > 1 ? 'tabpanel' : undefined" :aria-labelledby="fileNames.length > 1 ? `${codeId}-tab-${fileNames.indexOf(activeFile)}` : undefined" tabindex="0"><code class="hljs" v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import Icon from '../../../src/components/Icon/Icon.vue'
import { useComponentId } from '../../../src/utils/id'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import { locale, t } from '../i18n'

hljs.registerLanguage('html', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)

const props = withDefaults(
  defineProps<{
    code: string
    files?: Record<string, string>
    lang?: 'html' | 'vue' | 'xml' | 'ts' | 'typescript' | 'js' | 'javascript' | 'bash'
    defaultExpanded?: boolean
    showDemo?: boolean
    collapsible?: boolean
  }>(),
  {
    lang: 'html',
    defaultExpanded: false,
    showDemo: true,
    collapsible: true,
  },
)

const expanded = ref(props.defaultExpanded)
const codeId = useComponentId('doc-example-code')
const selectedFile = ref('App.vue')
const filesRef = ref<HTMLElement>()
const fileNames = computed(() => Object.keys(props.files || {}))
const activeFile = computed(() => fileNames.value.includes(selectedFile.value) ? selectedFile.value : fileNames.value[0] || '')
const displayedCode = computed(() => props.files?.[activeFile.value] ?? props.code)
const copyState = ref<'idle' | 'done' | 'error'>('idle')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
let copyTimer: ReturnType<typeof setTimeout> | undefined
const copyCode = async () => {
  if (copyTimer) clearTimeout(copyTimer)
  try { await navigator.clipboard.writeText(displayedCode.value); copyState.value = 'done' }
  catch { copyState.value = 'error' }
  copyTimer = setTimeout(() => { copyState.value = 'idle' }, 2000)
}
onBeforeUnmount(() => { if (copyTimer) clearTimeout(copyTimer) })

const selectFile = (name: string) => {
  selectedFile.value = name
  copyState.value = 'idle'
  if (copyTimer) clearTimeout(copyTimer)
}
const handleFileKeydown = (event: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const count = fileNames.value.length
  const index = fileNames.value.indexOf(activeFile.value)
  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count
  selectFile(fileNames.value[nextIndex])
  void nextTick(() => filesRef.value?.querySelectorAll<HTMLButtonElement>('button')[nextIndex]?.focus())
}

const highlightedCode = computed(() => {
  try {
    return hljs.highlight(displayedCode.value, { language: props.lang }).value
  } catch {
    return hljs.highlightAuto(displayedCode.value).value
  }
})
</script>

<style scoped>
.doc-example {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.doc-example__demo {
  padding: 14px;
  background: linear-gradient(135deg, var(--demo-bg-start, #f8fbff) 0%, var(--demo-bg-end, #eff6ff) 100%);
}

.doc-example__viewport { min-width: 0; width: 100%; margin-inline: auto; }
.doc-example__toolbar { display: flex; align-items: center; gap: 6px; min-height: 42px; padding: 4px 10px; border-top: 1px solid #ebeef5; background: #fafcff; }
.doc-example__copy-state { flex: 1; font-size: 12px; color: #73767a; text-align: right; }
.doc-example__tool { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; padding: 0; border: 0; border-radius: 4px; color: #73767a; background: transparent; cursor: pointer; }
.doc-example__tool:hover { background: #ecf5ff; color: #409eff; }
.doc-example__tool:focus-visible { outline: 2px solid #409eff; }
.doc-example__files { display: flex; gap: 12px; padding: 0 14px; border-bottom: 1px solid #334155; overflow-x: auto; }
.doc-example__files button { flex-shrink: 0; min-height: 40px; padding: 8px 2px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #cbd5e1; font-family: monospace; font-size: 12px; cursor: pointer; }
.doc-example__files button[aria-selected='true'] { border-bottom-color: #66b1ff; color: #fff; }
.doc-example__files button:focus-visible { outline: 2px solid #409eff; outline-offset: -2px; }

.doc-example__code-wrap {
  border-top: 1px solid #ebeef5;
  background: #0f172a;
}

.doc-example__code {
  margin: 0;
  padding: 14px;
  overflow: auto;
  max-height: 520px;
}
@media (pointer: coarse) { .doc-example__tool { width: 44px; height: 44px; } }
</style>
