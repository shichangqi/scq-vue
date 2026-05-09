import { createVNode, defineComponent, h, isVNode, onMounted, reactive, ref, render, type VNode, type VNodeChild } from 'vue'
import Dialog, { type DialogCloseReason, type DialogType } from './Dialog.vue'

export interface DialogApiOptions {
  title?: string
  type?: DialogType
  message?: string
  content?: string | VNode | (() => VNodeChild)
  width?: string | number
  zIndex?: number
  fullscreen?: boolean
  showClose?: boolean
  showFooter?: boolean
  showCancelButton?: boolean
  showConfirmButton?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  openFromTrigger?: boolean
  teleport?: boolean | string
  origin?: HTMLElement | MouseEvent | { x: number; y: number } | null
  beforeClose?: (reason: DialogCloseReason) => boolean | void | Promise<boolean | void>
  onConfirm?: () => boolean | void | Promise<boolean | void>
  onCancel?: () => boolean | void | Promise<boolean | void>
  onClose?: (reason: DialogCloseReason) => void
  onClosed?: () => void
}

export interface DialogInstance {
  close: () => void | Promise<void>
  update: (options: Partial<DialogApiOptions>) => void
}

type DialogApiMethod = (options: DialogApiOptions) => DialogInstance

type PointerOrigin = { x: number; y: number; time: number }

let dialogZIndexSeed = 3000
let lastPointerOrigin: PointerOrigin | null = null
let pointerTrackerBound = false

const bindPointerTracker = (): void => {
  if (pointerTrackerBound || typeof window === 'undefined') {
    return
  }

  const updatePointerOrigin = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null
    if (target && typeof target.getBoundingClientRect === 'function') {
      const rect = target.getBoundingClientRect()
      lastPointerOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        time: Date.now(),
      }
      return
    }

    lastPointerOrigin = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    }
  }

  window.addEventListener('pointerdown', updatePointerOrigin, true)
  pointerTrackerBound = true
}

const resolveAutoOrigin = (): { x: number; y: number } | null => {
  if (!lastPointerOrigin) {
    return null
  }

  if (Date.now() - lastPointerOrigin.time > 1800) {
    return null
  }

  return {
    x: lastPointerOrigin.x,
    y: lastPointerOrigin.y,
  }
}

const openedDialogSet = new Set<{
  close: () => Promise<void>
  forceClose: () => void
}>()

const nextDialogZIndex = (): number => {
  dialogZIndexSeed += 1
  return dialogZIndexSeed
}

const setDialogZIndexSeed = (value: number): void => {
  if (!Number.isFinite(value)) {
    return
  }
  dialogZIndexSeed = Math.max(0, Math.floor(value))
}

const defaultTitleMap: Record<DialogType, string> = {
  default: '提示',
  info: '提示',
  success: '成功',
  warning: '警告',
  error: '错误',
  confirm: '确认',
}

const resolveSlotContent = (state: DialogApiOptions): VNodeChild => {
  if (typeof state.content === 'function') {
    return state.content()
  }

  if (isVNode(state.content)) {
    return state.content
  }

  if (typeof state.content === 'string') {
    return state.content
  }

  if (typeof state.message === 'string') {
    return state.message
  }

  return ''
}

const shouldClose = async (
  handler?: () => boolean | void | Promise<boolean | void>,
): Promise<boolean> => {
  if (!handler) {
    return true
  }

  const result = await handler()
  return result !== false
}

const shouldCloseByReason = async (
  reason: DialogCloseReason,
  handler?: (reason: DialogCloseReason) => boolean | void | Promise<boolean | void>,
): Promise<boolean> => {
  if (!handler) {
    return true
  }

  const result = await handler(reason)
  return result !== false
}

export const openDialog: DialogApiMethod = (options) => {
  if (typeof document === 'undefined') {
    return {
      close: () => undefined,
      update: () => undefined,
    }
  }

  const container = document.createElement('div')
  document.body.appendChild(container)
  bindPointerTracker()

  const hasCancelText = typeof options.cancelButtonText === 'string' && options.cancelButtonText.trim().length > 0
  const hasConfirmText = typeof options.confirmButtonText === 'string' && options.confirmButtonText.trim().length > 0

  const state = reactive<DialogApiOptions>({
    ...options,
    type: options.type || 'info',
    title: options.title || defaultTitleMap[options.type || 'info'],
    showConfirmButton: options.showConfirmButton ?? hasConfirmText,
    showCancelButton: options.showCancelButton ?? hasCancelText,
    showFooter: options.showFooter ?? (hasCancelText || hasConfirmText),
    showClose: options.showClose ?? true,
    openFromTrigger: options.openFromTrigger ?? true,
    origin:
      options.origin ??
      ((options.openFromTrigger ?? true)
        ? resolveAutoOrigin()
        : null),
    zIndex: options.zIndex ?? nextDialogZIndex(),
  })

  if (typeof state.zIndex === 'number' && state.zIndex > dialogZIndexSeed) {
    dialogZIndexSeed = state.zIndex
  }

  const visible = ref(false)
  const confirmLoading = ref(false)
  const cancelLoading = ref(false)
  let destroyed = false

  const destroy = () => {
    if (destroyed) {
      return
    }
    destroyed = true
    render(null, container)
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  const close = async () => {
    const allowClose = await shouldCloseByReason('api', state.beforeClose)
    if (!allowClose) {
      return
    }
    state.onClose?.('api')
    visible.value = false
  }

  const forceClose = () => {
    state.onClose?.('api')
    visible.value = false
  }

  const registerItem = {
    close,
    forceClose,
  }
  openedDialogSet.add(registerItem)

  const Wrapper = defineComponent({
    name: 'DialogMethodWrapper',
    setup() {
      onMounted(() => {
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            visible.value = true
          })
          return
        }
        visible.value = true
      })

      const handleClose = (reason: DialogCloseReason) => {
        state.onClose?.(reason)
      }

      const handleCancel = async () => {
        if (cancelLoading.value) {
          return
        }
        cancelLoading.value = true
        try {
          const allowCancel = await shouldClose(state.onCancel)
          if (!allowCancel) {
            return
          }
          const allowClose = await shouldCloseByReason('cancel', state.beforeClose)
          if (!allowClose) {
            return
          }
          state.onClose?.('cancel')
          visible.value = false
        } finally {
          cancelLoading.value = false
        }
      }

      const handleConfirm = async () => {
        if (confirmLoading.value) {
          return
        }
        confirmLoading.value = true
        try {
          const allowConfirm = await shouldClose(state.onConfirm)
          if (!allowConfirm) {
            return
          }
          const allowClose = await shouldCloseByReason('confirm', state.beforeClose)
          if (!allowClose) {
            return
          }
          state.onClose?.('confirm')
          visible.value = false
        } finally {
          confirmLoading.value = false
        }
      }

      const handleClosed = () => {
        openedDialogSet.delete(registerItem)
        state.onClosed?.()
        destroy()
      }

      return () =>
        h(
          Dialog,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (next: boolean) => {
              visible.value = next
            },
            title: state.title,
            type: state.type,
            width: state.width,
            zIndex: state.zIndex,
            fullscreen: state.fullscreen,
            showClose: state.showClose,
            showFooter: state.showFooter ?? true,
            showCancelButton: state.showCancelButton,
            showConfirmButton: state.showConfirmButton,
            cancelButtonText: state.cancelButtonText || '',
            confirmButtonText: state.confirmButtonText || '',
            confirmLoading: confirmLoading.value,
            closeOnClickModal: state.closeOnClickModal ?? true,
            closeOnPressEscape: state.closeOnPressEscape ?? true,
            openFromTrigger: state.openFromTrigger ?? true,
            teleport: state.teleport ?? true,
            origin: state.origin ?? null,
            beforeClose: state.beforeClose,
            autoCloseOnCancel: false,
            autoCloseOnConfirm: false,
            onClose: handleClose,
            onCancel: handleCancel,
            onConfirm: handleConfirm,
            onClosed: handleClosed,
          },
          {
            default: () => resolveSlotContent(state),
          },
        )
    },
  })

  const vnode = createVNode(Wrapper)
  render(vnode, container)

  return {
    close,
    update: (nextOptions) => {
      Object.assign(state, nextOptions)
    },
  }
}

export const dialog = Object.assign(openDialog, {
  open: openDialog,
  setGlobalZIndex: (value: number) => setDialogZIndexSeed(value),
  destroyAll: () => {
    openedDialogSet.forEach((item) => {
      item.forceClose()
    })
  },
  info: (options: DialogApiOptions) => openDialog({ ...options, type: 'info' }),
  success: (options: DialogApiOptions) => openDialog({ ...options, type: 'success' }),
  warning: (options: DialogApiOptions) => openDialog({ ...options, type: 'warning' }),
  error: (options: DialogApiOptions) => openDialog({ ...options, type: 'error' }),
  confirm: (options: DialogApiOptions) =>
    openDialog({
      ...options,
      type: 'confirm',
    }),
}) as DialogApiMethod & {
  open: DialogApiMethod
  setGlobalZIndex: (value: number) => void
  destroyAll: () => void
  info: DialogApiMethod
  success: DialogApiMethod
  warning: DialogApiMethod
  error: DialogApiMethod
  confirm: DialogApiMethod
}
