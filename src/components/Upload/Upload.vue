<template>
  <div class="scq-upload" :class="{ 'is-disabled': isDisabled, 'is-dragging': dragging }" @dragover.prevent="dragging = drag && !isDisabled" @dragleave.prevent="dragging = false" @drop.prevent="drop">
    <input ref="inputRef" class="scq-upload__input" type="file" :accept="accept || undefined" :multiple="multiple" :disabled="isDisabled" :aria-label="text('selectFiles')" tabindex="-1" @change="choose" />
    <button type="button" class="scq-upload__trigger" :class="{ 'is-dropzone': drag }" :disabled="isDisabled" @click="inputRef?.click()"><slot name="trigger"><Icon name="upload" :size="drag ? 28 : 18" /><span>{{ drag ? text('dropFiles') : text('selectFiles') }}</span></slot></button>
    <div v-if="$slots.tip" class="scq-upload__tip"><slot name="tip" /></div>
    <ul v-if="showFileList" class="scq-upload__list"><li v-for="file in files" :key="file.uid" :class="`is-${file.status}`"><img v-if="listType === 'picture' && file.url" :src="file.url" :alt="file.name" class="scq-upload__thumbnail" /><div class="scq-upload__file"><button type="button" class="scq-upload__name" :title="file.name" @click="emit('preview', file)">{{ file.name }}</button><span class="scq-upload__meta">{{ formatSize(file.size) }} <span v-if="file.status === 'error'" role="alert">{{ text('uploadFailed') }}</span></span><Progress v-if="file.status === 'uploading'" :percentage="file.percentage" :stroke-width="3" :aria-label="file.name" /></div><Icon v-if="file.status === 'success'" name="check" :size="18" class="scq-upload__success" /><button v-if="file.raw && ['ready', 'error', 'cancelled'].includes(file.status)" type="button" class="scq-upload__action" :disabled="isDisabled" :aria-label="`${text(file.status === 'ready' ? 'upload' : 'retry')} ${file.name}`" :title="text(file.status === 'ready' ? 'upload' : 'retry')" @click="upload(file.uid)"><Icon name="upload" :size="16" /></button><button type="button" class="scq-upload__action" :disabled="isDisabled" :aria-label="`${text(file.status === 'uploading' ? 'cancel' : 'remove')} ${file.name}`" :title="text(file.status === 'uploading' ? 'cancel' : 'remove')" @click="file.status === 'uploading' ? abort(file.uid) : remove(file.uid)"><Icon name="close" :size="16" /></button></li></ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Progress from '../Progress/Progress.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'

export type UploadStatus = 'ready' | 'uploading' | 'success' | 'error' | 'cancelled'
export interface UploadFile { uid: string; name: string; size: number; status: UploadStatus; percentage: number; raw?: File; url?: string; response?: unknown; error?: unknown }
export interface UploadRequestOptions { file: Blob; filename: string; action: string; name: string; method: 'POST' | 'PUT' | 'PATCH'; data: Record<string, string | Blob>; headers: Record<string, string>; withCredentials: boolean; signal: AbortSignal; onProgress: (percentage: number) => void }
defineOptions({ name: 'Upload' })
const props = withDefaults(defineProps<{ fileList?: UploadFile[]; action?: string; method?: 'POST' | 'PUT' | 'PATCH'; name?: string; headers?: Record<string, string>; data?: Record<string, string | Blob>; withCredentials?: boolean; multiple?: boolean; accept?: string; limit?: number; maxSize?: number; autoUpload?: boolean; disabled?: boolean; drag?: boolean; showFileList?: boolean; listType?: 'text' | 'picture'; beforeUpload?: (file: File) => boolean | void | Blob | Promise<boolean | void | Blob>; beforeRemove?: (file: UploadFile) => boolean | void | Promise<boolean | void>; httpRequest?: (options: UploadRequestOptions) => Promise<unknown> }>(), { fileList: () => [], action: '', method: 'POST', name: 'file', headers: () => ({}), data: () => ({}), withCredentials: false, multiple: false, accept: '', limit: 0, maxSize: Infinity, autoUpload: true, disabled: undefined, drag: false, showFileList: true, listType: 'text' })
const emit = defineEmits<{
  (event: 'update:fileList', value: UploadFile[]): void
  (event: 'change' | 'remove', file: UploadFile, files: UploadFile[]): void
  (event: 'progress', percentage: number, file: UploadFile): void
  (event: 'success', response: unknown, file: UploadFile): void
  (event: 'error', error: unknown, file: UploadFile): void
  (event: 'preview' | 'abort', file: UploadFile): void
  (event: 'exceed', files: File[], current: UploadFile[]): void
  (event: 'reject', file: File, reason: 'type' | 'size' | 'hook'): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const inputRef = ref<HTMLInputElement>()
const files = ref<UploadFile[]>(props.fileList.map((file) => ({ ...file })))
const dragging = ref(false)
const uploadId = useComponentId('scq-upload')
const requests = new Map<string, AbortController>()
const objectUrls = new Map<string, string>()
let sequence = 0
let disposed = false
const publish = () => { if (!disposed) emit('update:fileList', files.value.map((file) => ({ ...file }))) }
const patch = (uid: string, values: Partial<UploadFile>) => {
  const index = files.value.findIndex((file) => file.uid === uid)
  if (index < 0 || disposed) return
  files.value[index] = { ...files.value[index], ...values }
  publish()
  return files.value[index]
}
const revoke = (uid: string) => { const url = objectUrls.get(uid); if (url) { URL.revokeObjectURL(url); objectUrls.delete(uid) } }
const accepted = (file: File) => !props.accept || props.accept.split(',').some((entry) => {
  const pattern = entry.trim().toLowerCase()
  return pattern.startsWith('.') ? file.name.toLowerCase().endsWith(pattern) : pattern.endsWith('/*') ? file.type.toLowerCase().startsWith(pattern.slice(0, -1)) : file.type.toLowerCase() === pattern
})
const xhrRequest = (options: UploadRequestOptions) => new Promise<unknown>((resolve, reject) => {
  const url = new URL(options.action, document.baseURI)
  if (!options.action || !['http:', 'https:'].includes(url.protocol)) { reject(new Error('A valid HTTP upload action is required')); return }
  const xhr = new XMLHttpRequest()
  const cancel = () => xhr.abort()
  const cleanup = () => options.signal.removeEventListener('abort', cancel)
  xhr.open(options.method, url.href)
  xhr.withCredentials = options.withCredentials
  for (const [name, value] of Object.entries(options.headers)) xhr.setRequestHeader(name, value)
  xhr.upload.onprogress = (event) => { if (event.lengthComputable) options.onProgress(event.loaded / event.total * 100) }
  xhr.onload = () => {
    cleanup()
    if (xhr.status < 200 || xhr.status >= 300) { reject(new Error(`Upload failed (${xhr.status})`)); return }
    let response: unknown = xhr.responseText
    try { response = JSON.parse(xhr.responseText) } catch {}
    resolve(response)
  }
  xhr.onerror = () => { cleanup(); reject(new Error('Upload network error')) }
  xhr.onabort = () => { cleanup(); reject(new DOMException('Upload cancelled', 'AbortError')) }
  options.signal.addEventListener('abort', cancel, { once: true })
  if (options.signal.aborted) { cleanup(); reject(new DOMException('Upload cancelled', 'AbortError')); return }
  const form = new FormData()
  for (const [name, value] of Object.entries(options.data)) form.append(name, value)
  form.append(options.name, options.file, options.filename)
  xhr.send(form)
})
const upload = async (uid: string) => {
  const original = files.value.find((file) => file.uid === uid)
  if (!original?.raw || isDisabled.value || requests.has(uid) || disposed || original.status === 'success') return
  const controller = new AbortController()
  requests.set(uid, controller)
  const current = () => !disposed && !controller.signal.aborted && requests.get(uid) === controller && files.value.some((file) => file.uid === uid)
  patch(uid, { status: 'uploading', percentage: 0, error: undefined })
  try {
    const result = await props.beforeUpload?.(original.raw)
    if (!current()) return
    if (result === false) { patch(uid, { status: 'ready' }); emit('reject', original.raw, 'hook'); return }
    const options: UploadRequestOptions = {
      file: result instanceof Blob ? result : original.raw,
      filename: original.name, action: props.action, name: props.name, method: props.method, data: props.data, headers: props.headers, withCredentials: props.withCredentials, signal: controller.signal,
      onProgress: (value) => {
        if (!current()) return
        const percentage = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
        const file = patch(uid, { percentage })
        if (file) emit('progress', percentage, file)
      },
    }
    const response = await (props.httpRequest || xhrRequest)(options)
    if (!current()) return
    const file = patch(uid, { status: 'success', percentage: 100, response })
    if (file) { emit('success', response, file); emit('change', file, [...files.value]) }
  } catch (error) {
    if (!current()) return
    const file = patch(uid, { status: 'error', error })
    if (file) { emit('error', error, file); emit('change', file, [...files.value]) }
  } finally { if (requests.get(uid) === controller) requests.delete(uid) }
}
const abort = (uid?: string) => {
  for (const [key, controller] of [...requests]) {
    if (uid !== undefined && key !== uid) continue
    requests.delete(key)
    controller.abort()
    const file = patch(key, { status: 'cancelled' })
    if (file) emit('abort', file)
  }
}
const remove = async (uid: string) => {
  const file = files.value.find((entry) => entry.uid === uid)
  if (!file || isDisabled.value || disposed) return
  try { if (await props.beforeRemove?.(file) === false || disposed || !files.value.some((entry) => entry.uid === uid)) return }
  catch (error) { if (!disposed) emit('error', error, file); return }
  abort(uid)
  files.value = files.value.filter((entry) => entry.uid !== uid)
  revoke(uid)
  publish()
  emit('remove', file, [...files.value])
}
const addFiles = (selected: File[]) => {
  if (isDisabled.value || disposed) return
  const incoming = props.multiple ? selected : selected.slice(0, 1)
  if (props.limit > 0 && files.value.length + incoming.length > props.limit) { emit('exceed', incoming, [...files.value]); return }
  for (const raw of incoming) {
    if (!accepted(raw)) { emit('reject', raw, 'type'); continue }
    if (raw.size > props.maxSize) { emit('reject', raw, 'size'); continue }
    const uid = `${uploadId}-${++sequence}`
    let url: string | undefined
    if (props.listType === 'picture' && raw.type.startsWith('image/') && typeof URL.createObjectURL === 'function') { url = URL.createObjectURL(raw); objectUrls.set(uid, url) }
    const file: UploadFile = { uid, name: raw.name, size: raw.size, status: 'ready', percentage: 0, raw, url }
    files.value.push(file)
    publish()
    emit('change', file, [...files.value])
    if (props.autoUpload) void upload(uid)
  }
}
const choose = (event: Event) => { const input = event.target as HTMLInputElement; addFiles(Array.from(input.files || [])); input.value = '' }
const drop = (event: DragEvent) => { dragging.value = false; if (props.drag && event.dataTransfer) addFiles(Array.from(event.dataTransfer.files)) }
const formatSize = (size: number) => size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : size >= 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`
watch(() => props.fileList, (value) => {
  const keys = new Set(value.map((file) => file.uid))
  for (const [uid, controller] of requests) if (!keys.has(uid)) { requests.delete(uid); controller.abort() }
  for (const uid of objectUrls.keys()) if (!keys.has(uid)) revoke(uid)
  files.value = value.map((file) => ({ ...file }))
})
onBeforeUnmount(() => { disposed = true; abort(); for (const uid of objectUrls.keys()) revoke(uid) })
defineExpose({ submit: () => Promise.all(files.value.filter((file) => ['ready', 'error', 'cancelled'].includes(file.status)).map((file) => upload(file.uid))), abort, remove, addFiles, clearFiles: async () => { for (const file of [...files.value]) await remove(file.uid) } })
</script>