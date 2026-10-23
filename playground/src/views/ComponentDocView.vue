<template>
  <section v-if="reference && entry" class="doc-block">
    <h1 v-if="!supplement">{{ entry.name }} {{ locale === 'zh-CN' ? entry.title : '' }}</h1>
    <h2 v-else>{{ entry.name }} · {{ t('doc.advanced') }}</h2>
    <p class="lead">{{ translate(reference.description) }}</p>
    <p v-if="reference.note" class="doc-note">{{ translate(reference.note) }}</p>
    <OnDemandExample v-if="!supplement" :code="reference.examples[0].code" :files="reference.examples[0].files">
      <component v-if="reference.examples[0].source" :is="sourceComponents[reference.examples[0].source]" />
      <component v-else :is="demoComponent" :kind="slug" :variant="reference.examples[0].variant" @notify="notify" />
    </OnDemandExample>
    <template v-for="(example, index) in reference.examples" :key="index">
      <template v-if="supplement || index > 0">
        <h2 :id="`${supplement ? 'enhancement-' : ''}example-${index + 1}`">{{ translate(example.title) }}</h2>
        <DocExample :code="example.code" :files="example.files" lang="vue"><component v-if="example.source" :is="sourceComponents[example.source]" /><component v-else :is="demoComponent" :kind="slug" :variant="example.variant" @notify="notify" /></DocExample>
      </template>
    </template>
    <h2 v-if="apiSections.length" :id="supplement ? 'enhancement-api' : 'api'">{{ entry.name }} API</h2>
    <template v-for="section in apiSections" :key="section.title">
      <h3 :id="supplement ? `enhancement-${section.id}` : section.id">{{ section.title }}</h3>
      <table class="prop-table"><thead><tr><th>{{ label('名称', 'Name') }}</th><th>{{ label('说明', 'Description') }}</th><th>{{ label('类型', 'Type') }}</th><th v-if="section.id === 'attributes'">{{ label('默认值', 'Default') }}</th></tr></thead><tbody><tr v-for="property in section.rows" :key="property.name"><td><code>{{ property.name }}</code></td><td>{{ translate(property.description) }}</td><td><code>{{ property.type }}</code></td><td v-if="section.id === 'attributes'"><code>{{ property.defaultValue }}</code></td></tr></tbody></table>
    </template>
    <p v-if="notice" class="doc-example-notice" role="status">{{ notice }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { locale, t } from '../i18n'
import DocExample from '../components/DocExample.vue'
import OnDemandExample from '../components/OnDemandExample.vue'
import { componentDocs } from '../docs/catalog'
import { componentReferences, componentEnhancements, type DocText } from '../docs/reference'
import { sourceComponents } from '../docs/example-sources'

const props = withDefaults(defineProps<{ slug: string; supplement?: boolean }>(), { supplement: false })
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const translate = (value: DocText) => locale.value === 'zh-CN' ? value.zh : value.en
const entry = computed(() => componentDocs.find((item) => item.slug === props.slug))
const reference = computed(() => (props.supplement ? componentEnhancements : componentReferences)[props.slug])
const demoComponents = {
  basic: defineAsyncComponent(() => import('../components/examples/BasicExamples.vue')),
  form: defineAsyncComponent(() => import('../components/examples/FormExamples.vue')),
  navigation: defineAsyncComponent(() => import('../components/examples/NavigationExamples.vue')),
  table: defineAsyncComponent(() => import('../components/examples/TableExamples.vue')),
  overlay: defineAsyncComponent(() => import('../components/examples/OverlayExamples.vue')),
  mobile: defineAsyncComponent(() => import('../components/examples/MobileExamples.vue')),
  'chat-choice': defineAsyncComponent(() => import('../components/examples/ChatChoiceExamples.vue')),
}
const demoComponent = computed(() => demoComponents[reference.value.demo])
const notice = ref('')
const notify = (message: string) => { notice.value = message }
const apiSections = computed(() => [
  { id: 'attributes', title: 'Attributes', rows: reference.value?.props },
  { id: 'events', title: 'Events', rows: reference.value?.events },
  { id: 'slots', title: 'Slots', rows: reference.value?.slots },
  { id: 'exposes', title: 'Exposes', rows: reference.value?.methods },
].filter((section) => section.rows?.length))
</script>

<style scoped>
.doc-note { border-left: 3px solid var(--scq-primary); padding: 10px 16px; background: var(--scq-fill); color: var(--scq-text-secondary); font-size: 13px; line-height: 1.8; }
.doc-example-notice { color: #16833a; font-size: 14px; }
</style>