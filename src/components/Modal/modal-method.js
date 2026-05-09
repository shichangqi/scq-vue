import { createVNode, defineComponent, h, isVNode, onMounted, reactive, ref, render } from 'vue'
import Modal from './Modal.vue'

let modalZIndexSeed = 3000
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

const openedModalSet = new Set()

const nextModalZIndex = () => {
  modalZIndexSeed += 1
  return modalZIndexSeed
}

const setModalZIndexSeed = (value) => {
  if (!Number.isFinite(value)) {
    return
  }
  modalZIndexSeed = Math.max(0, Math.floor(value))
}

const defaultTitleMap = {
  info: '提示',
  confirm: '确认',
  custom: '',
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

const resolveTextTitle = (title, type) => {
  if (typeof title === 'string') {
    return title
  }

  return defaultTitleMap[type || 'info']
}

const resolveTitleSlotContent = (title, context) => {
  if (typeof title === 'function') {
    return title(context)
  }

  if (isVNode(title)) {
    return title
  }

  return null
}

const resolveHeaderSlotContent = (header, context) => {
  if (typeof header === 'function') {
    return header(context)
  }

  if (isVNode(header)) {
    return header
  }

  return null
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

export const openModal = (options) => {
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
    title: options.title ?? defaultTitleMap[options.type || 'info'],
    showConfirmButton: options.showConfirmButton ?? hasConfirmText,
    showCancelButton: options.showCancelButton ?? hasCancelText,
    showFooter: options.showFooter ?? (hasCancelText || hasConfirmText),
    showClose: options.showClose ?? false,
    openFromTrigger: options.openFromTrigger ?? false,
    origin:
      options.origin ??
      ((options.openFromTrigger ?? false)
        ? resolveAutoOrigin()
        : null),
    zIndex: options.zIndex ?? nextModalZIndex(),
  })

  if (typeof state.zIndex === 'number' && state.zIndex > modalZIndexSeed) {
    modalZIndexSeed = state.zIndex
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
  openedModalSet.add(registerItem)

  const Wrapper = defineComponent({
    name: 'ModalMethodWrapper',
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
        openedModalSet.delete(registerItem)
        if (typeof state.onClosed === 'function') {
          state.onClosed()
        }
        destroy()
      }

      return () => {
        const resolvedTitle = resolveTextTitle(state.title, state.type)
        const titleSlotContent = resolveTitleSlotContent(state.title, { title: resolvedTitle })

        return h(
          Modal,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (next) => {
              visible.value = next
            },
            title: resolvedTitle,
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
            title: titleSlotContent
              ? () => titleSlotContent
              : undefined,
            header: state.header
              ? (slotProps) => {
                  return resolveHeaderSlotContent(state.header, {
                    close: slotProps.close,
                    title: resolvedTitle,
                  })
                }
              : undefined,
          },
        )
      }
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

export const modal = Object.assign(openModal, {
  open: openModal,
  setGlobalZIndex: (value) => setModalZIndexSeed(value),
  destroyAll: () => {
    openedModalSet.forEach((item) => {
      item.forceClose()
    })
  },
  info: (options) => openModal({ ...options, type: 'info' }),
  confirm: (options) => openModal({ ...options, type: 'confirm' }),
})
