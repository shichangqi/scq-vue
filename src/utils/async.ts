import { getCurrentInstance, onBeforeUnmount, readonly, ref, watch } from 'vue'

export type AsyncGuard<T> = (value: T, signal: AbortSignal) => boolean | void | Promise<boolean | void>
export const MAX_TIMEOUT_DELAY = 2_147_483_647

const useAsyncTask = (hasErrorHandler?: () => boolean) => {
  const instance = getCurrentInstance()
  const pending = ref(false)
  let controller: AbortController | undefined
  let sequence = 0
  let disposed = false
  const cancel = () => {
    const active = controller
    controller = undefined
    sequence += 1
    pending.value = false
    active?.abort()
  }
  const run = <Result>(
    execute: (signal: AbortSignal) => Result | Promise<Result>,
    apply: (result: Result) => void | boolean,
    onError: (error: unknown) => void,
  ): Promise<boolean> => {
    if (disposed) return Promise.resolve(false)
    const current = sequence + 1
    cancel()
    if (disposed || sequence !== current) return Promise.resolve(false)
    const request = new AbortController()
    controller = request
    pending.value = true
    const currentRequest = () => !disposed && !request.signal.aborted && sequence === current
    let abort: () => void = () => {}
    const cancelled = new Promise<{ cancelled: true }>((resolve) => {
      abort = () => resolve({ cancelled: true })
      request.signal.addEventListener('abort', abort, { once: true })
    })
    const execution = Promise.resolve().then(async () => {
      if (!currentRequest()) return { cancelled: true } as const
      return { cancelled: false, value: await execute(request.signal) } as const
    })
    return Promise.race([execution, cancelled])
      .then((result) => {
        if (!currentRequest() || result.cancelled) return false
        return apply(result.value) !== false
      }, (error: unknown) => {
        if (currentRequest()) {
          onError(error)
          if (instance && !(hasErrorHandler?.() ?? Boolean(instance.vnode.props?.onError))) console.error('[scq-vue] Async guard failed', error)
        }
        return false
      })
      .finally(() => {
        request.signal.removeEventListener('abort', abort)
        if (current === sequence) {
          controller = undefined
          pending.value = false
        }
      })
  }
  onBeforeUnmount(() => { disposed = true; cancel() })
  return { pending: readonly(pending), run, cancel, active: () => !disposed }
}

export const useAsyncGuard = <T>(
  guard: () => AsyncGuard<T> | undefined,
  onError: (error: unknown, value: T) => void,
  hasErrorHandler?: () => boolean,
) => {
  const task = useAsyncTask(hasErrorHandler)
  watch(guard, task.cancel, { flush: 'sync' })
  const run = (value: T, accept: () => void) => {
    if (!task.active() || task.pending.value) return Promise.resolve(false)
    const handler = guard()
    if (!handler) { accept(); return Promise.resolve(true) }
    return task.run((signal) => handler(value, signal), (allowed) => {
      if (allowed === false) return false
      accept()
      return true
    }, (error) => onError(error, value))
  }
  return { pending: task.pending, cancel: task.cancel, run }
}

export const useLatestRequest = <Result>(
  onResult: (result: Result) => void,
  onError: (error: unknown) => void,
) => {
  const task = useAsyncTask()
  return { pending: task.pending, cancel: task.cancel, run: (request: (signal: AbortSignal) => Result | Promise<Result>) => task.run(request, onResult, onError) }
}

export interface ModalActionOptions<T extends string> {
  beforeClose?: AsyncGuard<T>
  onConfirm?: (signal: AbortSignal) => boolean | void | Promise<boolean | void>
  onCancel?: (signal: AbortSignal) => boolean | void | Promise<boolean | void>
  onError?: (error: unknown, reason: T) => void
}

export const useModalActions = <T extends string>(options: () => ModalActionOptions<T>) => {
  const reason = ref<string>()
  const guard = useAsyncGuard<T>(() => async (action, signal) => {
    const current = options()
    const callback = action === 'confirm' ? current.onConfirm : action === 'cancel' ? current.onCancel : undefined
    if (callback && await callback(signal) === false) return false
    if (signal.aborted) return false
    return current.beforeClose?.(action, signal)
  }, (error, action) => options().onError?.(error, action), () => Boolean(options().onError))
  const request = (action: T, accept: () => void) => {
    if (guard.pending.value) {
      if (reason.value !== 'confirm' || action === 'confirm') return Promise.resolve(false)
      guard.cancel()
    }
    reason.value = action
    return guard.run(action, accept)
  }
  const beforeClose: AsyncGuard<T> = (action, signal) => {
    if (signal.aborted) return false
    const cancel = () => guard.cancel()
    signal.addEventListener('abort', cancel, { once: true })
    return request(action, () => {}).finally(() => signal.removeEventListener('abort', cancel))
  }
  return { pending: guard.pending, reason: readonly(reason), cancel: guard.cancel, request, beforeClose }
}
