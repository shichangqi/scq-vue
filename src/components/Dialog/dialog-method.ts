import { computed, createVNode, defineComponent, h, isVNode, onMounted, onScopeDispose, reactive, ref, render, type AppContext, type VNode, type VNodeChild } from 'vue'
import Dialog, { type DialogCloseReason, type DialogType } from './Dialog.vue'
import { resolveMethodContext, useConfigContext, useLocale, type LocaleKey } from '../ConfigProvider/context'
import { useModalActions, type ModalActionOptions } from '../../utils/async'
import { getPointerOrigin, MODAL_DEFAULTS, nextOverlayZIndex, type InitialFocus } from '../../utils/modal'

export interface DialogApiOptions extends ModalActionOptions<DialogCloseReason> {
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
  lockScroll?: boolean
  initialFocus?: InitialFocus
  origin?: HTMLElement | MouseEvent | { x: number; y: number } | null
  onClose?: (reason: DialogCloseReason) => void
  onClosed?: () => void
}

export interface DialogInstance {
  close: () => void | Promise<void>
  update: (options: Partial<DialogApiOptions>) => void
}

type DialogApiMethod = (options: DialogApiOptions, appContext?: AppContext) => DialogInstance

let dialogZIndexSeed: number = MODAL_DEFAULTS.methodZIndex

const openedDialogSet = new Set<{
  close: () => Promise<void>
  forceClose: () => void
  dispose: () => void
  appContext?: AppContext
}>()

const nextDialogZIndex = (): number => {
  dialogZIndexSeed = nextOverlayZIndex(dialogZIndexSeed + MODAL_DEFAULTS.layerStep, document)
  return dialogZIndexSeed
}

const setDialogZIndexSeed = (value: number): void => {
  if (!Number.isFinite(value)) {
    return
  }
  dialogZIndexSeed = Math.max(0, Math.floor(value))
}

const defaultTitleKeys: Record<DialogType, LocaleKey> = {
  default: 'noticeTitle',
  info: 'noticeTitle',
  success: 'successTitle',
  warning: 'warningTitle',
  error: 'errorTitle',
  confirm: 'confirmTitle',
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

export const openDialog: DialogApiMethod = (options, appContext) => {
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

  const state = reactive<DialogApiOptions>({
    ...options,
    type: options.type || 'info',
    showConfirmButton: options.showConfirmButton ?? hasConfirmText,
    showCancelButton: options.showCancelButton ?? hasCancelText,
    showFooter: options.showFooter ?? (hasCancelText || hasConfirmText),
    showClose: options.showClose ?? true,
    openFromTrigger: options.openFromTrigger ?? true,
    origin:
      options.origin ??
      ((options.openFromTrigger ?? true)
        ? getPointerOrigin(document)
        : null),
    zIndex: options.zIndex ?? nextDialogZIndex(),
  })

  if (typeof state.zIndex === 'number' && state.zIndex > dialogZIndexSeed) {
    dialogZIndexSeed = state.zIndex
  }

  const visible = ref(false)
  let requestClose: ((reason: DialogCloseReason) => Promise<boolean>) | undefined
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
    openedDialogSet.delete(registerItem)
    render(null, container)
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  const close = async () => {
    if (destroyed || closing) return
    if (!requestClose) throw new Error('[scq-vue] Dialog was not mounted.')
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
  openedDialogSet.add(registerItem)

  const Wrapper = defineComponent({
    name: 'DialogMethodWrapper',
    setup() {
      const text = useLocale()
      const actions = useModalActions<DialogCloseReason>(() => state)
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

      const handleClose = (reason: DialogCloseReason) => {
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

      return () =>
        h(
          Dialog,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (next: boolean) => {
              visible.value = next
            },
            title: state.title ?? text(defaultTitleKeys[state.type ?? 'info']),
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
            onError: (error: unknown) => console.error('[scq-vue] Dialog callback failed', error),
          },
          {
            default: () => resolveSlotContent(state),
          },
        )
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

const createDialog = (appContext?: AppContext) => {
  const open: DialogApiMethod = (options, context = appContext) => openDialog(options, resolveMethodContext(appContext, context))
  const typed = (type: DialogType): DialogApiMethod => (options, context = appContext) => open({ ...options, type }, context)
  return Object.assign(open, {
    open,
    setGlobalZIndex: setDialogZIndexSeed,
    destroyAll: () => {
      openedDialogSet.forEach((item) => {
        if (!appContext || item.appContext === appContext) item.forceClose()
      })
    },
    info: typed('info'),
    success: typed('success'),
    warning: typed('warning'),
    error: typed('error'),
    confirm: typed('confirm'),
  })
}

export const dialog = createDialog()
export const useDialog = () => {
  const context = useConfigContext('useDialog')
  onScopeDispose(() => openedDialogSet.forEach((item) => { if (item.appContext === context) item.dispose() }))
  return createDialog(context)
}
