import { createVNode, render, type AppContext } from 'vue'
import Toast, { type ToastPosition, type ToastType } from './Toast.vue'
import type { IconName } from '../Icon/icons'

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

const activeToasts = new Map<Element, { dispose: () => void }>()
const emptyInstance: ToastInstance = { close: () => {}, update: () => {} }

export const showToast = (input: string | ToastApiOptions = {}, appContext?: AppContext): ToastInstance => {
  if (typeof document === 'undefined') return emptyInstance
  let options: ToastApiOptions = typeof input === 'string' ? { message: input } : { ...input }
  const target = options.teleport ? document.querySelector(options.teleport) : document.body
  if (!target) return emptyInstance
  activeToasts.get(target)?.dispose()

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
    if (activeToasts.get(target) === record) activeToasts.delete(target)
    try {
      if (notifyClose) options.onClose?.()
    } finally {
      options.onClosed?.()
    }
  }

  const handleClose = () => {
    if (closing || disposed) return
    closing = true
    cleanupTimer = setTimeout(dispose, 250)
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
  activeToasts.set(target, record)
  renderToast()

  return {
    close: () => {
      if (closing || disposed) return
      try { handleClose() } finally { renderToast() }
    },
    update: (nextOptions) => {
      if (closing || disposed) return
      options = { ...options, ...nextOptions }
      renderToast()
    },
  }
}

const createTypeMethod = (type: ToastType) => (options: string | ToastApiOptions = {}, appContext?: AppContext) => {
  return showToast(typeof options === 'string' ? { message: options, type } : { ...options, type }, appContext)
}

const clear = (teleport?: string) => {
  if (typeof document === 'undefined') return
  for (const [target, record] of [...activeToasts]) {
    if (!teleport || target.matches(teleport)) record.dispose()
  }
}

export const toast = {
  show: showToast,
  success: createTypeMethod('success'),
  fail: createTypeMethod('fail'),
  loading: createTypeMethod('loading'),
  clear,
  destroyAll: clear,
}