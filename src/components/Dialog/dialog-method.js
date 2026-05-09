import { createVNode, defineComponent, h, isVNode, onMounted, reactive, ref, render } from 'vue'
import Dialog from './Dialog.vue'

const defaultTitleMap = {
  default: '提示',
  info: '提示',
  success: '成功',
  warning: '警告',
  error: '错误',
  confirm: '确认',
}

let dialogZIndexSeed = 3000
let lastPointerOrigin = null
let pointerTrackerBound = false

const bindPointerTracker = () => {
  if (pointerTrackerBound || typeof window === 'undefined') {
    return
  }

  const updatePointerOrigin = (event) => {
    const target = event.target
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

const resolveAutoOrigin = () => {
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

const openedDialogSet = new Set()

const nextDialogZIndex = () => {
  dialogZIndexSeed += 1
  return dialogZIndexSeed
}

const setDialogZIndexSeed = (value) => {
  if (!Number.isFinite(value)) {
    return
  }
  dialogZIndexSeed = Math.max(0, Math.floor(value))
}

const resolveSlotContent = (state) => {
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

const shouldClose = async (handler) => {
  if (!handler) {
    return true
  }

  const result = await handler()
  return result !== false
}

const shouldCloseByReason = async (reason, handler) => {
  if (!handler) {
    return true
  }

  const result = await handler(reason)
  return result !== false
}

export const openDialog = (options) => {
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

  const state = reactive({
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
    if (typeof state.onClose === 'function') {
      state.onClose('api')
    }
    visible.value = false
  }

  const forceClose = () => {
    if (typeof state.onClose === 'function') {
      state.onClose('api')
    }
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

      const handleClose = (reason) => {
        if (typeof state.onClose === 'function') {
          state.onClose(reason)
        }
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
          if (typeof state.onClose === 'function') {
            state.onClose('cancel')
          }
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
          if (typeof state.onClose === 'function') {
            state.onClose('confirm')
          }
          visible.value = false
        } finally {
          confirmLoading.value = false
        }
      }

      const handleClosed = () => {
        openedDialogSet.delete(registerItem)
        if (typeof state.onClosed === 'function') {
          state.onClosed()
        }
        destroy()
      }

      return () =>
        h(
          Dialog,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (next) => {
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
  setGlobalZIndex: (value) => setDialogZIndexSeed(value),
  destroyAll: () => {
    openedDialogSet.forEach((item) => {
      item.forceClose()
    })
  },
  info: (options) => openDialog({ ...options, type: 'info' }),
  success: (options) => openDialog({ ...options, type: 'success' }),
  warning: (options) => openDialog({ ...options, type: 'warning' }),
  error: (options) => openDialog({ ...options, type: 'error' }),
  confirm: (options) =>
    openDialog({
      ...options,
      type: 'confirm',
    }),
})
