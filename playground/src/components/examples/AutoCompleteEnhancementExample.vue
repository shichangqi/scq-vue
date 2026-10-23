<script setup lang="ts">
import { reactive, ref } from 'vue'
import ScqAutoComplete from '../../../../src/components/AutoComplete'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqForm from '../../../../src/components/Form'
import ScqFormItem from '../../../../src/components/FormItem'
import { VIRTUAL_LIST_DEFAULTS } from '../../../../src/components/VirtualList'
import type { AutoCompleteExpose, AutoCompleteFetchSuggestions, AutoCompleteOption } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const EXAMPLE = { count: 10_000, height: 440, requestDelay: 250, pageSize: 10, minLength: 2, cacheTtl: 30_000 } as const
const model = reactive({ member: '' })
const formDisabled = ref(false)
const members: AutoCompleteOption[] = [
  { value: 'ada@example.com', label: 'Ada Lovelace', group: 'Engineering' },
  { value: 'grace@example.com', label: 'Grace Hopper', group: 'Engineering' },
  { value: 'lin@example.com', label: 'Lin', group: 'Design' },
  { value: 'inactive@example.com', label: 'Inactive', group: 'Design', disabled: true },
]
const groupBy = (option: AutoCompleteOption) => typeof option.group === 'string' ? option.group : undefined
const filterMember = (query: string, option: AutoCompleteOption) => `${option.label ?? ''} ${option.value}`.toLowerCase().includes(query.toLowerCase())
const options = Array.from({ length: EXAMPLE.count }, (_, index) => ({ value: `Record ${index + 1}` }))
const remoteQuery = ref('Record')
const virtualQuery = ref('')
const remoteControl = ref<AutoCompleteExpose>()
const fail = ref(false)
const failure = ref('')
const requests = ref(0)
const fetchSuggestions: AutoCompleteFetchSuggestions = (query, signal, { page, pageSize }) => new Promise((resolve, reject) => {
  requests.value += 1
  const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    if (fail.value) { reject(new Error('模拟失败 / Simulated failure')); return }
    failure.value = ''
    const matches = options.filter((option) => option.value.toLowerCase().includes(query.toLowerCase()))
    resolve({ list: matches.slice((page - 1) * pageSize, page * pageSize), total: matches.length })
  }, EXAMPLE.requestDelay)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
const onError = (error: unknown) => { failure.value = error instanceof Error ? error.message : String(error) }
</script>

<template>
  <div class="auto-complete-enhancement-example">
    <ExampleSection title="分组与匹配高亮" subtitle="Fields, groups &amp; highlighting">
      <template #controls><ScqCheckbox v-model="formDisabled">禁用整个表单</ScqCheckbox></template>
      <ScqForm :model="model" :disabled="formDisabled" label-position="top" show-error-summary focus-on-error>
        <ScqFormItem prop="member" label="成员 / Member" help="输入姓名或邮箱，选中后提交邮箱。" :rules="{ required: true, message: '请选择成员 / Choose a member' }">
          <ScqAutoComplete v-model="model.member" :options="members" :group-by="groupBy" :filter-method="filterMember" highlight-match :disabled="false" />
        </ScqFormItem>
        <ScqButton native-type="submit" type="primary" :disabled="formDisabled">校验</ScqButton>
      </ScqForm>
      <p>Value: {{ model.member || '—' }}</p>
    </ExampleSection>
    <ExampleSection title="远程分页、缓存与重试" subtitle="Remote pages, cache &amp; retry">
      <template #controls><ScqCheckbox v-model="fail">模拟远程失败</ScqCheckbox></template>
      <ScqAutoComplete ref="remoteControl" v-model="remoteQuery" :fetch-suggestions="fetchSuggestions" pagination :page-size="EXAMPLE.pageSize" :min-length="EXAMPLE.minLength" :cache-ttl="EXAMPLE.cacheTtl" highlight-first-item aria-label="Remote suggestions" @error="onError" />
      <ScqButton @click="remoteControl?.refresh()">强制刷新</ScqButton>
      <p role="status">Requests: {{ requests }} · Cache: {{ EXAMPLE.cacheTtl }} ms · Min length: {{ EXAMPLE.minLength }}</p>
      <p v-if="failure" role="alert">{{ failure }}</p>
    </ExampleSection>
    <ExampleSection title="一万项虚拟建议" subtitle="10,000 virtual suggestions" description="使用方向键、Home / End 或 PageUp / PageDown 导航，Enter 选择。">
      <ScqAutoComplete v-model="virtualQuery" :options="options" virtual :height="EXAMPLE.height" :item-height="VIRTUAL_LIST_DEFAULTS.itemHeight" :overscan="VIRTUAL_LIST_DEFAULTS.overscan" aria-label="Virtual suggestions" />
      <p>Value: {{ virtualQuery || '—' }}</p>
    </ExampleSection>
  </div>
</template>

<style scoped>
.auto-complete-enhancement-example { display: grid; gap: var(--scq-space-lg, 16px); min-width: 0; }
.auto-complete-enhancement-example .scq-auto-complete { width: 100%; max-width: 440px; }
</style>
