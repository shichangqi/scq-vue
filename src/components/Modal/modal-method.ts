import { createVNode, defineComponent, h, isVNode, onMounted, reactive, ref, render, type VNode, type VNodeChild } from 'vue'
import Modal, { type ModalCloseReason, type ModalType } from './Modal.vue'

type ModalApiTitleRender = string | VNode | ((context: { title: string }) => VNodeChild)
type ModalApiHeaderRender = VNode | ((context: { close: () => void; title: string }) => VNodeChild)

export interface ModalApiOptions {
  title?: ModalApiTitleRender
  header?: ModalApiHeaderRender
  type?: ModalType
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
  beforeClose?: (reason: ModalCloseReason) => boolean | void | Promise<boolean | void>
  onConfirm?: () => boolean | void | Promise<boolean | void>
  onCancel?: () => boolean | void | Promise<boolean | void>
  onClose?: (reason: ModalCloseReason) => void
  onClosed?: () => void
}

export interface ModalInstance {
  close: () => void | Promise<void>
  update: (options: Partial<ModalApiOptions>) => void
}

type ModalApiMethod = (options: ModalApiOptions) => ModalInstance

type PointerOrigin = { x: number; y: number; time: number }

let modalZIndexSeed = 3000
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

const openedModalSet = new Set<{
  close: () => Promise<void>
  forceClose: () => void
}>()

const nextModalZIndex = (): number => {
  modalZIndexSeed += 1
  return modalZIndexSeed
}

const setModalZIndexSeed = (value: number): void => {
  if (!Number.isFinite(value)) {
    return
  }
  modalZIndexSeed = Math.max(0, Math.floor(value))
}

const defaultTitleMap: Record<ModalType, string> = {
  info: '提示',
  confirm: '确认',
}

const resolveSlotContent = (state: ModalApiOptions): VNodeChild => {
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

const resolveTextTitle = (title: ModalApiTitleRender | undefined, type: ModalType | undefined): string => {
  if (typeof title === 'string') {
    return title
  }

  return defaultTitleMap[type || 'info']
}

const resolveTitleSlotContent = (
  title: ModalApiTitleRender | undefined,
  context: { title: string },
): VNodeChild | null => {
  if (typeof title === 'function') {
    return title(context)
  }

  if (isVNode(title)) {
    return title
  }

  return null
}

const resolveHeaderSlotContent = (
  header: ModalApiHeaderRender | undefined,
  context: { close: () => void; title: string },
): VNodeChild | null => {
  if (typeof header === 'function') {
    return header(context)
  }

  if (isVNode(header)) {
    return header
  }

  return null
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
  reason: ModalCloseReason,
  handler?: (reason: ModalCloseReason) => boolean | void | Promise<boolean | void>,
): Promise<boolean> => {
  if (!handler) {
    return true
  }

  const result = await handler(reason)
  return result !== false
}

export const openModal: ModalApiMethod = (options) => {
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

  const state = reactive<ModalApiOptions>({
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

      const handleClose = (reason: ModalCloseReason) => {
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
        openedModalSet.delete(registerItem)
        state.onClosed?.()
        destroy()
      }

      return () => {
        const resolvedTitle = resolveTextTitle(state.title, state.type)
        const titleSlotContent = resolveTitleSlotContent(state.title, { title: resolvedTitle })

        return h(
          Modal,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (next: boolean) => {
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
              ? (slotProps: { close: () => void; title: string }) => {
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
  setGlobalZIndex: (value: number) => setModalZIndexSeed(value),
  destroyAll: () => {
    openedModalSet.forEach((item) => {
      item.forceClose()
    })
  },
  info: (options: ModalApiOptions) => openModal({ ...options, type: 'info' }),
  confirm: (options: ModalApiOptions) =>
    openModal({
      ...options,
      type: 'confirm',
    }),
}) as ModalApiMethod & {
  setGlobalZIndex: (value: number) => void
  destroyAll: () => void
  info: ModalApiMethod
  confirm: ModalApiMethod
}
