// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Upload from '../src/components/Upload/Upload.vue'
import Form from '../src/components/Form/Form.vue'
import FormItem from '../src/components/Form/FormItem.vue'
import type { UploadConfigurationError, UploadExpose, UploadFile, UploadProps, UploadRequestOptions } from '../src/components/Upload'
import { UPLOAD_CONFIGURATION_ERROR_PREFIX } from '../src/components/Upload/constants'

const FILE_COUNT = 10
const CONCURRENCY = 3
const PROGRESS = 37
const wrappers: VueWrapper[] = []
const containers: HTMLElement[] = []

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  containers.splice(0).forEach((container) => container.remove())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((complete, fail) => { resolve = complete; reject = fail })
  return { promise, resolve, reject }
}
const rawFiles = (count = FILE_COUNT) => Array.from({ length: count }, (_, index) => new File(['data'], `file-${index + 1}.txt`, { type: 'text/plain' }))
const uploadFile = (raw: File, uid = raw.name): UploadFile => ({ uid, raw, name: raw.name, size: raw.size, status: 'ready', percentage: 0 })
const latestFiles = (wrapper: VueWrapper) => wrapper.emitted('update:fileList')!.at(-1)![0] as UploadFile[]
const names = (files: File[]) => files.map((file) => file.name)
type UploadTestProps = UploadProps & {
  onConfigurationError?: (error: UploadConfigurationError) => void
  onConfigurationErrorOnce?: (error: UploadConfigurationError) => void
}
const mountUpload = (props: UploadTestProps = {}) => {
  const wrapper = mount(Upload, { props: { multiple: true, ...props } })
  wrappers.push(wrapper)
  return wrapper
}

const requestHarness = (honorAbort = false) => {
  let active = 0
  let peak = 0
  const requests: { options: UploadRequestOptions; settled: boolean; resolve: (value?: unknown) => void; reject: (error?: unknown) => void }[] = []
  const httpRequest = vi.fn((options: UploadRequestOptions) => {
    const result = deferred<unknown>()
    const finish = (callback: () => void) => {
      if (entry.settled) return
      entry.settled = true
      active--
      options.signal.removeEventListener('abort', abort)
      callback()
    }
    const entry = {
      options,
      settled: false,
      resolve: (value: unknown = { name: options.filename }) => finish(() => result.resolve(value)),
      reject: (error: unknown = new Error('offline')) => finish(() => result.reject(error)),
    }
    const abort = () => entry.reject(new DOMException('Cancelled', 'AbortError'))
    requests.push(entry)
    active++
    peak = Math.max(peak, active)
    if (honorAbort) {
      options.signal.addEventListener('abort', abort, { once: true })
      if (options.signal.aborted) abort()
    }
    return result.promise
  })
  return {
    httpRequest, requests,
    get active() { return active },
    get peak() { return peak },
    get started() { return requests.map((request) => request.options.filename) },
  }
}
const finishRequests = async (harness: ReturnType<typeof requestHarness>) => {
  while (harness.requests.some((request) => !request.settled)) {
    harness.requests.filter((request) => !request.settled).at(-1)!.resolve()
    await flushPromises()
  }
}
const mountControlled = (props: UploadProps) => {
  const files = ref<UploadFile[]>(props.fileList || [])
  const host = mount(defineComponent({
    setup: () => () => h(Upload, {
      multiple: true, ...props, fileList: files.value,
      'onUpdate:fileList': (value: UploadFile[]) => { files.value = value.map((file) => ({ ...file })) },
    }),
  }))
  wrappers.push(host)
  const wrapper = host.findComponent(Upload)
  return { files, wrapper, api: wrapper.vm as unknown as UploadExpose }
}

const mountUploadForm = (props: UploadTestProps = {}, attrs: Record<string, unknown> = {}) => {
  const model = ref({ attachments: props.fileList || [] as UploadFile[] })
  const disabled = ref(false)
  const container = document.createElement('div')
  containers.push(container)
  document.body.append(container)
  const wrapper = mount(defineComponent({
    setup: () => () => h(Form, { model: model.value, disabled: disabled.value }, {
      default: () => h(FormItem, {
        prop: 'attachments', label: 'Attachments', help: 'Choose supporting documents',
        rules: { type: 'array', required: true, min: 1, trigger: 'blur', message: 'Choose at least one file' },
      }, {
        default: () => h(Upload, {
          multiple: true, autoUpload: false, ...props, ...attrs, fileList: model.value.attachments,
          'onUpdate:fileList': (value: UploadFile[]) => { model.value.attachments = value },
        }),
      }),
    }),
  }), { attachTo: container })
  wrappers.push(wrapper)
  const upload = wrapper.findComponent(Upload)
  return { wrapper, upload, form: wrapper.findComponent(Form), api: upload.vm as unknown as UploadExpose, model, disabled }
}

describe('Upload form integration', () => {
  it('associates the visible trigger with the automatic label, help, errors and field focus', async () => {
    const { wrapper, upload, form, api } = mountUploadForm()
    const trigger = upload.get<HTMLButtonElement>('button.scq-upload__trigger')
    const input = upload.get<HTMLInputElement>('input[type="file"]')
    const label = wrapper.get('.scq-form-item__label')
    const help = wrapper.get('.scq-form-item__help')
    const id = trigger.attributes('id')

    expect(id).toBeTruthy()
    expect(label.attributes('for')).toBe(id)
    expect(trigger.attributes('aria-labelledby')).toBe(label.attributes('id'))
    expect(trigger.attributes('aria-describedby')).toBe(help.attributes('id'))
    expect(trigger.attributes('aria-required')).toBe('true')
    expect(wrapper.findAll(`[id="${id}"]`)).toHaveLength(1)
    expect(input.attributes('id')).toBeUndefined()
    expect(input.attributes('aria-labelledby')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBeUndefined()
    expect(form.vm.focusField('attachments')).toBe(true)
    expect(document.activeElement).toBe(trigger.element)

    await trigger.trigger('blur')
    await flushPromises()
    const error = wrapper.get('.scq-form-item__error')
    expect(error.text()).toBe('Choose at least one file')
    expect(trigger.attributes('aria-invalid')).toBe('true')
    expect(trigger.attributes('aria-describedby')?.split(' ')).toEqual([help.attributes('id'), error.attributes('id')])
    expect(form.vm.getFieldState('attachments')?.touched).toBe(true)
    expect(input.attributes('aria-invalid')).toBeUndefined()

    api.addFiles(rawFiles(1))
    await flushPromises()
    expect(await form.vm.validateField('attachments')).toBe(true)
    await nextTick()
    expect(wrapper.find('.scq-form-item__error').exists()).toBe(false)
    expect(trigger.attributes('aria-invalid')).toBeUndefined()
    expect(trigger.attributes('aria-describedby')).toBe(help.attributes('id'))
  })

  it('forwards explicit native/ARIA attributes to the trigger without duplicating IDs on the root', async () => {
    const { wrapper, upload, form } = mountUploadForm({}, {
      id: 'attachments-trigger', 'aria-label': 'Supporting documents', 'aria-describedby': 'external-help',
      tabindex: 0, class: 'consumer-upload', 'data-upload': 'preserved',
    })
    await nextTick()
    const trigger = upload.get<HTMLButtonElement>('button.scq-upload__trigger')
    const label = wrapper.get('.scq-form-item__label')
    const help = wrapper.get('.scq-form-item__help')
    expect(trigger.attributes('id')).toBe('attachments-trigger')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-label')).toBe('Supporting documents')
    expect(trigger.attributes('aria-labelledby')).toBeUndefined()
    expect(trigger.attributes('aria-describedby')?.split(' ')).toEqual(['external-help', help.attributes('id')])
    expect(label.attributes('for')).toBe('attachments-trigger')
    expect(upload.attributes('id')).toBeUndefined()
    expect(upload.attributes('aria-label')).toBeUndefined()
    expect(upload.classes()).toContain('consumer-upload')
    expect(upload.attributes('data-upload')).toBe('preserved')
    expect(wrapper.findAll('[id="attachments-trigger"]')).toHaveLength(1)
    expect(form.vm.focusField('attachments')).toBe(true)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('enforces Form.disabled over disabled=false and pauses admission without aborting active requests', async () => {
    const harness = requestHarness()
    const selected = rawFiles(CONCURRENCY)
    const { upload, form, api, model, disabled } = mountUploadForm({
      disabled: false, autoUpload: true, drag: true, concurrency: 1, httpRequest: harness.httpRequest,
    })
    api.addFiles(selected)
    await flushPromises()
    const trigger = upload.get<HTMLButtonElement>('button.scq-upload__trigger')
    const input = upload.get<HTMLInputElement>('input[type="file"]')
    expect(harness.active).toBe(1)
    expect(trigger.attributes('aria-busy')).toBe('true')
    disabled.value = true
    await nextTick()
    expect(trigger.element.disabled).toBe(true)
    expect(input.element.disabled).toBe(true)
    expect(upload.classes()).toContain('is-disabled')
    expect(form.vm.focusField('attachments')).toBe(false)
    expect(harness.requests[0].options.signal.aborted).toBe(false)
    api.addFiles(rawFiles(1))
    await api.submit()
    await upload.get('.scq-upload').trigger('drop', { dataTransfer: { files: rawFiles(1) } })
    expect(model.value.attachments).toHaveLength(CONCURRENCY)
    harness.requests[0].resolve()
    await flushPromises()
    expect(harness.active).toBe(0)
    expect(harness.requests).toHaveLength(1)
    expect(model.value.attachments.filter((file) => file.status === 'queued')).toHaveLength(CONCURRENCY - 1)
    disabled.value = false
    await flushPromises()
    expect(trigger.element.disabled).toBe(false)
    expect(input.element.disabled).toBe(false)
    expect(harness.requests).toHaveLength(2)
    await finishRequests(harness)
    expect(harness.peak).toBe(1)
    expect(trigger.attributes('aria-busy')).toBeUndefined()
  })
})

describe('Upload queue scheduling', () => {
  it('keeps ten real requests at or below concurrency=3 and admits FIFO despite out-of-order completion', async () => {
    const harness = requestHarness()
    const selected = rawFiles()
    const beforeUpload = vi.fn()
    const wrapper = mountUpload({ concurrency: CONCURRENCY, beforeUpload, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()

    expect(harness.active).toBe(CONCURRENCY)
    expect(harness.started).toEqual(names(selected.slice(0, CONCURRENCY)))
    expect(beforeUpload).toHaveBeenCalledTimes(CONCURRENCY)
    expect(latestFiles(wrapper).filter((file) => file.status === 'queued')).toHaveLength(FILE_COUNT - CONCURRENCY)

    for (let completed = 0; completed < FILE_COUNT; completed++) {
      harness.requests.filter((request) => !request.settled).at(-1)!.resolve()
      await flushPromises()
      expect(harness.active).toBeLessThanOrEqual(CONCURRENCY)
      expect(harness.peak).toBeLessThanOrEqual(CONCURRENCY)
      expect(harness.started).toEqual(names(selected.slice(0, harness.requests.length)))
    }

    expect(harness.peak).toBe(CONCURRENCY)
    expect(harness.active).toBe(0)
    expect(wrapper.emitted('success')).toHaveLength(FILE_COUNT)
    expect(wrapper.emitted('success')![0][1]).toMatchObject({ name: selected[CONCURRENCY - 1].name })
    expect(latestFiles(wrapper).every((file) => file.status === 'success' && file.percentage === 100)).toBe(true)
    expect(wrapper.emitted('change')).toHaveLength(FILE_COUNT * 2)
  })

  it.each([undefined, Infinity])('preserves unlimited admission for concurrency=%s', async (concurrency) => {
    const harness = requestHarness()
    const wrapper = mountUpload({ concurrency, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(rawFiles())
    await flushPromises()
    expect(harness.active).toBe(FILE_COUNT)
    expect(harness.requests).toHaveLength(FILE_COUNT)
    expect(latestFiles(wrapper).some((file) => file.status === 'queued')).toBe(false)
    await finishRequests(harness)
  })

  it.each([0, -1, 1.5, NaN, -Infinity])('reports invalid concurrency=%s, pauses admission, and resumes when corrected', async (concurrency) => {
    const harness = requestHarness()
    const onConfigurationError = vi.fn()
    const beforeUpload = vi.fn()
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mountUpload({ concurrency, beforeUpload, httpRequest: harness.httpRequest, onConfigurationError })
    const selected = rawFiles(CONCURRENCY)
    wrapper.vm.addFiles(selected)
    await flushPromises()
    expect(harness.active).toBe(0)
    expect(beforeUpload).not.toHaveBeenCalled()
    expect(latestFiles(wrapper).every((file) => file.status === 'queued')).toBe(true)
    expect(onConfigurationError).toHaveBeenCalledOnce()
    expect(onConfigurationError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onConfigurationError.mock.calls[0][0]).toMatchObject({ name: 'UploadConfigurationError', code: 'invalid-concurrency', value: concurrency })
    expect(wrapper.vm.getConfigurationErrors()).toEqual([onConfigurationError.mock.calls[0][0]])
    expect(wrapper.get('.scq-upload__configuration-error[role="alert"]').text()).toBe('上传并发数必须为正整数或 Infinity')
    expect(wrapper.classes()).toContain('has-configuration-error')
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(report).not.toHaveBeenCalled()
    await wrapper.setProps({ concurrency: CONCURRENCY })
    await flushPromises()
    expect(harness.started).toEqual(names(selected))
    expect(wrapper.vm.getConfigurationErrors()).toEqual([])
    expect(wrapper.find('.scq-upload__configuration-error').exists()).toBe(false)
    expect(onConfigurationError).toHaveBeenCalledOnce()
    await finishRequests(harness)
    expect(harness.peak).toBe(CONCURRENCY)
  })

  it('reports unhandled invalid values to console.error once per configuration transition', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const harness = requestHarness()
    const wrapper = mountUpload({ concurrency: 0, httpRequest: harness.httpRequest })
    expect(report.mock.calls).toEqual([[UPLOAD_CONFIGURATION_ERROR_PREFIX, expect.objectContaining({ code: 'invalid-concurrency', value: 0 })]])
    wrapper.vm.addFiles(rawFiles(CONCURRENCY))
    wrapper.vm.cancelAll()
    await flushPromises()
    await wrapper.setProps({ concurrency: 0 })
    expect(report).toHaveBeenCalledOnce()
    expect(harness.requests).toHaveLength(0)
    await wrapper.setProps({ concurrency: -1 })
    expect(report).toHaveBeenCalledTimes(2)
    await wrapper.setProps({ concurrency: CONCURRENCY })
    expect(wrapper.vm.getConfigurationErrors()).toEqual([])
    await wrapper.setProps({ concurrency: -1 })
    expect(report).toHaveBeenCalledTimes(CONCURRENCY)
    expect(report).toHaveBeenLastCalledWith(UPLOAD_CONFIGURATION_ERROR_PREFIX, expect.objectContaining({ code: 'invalid-concurrency', value: -1 }))
  })

  it('falls back to console.error after a once-only error listener has been consumed', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onConfigurationErrorOnce = vi.fn()
    const wrapper = mountUpload({ concurrency: 0, onConfigurationErrorOnce })
    expect(onConfigurationErrorOnce).toHaveBeenCalledOnce()
    expect(report).not.toHaveBeenCalled()
    await wrapper.setProps({ concurrency: -1 })
    expect(onConfigurationErrorOnce).toHaveBeenCalledOnce()
    expect(report.mock.calls).toEqual([[UPLOAD_CONFIGURATION_ERROR_PREFIX, expect.objectContaining({ code: 'invalid-concurrency', value: -1 })]])
  })

  it('recognizes kebab-case event listeners and reports again if they are removed', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const listener = vi.fn()
    const wrapper = mountUpload({ concurrency: 0, ...{ 'onConfiguration-error': listener } })
    expect(listener).toHaveBeenCalledOnce()
    expect(report).not.toHaveBeenCalled()
    await wrapper.setProps({ concurrency: -1, 'onConfiguration-error': undefined })
    expect(report.mock.calls).toEqual([[UPLOAD_CONFIGURATION_ERROR_PREFIX, expect.objectContaining({ code: 'invalid-concurrency', value: -1 })]])
  })

  it.each([undefined, Infinity])('recovers invalid configuration to unlimited concurrency=%s', async (concurrency) => {
    const harness = requestHarness()
    const wrapper = mountUpload({ concurrency: 0, httpRequest: harness.httpRequest, onConfigurationError: vi.fn() })
    wrapper.vm.addFiles(rawFiles())
    await flushPromises()
    expect(harness.requests).toHaveLength(0)
    await wrapper.setProps({ concurrency })
    await flushPromises()
    expect(harness.active).toBe(FILE_COUNT)
    expect(wrapper.vm.getConfigurationErrors()).toEqual([])
    await finishRequests(harness)
  })

  it('lets active requests settle while invalid and resumes queued work/retries in FIFO order', async () => {
    const harness = requestHarness()
    const selected = rawFiles()
    const beforeUpload = vi.fn()
    const onConfigurationError = vi.fn()
    const wrapper = mountUpload({ concurrency: CONCURRENCY, beforeUpload, httpRequest: harness.httpRequest, onConfigurationError })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    await wrapper.setProps({ concurrency: 0 })
    expect(harness.requests.every((request) => !request.options.signal.aborted)).toBe(true)
    harness.requests[0].reject()
    harness.requests[1].resolve()
    harness.requests[2].resolve()
    await flushPromises()
    const retried = wrapper.vm.retryAll()
    const cancelled = latestFiles(wrapper)[CONCURRENCY]
    wrapper.vm.abort(cancelled.uid)
    await flushPromises()
    expect(harness.active).toBe(0)
    expect(harness.requests).toHaveLength(CONCURRENCY)
    expect(beforeUpload).toHaveBeenCalledTimes(CONCURRENCY)
    expect(wrapper.emitted('success')).toHaveLength(2)
    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(onConfigurationError).toHaveBeenCalledOnce()
    await wrapper.setProps({ concurrency: CONCURRENCY })
    await flushPromises()
    await finishRequests(harness)
    await retried
    expect(harness.started).toEqual([
      ...names(selected.slice(0, CONCURRENCY)),
      ...names(selected.slice(CONCURRENCY + 1)),
      selected[0].name,
    ])
    expect(harness.peak).toBe(CONCURRENCY)
    expect(latestFiles(wrapper)[CONCURRENCY].status).toBe('cancelled')
  })

  it('keeps manual submission pending while invalid, but permits cancelling every queued attempt', async () => {
    const harness = requestHarness()
    const wrapper = mountUpload({ autoUpload: false, concurrency: 0, httpRequest: harness.httpRequest, onConfigurationError: vi.fn() })
    wrapper.vm.addFiles(rawFiles(CONCURRENCY))
    let completed = false
    const submitted = wrapper.vm.submit().then(() => { completed = true })
    await flushPromises()
    expect(harness.requests).toHaveLength(0)
    expect(completed).toBe(false)
    wrapper.vm.cancelAll()
    await submitted
    await wrapper.setProps({ concurrency: CONCURRENCY })
    await flushPromises()
    expect(harness.requests).toHaveLength(0)
    expect(latestFiles(wrapper).every((file) => file.status === 'cancelled')).toBe(true)
  })

  it('applies increases immediately and reductions only to future admissions', async () => {
    const harness = requestHarness()
    const selected = rawFiles()
    const wrapper = mountUpload({ concurrency: CONCURRENCY, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    await wrapper.setProps({ concurrency: 1 })
    expect(harness.requests.every((request) => !request.options.signal.aborted)).toBe(true)
    for (let index = 0; index < CONCURRENCY - 1; index++) {
      harness.requests[index].resolve()
      await flushPromises()
      expect(harness.requests).toHaveLength(CONCURRENCY)
    }
    harness.requests[CONCURRENCY - 1].resolve()
    await flushPromises()
    expect(harness.active).toBe(1)
    expect(harness.requests).toHaveLength(CONCURRENCY + 1)
    await wrapper.setProps({ concurrency: CONCURRENCY })
    await flushPromises()
    expect(harness.active).toBe(CONCURRENCY)
    await wrapper.setProps({ concurrency: undefined })
    await flushPromises()
    expect(harness.started).toEqual(names(selected))
    await finishRequests(harness)
  })

  it('leaves manual files ready until submit and does not duplicate repeated submissions', async () => {
    const harness = requestHarness()
    const beforeUpload = vi.fn()
    const wrapper = mountUpload({ autoUpload: false, concurrency: CONCURRENCY, beforeUpload, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(rawFiles())
    expect(latestFiles(wrapper).every((file) => file.status === 'ready')).toBe(true)
    expect(beforeUpload).not.toHaveBeenCalled()
    const submitted = wrapper.vm.submit()
    const repeated = wrapper.vm.submit()
    await flushPromises()
    expect(harness.requests).toHaveLength(CONCURRENCY)
    await finishRequests(harness)
    await expect(submitted).resolves.toHaveLength(FILE_COUNT)
    await repeated
    expect(harness.requests).toHaveLength(FILE_COUNT)
  })

  it('pauses queued admission while disabled without aborting existing requests', async () => {
    const harness = requestHarness()
    const wrapper = mountUpload({ concurrency: 1, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(rawFiles(CONCURRENCY))
    await flushPromises()
    await wrapper.setProps({ disabled: true })
    expect(harness.requests[0].options.signal.aborted).toBe(false)
    harness.requests[0].resolve()
    await flushPromises()
    await wrapper.vm.submit()
    wrapper.vm.addFiles(rawFiles(1))
    expect(harness.requests).toHaveLength(1)
    expect(latestFiles(wrapper)).toHaveLength(CONCURRENCY)
    await wrapper.setProps({ disabled: false })
    await flushPromises()
    expect(harness.requests).toHaveLength(2)
    await finishRequests(harness)
    expect(harness.peak).toBe(1)
  })
})

describe('Upload queue cancellation and retry', () => {
  it('cancels a queued file without invoking its hook or request and exposes localized queue actions', async () => {
    const harness = requestHarness()
    const beforeUpload = vi.fn()
    const selected = rawFiles(CONCURRENCY)
    const wrapper = mountUpload({ concurrency: 1, beforeUpload, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    const queued = latestFiles(wrapper)[1]
    const row = wrapper.findAll('li.is-queued')[0]
    expect(row.get('[role="status"]').text()).toBe('排队中')
    await row.get(`button[aria-label="取消 ${queued.name}"]`).trigger('click')
    wrapper.vm.abort(queued.uid)
    expect(wrapper.emitted('abort')).toHaveLength(1)
    expect(latestFiles(wrapper)[1].status).toBe('cancelled')
    expect(harness.requests).toHaveLength(1)
    harness.requests[0].resolve()
    await flushPromises()
    expect(harness.started).toEqual([selected[0].name, selected[2].name])
    expect(beforeUpload.mock.calls.map(([file]) => file.name)).toEqual(harness.started)
  })

  it('releases a sent request slot only after a signal-aware request has stopped and settled', async () => {
    const harness = requestHarness(true)
    const wrapper = mountUpload({ concurrency: 1, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(rawFiles(CONCURRENCY))
    await flushPromises()
    const first = harness.requests[0]
    wrapper.vm.abort(latestFiles(wrapper)[0].uid)
    expect(first.options.signal.aborted).toBe(true)
    expect(harness.active).toBe(0)
    expect(harness.requests).toHaveLength(1)
    await flushPromises()
    expect(harness.active).toBe(1)
    expect(harness.requests).toHaveLength(2)
    first.options.onProgress(PROGRESS)
    first.resolve({ stale: true })
    await flushPromises()
    expect(wrapper.emitted('progress')).toBeUndefined()
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
    await finishRequests(harness)
    expect(harness.peak).toBe(1)
  })

  it('retains real capacity and submit settlement when a custom request ignores abort', async () => {
    const harness = requestHarness()
    const wrapper = mountUpload({ autoUpload: false, concurrency: 1, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(rawFiles(CONCURRENCY))
    let submitted = false
    const submission = wrapper.vm.submit().then(() => { submitted = true })
    await flushPromises()
    wrapper.vm.cancelAll()
    await flushPromises()
    expect(harness.requests).toHaveLength(1)
    expect(harness.active).toBe(1)
    expect(harness.requests[0].options.signal.aborted).toBe(true)
    expect(submitted).toBe(false)
    expect(latestFiles(wrapper).every((file) => file.status === 'cancelled')).toBe(true)
    harness.requests[0].options.onProgress(PROGRESS)
    harness.requests[0].reject(new Error('late failure'))
    await submission
    expect(harness.active).toBe(0)
    expect(harness.requests).toHaveLength(1)
    expect(wrapper.emitted('progress')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.emitted('success')).toBeUndefined()
  })

  it('cancels all ten jobs atomically, including when abort settles synchronously', async () => {
    const harness = requestHarness(true)
    const wrapper = mountUpload({ concurrency: CONCURRENCY, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(rawFiles())
    await flushPromises()
    await wrapper.get('.scq-upload__batch-action').trigger('click')
    await flushPromises()
    expect(harness.requests).toHaveLength(CONCURRENCY)
    expect(harness.active).toBe(0)
    expect(wrapper.emitted('abort')).toHaveLength(FILE_COUNT)
    wrapper.vm.cancelAll()
    await wrapper.vm.retryAll()
    expect(wrapper.emitted('abort')).toHaveLength(FILE_COUNT)
    expect(harness.requests).toHaveLength(CONCURRENCY)
    const submitted = wrapper.vm.submit()
    await flushPromises()
    expect(harness.requests).toHaveLength(CONCURRENCY * 2)
    wrapper.vm.abort()
    await submitted
    expect(harness.peak).toBe(CONCURRENCY)
    expect(wrapper.emitted('abort')).toHaveLength(FILE_COUNT * 2)
  })

  it('puts retries at the FIFO tail and prevents overlap or stale cleanup across repeated cancel/retry', async () => {
    const harness = requestHarness()
    const selected = rawFiles(2)
    const wrapper = mountUpload({ concurrency: 1, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    const uid = latestFiles(wrapper)[0].uid
    wrapper.vm.abort(uid)
    const retry = wrapper.vm.retry(uid)
    expect(wrapper.vm.retry(uid)).toBe(retry)
    await flushPromises()
    expect(harness.requests).toHaveLength(1)
    expect(harness.active).toBe(1)
    harness.requests[0].resolve({ stale: true })
    await flushPromises()
    expect(harness.started).toEqual(names(selected))
    expect(wrapper.emitted('success')).toBeUndefined()
    harness.requests[1].resolve()
    await flushPromises()
    expect(harness.started).toEqual([...names(selected), selected[0].name])
    harness.requests[0].options.onProgress(PROGRESS)
    wrapper.vm.abort(uid)
    const secondRetry = wrapper.vm.retry(uid)
    expect(wrapper.vm.retry(uid)).toBe(secondRetry)
    harness.requests[2].reject()
    await retry
    await flushPromises()
    expect(harness.requests).toHaveLength(4)
    harness.requests[2].options.onProgress(PROGRESS)
    harness.requests[3].resolve()
    await secondRetry
    expect(wrapper.emitted('success')).toHaveLength(2)
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.emitted('progress')).toBeUndefined()
    expect(harness.peak).toBe(1)
    expect(latestFiles(wrapper).every((file) => file.status === 'success')).toBe(true)
  })

  it('retries failed files only, in list order, without duplicating repeated batch retries', async () => {
    const harness = requestHarness(true)
    const selected = rawFiles(4)
    const wrapper = mountUpload({ concurrency: 2, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    harness.requests[0].reject()
    harness.requests[1].resolve()
    await flushPromises()
    harness.requests[2].reject()
    wrapper.vm.abort(latestFiles(wrapper)[3].uid)
    await flushPromises()
    expect(latestFiles(wrapper).map((file) => file.status)).toEqual(['error', 'success', 'error', 'cancelled'])
    expect(wrapper.get('.scq-upload__batch-action').text()).toBe('重试失败项')
    const retried = wrapper.vm.retryAll()
    await wrapper.vm.retryAll()
    await flushPromises()
    expect(harness.started.slice(selected.length)).toEqual([selected[0].name, selected[2].name])
    await finishRequests(harness)
    await retried
    expect(harness.peak).toBe(2)
    expect(wrapper.emitted('error')).toHaveLength(2)
    expect(latestFiles(wrapper).map((file) => file.status)).toEqual(['success', 'success', 'success', 'cancelled'])
  })
})

describe('Upload queue validation and preflight', () => {
  it('preserves type, size and limit rejection without consuming queue slots', async () => {
    const harness = requestHarness()
    const wrapper = mountUpload({ concurrency: 1, accept: '.txt', maxSize: 4, limit: 2, httpRequest: harness.httpRequest })
    const invalidType = new File(['x'], 'image.png', { type: 'image/png' })
    const invalidSize = new File(['too large'], 'large.txt', { type: 'text/plain' })
    wrapper.vm.addFiles([invalidType])
    wrapper.vm.addFiles([invalidSize])
    wrapper.vm.addFiles(rawFiles(CONCURRENCY))
    expect(wrapper.emitted('reject')).toEqual([[invalidType, 'type'], [invalidSize, 'size']])
    expect(wrapper.emitted('exceed')![0][0]).toHaveLength(CONCURRENCY)
    expect(harness.requests).toHaveLength(0)
    wrapper.vm.addFiles(rawFiles(2))
    await flushPromises()
    expect(harness.active).toBe(1)
    expect(latestFiles(wrapper)).toHaveLength(2)
    await finishRequests(harness)
    expect(harness.peak).toBe(1)
  })

  it('admits asynchronous hooks FIFO, counts preflight slots, transforms blobs, and advances after rejection', async () => {
    const harness = requestHarness()
    const selected = rawFiles(4)
    const gates = selected.map(() => deferred<boolean | void | Blob>())
    const beforeUpload = vi.fn((file: File) => gates[selected.indexOf(file)].promise)
    const wrapper = mountUpload({ concurrency: 2, beforeUpload, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    expect(beforeUpload.mock.calls.map(([file]) => file.name)).toEqual(names(selected.slice(0, 2)))
    expect(harness.requests).toHaveLength(0)
    const transformed = new Blob(['transformed'], { type: 'application/octet-stream' })
    gates[1].resolve(transformed)
    await flushPromises()
    expect(harness.requests[0].options).toMatchObject({ file: transformed, filename: selected[1].name })
    expect(beforeUpload).toHaveBeenCalledTimes(2)
    gates[0].resolve(false)
    await flushPromises()
    expect(wrapper.emitted('reject')).toEqual([[selected[0], 'hook']])
    expect(latestFiles(wrapper)[0].status).toBe('ready')
    expect(beforeUpload).toHaveBeenCalledTimes(CONCURRENCY)
    const hookError = new Error('preflight failed')
    gates[2].reject(hookError)
    await flushPromises()
    expect(wrapper.emitted('error')![0]).toEqual([hookError, expect.objectContaining({ name: selected[2].name, status: 'error' })])
    gates[3].resolve(undefined)
    await flushPromises()
    expect(harness.started).toEqual([selected[1].name, selected[3].name])
    expect(beforeUpload.mock.calls.map(([file]) => file.name)).toEqual(names(selected))
    await finishRequests(harness)
    expect(harness.peak).toBe(2)
  })

  it.each(['resolve', 'reject'] as const)('releases cancelled preflight immediately and ignores its late %s', async (outcome) => {
    const harness = requestHarness()
    const gate = deferred<boolean | void | Blob>()
    const selected = rawFiles(2)
    const beforeUpload = vi.fn((file: File) => file === selected[0] ? gate.promise : undefined)
    const wrapper = mountUpload({ concurrency: 1, beforeUpload, httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    expect(harness.requests).toHaveLength(0)
    wrapper.vm.abort(latestFiles(wrapper)[0].uid)
    await flushPromises()
    expect(harness.started).toEqual([selected[1].name])
    if (outcome === 'resolve') gate.resolve(false)
    else gate.reject(new Error('stale preflight'))
    await flushPromises()
    expect(wrapper.emitted('reject')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(harness.requests).toHaveLength(1)
    expect(latestFiles(wrapper)[0].status).toBe('cancelled')
  })

  it.each(['hook', 'request'] as const)('advances the queue after a synchronous %s exception', async (source) => {
    const harness = requestHarness()
    const selected = rawFiles(2)
    const error = new Error('synchronous failure')
    const wrapper = mountUpload({
      concurrency: 1,
      beforeUpload: (file) => { if (source === 'hook' && file === selected[0]) throw error },
      httpRequest: (options) => {
        if (source === 'request' && options.file === selected[0]) throw error
        return harness.httpRequest(options)
      },
    })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    expect(wrapper.emitted('error')![0]).toEqual([error, expect.objectContaining({ name: selected[0].name })])
    expect(harness.started).toEqual([selected[1].name])
    harness.requests[0].resolve()
    await flushPromises()
    expect(wrapper.emitted('success')).toHaveLength(1)
  })

  it('preserves request options, progress clamping and success events, and ignores post-settlement progress', async () => {
    const harness = requestHarness()
    const transformed = new Blob(['body'])
    const headers = { Authorization: 'test-token' }
    const data = { category: 'test', attachment: new Blob(['extra']) }
    const wrapper = mountUpload({
      concurrency: 1, action: '/files', method: 'PUT', name: 'payload', headers, data, withCredentials: true,
      beforeUpload: () => transformed, httpRequest: harness.httpRequest,
    })
    const selected = rawFiles(1)
    wrapper.vm.addFiles(selected)
    await flushPromises()
    const request = harness.requests[0]
    expect(request.options).toMatchObject({ file: transformed, filename: selected[0].name, action: '/files', method: 'PUT', name: 'payload', headers, data, withCredentials: true })
    for (const progress of [150, -1, NaN, PROGRESS]) request.options.onProgress(progress)
    expect(wrapper.emitted('progress')!.map(([percentage]) => percentage)).toEqual([100, 0, 0, PROGRESS])
    const response = { id: 'uploaded' }
    request.resolve(response)
    await flushPromises()
    expect(wrapper.emitted('success')![0]).toEqual([response, expect.objectContaining({ response, status: 'success', percentage: 100 })])
    const updates = wrapper.emitted('update:fileList')!.length
    request.options.onProgress(0)
    expect(wrapper.emitted('update:fileList')).toHaveLength(updates)
    expect(wrapper.emitted('progress')).toHaveLength(4)
  })

  it('reuses the built-in XHR abort path and releases capacity after its abort event', async () => {
    let active = 0
    let peak = 0
    const requests: FakeXHR[] = []
    class FakeXHR {
      upload = { onprogress: null as ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null }
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      onabort: (() => void) | null = null
      withCredentials = false
      status = 200
      responseText = '{"ok":true}'
      open = vi.fn()
      setRequestHeader = vi.fn()
      sent = false
      send = vi.fn((_body: FormData) => { this.sent = true; active++; peak = Math.max(peak, active) })
      abort = vi.fn(() => { if (this.sent) { this.sent = false; active--; this.onabort?.() } })
      finish() { this.sent = false; active--; this.onload?.() }
      constructor() { requests.push(this) }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXHR)
    const wrapper = mountUpload({ concurrency: 1, action: 'https://upload.example.test/files', method: 'PATCH', name: 'payload', data: { folder: 'test' }, headers: { 'X-Test': 'yes' }, withCredentials: true })
    const selected = rawFiles(2)
    wrapper.vm.addFiles(selected)
    await flushPromises()
    expect(active).toBe(1)
    expect(requests[0].open).toHaveBeenCalledWith('PATCH', 'https://upload.example.test/files')
    expect(requests[0].setRequestHeader).toHaveBeenCalledWith('X-Test', 'yes')
    expect(requests[0].withCredentials).toBe(true)
    const form = requests[0].send.mock.calls[0][0]
    expect(form.get('folder')).toBe('test')
    expect((form.get('payload') as File).name).toBe(selected[0].name)
    wrapper.vm.abort(latestFiles(wrapper)[0].uid)
    expect(requests[0].abort).toHaveBeenCalledOnce()
    await flushPromises()
    expect(requests).toHaveLength(2)
    expect(active).toBe(1)
    requests[1].finish()
    await flushPromises()
    expect(peak).toBe(1)
    expect(wrapper.emitted('success')![0][0]).toEqual({ ok: true })
    expect(wrapper.emitted('error')).toBeUndefined()
  })
})

describe('Upload queue controlled identity and cleanup', () => {
  it('preserves requests across immutable v-model echoes and progress updates', async () => {
    const harness = requestHarness()
    const { files, api } = mountControlled({ concurrency: CONCURRENCY, httpRequest: harness.httpRequest })
    api.addFiles(rawFiles())
    await flushPromises()
    expect(harness.requests).toHaveLength(CONCURRENCY)
    harness.requests[0].options.onProgress(PROGRESS)
    await nextTick()
    expect(files.value[0].percentage).toBe(PROGRESS)
    expect(harness.requests.every((request) => !request.options.signal.aborted)).toBe(true)
    await finishRequests(harness)
    expect(harness.requests).toHaveLength(FILE_COUNT)
    expect(harness.peak).toBe(CONCURRENCY)
    expect(files.value.every((file) => file.status === 'success')).toBe(true)
  })

  it('observes in-place external removal of active and queued files without leaking their results', async () => {
    const harness = requestHarness()
    const selected = rawFiles(CONCURRENCY)
    const beforeUpload = vi.fn()
    const { files, wrapper, api } = mountControlled({ concurrency: 1, beforeUpload, httpRequest: harness.httpRequest })
    api.addFiles(selected)
    await flushPromises()
    files.value.splice(0, 2)
    await nextTick()
    expect(harness.requests[0].options.signal.aborted).toBe(true)
    expect(harness.requests).toHaveLength(1)
    harness.requests[0].options.onProgress(PROGRESS)
    harness.requests[0].resolve({ stale: true })
    await flushPromises()
    expect(harness.started).toEqual([selected[0].name, selected[2].name])
    expect(beforeUpload.mock.calls.map(([file]) => file.name)).toEqual(harness.started)
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(wrapper.emitted('progress')).toBeUndefined()
    expect(wrapper.emitted('abort')).toBeUndefined()
    expect(wrapper.emitted('remove')).toBeUndefined()
    expect(files.value).toHaveLength(1)
  })

  it('invalidates same-ID replacement attempts and keeps their real slots until settlement', async () => {
    const harness = requestHarness()
    const original = uploadFile(rawFiles(1)[0], 'stable-id')
    const replacement = uploadFile(new File(['replacement'], original.name), original.uid)
    const wrapper = mountUpload({ fileList: [original], autoUpload: false, concurrency: 1, httpRequest: harness.httpRequest })
    const submitted = wrapper.vm.submit()
    await flushPromises()
    await wrapper.setProps({ fileList: [replacement] })
    const replaced = wrapper.vm.submit()
    await flushPromises()
    expect(harness.requests[0].options.signal.aborted).toBe(true)
    expect(harness.active).toBe(1)
    expect(harness.requests).toHaveLength(1)
    harness.requests[0].options.onProgress(PROGRESS)
    harness.requests[0].resolve({ stale: true })
    await submitted
    await flushPromises()
    expect(harness.requests).toHaveLength(2)
    expect(harness.requests[1].options.file).toBe(replacement.raw)
    harness.requests[0].options.onProgress(PROGRESS)
    harness.requests[1].resolve({ replacement: true })
    await replaced
    expect(harness.peak).toBe(1)
    expect(wrapper.emitted('success')).toHaveLength(1)
    expect(wrapper.emitted('success')![0][0]).toEqual({ replacement: true })
    expect(wrapper.emitted('progress')).toBeUndefined()
  })

  it('honors external status resets without treating ordinary clones as replacements', async () => {
    const harness = requestHarness()
    const { files, api, wrapper } = mountControlled({ concurrency: 1, httpRequest: harness.httpRequest })
    api.addFiles(rawFiles(2))
    await flushPromises()
    files.value[0].status = 'cancelled'
    await nextTick()
    expect(harness.requests[0].options.signal.aborted).toBe(true)
    expect(harness.requests).toHaveLength(1)
    harness.requests[0].reject()
    await flushPromises()
    expect(harness.requests).toHaveLength(2)
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(files.value[0].status).toBe('cancelled')
  })

  it('reports every rejected duplicate ID and only requests the retained entries', async () => {
    const harness = requestHarness()
    const selected = rawFiles(4)
    const list = [uploadFile(selected[0], 'duplicate'), uploadFile(selected[1], 'duplicate'), uploadFile(selected[2], 'duplicate'), uploadFile(selected[3])]
    const onConfigurationError = vi.fn()
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mountUpload({ fileList: list, concurrency: CONCURRENCY, autoUpload: false, httpRequest: harness.httpRequest, onConfigurationError })
    expect(onConfigurationError).toHaveBeenCalledTimes(2)
    expect(onConfigurationError.mock.calls.map(([error]) => error)).toEqual([
      expect.objectContaining({ code: 'duplicate-uid', uid: 'duplicate', index: 1, file: list[1], firstIndex: 0, firstFile: list[0] }),
      expect.objectContaining({ code: 'duplicate-uid', uid: 'duplicate', index: 2, file: list[2], firstIndex: 0, firstFile: list[0] }),
    ])
    expect(wrapper.vm.getConfigurationErrors()).toHaveLength(2)
    expect(report).not.toHaveBeenCalled()
    const submitted = wrapper.vm.submit()
    await flushPromises()
    expect(wrapper.findAll('.scq-upload__list li')).toHaveLength(2)
    expect(harness.started).toEqual([selected[0].name, selected[3].name])
    expect(list).toHaveLength(selected.length)
    await finishRequests(harness)
    await submitted
    expect(latestFiles(wrapper)).toHaveLength(2)
    expect(wrapper.emitted('success')).toHaveLength(2)
    expect(wrapper.emitted('reject')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
  })

  it('logs unhandled duplicate inputs, avoids repeated clone/progress reports, and clears corrected errors', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const selected = rawFiles(2)
    const list = selected.map((file) => uploadFile(file, 'duplicate'))
    const wrapper = mountUpload({ fileList: list, autoUpload: false })
    expect(report.mock.calls).toEqual([[UPLOAD_CONFIGURATION_ERROR_PREFIX, expect.objectContaining({
      code: 'duplicate-uid', index: 1, file: list[1], firstIndex: 0, firstFile: list[0],
    })]])
    await wrapper.setProps({ fileList: list.map((file) => ({ ...file, percentage: PROGRESS })) })
    expect(report).toHaveBeenCalledOnce()
    expect(wrapper.vm.getConfigurationErrors()[0]).toMatchObject({ file: { percentage: PROGRESS } })
    await wrapper.setProps({ fileList: [list[0]] })
    expect(wrapper.vm.getConfigurationErrors()).toEqual([])
    await wrapper.setProps({ fileList: list })
    expect(report).toHaveBeenCalledTimes(2)
    const replacement = uploadFile(new File(['replacement'], list[1].name), list[1].uid)
    await wrapper.setProps({ fileList: [list[0], replacement] })
    expect(report).toHaveBeenCalledTimes(CONCURRENCY)
    expect(report).toHaveBeenLastCalledWith(UPLOAD_CONFIGURATION_ERROR_PREFIX, expect.objectContaining({ code: 'duplicate-uid', file: replacement }))
    expect(wrapper.vm.getConfigurationErrors()).toHaveLength(1)
  })

  it('exposes both invalid concurrency and duplicate inputs until their respective corrections', async () => {
    const onConfigurationError = vi.fn()
    const list = rawFiles(2).map((file) => uploadFile(file, 'duplicate'))
    const wrapper = mountUpload({ concurrency: 0, fileList: list, onConfigurationError })
    expect(wrapper.vm.getConfigurationErrors().map((error) => error.code)).toEqual(['invalid-concurrency', 'duplicate-uid'])
    expect(onConfigurationError).toHaveBeenCalledTimes(2)
    await wrapper.setProps({ concurrency: CONCURRENCY })
    expect(wrapper.vm.getConfigurationErrors().map((error) => error.code)).toEqual(['duplicate-uid'])
    await wrapper.setProps({ fileList: [list[0]] })
    expect(wrapper.vm.getConfigurationErrors()).toEqual([])
    expect(onConfigurationError).toHaveBeenCalledTimes(2)
  })

  it('skips generated IDs already supplied by a controlled file list', async () => {
    const wrapper = mountUpload({ autoUpload: false })
    wrapper.vm.addFiles(rawFiles(1))
    const initial = latestFiles(wrapper)[0]
    const nextId = initial.uid.replace(/-\d+$/, '-2')
    const controlled = uploadFile(new File(['external'], 'external.txt'), nextId)
    await wrapper.setProps({ fileList: [initial, controlled] })
    wrapper.vm.addFiles([new File(['new'], 'new.txt')])
    expect(new Set(latestFiles(wrapper).map((file) => file.uid)).size).toBe(CONCURRENCY)
    expect(latestFiles(wrapper)[2].uid).not.toBe(nextId)
  })

  it('deduplicates pending removal and exposes busy state on the remove button', async () => {
    const gate = deferred<boolean>()
    const beforeRemove = vi.fn(() => gate.promise)
    const file = uploadFile(rawFiles(1)[0])
    const wrapper = mountUpload({ fileList: [file], autoUpload: false, beforeRemove })
    const first = wrapper.vm.remove(file.uid)
    const second = wrapper.vm.remove(file.uid)
    await flushPromises()
    expect(first).toBe(second)
    expect(beforeRemove).toHaveBeenCalledOnce()
    expect(wrapper.findAll('.scq-upload__action').at(-1)?.attributes('aria-busy')).toBe('true')
    gate.resolve(true)
    await first
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it.each(['disabled', 'guard'])('invalidates an outstanding removal when %s changes', async change => {
    const gate = deferred<boolean>()
    const file = uploadFile(rawFiles(1)[0])
    const wrapper = mountUpload({ fileList: [file], autoUpload: false, beforeRemove: () => gate.promise })
    const pending = wrapper.vm.remove(file.uid)
    await flushPromises()
    if (change === 'disabled') {
      await wrapper.setProps({ disabled: true })
      await wrapper.setProps({ disabled: false })
    } else await wrapper.setProps({ beforeRemove: () => false })
    gate.resolve(true)
    await pending
    expect(wrapper.emitted('remove')).toBeUndefined()
    expect(wrapper.findAll('.scq-upload__list li')).toHaveLength(1)
  })

  it.each(['name', 'remove'])('restores the upload trigger when the focused file %s control is removed', async control => {
    const container = document.createElement('div')
    document.body.append(container)
    containers.push(container)
    const file = uploadFile(rawFiles(1)[0])
    const wrapper = mount(Upload, { attachTo: container, props: { fileList: [file], autoUpload: false } })
    wrappers.push(wrapper)
    const target = control === 'name' ? wrapper.get<HTMLButtonElement>('.scq-upload__name') : wrapper.findAll<HTMLButtonElement>('.scq-upload__action').at(-1)!
    target.element.focus()
    await wrapper.vm.remove(file.uid)
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('.scq-upload__trigger').element)
  })

  it.each(['resolve', 'reject'] as const)('ignores a stale removal guard %s after the same ID is replaced', async (outcome) => {
    const gate = deferred<boolean>()
    const original = uploadFile(rawFiles(1)[0])
    const replacement = uploadFile(new File(['replacement'], 'replacement.txt'), original.uid)
    const wrapper = mountUpload({ fileList: [original], autoUpload: false, beforeRemove: () => gate.promise })
    const removed = wrapper.vm.remove(original.uid)
    await wrapper.setProps({ fileList: [replacement] })
    if (outcome === 'resolve') gate.resolve(true)
    else gate.reject(new Error('stale guard'))
    await removed
    expect(wrapper.emitted('remove')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.get('.scq-upload__name').text()).toBe(replacement.name)
  })

  it('holds queue admission throughout clearFiles guards and preserves only vetoed entries', async () => {
    const harness = requestHarness(true)
    const gate = deferred<boolean>()
    const selected = rawFiles(CONCURRENCY)
    const wrapper = mountUpload({
      concurrency: 1, httpRequest: harness.httpRequest,
      beforeRemove: (file) => file.name === selected[0].name ? gate.promise : file.name !== selected[1].name,
    })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    const clearing = wrapper.vm.clearFiles()
    harness.requests[0].resolve()
    await flushPromises()
    expect(harness.requests).toHaveLength(1)
    gate.resolve(true)
    await clearing
    await flushPromises()
    expect(harness.started).toEqual([selected[0].name, selected[1].name])
    expect(latestFiles(wrapper).map((file) => file.name)).toEqual([selected[1].name])
    expect(wrapper.emitted('remove')).toHaveLength(2)
    expect(wrapper.emitted('abort')).toHaveLength(1)
    expect(harness.peak).toBe(1)
  })

  it('does not clear files replaced while an earlier clearFiles guard is pending', async () => {
    const gate = deferred<boolean>()
    const selected = rawFiles(2).map((raw) => uploadFile(raw))
    const replacement = uploadFile(new File(['replacement'], 'replacement.txt'), selected[1].uid)
    const beforeRemove = vi.fn(() => gate.promise)
    const wrapper = mountUpload({ fileList: selected, autoUpload: false, beforeRemove })
    const clearing = wrapper.vm.clearFiles()
    await wrapper.setProps({ fileList: [selected[0], replacement] })
    gate.resolve(true)
    await clearing
    expect(beforeRemove).toHaveBeenCalledOnce()
    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(latestFiles(wrapper)).toEqual([replacement])
  })

  it('revokes owned previews on removal and unmount without releasing an uncancellable request prematurely', async () => {
    const createObjectURL = vi.fn((file: File) => `blob:${file.name}`)
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL })
    const harness = requestHarness()
    const selected = Array.from({ length: CONCURRENCY }, (_, index) => new File(['image'], `${index}.png`, { type: 'image/png' }))
    const wrapper = mountUpload({ concurrency: 1, listType: 'picture', httpRequest: harness.httpRequest })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    const files = latestFiles(wrapper)
    await wrapper.vm.remove(files[1].uid)
    await wrapper.vm.remove(files[0].uid)
    expect(revokeObjectURL.mock.calls.map(([url]) => url)).toEqual([files[1].url, files[0].url])
    expect(harness.active).toBe(1)
    expect(harness.requests).toHaveLength(1)
    harness.requests[0].options.onProgress(PROGRESS)
    harness.requests[0].resolve({ removed: true })
    await flushPromises()
    expect(harness.started).toEqual([selected[0].name, selected[2].name])
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(wrapper.emitted('progress')).toBeUndefined()
    wrapper.unmount()
    expect(harness.requests[1].options.signal.aborted).toBe(true)
    expect(revokeObjectURL.mock.calls.map(([url]) => url)).toEqual([files[1].url, files[0].url, files[2].url])
    expect(createObjectURL).toHaveBeenCalledTimes(CONCURRENCY)
  })

  it('aborts active work, discards queued/preflight work, and ignores every late event after unmount', async () => {
    const harness = requestHarness()
    const gate = deferred<Blob>()
    const selected = rawFiles(4)
    const observed = vi.fn()
    const listeners = {
      'onUpdate:fileList': observed, onChange: observed, onProgress: observed,
      onSuccess: observed, onError: observed, onAbort: observed, onRemove: observed, onReject: observed,
    }
    const wrapper = mountUpload({
      ...listeners,
      concurrency: 2, httpRequest: harness.httpRequest,
      beforeUpload: (file) => file === selected[1] ? gate.promise : undefined,
    })
    wrapper.vm.addFiles(selected)
    await flushPromises()
    expect(harness.requests).toHaveLength(1)
    const api = wrapper.vm
    const beforeUnmount = observed.mock.calls.length
    wrapper.unmount()
    expect(harness.requests[0].options.signal.aborted).toBe(true)
    gate.resolve(new Blob(['stale']))
    harness.requests[0].options.onProgress(PROGRESS)
    harness.requests[0].resolve()
    api.addFiles(rawFiles(1))
    await api.submit()
    await api.clearFiles()
    api.cancelAll()
    await flushPromises()
    expect(harness.requests).toHaveLength(1)
    expect(observed).toHaveBeenCalledTimes(beforeUnmount)
  })
})
