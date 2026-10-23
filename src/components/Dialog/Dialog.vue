<template>
  <teleport :to="teleportTarget" :disabled="teleportDisabled">
    <transition
      name="scq-dialog-fade"
      @after-enter="emit('opened')"
      @after-leave="emit('closed')"
    >
      <div
        v-if="visible || (rendered && !destroyOnClose)"
        v-show="visible"
        class="scq-dialog__overlay"
        :class="{ 'is-fullscreen': fullscreen }"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
        <div
          ref="panel"
          class="scq-dialog"
          :class="[
            `is-${type}`,
            {
              'is-fullscreen': fullscreen,
            },
          ]"
          :style="dialogStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || text('dialog')"
          :aria-busy="isClosing || confirmLoading || cancelLoading || undefined"
          tabindex="-1"
        >
          <header class="scq-dialog__header" v-if="title || showClose">
            <div class="scq-dialog__title-wrap">
              <span
                v-if="showTypeIcon"
                class="scq-dialog__type-icon"
                :class="`is-${type}`"
                aria-hidden="true"
              >
                {{ typeIconText }}
              </span>
              <span class="scq-dialog__title">{{ title }}</span>
            </div>
            <button
              v-if="showClose"
              type="button"
              class="scq-dialog__close"
              :aria-label="text('closeDialog')"
              @click="handleCloseIcon"
            >
              &times;
            </button>
          </header>

          <section class="scq-dialog__body">
            <slot />
          </section>

          <footer v-if="hasFooter" class="scq-dialog__footer">
            <slot name="footer" :cancel="handleCancel" :confirm="handleConfirm">
              <Button
                v-if="resolvedShowCancelButton"
                type="default"
                :loading="cancelLoading"
                :disabled="isClosing ? true : undefined"
                @click="handleCancel"
              >
                {{ cancelButtonText ?? text('cancel') }}
              </Button>
              <Button
                v-if="resolvedShowConfirmButton"
                :type="resolvedConfirmButtonType"
                :loading="confirmLoading || isClosing"
                :disabled="cancelLoading ? true : undefined"
                @click="handleConfirm"
              >
                {{ confirmButtonText ?? text('confirm') }}
              </Button>
            </slot>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import Button from '../Button'
import { useLocale, useThemeStyle } from '../ConfigProvider/context'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'
import { toCssLength } from '../../utils/layout'
import { useContentFocus } from '../../utils/focus'
import { getPointerOrigin, MODAL_DEFAULTS, resolveOrigin, retainPointerOrigin, useModal as useModalLayer, type InitialFocus, type OriginPoint, type OverlayOrigin } from '../../utils/modal'

defineOptions({
  name: 'Dialog',
})

export type DialogType = 'default' | 'info' | 'success' | 'warning' | 'error' | 'confirm'
export type DialogCloseReason = 'cancel' | 'confirm' | 'close-icon' | 'mask' | 'esc' | 'api'
type BeforeCloseHandler = AsyncGuard<DialogCloseReason>
type DialogOriginPoint = OriginPoint
type DialogOrigin = OverlayOrigin
type DialogButtonType = 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'

const slots = useSlots()
const text = useLocale()
const themeStyle = useThemeStyle()

let releasePointer: (() => void) | undefined

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    type?: DialogType
    width?: string | number
    zIndex?: number
    fullscreen?: boolean
    showClose?: boolean
    showFooter?: boolean
    showCancelButton?: boolean
    showConfirmButton?: boolean
    cancelButtonText?: string
    confirmButtonText?: string
    confirmButtonType?: DialogButtonType
    confirmLoading?: boolean
    cancelLoading?: boolean
    closeOnClickModal?: boolean
    closeOnPressEscape?: boolean
    openFromTrigger?: boolean
    teleport?: boolean | string
    origin?: DialogOrigin
    beforeClose?: BeforeCloseHandler
    autoCloseOnCancel?: boolean
    autoCloseOnConfirm?: boolean
    lockScroll?: boolean
    destroyOnClose?: boolean
    initialFocus?: InitialFocus
  }>(),
  {
    modelValue: false,
    title: '',
    type: 'default',
    width: 520,
    fullscreen: false,
    showClose: true,
    showFooter: true,
    showCancelButton: false,
    showConfirmButton: true,
    confirmButtonType: undefined,
    confirmLoading: false,
    cancelLoading: false,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    openFromTrigger: true,
    teleport: true,
    origin: null,
    beforeClose: undefined,
    autoCloseOnCancel: true,
    autoCloseOnConfirm: true,
    lockScroll: true,
    destroyOnClose: true,
    initialFocus: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close', reason: DialogCloseReason): void
  (e: 'closed'): void
  (e: 'error', error: unknown, reason: DialogCloseReason): void
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()

const visible = ref(Boolean(props.modelValue))
const rendered = ref(visible.value)
const panel = ref<HTMLElement>()
const closeGuard = useAsyncGuard(() => props.beforeClose, (error, reason) => emit('error', error, reason))
const isClosing = closeGuard.pending
useContentFocus(() => panel.value, () => isClosing.value, () => panel.value)
const { zIndex: layerZIndex } = useModalLayer(() => visible.value, panel, {
  closeOnPressEscape: () => props.closeOnPressEscape, lockScroll: () => props.lockScroll,
  onEscape: () => { void closeDialog('esc') }, zIndex: () => props.zIndex,
  defaultZIndex: MODAL_DEFAULTS.legacyZIndex, initialFocus: () => props.initialFocus,
})
const originPoint = ref<DialogOriginPoint | null>(null)

const typeIconMap: Record<Exclude<DialogType, 'default'>, string> = {
  info: 'i',
  success: '\u2713',
  warning: '!',
  error: '\u00d7',
  confirm: '?',
}

const showTypeIcon = computed(() => props.type !== 'default')

const typeIconText = computed(() => {
  if (props.type === 'default') {
    return ''
  }
  return typeIconMap[props.type]
})

const resolvedShowCancelButton = computed(() => {
  return props.showCancelButton || props.type === 'confirm'
})

const resolvedShowConfirmButton = computed(() => {
  return props.showConfirmButton
})

const hasFooter = computed(() => {
  if (!props.showFooter) {
    return false
  }
  const hasFooterSlot = Boolean(slots.footer)
  return hasFooterSlot || resolvedShowCancelButton.value || resolvedShowConfirmButton.value
})

const resolvedConfirmButtonType = computed<DialogButtonType>(() => {
  if (props.confirmButtonType) {
    return props.confirmButtonType
  }

  if (props.type === 'success') {
    return 'success'
  }
  if (props.type === 'warning') {
    return 'warning'
  }
  if (props.type === 'error') {
    return 'danger'
  }
  return 'primary'
})

const overlayStyle = computed(() => {
  return {
    ...themeStyle.value,
    zIndex: String(layerZIndex.value),
  }
})

const teleportDisabled = computed(() => {
  return props.teleport === false
})

const teleportTarget = computed(() => {
  if (typeof props.teleport === 'string' && props.teleport.trim().length > 0) {
    return props.teleport
  }
  return 'body'
})

const dialogStyle = computed(() => {
  const originStyle = originPoint.value
    ? {
        '--scq-dialog-origin-x': `${originPoint.value.x}px`,
        '--scq-dialog-origin-y': `${originPoint.value.y}px`,
      }
    : {}

  if (props.fullscreen) {
    return originStyle
  }

  const normalizedWidth = toCssLength(props.width)
  return {
    ...originStyle,
    width: normalizedWidth,
    maxWidth: 'calc(100vw - 40px)',
  }
})

const updateOriginPoint = () => {
  const explicitOrigin = resolveOrigin(props.origin)
  if (explicitOrigin) {
    originPoint.value = explicitOrigin
    return
  }

  const pointer = props.openFromTrigger ? getPointerOrigin(typeof document === 'undefined' ? undefined : document) : null
  if (pointer) {
    originPoint.value = pointer
    return
  }

  if (typeof window !== 'undefined') {
    originPoint.value = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
  }
}

const openDialog = () => {
  rendered.value = true
  if (!visible.value) {
    visible.value = true
    emit('open')
  }
}

const closeDialog = (reason: DialogCloseReason) => {
  if (!visible.value) return Promise.resolve(false)
  return closeGuard.run(reason, () => {
    visible.value = false
    emit('update:modelValue', false)
    emit('close', reason)
  })
}

const handleOverlayClick = () => {
  if (props.closeOnClickModal) {
    void closeDialog('mask')
  }
}

const handleCloseIcon = () => {
  void closeDialog('close-icon')
}

const handleCancel = () => {
  if (!visible.value || isClosing.value || props.cancelLoading) return
  emit('cancel')
  if (props.autoCloseOnCancel) {
    void closeDialog('cancel')
  }
}

const handleConfirm = () => {
  if (!visible.value || isClosing.value || props.confirmLoading || props.cancelLoading) return
  emit('confirm')
  if (props.autoCloseOnConfirm) {
    void closeDialog('confirm')
  }
}

watch(
  () => props.modelValue,
  (next) => {
    closeGuard.cancel()
    if (next) {
      updateOriginPoint()
      openDialog()
      return
    }

    if (visible.value) {
      visible.value = false
    }
  },
)

onMounted(() => {
  releasePointer = retainPointerOrigin(document)
  updateOriginPoint()
  if (visible.value) {
    emit('open')
  }
})

onBeforeUnmount(() => releasePointer?.())
defineExpose({ close: () => closeDialog('api'), pending: isClosing })
</script>

<style scoped>
.scq-dialog__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 20px;
  z-index: 2000;
}

.scq-dialog__overlay.is-fullscreen {
  padding: 0;
}

.scq-dialog {
  --scq-dialog-origin-x: 50vw;
  --scq-dialog-origin-y: 50vh;
  --scq-dialog-shift-x: calc(var(--scq-dialog-origin-x) - 50vw);
  --scq-dialog-shift-y: calc(var(--scq-dialog-origin-y) - 50vh);

  position: relative;
  width: 520px;
  max-height: calc(100vh - 40px);
  background: var(--scq-surface, #ffffff);
  border: 1px solid var(--scq-border, #e2e8f0);
  border-radius: var(--scq-radius-xl, 16px);
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scq-dialog.is-fullscreen {
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  border: 0;
}

.scq-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 18px 24px 14px;
  border-bottom: 1px solid var(--scq-border, #e2e8f0);
}

.scq-dialog__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scq-dialog__type-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.scq-dialog__type-icon.is-info,
.scq-dialog__type-icon.is-confirm {
  background: var(--scq-color-primary-soft-bg, #eff6ff);
  color: var(--scq-primary, #2563eb);
}

.scq-dialog__type-icon.is-success {
  background: var(--scq-color-success-soft-bg, #ecfdf5);
  color: var(--scq-success, #10b981);
}

.scq-dialog__type-icon.is-warning {
  background: var(--scq-color-warning-soft-bg, #fffbeb);
  color: var(--scq-warning, #f59e0b);
}

.scq-dialog__type-icon.is-error {
  background: var(--scq-color-danger-soft-bg, #fef2f2);
  color: var(--scq-danger, #ef4444);
}

.scq-dialog__title {
  font-size: 17px;
  font-weight: 650;
  color: var(--scq-text, #0f172a);
  letter-spacing: -0.01em;
}

.scq-dialog__close {
  border: none;
  background: transparent;
  color: var(--scq-muted, #94a3b8);
  font-size: 24px;
  line-height: 1;
  width: 32px;
  height: 32px;
  border-radius: var(--scq-radius-sm, 6px);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.scq-dialog__close:hover {
  color: var(--scq-text, #0f172a);
  background: var(--scq-fill, #f8fafc);
}

.scq-dialog__body {
  padding: 20px 24px;
  color: var(--scq-text-secondary, #475569);
  line-height: 1.65;
  font-size: 14px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 60, 67, 0.42) transparent;
}

.scq-dialog__body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scq-dialog__body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.4);
}

.scq-dialog__body::-webkit-scrollbar-track {
  background: transparent;
}

.scq-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px 18px;
  border-top: 1px solid var(--scq-border, #e2e8f0);
  background: var(--scq-fill, #f8fafc);
}

.scq-dialog-fade-enter-active,
.scq-dialog-fade-leave-active {
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-dialog-fade-enter-active .scq-dialog,
.scq-dialog-fade-leave-active .scq-dialog {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-dialog-fade-enter-from,
.scq-dialog-fade-leave-to {
  opacity: 0;
}

.scq-dialog-fade-enter-from .scq-dialog,
.scq-dialog-fade-leave-to .scq-dialog {
  transform: translate3d(var(--scq-dialog-shift-x), var(--scq-dialog-shift-y), 0) scale(0.22);
  opacity: 0.4;
}

.scq-dialog-fade-enter-from .scq-dialog.is-fullscreen,
.scq-dialog-fade-leave-to .scq-dialog.is-fullscreen {
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 768px) {
  .scq-dialog__overlay {
    padding: 12px;
  }

  .scq-dialog {
    max-height: calc(100vh - 24px);
    border-radius: var(--scq-radius-lg, 12px);
  }

  .scq-dialog__title {
    font-size: 16px;
  }
}
</style>
