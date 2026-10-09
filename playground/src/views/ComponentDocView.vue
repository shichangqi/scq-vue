<template>
  <section v-if="reference && entry" class="doc-block">
    <h1>{{ entry.name }} {{ locale === 'zh-CN' ? entry.title : '' }}</h1>
    <p class="lead">{{ translate(reference.description) }}</p>
    <p v-if="reference.note" class="doc-note">{{ translate(reference.note) }}</p>
    <template v-for="(example, index) in reference.examples" :key="index">
      <h2 :id="`example-${index + 1}`">{{ translate(example.title) }}</h2>
      <DocExample :code="example.code" :files="example.files" lang="vue"><component v-if="example.source" :is="sourceComponents[example.source]" /><component v-else :is="demoComponent" :kind="slug" :variant="example.variant" @notify="notify" /></DocExample>
    </template>
    <h2 id="api">{{ entry.name }} API</h2>
    <template v-for="section in apiSections" :key="section.title">
      <h3 :id="section.id">{{ section.title }}</h3>
      <table class="prop-table"><thead><tr><th>{{ label('名称', 'Name') }}</th><th>{{ label('说明', 'Description') }}</th><th>{{ label('类型', 'Type') }}</th><th v-if="section.id === 'attributes'">{{ label('默认值', 'Default') }}</th></tr></thead><tbody><tr v-for="property in section.rows" :key="property.name"><td><code>{{ property.name }}</code></td><td>{{ translate(property.description) }}</td><td><code>{{ property.type }}</code></td><td v-if="section.id === 'attributes'"><code>{{ property.defaultValue }}</code></td></tr></tbody></table>
    </template>
    <p v-if="notice" class="doc-example-notice" role="status">{{ notice }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { locale } from '../i18n'
import DocExample from '../components/DocExample.vue'
import BasicExamples from '../components/examples/BasicExamples.vue'
import FormExamples from '../components/examples/FormExamples.vue'
import NavigationExamples from '../components/examples/NavigationExamples.vue'
import TableExamples from '../components/examples/TableExamples.vue'
import OverlayExamples from '../components/examples/OverlayExamples.vue'
import MobileExamples from '../components/examples/MobileExamples.vue'
import ChatChoiceExamples from '../components/examples/ChatChoiceExamples.vue'
import { componentDocs } from '../docs/catalog'
import { componentReferences, type DocText } from '../docs/reference'
import { sourceComponents } from '../docs/example-sources'

const props = defineProps<{ slug: string }>()
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const translate = (value: DocText) => locale.value === 'zh-CN' ? value.zh : value.en
const entry = computed(() => componentDocs.find((item) => item.slug === props.slug))
const reference = computed(() => componentReferences[props.slug])
const demoComponents = { basic: BasicExamples, form: FormExamples, navigation: NavigationExamples, table: TableExamples, overlay: OverlayExamples, mobile: MobileExamples, 'chat-choice': ChatChoiceExamples }
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
.doc-note { border-left: 3px solid #409eff; padding: 10px 16px; background: #ecf5ff; color: #606266; font-size: 13px; line-height: 1.8; }
.doc-example-notice { color: #16833a; font-size: 14px; }
</style>