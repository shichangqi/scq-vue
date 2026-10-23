<template>
  <teleport :to="teleportTarget" :disabled="teleportDisabled">
    <transition
      :name="transitionName"
      @after-enter="handleAfterEnter"
      @after-leave="handleAfterLeave"
    >
      <div
        v-if="visible || (rendered && !destroyOnClose)"
        v-show="visible"
        class="scq-popup__overlay"
        :class="[`is-${position}`, `is-overlay-${overlayTheme}`, hasSize ? 'is-size-fixed' : 'is-size-auto']"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
        <div
          ref="panel"
          class="scq-popup"
          :class="[`is-${position}`, { 'is-round': round, 'has-size': hasSize }]"
          :style="popupStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabelledby ? undefined : ariaLabel || text('panel')"
          :aria-labelledby="ariaLabelledby || undefined"
          :aria-busy="isClosing || undefined"
          tabindex="-1"
        >
          <button
            v-if="showClose"
            type="button"
            class="scq-popup__close"
            :aria-label="text('closePopup')"
            @click="handleCloseIcon"
          >
            <slot name="close-icon">
              <component
                :is="closeIconComponent"
                v-if="closeIconComponent"
                class="scq-popup__close-icon"
              />
              <span v-else class="scq-popup__close-icon">{{ closeIconText }}</span>
            </slot>
          </button>

          <div class="scq-popup__content">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component } from 'vue'
import { useLocale, useThemeStyle } from '../ConfigProvider/context'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'
import { MODAL_DEFAULTS, useModal, type InitialFocus } from '../../utils/modal'
import { toCssLength } from '../../utils/layout'
import { useUpdateFocus } from '../../utils/focus'

defineOptions({
  name: 'Popup',
})

export type PopupPosition = 'left' | 'right' | 'top' | 'bottom' | 'center'
export type PopupOverlayTheme = 'dialog' | 'modal'
export type PopupCloseReason = 'close-icon' | 'mask' | 'esc' | 'api'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    zIndex?: number
    position?: PopupPosition
    size?: string | number
    showClose?: boolean
    closeIcon?: string | Component
    round?: boolean
    roundRadius?: string | number
    overlayTheme?: PopupOverlayTheme
    closeOnClickOverlay?: boolean
    closeOnPressEscape?: boolean
    teleport?: boolean | string
    beforeClose?: AsyncGuard<PopupCloseReason>
    lockScroll?: boolean
    destroyOnClose?: boolean
    initialFocus?: InitialFocus
    ariaLabel?: string
    ariaLabelledby?: string
  }>(),
  {
    modelValue: false,
    position: 'center',
    size: undefined,
    showClose: false,
    closeIcon: '×',
    round: true,
    roundRadius: 12,
    overlayTheme: 'dialog',
    closeOnClickOverlay: true,
    closeOnPressEscape: true,
    teleport: true,
    lockScroll: true,
    destroyOnClose: true,
    initialFocus: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close', reason: PopupCloseReason): void
  (e: 'closed'): void
  (e: 'error', error: unknown, reason: PopupCloseReason): void
}>()

const visible = ref(Boolean(props.modelValue))
const rendered = ref(visible.value)
const panel = ref<HTMLElement>()
useUpdateFocus(() => visible.value ? panel.value : undefined)
const closeGuard = useAsyncGuard(() => props.beforeClose, (error, reason) => emit('error', error, reason))
const isClosing = closeGuard.pending
const { zIndex: layerZIndex } = useModal(() => visible.value, panel, {
  closeOnPressEscape: () => props.closeOnPressEscape, lockScroll: () => props.lockScroll,
  onEscape: () => { void closePopup('esc') }, zIndex: () => props.zIndex,
  defaultZIndex: MODAL_DEFAULTS.legacyZIndex, initialFocus: () => props.initialFocus,
})
const text = useLocale()
const themeStyle = useThemeStyle()

const closeIconComponent = computed<Component | null>(() => {
  if (!props.closeIcon || typeof props.closeIcon === 'string') {
    return null
  }
  return props.closeIcon
})

const closeIconText = computed(() => {
  if (typeof props.closeIcon === 'string' && props.closeIcon.trim().length > 0) {
    return props.closeIcon
  }
  return '×'
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

const overlayStyle = computed(() => {
  return {
    ...themeStyle.value,
    zIndex: String(layerZIndex.value),
  }
})

const hasSize = computed(() => {
  if (typeof props.size === 'number') {
    return Number.isFinite(props.size)
  }
  if (typeof props.size === 'string') {
    return props.size.trim().length > 0
  }
  return false
})

const popupStyle = computed(() => {
  const normalizedSize = toCssLength(props.size ?? '').trim()
  const normalizedRadius = toCssLength(props.roundRadius)

  let borderRadius = '0'
  if (props.round) {
    if (props.position === 'center') {
      borderRadius = normalizedRadius
    } else if (props.position === 'left') {
      borderRadius = `0 ${normalizedRadius} ${normalizedRadius} 0`
    } else if (props.position === 'right') {
      borderRadius = `${normalizedRadius} 0 0 ${normalizedRadius}`
    } else if (props.position === 'top') {
      borderRadius = `0 0 ${normalizedRadius} ${normalizedRadius}`
    } else {
      borderRadius = `${normalizedRadius} ${normalizedRadius} 0 0`
    }
  }

  if (!hasSize.value) {
    return {
      borderRadius,
    }
  }

  return {
    '--scq-popup-size': normalizedSize,
    borderRadius,
  }
})

const transitionName = computed(() => {
  if (props.position === 'center') {
    return 'scq-popup-fade'
  }
  return `scq-popup-slide-${props.position}`
})

const openPopup = () => {
  rendered.value = true
  if (!visible.value) {
    visible.value = true
    emit('open')
  }
}

const closePopup = (reason: PopupCloseReason) => {
  if (!visible.value) return Promise.resolve(false)
  return closeGuard.run(reason, () => {
    visible.value = false
    emit('update:modelValue', false)
    emit('close', reason)
  })
}

const handleAfterEnter = () => {
  emit('opened')
}

const handleAfterLeave = () => {
  emit('closed')
}

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    void closePopup('mask')
  }
}

const handleCloseIcon = () => {
  void closePopup('close-icon')
}

watch(
  () => props.modelValue,
  (next: boolean) => {
    closeGuard.cancel()
    if (next) {
      openPopup()
      return
    }

    if (visible.value) {
      visible.value = false
    }
  },
)

onMounted(() => {
  if (visible.value) {
    emit('open')
  }
})

defineExpose({
  close: () => closePopup('api'),
  pending: isClosing,
})
</script>

<style scoped>
.scq-popup__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  padding: 0;
  overflow: hidden;
  z-index: 2000;
}

.scq-popup__overlay.is-overlay-dialog {
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.scq-popup__overlay.is-overlay-modal {
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
}

.scq-popup__overlay.is-center {
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.scq-popup__overlay.is-left {
  align-items: center;
  justify-content: flex-start;
}

.scq-popup__overlay.is-right {
  align-items: center;
  justify-content: flex-end;
}

.scq-popup__overlay.is-left.is-size-fixed,
.scq-popup__overlay.is-right.is-size-fixed {
  align-items: stretch;
}

.scq-popup__overlay.is-top {
  align-items: flex-start;
  justify-content: center;
}

.scq-popup__overlay.is-bottom {
  align-items: flex-end;
  justify-content: center;
}

.scq-popup {
  position: relative;
  background: var(--scq-surface, #ffffff);
  color: var(--scq-text, #0f172a);
  border: 1px solid var(--scq-border, #e2e8f0);
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 60, 67, 0.42) transparent;
  box-sizing: border-box;
}

.scq-popup::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scq-popup::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.4);
}

.scq-popup::-webkit-scrollbar-track {
  background: transparent;
}

.scq-popup.is-center {
  min-width: 280px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  border-radius: var(--scq-radius-xl, 16px);
}

.scq-popup.is-left,
.scq-popup.is-right {
  max-width: 100vw;
  height: 100%;
  max-height: 100vh;
}

.scq-popup.is-left { border-radius: 0 20px 20px 0; }
.scq-popup.is-right { border-radius: 20px 0 0 20px; }

.scq-popup.is-top,
.scq-popup.is-bottom {
  width: 100%;
  max-width: 100vw;
  max-height: 100vh;
}

.scq-popup.is-bottom { border-radius: 24px 24px 0 0; }
.scq-popup.is-top { border-radius: 0 0 24px 24px; }

.scq-popup.is-left.has-size,
.scq-popup.is-right.has-size {
  width: min(var(--scq-popup-size), 100vw);
}

.scq-popup.is-top.has-size,
.scq-popup.is-bottom.has-size {
  height: min(var(--scq-popup-size), 100vh);
}

.scq-popup__close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--scq-muted, #94a3b8);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.scq-popup__close:hover {
  background: var(--scq-fill, #f8fafc);
  color: var(--scq-text, #0f172a);
}

.scq-popup__close-icon {
  font-size: 22px;
  line-height: 1;
}

.scq-popup__content {
  padding: 20px 24px;
}

.scq-popup-fade-enter-active,
.scq-popup-fade-leave-active {
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-popup-fade-enter-active .scq-popup,
.scq-popup-fade-leave-active .scq-popup {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-popup-fade-enter-from,
.scq-popup-fade-leave-to {
  opacity: 0;
}

.scq-popup-fade-enter-from .scq-popup,
.scq-popup-fade-leave-to .scq-popup {
  transform: scale(0.94);
  opacity: 0;
}

.scq-popup-slide-left-enter-active,
.scq-popup-slide-left-leave-active,
.scq-popup-slide-right-enter-active,
.scq-popup-slide-right-leave-active,
.scq-popup-slide-top-enter-active,
.scq-popup-slide-top-leave-active,
.scq-popup-slide-bottom-enter-active,
.scq-popup-slide-bottom-leave-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-popup-slide-left-enter-active .scq-popup,
.scq-popup-slide-left-leave-active .scq-popup,
.scq-popup-slide-right-enter-active .scq-popup,
.scq-popup-slide-right-leave-active .scq-popup,
.scq-popup-slide-top-enter-active .scq-popup,
.scq-popup-slide-top-leave-active .scq-popup,
.scq-popup-slide-bottom-enter-active .scq-popup,
.scq-popup-slide-bottom-leave-active .scq-popup {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-popup-slide-left-enter-from,
.scq-popup-slide-left-leave-to,
.scq-popup-slide-right-enter-from,
.scq-popup-slide-right-leave-to,
.scq-popup-slide-top-enter-from,
.scq-popup-slide-top-leave-to,
.scq-popup-slide-bottom-enter-from,
.scq-popup-slide-bottom-leave-to {
  opacity: 0;
}

.scq-popup-slide-left-enter-from .scq-popup,
.scq-popup-slide-left-leave-to .scq-popup {
  transform: translateX(-100%);
}

.scq-popup-slide-right-enter-from .scq-popup,
.scq-popup-slide-right-leave-to .scq-popup {
  transform: translateX(100%);
}

.scq-popup-slide-top-enter-from .scq-popup,
.scq-popup-slide-top-leave-to .scq-popup {
  transform: translateY(-100%);
}

.scq-popup-slide-bottom-enter-from .scq-popup,
.scq-popup-slide-bottom-leave-to .scq-popup {
  transform: translateY(100%);
}

@media (max-width: 768px) {
  .scq-popup__overlay {
    padding: 0;
  }

  .scq-popup.is-center {
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
  }

  .scq-popup__overlay.is-center {
    padding: 10px;
  }

  .scq-popup__content {
    padding: 16px;
  }
}
</style>