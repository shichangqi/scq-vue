<template>
  <div class="doc-example">
    <div v-if="props.showDemo" class="doc-example__demo">
      <slot />
    </div>

    <button
      v-if="props.collapsible"
      type="button"
      class="doc-example__toggle"
      :aria-expanded="expanded ? 'true' : 'false'"
      @click="expanded = !expanded"
    >
      {{ expanded ? t('example.collapse') : t('example.expand') }}
    </button>

    <div v-show="props.collapsible ? expanded : true" class="doc-example__code-wrap">
      <pre class="doc-example__code"><code class="hljs" v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import { t } from '../i18n'

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

const highlightedCode = computed(() => {
  try {
    return hljs.highlight(props.code, { language: props.lang }).value
  } catch {
    return hljs.highlightAuto(props.code).value
  }
})
</script>

<style scoped>
.doc-example {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.doc-example__demo {
  padding: 14px;
}

.doc-example__toggle {
  width: 100%;
  border: none;
  border-top: 1px solid #ebeef5;
  background: #fafcff;
  color: #409eff;
  font-size: 13px;
  line-height: 36px;
  cursor: pointer;
}

.doc-example__toggle:hover {
  background: #f5f9ff;
}

.doc-example__code-wrap {
  border-top: 1px solid #ebeef5;
  background: #0f172a;
}

.doc-example__code {
  margin: 0;
  padding: 14px;
  overflow: auto;
}
</style>
