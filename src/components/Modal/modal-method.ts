import { computed, createVNode, defineComponent, h, isVNode, onMounted, onScopeDispose, reactive, ref, render, type AppContext, type VNode, type VNodeChild } from 'vue'
import Modal, { type ModalCloseReason, type ModalType } from './Modal.vue'
import { resolveMethodContext, useConfigContext, useLocale, type LocaleKey } from '../ConfigProvider/context'
import { useModalActions, type ModalActionOptions } from '../../utils/async'
import { getPointerOrigin, MODAL_DEFAULTS, nextOverlayZIndex, type InitialFocus } from '../../utils/modal'

type ModalApiTitleRender = string | VNode | ((context: { title: string }) => VNodeChild)
type ModalApiHeaderRender = VNode | ((context: { close: () => void; title: string }) => VNodeChild)

export interface ModalApiOptions extends ModalActionOptions<ModalCloseReason> {
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
  lockScroll?: boolean
  initialFocus?: InitialFocus
  origin?: HTMLElement | MouseEvent | { x: number; y: number } | null
  onClose?: (reason: ModalCloseReason) => void
  onClosed?: () => void
}

export interface ModalInstance {
  close: () => void | Promise<void>
  update: (options: Partial<ModalApiOptions>) => void
}

type ModalApiMethod = (options: ModalApiOptions, appContext?: AppContext) => ModalInstance

let modalZIndexSeed: number = MODAL_DEFAULTS.methodZIndex

const openedModalSet = new Set<{
  close: () => Promise<void>
  forceClose: () => void
  dispose: () => void
  appContext?: AppContext
}>()

const nextModalZIndex = (): number => {
  modalZIndexSeed = nextOverlayZIndex(modalZIndexSeed + MODAL_DEFAULTS.layerStep, document)
  return modalZIndexSeed
}

const setModalZIndexSeed = (value: number): void => {
  if (!Number.isFinite(value)) {
    return
  }
  modalZIndexSeed = Math.max(0, Math.floor(value))
}

const defaultTitleKeys: Record<ModalType, LocaleKey> = {
  info: 'noticeTitle',
  confirm: 'confirmTitle',
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

const resolveTextTitle = (title: ModalApiTitleRender | undefined, fallback: string): string => {
  if (typeof title === 'string') {
    return title
  }

  return fallback
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

export const openModal: ModalApiMethod = (options, appContext) => {
  if (typeof document === 'undefined') {
    return {
      close: () => undefined,
      update: () => undefined,
    }
  }

  const container = document.createElement('div')
  document.body.appendChild(container)

  const hasCancelText = typeof options.cancelButtonText === 'string' && options.cancelButtonText.trim().length > 0
  const hasConfirmText = typeof options.confirmButtonText === 'string' && options.confirmButtonText.trim().length > 0

  const state = reactive<ModalApiOptions>({
    ...options,
    type: options.type || 'info',
    showConfirmButton: options.showConfirmButton ?? hasConfirmText,
    showCancelButton: options.showCancelButton ?? hasCancelText,
    showFooter: options.showFooter ?? (hasCancelText || hasConfirmText),
    showClose: options.showClose ?? false,
    openFromTrigger: options.openFromTrigger ?? false,
    origin:
      options.origin ??
      ((options.openFromTrigger ?? false)
        ? getPointerOrigin(document)
        : null),
    zIndex: options.zIndex ?? nextModalZIndex(),
  })

  if (typeof state.zIndex === 'number' && state.zIndex > modalZIndexSeed) {
    modalZIndexSeed = state.zIndex
  }

  const visible = ref(false)
  let requestClose: ((reason: ModalCloseReason) => Promise<boolean>) | undefined
  let cancelPending: (() => void) | undefined
  let destroyed = false
  let closing = false
  let openingFrame: number | undefined

  const destroy = () => {
    if (destroyed) {
      return
    }
    destroyed = true
    cancelPending?.()
    if (openingFrame !== undefined) window.cancelAnimationFrame(openingFrame)
    openedModalSet.delete(registerItem)
    render(null, container)
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  const close = async () => {
    if (destroyed || closing) return
    if (!requestClose) throw new Error('[scq-vue] Modal was not mounted.')
    await requestClose('api')
  }

  const forceClose = () => {
    if (destroyed || closing) return
    cancelPending?.()
    if (!visible.value) { dispose(); return }
    closing = true
    visible.value = false
    state.onClose?.('api')
  }

  const dispose = () => {
    if (destroyed) return
    cancelPending?.()
    const notifyClose = !closing
    closing = true
    try {
      if (notifyClose) state.onClose?.('api')
    } finally {
      try { state.onClosed?.() } finally { destroy() }
    }
  }

  const registerItem = {
    close,
    forceClose,
    dispose,
    appContext,
  }
  openedModalSet.add(registerItem)

  const Wrapper = defineComponent({
    name: 'ModalMethodWrapper',
    setup() {
      const text = useLocale()
      const actions = useModalActions<ModalCloseReason>(() => state)
      cancelPending = actions.cancel
      const confirmLoading = computed(() => actions.pending.value && actions.reason.value !== 'cancel')
      const cancelLoading = computed(() => actions.pending.value && actions.reason.value !== 'confirm')
      requestClose = (reason) => actions.request(reason, () => {
        if (destroyed || closing) return
        if (!visible.value) { dispose(); return }
        closing = true
        visible.value = false
        state.onClose?.(reason)
      })
      onMounted(() => {
        if (typeof window !== 'undefined') {
          openingFrame = window.requestAnimationFrame(() => {
            openingFrame = undefined
            visible.value = true
          })
          return
        }
        visible.value = true
      })

      const handleClose = (reason: ModalCloseReason) => {
        if (destroyed || closing) return
        actions.cancel()
        closing = true
        state.onClose?.(reason)
      }

      const handleCancel = () => requestClose?.('cancel')
      const handleConfirm = () => requestClose?.('confirm')

      const handleClosed = () => {
        if (destroyed) return
        try { state.onClosed?.() } finally { destroy() }
      }

      return () => {
        const resolvedTitle = resolveTextTitle(state.title, text(defaultTitleKeys[state.type ?? 'info']))
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
            cancelButtonText: state.cancelButtonText,
            confirmButtonText: state.confirmButtonText,
            confirmLoading: confirmLoading.value,
            cancelLoading: cancelLoading.value,
            lockScroll: state.lockScroll,
            initialFocus: state.initialFocus,
            closeOnClickModal: state.closeOnClickModal ?? true,
            closeOnPressEscape: state.closeOnPressEscape ?? true,
            openFromTrigger: state.openFromTrigger ?? true,
            teleport: state.teleport ?? true,
            origin: state.origin ?? null,
            beforeClose: actions.beforeClose,
            autoCloseOnCancel: false,
            autoCloseOnConfirm: false,
            onClose: handleClose,
            onCancel: handleCancel,
            onConfirm: handleConfirm,
            onClosed: handleClosed,
            onError: (error: unknown) => console.error('[scq-vue] Modal callback failed', error),
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
  if (appContext) vnode.appContext = appContext
  try { render(vnode, container) } catch (error) { destroy(); throw error }

  return {
    close,
    update: (nextOptions) => {
      if (destroyed || closing) return
      Object.assign(state, nextOptions)
    },
  }
}

const createModal = (appContext?: AppContext) => {
  const open: ModalApiMethod = (options, context = appContext) => openModal(options, resolveMethodContext(appContext, context))
  const typed = (type: ModalType): ModalApiMethod => (options, context = appContext) => open({ ...options, type }, context)
  return Object.assign(open, {
    setGlobalZIndex: setModalZIndexSeed,
    destroyAll: () => {
      openedModalSet.forEach((item) => {
        if (!appContext || item.appContext === appContext) item.forceClose()
      })
    },
    info: typed('info'),
    confirm: typed('confirm'),
  })
}

export const modal = createModal()
export const useModal = () => {
  const context = useConfigContext('useModal')
  onScopeDispose(() => openedModalSet.forEach((item) => { if (item.appContext === context) item.dispose() }))
  return createModal(context)
}
