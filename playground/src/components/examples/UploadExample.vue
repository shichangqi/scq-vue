<script setup lang="ts">
import { ref } from 'vue'
import { ScqSwitch, ScqUpload, type UploadFile, type UploadRequestOptions } from '../../../../src/index'

const files = ref<UploadFile[]>([])
const offline = ref(false)
const request = (options: UploadRequestOptions) => new Promise<unknown>((resolve, reject) => {
  let progress = 0
  const abort = () => { clearInterval(timer); reject(new DOMException('Cancelled', 'AbortError')) }
  const timer = setInterval(() => {
    progress += 20
    options.onProgress(progress)
    if (progress < 100) return
    clearInterval(timer)
    options.signal.removeEventListener('abort', abort)
    if (offline.value) reject(new Error('Network unavailable'))
    else resolve({ name: options.filename, size: options.file.size })
  }, 180)
  options.signal.addEventListener('abort', abort, { once: true })
  if (options.signal.aborted) abort()
})
</script>

<template>
  <div class="upload-example"><label><ScqSwitch v-model="offline" aria-label="离线模式" />离线</label><ScqUpload v-model:file-list="files" drag multiple accept=".pdf,.png,.jpg,.jpeg,.txt" :limit="3" :max-size="5 * 1024 * 1024" :http-request="request"><template #tip>PDF / PNG / JPG / TXT · 单个文件不超过 5 MB · 最多 3 个文件</template></ScqUpload></div>
</template>

<style scoped>
.upload-example { max-width: 560px; }
.upload-example > label { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: var(--scq-muted); font-size: 13px; }
</style>