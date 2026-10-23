<script setup lang="ts">
import { computed, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqSwitch from '../../../../src/components/Switch'
import ScqSelect from '../../../../src/components/Select'
import ScqUpload from '../../../../src/components/Upload'
import type { SelectValue, UploadFile, UploadRequestOptions } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const DEMO = {
  fileCount: 10,
  concurrency: 3,
  concurrencyOptions: [1, 2, 3, 5],
  invalidConcurrency: 0,
  progressStep: 20,
  completePercentage: 100,
  tickMilliseconds: 300,
  unlimited: 'unlimited',
}
const upload = ref<InstanceType<typeof ScqUpload>>()
const files = ref<UploadFile[]>([])
const concurrency = ref<number | undefined>(DEMO.concurrency)
const concurrencyOptions = [
  ...DEMO.concurrencyOptions.map(value => ({ label: String(value), value })),
  { label: '不限制', value: DEMO.unlimited },
  { label: `${DEMO.invalidConcurrency}（无效：暂停队列）`, value: DEMO.invalidConcurrency },
]
const setConcurrency = (value: SelectValue | SelectValue[] | null) => {
  if (value === DEMO.unlimited) concurrency.value = undefined
  else if (typeof value === 'number' && concurrencyOptions.some(option => option.value === value)) concurrency.value = value
  else throw new RangeError('Unknown upload concurrency option.')
}
const failFirstAttempt = ref(false)
const active = ref(0)
const peak = ref(0)
const lastConfigurationError = ref<Error>()
const handleConfigurationError = (error: Error) => { lastConfigurationError.value = error }
const attempts = new WeakMap<Blob, number>()
const queued = computed(() => files.value.filter((file) => file.status === 'queued').length)
const canSubmit = computed(() => files.value.some((file) => file.status === 'ready' || file.status === 'cancelled'))
let batch = 0

const addDemoFiles = () => {
  if (!active.value) peak.value = 0
  batch++
  upload.value?.addFiles(Array.from({ length: DEMO.fileCount }, (_, index) => new File(
    [`Upload queue demonstration ${batch}-${index + 1}`],
    `queue-${batch}-${index + 1}.txt`,
    { type: 'text/plain' },
  )))
}
const request = (options: UploadRequestOptions) => new Promise<unknown>((resolve, reject) => {
  const attempt = (attempts.get(options.file) || 0) + 1
  attempts.set(options.file, attempt)
  const fail = failFirstAttempt.value && attempt === 1
  let progress = 0
  let settled = false
  active.value++
  peak.value = Math.max(peak.value, active.value)
  const finish = (error?: Error) => {
    if (settled) return
    settled = true
    clearInterval(timer)
    options.signal.removeEventListener('abort', abort)
    active.value--
    if (error) reject(error)
    else resolve({ name: options.filename, attempt })
  }
  const abort = () => finish(new DOMException('Upload cancelled', 'AbortError'))
  const timer = setInterval(() => {
    progress = Math.min(progress + DEMO.progressStep, DEMO.completePercentage)
    options.onProgress(progress)
    if (progress === DEMO.completePercentage) finish(fail ? new Error('Simulated first-attempt failure') : undefined)
  }, DEMO.tickMilliseconds)
  options.signal.addEventListener('abort', abort, { once: true })
  if (options.signal.aborted) abort()
})
</script>

<template>
  <ExampleSection class="upload-queue-example" title="上传队列与并发控制" subtitle="Upload queue &amp; concurrency">
    <div class="upload-queue-example__controls">
      <label>并发上限
        <ScqSelect :model-value="concurrency ?? DEMO.unlimited" :options="concurrencyOptions" :clearable="false" aria-label="上传并发上限" @update:model-value="setConcurrency" />
      </label>
      <label><ScqSwitch v-model="failFirstAttempt" aria-label="模拟首次上传失败" />首次尝试失败</label>
    </div>
    <div class="upload-queue-example__controls">
      <ScqButton @click="addDemoFiles">添加 {{ DEMO.fileCount }} 个示例文件</ScqButton>
      <ScqButton :disabled="!canSubmit" @click="upload?.submit()">提交待上传 / 已取消项</ScqButton>
      <ScqButton :disabled="!files.length" @click="upload?.clearFiles()">清空列表</ScqButton>
    </div>
    <p class="upload-queue-example__summary" role="status">活动请求 {{ active }} · 排队 {{ queued }} · 历史峰值 {{ peak }} · 当前配置错误 {{ upload?.getConfigurationErrors().length || 0 }}</p>
    <ScqUpload ref="upload" v-model:file-list="files" multiple drag accept=".txt" :concurrency="concurrency" :http-request="request" @configuration-error="handleConfigurationError">
      <template #tip>初始并发为 {{ DEMO.concurrency }}；省略 concurrency 时不限制。无效值暂停队列派发，修正后自动继续，已开始的任务正常结束。批量重试仅重试失败项；取消项可单独重试或重新提交。</template>
    </ScqUpload>
    <p v-if="lastConfigurationError" class="upload-queue-example__note">最近捕获的 configuration-error：{{ lastConfigurationError.message }}</p>
    <p class="upload-queue-example__note">configuration-error 报告无效并发或重复 UID（保留首项，并包含被拒绝项的信息）；未监听时使用 console.error 报告。getConfigurationErrors() 可读取当前配置问题，修正输入后对应错误会清除。</p>
    <p class="upload-queue-example__note">示例仅模拟上传，不发送网络请求。自定义请求应监听 signal，并在真正停止请求后结算 Promise；忽略取消的请求会继续占用并发名额，直到 Promise 结束。</p>
  </ExampleSection>
</template>

<style scoped>
.upload-queue-example { max-width: 680px; }
.upload-queue-example__controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--example-space-md); }
.upload-queue-example__controls label { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--example-space-sm); max-width: 100%; color: var(--scq-text); font-size: var(--example-font-body); }
.upload-queue-example__controls .scq-select { min-width: 0; max-width: 100%; }
.upload-queue-example__summary { color: var(--scq-primary); font-size: 14px; }
.upload-queue-example__note { margin-top: 12px; color: var(--scq-muted); font-size: 13px; line-height: 1.6; }
</style>
