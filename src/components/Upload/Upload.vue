<template>
  <div ref="rootRef" v-bind="rootAttrs()" class="scq-upload" :class="{ 'is-disabled': isDisabled, 'is-dragging': dragging, 'has-configuration-error': concurrencyError }" @dragover.prevent="dragging = drag && !isDisabled" @dragleave.prevent="dragging = false" @drop.prevent="drop">
    <input ref="inputRef" class="scq-upload__input" type="file" :accept="accept || undefined" :multiple="multiple" :disabled="isDisabled" :aria-label="text('selectFiles')" tabindex="-1" @change="choose" />
    <button ref="triggerRef" type="button" class="scq-upload__trigger" :class="{ 'is-dropzone': drag }" :disabled="isDisabled" v-bind="field.attrs.value" @blur="field.touch" @click="inputRef?.click()"><slot name="trigger"><Icon name="upload" :size="drag ? 28 : 18" /><span>{{ drag ? text('dropFiles') : text('selectFiles') }}</span></slot></button>
    <div v-if="$slots.tip" class="scq-upload__tip"><slot name="tip" /></div>
    <p v-if="concurrencyError" class="scq-upload__configuration-error" role="alert">{{ text('uploadConcurrencyError') }}</p>
    <div v-if="showFileList && (hasPending || hasFailures)" class="scq-upload__batch-actions">
      <button v-if="hasPending" type="button" class="scq-upload__trigger scq-upload__batch-action" :disabled="isDisabled" @click="cancelAll">{{ text('cancelAll') }}</button>
      <button v-if="hasFailures" type="button" class="scq-upload__trigger scq-upload__batch-action" :disabled="isDisabled" @click="retryAll">{{ text('retryAll') }}</button>
    </div>
    <ul v-if="showFileList" class="scq-upload__list">
      <li v-for="file in files" :key="file.uid" :class="`is-${file.status}`">
        <img v-if="listType === 'picture' && file.url" :src="file.url" :alt="file.name" class="scq-upload__thumbnail" />
        <div class="scq-upload__file">
          <button type="button" class="scq-upload__name" :title="file.name" @click="emit('preview', file)">{{ file.name }}</button>
          <span class="scq-upload__meta">{{ formatSize(file.size) }} <span v-if="file.status === 'queued'" class="scq-upload__queued" role="status">{{ text('queued') }}</span><span v-if="file.status === 'error'" role="alert">{{ text('uploadFailed') }}</span></span>
          <Progress v-if="file.status === 'uploading'" :percentage="file.percentage" :stroke-width="3" :aria-label="file.name" />
        </div>
        <Icon v-if="file.status === 'success'" name="check" :size="18" class="scq-upload__success" />
        <button v-if="file.raw && UPLOAD_STARTABLE_STATUSES.has(file.status)" type="button" class="scq-upload__action" :disabled="isDisabled" :aria-label="`${text(file.status === 'ready' ? 'upload' : 'retryAction')} ${file.name}`" :title="text(file.status === 'ready' ? 'upload' : 'retryAction')" @click="upload(file.uid)"><Icon name="upload" :size="16" /></button>
        <button type="button" class="scq-upload__action"         :disabled="isDisabled || removing.has(file.uid)" :aria-busy="removing.has(file.uid) || undefined" :aria-label="`${text(UPLOAD_PENDING_STATUSES.has(file.status) ? 'cancel' : 'remove')} ${file.name}`" :title="text(UPLOAD_PENDING_STATUSES.has(file.status) ? 'cancel' : 'remove')" @click="UPLOAD_PENDING_STATUSES.has(file.status) ? abort(file.uid) : remove(file.uid)"><Icon name="close" :size="16" /></button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, ref, shallowRef, useAttrs, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Progress from '../Progress/Progress.vue'
import { useLocale } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import { useComponentId } from '../../utils/id'
import { useContentFocus, useUpdateFocus } from '../../utils/focus'
import { UPLOAD_COMPLETE_PERCENTAGE, UPLOAD_CONFIGURATION_ERROR_MESSAGES, UPLOAD_CONFIGURATION_ERROR_NAME, UPLOAD_CONFIGURATION_ERROR_PREFIX, UPLOAD_HTTP_SUCCESS_END, UPLOAD_HTTP_SUCCESS_MIN, UPLOAD_MIN_CONCURRENCY, UPLOAD_PENDING_STATUSES, UPLOAD_SIZE_PRECISION, UPLOAD_SIZE_UNIT, UPLOAD_STARTABLE_STATUSES, UPLOAD_UNLIMITED_CONCURRENCY } from './constants'
import type { UploadConfigurationError, UploadExpose, UploadFile, UploadProps, UploadRequestOptions } from './types'

export type { UploadConfigurationError, UploadExpose, UploadFile, UploadProps, UploadRequestOptions, UploadStatus } from './types'
defineOptions({ name: 'Upload', inheritAttrs: false })
const props = withDefaults(defineProps<UploadProps>(), { fileList: () => [], action: '', method: 'POST', name: 'file', headers: () => ({}), data: () => ({}), withCredentials: false, multiple: false, accept: '', limit: 0, maxSize: Infinity, autoUpload: true, disabled: undefined, drag: false, showFileList: true, listType: 'text' })
const emit = defineEmits<{
  (event: 'update:fileList', value: UploadFile[]): void
  (event: 'change' | 'remove', file: UploadFile, files: UploadFile[]): void
  (event: 'progress', percentage: number, file: UploadFile): void
  (event: 'success', response: unknown, file: UploadFile): void
  (event: 'error', error: unknown, file: UploadFile): void
  (event: 'preview' | 'abort', file: UploadFile): void
  (event: 'exceed', files: File[], current: UploadFile[]): void
  (event: 'reject', file: File, reason: 'type' | 'size' | 'hook'): void
  (event: 'configuration-error', error: UploadConfigurationError): void
}>()
const instance = getCurrentInstance()
const text = useLocale()
const concurrency = computed(() => {
  const value = props.concurrency
  if (value === undefined || value === UPLOAD_UNLIMITED_CONCURRENCY) return UPLOAD_UNLIMITED_CONCURRENCY
  return Number.isInteger(value) && value >= UPLOAD_MIN_CONCURRENCY ? value : undefined
})
const concurrencyError = computed<UploadConfigurationError | undefined>(() => concurrency.value === undefined
  ? Object.assign(new Error(UPLOAD_CONFIGURATION_ERROR_MESSAGES.concurrency), { name: UPLOAD_CONFIGURATION_ERROR_NAME, code: 'invalid-concurrency' as const, value: props.concurrency })
  : undefined)
type DuplicateUidError = Extract<UploadConfigurationError, { code: 'duplicate-uid' }>
const normalizeFiles = (value: UploadFile[]) => {
  const seen = new Map<string, { file: UploadFile; index: number }>()
  const files: UploadFile[] = []
  const errors: DuplicateUidError[] = []
  value.forEach((file, index) => {
    const first = seen.get(file.uid)
    if (first) {
      errors.push(Object.assign(new Error(UPLOAD_CONFIGURATION_ERROR_MESSAGES.duplicateUid), {
        name: UPLOAD_CONFIGURATION_ERROR_NAME, code: 'duplicate-uid' as const,
        uid: file.uid, index, file: { ...file }, firstIndex: first.index, firstFile: { ...first.file },
      }))
    } else {
      seen.set(file.uid, { file, index })
      files.push({ ...file })
    }
  })
  return { files, errors }
}
const initialFiles = normalizeFiles(props.fileList)
const duplicateErrors = shallowRef(initialFiles.errors)
const configurationErrors = computed<UploadConfigurationError[]>(() => [
  ...(concurrencyError.value ? [concurrencyError.value] : []),
  ...duplicateErrors.value,
])
const getConfigurationErrors = () => [...configurationErrors.value]
const inputRef = ref<HTMLInputElement>()
const triggerRef = ref<HTMLButtonElement>()
const rootRef = ref<HTMLElement>()
useUpdateFocus(() => rootRef.value, undefined, () => triggerRef.value)
const removing = ref(new Set<string>())
useContentFocus(() => rootRef.value, () => removing.value.size > 0, () => triggerRef.value)
const removals = new Map<string, { identity: symbol; completion: Promise<void> }>()
let removalRevision = 0
const inheritedAttrs = useAttrs()
const files = ref<UploadFile[]>(initialFiles.files)
const dragging = ref(false)
const uploadId = useComponentId('scq-upload')
const identities = new Map(files.value.map((file) => [file.uid, Symbol(file.uid)]))
interface UploadTask {
  uid: string
  identity: symbol
  raw: File
  filename: string
  controller: AbortController
  phase: 'queued' | 'preflight' | 'request' | 'settled'
  completion: Promise<void>
  complete: () => void
}
const tasks = new Map<string, UploadTask>()
const active = new Set<UploadTask>()
const queue: UploadTask[] = []
const objectUrls = new Map<string, string>()
const hasPending = computed(() => files.value.some((file) => UPLOAD_PENDING_STATUSES.has(file.status)))
const hasFailures = computed(() => files.value.some((file) => file.raw && file.status === 'error'))
const field = useFormControl({ element: () => triggerRef.value, disabled: () => props.disabled, busy: () => hasPending.value })
const isDisabled = field.disabled
const rootAttrs = () => Object.fromEntries(Object.entries(inheritedAttrs).filter(([key]) => !(key in field.attrs.value)))
let sequence = 0
let disposed = false
let schedulingPaused = 0
let draining = false
const handledOnceListeners = new Set<string>()
const reportConfigurationError = (error: UploadConfigurationError) => {
  if (disposed) return
  const listeners = instance?.vnode.props
  const listenerName = listeners?.['onConfiguration-error'] ? 'onConfiguration-error' : 'onConfigurationError'
  const onceListener = listeners?.[`${listenerName}Once`]
  const handled = Boolean(listeners?.[listenerName] || onceListener && !handledOnceListeners.has(listenerName))
  if (onceListener) handledOnceListeners.add(listenerName)
  emit('configuration-error', error)
  if (!handled) console.error(UPLOAD_CONFIGURATION_ERROR_PREFIX, error)
}
const sameDuplicate = (left: DuplicateUidError, right: DuplicateUidError) => left.uid === right.uid && left.index === right.index && left.firstIndex === right.firstIndex
  && left.file.raw === right.file.raw && left.file.name === right.file.name && left.file.size === right.file.size
  && left.firstFile.raw === right.firstFile.raw && left.firstFile.name === right.firstFile.name && left.firstFile.size === right.firstFile.size
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
  xhr.upload.onprogress = (event) => { if (event.lengthComputable) options.onProgress(event.loaded / event.total * UPLOAD_COMPLETE_PERCENTAGE) }
  xhr.onload = () => {
    cleanup()
    if (xhr.status < UPLOAD_HTTP_SUCCESS_MIN || xhr.status >= UPLOAD_HTTP_SUCCESS_END) { reject(new Error(`Upload failed (${xhr.status})`)); return }
    let response: unknown = xhr.responseText
    try { response = JSON.parse(xhr.responseText) } catch {}
    resolve(response)
  }
  xhr.onerror = () => { cleanup(); reject(new Error('Upload network error')) }
  xhr.onabort = () => { cleanup(); reject(new DOMException('Upload cancelled', 'AbortError')) }
  options.signal.addEventListener('abort', cancel, { once: true })
  if (options.signal.aborted) { cleanup(); reject(new DOMException('Upload cancelled', 'AbortError')); return }
  try {
    const form = new FormData()
    for (const [name, value] of Object.entries(options.data)) form.append(name, value)
    form.append(options.name, options.file, options.filename)
    xhr.send(form)
  } catch (error) { cleanup(); reject(error) }
})
const current = (task: UploadTask) => !disposed && !task.controller.signal.aborted && tasks.get(task.uid) === task && identities.get(task.uid) === task.identity
const settle = (task: UploadTask) => {
  if (task.phase === 'settled') return
  task.phase = 'settled'
  active.delete(task)
  if (tasks.get(task.uid) === task) tasks.delete(task.uid)
  task.complete()
}
const run = async (task: UploadTask) => {
  const { uid, controller } = task
  try {
    patch(uid, { status: 'uploading' })
    if (!current(task)) return
    const result = await props.beforeUpload?.(task.raw)
    if (!current(task)) return
    if (result === false) {
      patch(uid, { status: 'ready' })
      if (current(task)) emit('reject', task.raw, 'hook')
      return
    }
    const options: UploadRequestOptions = {
      file: result instanceof Blob ? result : task.raw,
      filename: task.filename, action: props.action, name: props.name, method: props.method, data: props.data, headers: props.headers, withCredentials: props.withCredentials, signal: controller.signal,
      onProgress: (value) => {
        if (!current(task)) return
        const percentage = Math.max(0, Math.min(UPLOAD_COMPLETE_PERCENTAGE, Number.isFinite(value) ? value : 0))
        const file = patch(uid, { percentage })
        if (file && current(task)) emit('progress', percentage, file)
      },
    }
    task.phase = 'request'
    const response = await (props.httpRequest || xhrRequest)(options)
    if (!current(task)) return
    const file = patch(uid, { status: 'success', percentage: UPLOAD_COMPLETE_PERCENTAGE, response })
    if (file && current(task)) {
      emit('success', response, file)
      if (current(task)) emit('change', file, [...files.value])
    }
  } catch (error) {
    if (!current(task)) return
    const file = patch(uid, { status: 'error', error })
    if (file && current(task)) {
      emit('error', error, file)
      if (current(task)) emit('change', file, [...files.value])
    }
  } finally { settle(task); drain() }
}
const drain = () => {
  if (disposed || isDisabled.value || schedulingPaused || draining) return
  draining = true
  try {
    while (!disposed && !isDisabled.value && !schedulingPaused && queue.length) {
      const limit = concurrency.value
      if (limit === undefined || active.size >= limit) break
      const task = queue.shift()!
      if (!current(task)) { settle(task); continue }
      task.phase = 'preflight'
      active.add(task)
      void run(task)
    }
  } finally { draining = false }
}
const batch = <T,>(operation: () => T): T => {
  schedulingPaused++
  try { return operation() }
  finally { schedulingPaused--; drain() }
}
const upload = (uid: string): Promise<void> => {
  const existing = tasks.get(uid)
  if (existing) return existing.completion
  const file = files.value.find((entry) => entry.uid === uid)
  const identity = identities.get(uid)
  if (!file?.raw || !identity || !UPLOAD_STARTABLE_STATUSES.has(file.status) || isDisabled.value || disposed) return Promise.resolve()
  let complete!: () => void
  const completion = new Promise<void>((resolve) => { complete = resolve })
  const task: UploadTask = { uid, identity, raw: file.raw, filename: file.name, controller: new AbortController(), phase: 'queued', completion, complete }
  tasks.set(uid, task)
  queue.push(task)
  patch(uid, { status: 'queued', percentage: 0, error: undefined })
  drain()
  return completion
}
const cancel = (task: UploadTask, notify: boolean) => {
  if (tasks.get(task.uid) !== task) return
  tasks.delete(task.uid)
  const index = queue.indexOf(task)
  if (index >= 0) queue.splice(index, 1)
  // Preflight has no upload request to stop. Sent requests retain their slot until settlement.
  if (task.phase !== 'request') settle(task)
  task.controller.abort()
  if (notify && identities.get(task.uid) === task.identity) {
    const file = patch(task.uid, { status: 'cancelled' })
    if (file && !disposed && identities.get(task.uid) === task.identity) emit('abort', file)
  }
}
const abort = (uid?: string) => batch(() => {
  for (const task of [...tasks.values()]) if (uid === undefined || task.uid === uid) cancel(task, true)
})
const cancelAll = () => abort()
const submit = () => batch(() => Promise.all(files.value.filter((file) => UPLOAD_STARTABLE_STATUSES.has(file.status)).map((file) => upload(file.uid))))
const retry = (uid: string) => {
  const file = files.value.find((entry) => entry.uid === uid)
  return file && (file.status === 'error' || file.status === 'cancelled') ? upload(uid) : tasks.get(uid)?.completion || Promise.resolve()
}
const retryAll = () => batch(() => Promise.all(files.value.filter((file) => file.status === 'error').map((file) => upload(file.uid))))
const remove = (uid: string): Promise<void> => {
  const file = files.value.find((entry) => entry.uid === uid)
  const identity = identities.get(uid)
  if (!file || !identity || isDisabled.value || disposed) return Promise.resolve()
  const existing = removals.get(uid)
  if (existing?.identity === identity) return existing.completion
  const revision = removalRevision
  const sameFile = () => !disposed && !isDisabled.value && removalRevision === revision && identities.get(uid) === identity
  removing.value.add(uid)
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const completion = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  removals.set(uid, { identity, completion })
  const execute = async () => {
    try { if (await props.beforeRemove?.(file) === false || !sameFile()) return }
    catch (error) { if (sameFile()) emit('error', error, file); return }
    batch(() => {
      abort(uid)
      if (!sameFile()) return
      identities.delete(uid)
      const task = tasks.get(uid)
      if (task) cancel(task, false)
      files.value = files.value.filter((entry) => entry.uid !== uid)
      revoke(uid)
      publish()
      if (!disposed) emit('remove', file, [...files.value])
    })
  }
  void execute().finally(() => {
    if (removals.get(uid)?.completion !== completion) return
    removals.delete(uid)
    removing.value.delete(uid)
  }).then(resolve, reject)
  return completion
}
const addFiles = (selected: File[]) => {
  if (isDisabled.value || disposed) return
  const incoming = props.multiple ? selected : selected.slice(0, 1)
  if (props.limit > 0 && files.value.length + incoming.length > props.limit) { emit('exceed', incoming, [...files.value]); return }
  for (const raw of incoming) {
    if (!accepted(raw)) { emit('reject', raw, 'type'); continue }
    if (raw.size > props.maxSize) { emit('reject', raw, 'size'); continue }
    let uid: string
    do { uid = `${uploadId}-${++sequence}` }
    while (identities.has(uid) || [...active].some((task) => task.uid === uid))
    let url: string | undefined
    if (props.listType === 'picture' && raw.type.startsWith('image/') && typeof URL.createObjectURL === 'function') { url = URL.createObjectURL(raw); objectUrls.set(uid, url) }
    const file: UploadFile = { uid, name: raw.name, size: raw.size, status: 'ready', percentage: 0, raw, url }
    identities.set(uid, Symbol(uid))
    files.value.push(file)
    publish()
    emit('change', file, [...files.value])
    if (props.autoUpload) void upload(uid)
  }
}
const choose = (event: Event) => { const input = event.target as HTMLInputElement; addFiles(Array.from(input.files || [])); input.value = '' }
const drop = (event: DragEvent) => { dragging.value = false; if (props.drag && event.dataTransfer) addFiles(Array.from(event.dataTransfer.files)) }
const formatSize = (size: number) => size >= UPLOAD_SIZE_UNIT * UPLOAD_SIZE_UNIT ? `${(size / UPLOAD_SIZE_UNIT / UPLOAD_SIZE_UNIT).toFixed(UPLOAD_SIZE_PRECISION)} MB` : size >= UPLOAD_SIZE_UNIT ? `${(size / UPLOAD_SIZE_UNIT).toFixed(UPLOAD_SIZE_PRECISION)} KB` : `${size} B`
const clearFiles = async () => {
  const selected = files.value.map((file) => ({ uid: file.uid, identity: identities.get(file.uid) }))
  schedulingPaused++
  try { for (const file of selected) if (identities.get(file.uid) === file.identity) await remove(file.uid) }
  finally { schedulingPaused--; drain() }
}
watch(() => props.fileList, (value) => {
  batch(() => {
    const normalized = normalizeFiles(value)
    const next = normalized.files
    const incoming = new Map(next.map((file) => [file.uid, file]))
    for (const file of files.value) {
      const replacement = incoming.get(file.uid)
      const replaced = !replacement || replacement.raw !== file.raw || replacement.name !== file.name || replacement.size !== file.size
      const task = tasks.get(file.uid)
      if (replaced) identities.delete(file.uid)
      if (task && (replaced || replacement!.status !== file.status)) cancel(task, false)
      if (replaced || objectUrls.has(file.uid) && objectUrls.get(file.uid) !== replacement?.url) revoke(file.uid)
    }
    for (const file of next) if (!identities.has(file.uid)) identities.set(file.uid, Symbol(file.uid))
    files.value = next
    duplicateErrors.value = normalized.errors
  })
}, { deep: true, flush: 'sync' })
watch(concurrencyError, (error) => { if (error) reportConfigurationError(error) }, { immediate: true, flush: 'sync' })
watch(duplicateErrors, (errors, previous = []) => {
  for (const error of errors) if (!previous.some((entry) => sameDuplicate(entry, error))) reportConfigurationError(error)
}, { immediate: true, flush: 'sync' })
watch([concurrency, isDisabled], drain, { flush: 'sync' })
watch([isDisabled, () => props.beforeRemove], () => { removalRevision++; removals.clear(); removing.value.clear() }, { flush: 'sync' })
onBeforeUnmount(() => {
  disposed = true
  for (const task of [...tasks.values()]) cancel(task, false)
  for (const uid of objectUrls.keys()) revoke(uid)
})
defineExpose<UploadExpose>({ submit, abort, cancelAll, retry, retryAll, remove, addFiles, clearFiles, getConfigurationErrors })
</script>