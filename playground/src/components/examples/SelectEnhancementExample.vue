<script setup lang="ts">
import { ref } from 'vue'
import ScqSelect from '../../../../src/components/Select'
import ScqCheckbox from '../../../../src/components/Checkbox'
import { VIRTUAL_LIST_DEFAULTS } from '../../../../src/components/VirtualList'
import type { SelectRemoteMethod, SelectValue } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const DATA_SIZE = 10_000
const VIEWPORT_HEIGHT = 440
const REQUEST_DELAY = 250
const PAGE_SIZE = 10
const options = Array.from({ length: DATA_SIZE }, (_, index) => ({ label: `Record ${index + 1}`, value: index + 1 }))
const selected = ref<SelectValue | null>(null)
const remoteValue = ref<SelectValue | SelectValue[] | null>([1])
const fail = ref(false)
const failure = ref('')
const remoteMethod: SelectRemoteMethod = (query, page, pageSize, signal) => new Promise((resolve, reject) => {
  const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    if (fail.value) { reject(new Error('模拟失败 / Simulated failure')); return }
    failure.value = ''
    const matches = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    resolve({ list: matches.slice((page - 1) * pageSize, page * pageSize), total: matches.length })
  }, REQUEST_DELAY)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
const onError = (error: unknown) => { failure.value = error instanceof Error ? error.message : String(error) }
</script>

<template>
  <div class="select-enhancement-example">
    <ExampleSection title="远程搜索与分页" subtitle="Remote search &amp; selected labels">
      <template #controls><ScqCheckbox v-model="fail">模拟远程失败</ScqCheckbox></template>
      <ScqSelect v-model="remoteValue" remote filterable multiple pagination :page-size="PAGE_SIZE" :options="[options[0]]" :remote-method="remoteMethod" aria-label="Remote choice" @error="onError" />
      <p v-if="failure" role="alert">{{ failure }}</p>
    </ExampleSection>
    <ExampleSection title="一万项虚拟选择" subtitle="10,000 options" description="使用方向键、Home / End 或 PageUp / PageDown 导航，Enter 选择。">
      <ScqSelect v-model="selected" :options="options" filterable virtual :height="VIEWPORT_HEIGHT" :item-height="VIRTUAL_LIST_DEFAULTS.itemHeight" :overscan="VIRTUAL_LIST_DEFAULTS.overscan" aria-label="Virtual choice" />
      <p>Value: {{ selected ?? '—' }}</p>
    </ExampleSection>
  </div>
</template>

<style scoped>
.select-enhancement-example { display: grid; gap: var(--scq-space-lg, 16px); min-width: 0; }
.select-enhancement-example .scq-select { width: 100%; max-width: 440px; }
</style>
