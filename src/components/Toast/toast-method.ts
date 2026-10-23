import { createVNode, onScopeDispose, render, type AppContext } from 'vue'
import Toast, { type ToastPosition, type ToastType } from './Toast.vue'
import type { IconName } from '../Icon/icons'
import { resolveMethodContext, useConfigContext } from '../ConfigProvider/context'
import { FEEDBACK_CLEANUP_DELAY, resolveFeedbackTarget, validateFeedbackOptions } from '../../utils/feedback'

export interface ToastApiOptions {
  message?: string
  type?: ToastType
  position?: ToastPosition
  duration?: number
  icon?: IconName
  overlay?: boolean
  forbidClick?: boolean
  closeOnClick?: boolean
  closeOnClickOverlay?: boolean
  teleport?: string
  zIndex?: number
  onClose?: () => void
  onClosed?: () => void
}

export interface ToastInstance {
  close: () => void
  update: (options: Omit<Partial<ToastApiOptions>, 'teleport'>) => void
}

const activeToasts = new Map<Element, Map<AppContext | undefined, { dispose: () => void }>>()
const emptyInstance: ToastInstance = { close: () => {}, update: () => {} }

export const showToast = (input: string | ToastApiOptions = {}, appContext?: AppContext): ToastInstance => {
  if (typeof document === 'undefined') return emptyInstance
  let options: ToastApiOptions = typeof input === 'string' ? { message: input } : { ...input }
  validateFeedbackOptions(options, 'Toast')
  const target = resolveFeedbackTarget(options.teleport, 'Toast')
  activeToasts.get(target)?.get(appContext)?.dispose()

  const container = document.createElement('div')
  container.className = 'scq-toast-host'
  target.appendChild(container)
  let closing = false
  let disposed = false
  let cleanupTimer: ReturnType<typeof setTimeout> | undefined

  const dispose = () => {
    if (disposed) return
    disposed = true
    const notifyClose = !closing
    closing = true
    if (cleanupTimer !== undefined) clearTimeout(cleanupTimer)
    render(null, container)
    container.remove()
    const records = activeToasts.get(target)
    if (records?.get(appContext) === record) {
      records.delete(appContext)
      if (!records.size) activeToasts.delete(target)
    }
    try {
      if (notifyClose) options.onClose?.()
    } finally {
      options.onClosed?.()
    }
  }

  const handleClose = () => {
    if (closing || disposed) return
    closing = true
    cleanupTimer = setTimeout(dispose, FEEDBACK_CLEANUP_DELAY)
    options.onClose?.()
  }

  const renderToast = () => {
    const vnode = createVNode(Toast, {
      ...options,
      modelValue: !closing,
      teleport: false,
      onClose: handleClose,
      onClosed: dispose,
    })
    if (appContext) vnode.appContext = appContext
    render(vnode, container)
  }

  const record = { dispose }
  const records = activeToasts.get(target) ?? new Map<AppContext | undefined, { dispose: () => void }>()
  records.set(appContext, record)
  activeToasts.set(target, records)
  renderToast()

  return {
    close: () => {
      if (closing || disposed) return
      try { handleClose() } finally { renderToast() }
    },
    update: (nextOptions) => {
      if (closing || disposed) return
      const next = { ...options, ...nextOptions }
      validateFeedbackOptions(next, 'Toast')
      options = next
      renderToast()
    },
  }
}

const clear = (teleport?: string, appContext?: AppContext) => {
  if (typeof document === 'undefined') return
  for (const [target, records] of [...activeToasts]) {
    if (!teleport || target.matches(teleport)) {
      for (const [context, record] of [...records]) {
        if (!appContext || context === appContext) record.dispose()
      }
    }
  }
}

const createToast = (appContext?: AppContext) => {
  const show = (input: string | ToastApiOptions = {}, context = appContext) => showToast(input, resolveMethodContext(appContext, context))
  const typed = (type: ToastType) => (input: string | ToastApiOptions = {}, context = appContext) =>
    show(typeof input === 'string' ? { message: input, type } : { ...input, type }, context)
  const clearScope = (selector?: string) => clear(selector, appContext)
  return { show, success: typed('success'), fail: typed('fail'), loading: typed('loading'), clear: clearScope, destroyAll: clearScope }
}

export const toast = createToast()
export const useToast = () => {
  const api = createToast(useConfigContext('useToast'))
  onScopeDispose(api.destroyAll)
  return api
}