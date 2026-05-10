<template>
  <teleport :to="teleportTarget" :disabled="teleportDisabled">
    <transition
      :name="transitionName"
      @after-enter="handleAfterEnter"
      @after-leave="handleAfterLeave"
    >
      <div
        v-if="visible"
        class="scq-popup__overlay"
        :class="[`is-${position}`, `is-overlay-${overlayTheme}`, hasSize ? 'is-size-fixed' : 'is-size-auto']"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
        <div
          class="scq-popup"
          :class="[`is-${position}`, { 'is-round': round, 'has-size': hasSize }]"
          :style="popupStyle"
          role="dialog"
          aria-modal="true"
        >
          <button
            v-if="showClose"
            type="button"
            class="scq-popup__close"
            aria-label="Close popup"
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
import { computed, onMounted, onUnmounted, ref, watch, type Component } from 'vue'

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
  }>(),
  {
    modelValue: false,
    zIndex: 2100,
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
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close', reason: PopupCloseReason): void
  (e: 'closed'): void
}>()

const visible = ref(Boolean(props.modelValue))
const isClosing = ref(false)

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
    zIndex: String(props.zIndex),
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
  const normalizedSize = typeof props.size === 'number'
    ? `${props.size}px`
    : (props.size || '').trim()
  const normalizedRadius = typeof props.roundRadius === 'number'
    ? `${props.roundRadius}px`
    : props.roundRadius

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
  if (!visible.value) {
    visible.value = true
    emit('open')
  }
}

const closePopup = async (reason: PopupCloseReason) => {
  if (!visible.value || isClosing.value) {
    return
  }

  isClosing.value = true
  try {
    visible.value = false
    emit('update:modelValue', false)
    emit('close', reason)
  } finally {
    isClosing.value = false
  }
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

const handleEsc = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') {
    return
  }
  if (!visible.value || !props.closeOnPressEscape) {
    return
  }
  void closePopup('esc')
}

watch(
  () => props.modelValue,
  (next: boolean) => {
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
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleEsc)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleEsc)
  }
})

defineExpose({
  close: () => closePopup('api'),
})
</script>

<style scoped>
.scq-popup__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  padding: 0;
  overflow: hidden;
}

.scq-popup__overlay.is-overlay-dialog {
  background: rgba(0, 0, 0, 0.46);
}

.scq-popup__overlay.is-overlay-modal {
  background: rgba(17, 17, 17, 0.3);
  backdrop-filter: blur(22px) saturate(1.15);
  -webkit-backdrop-filter: blur(22px) saturate(1.15);
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
  background: #ffffff;
  color: #303133;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.25);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.scq-popup.is-center {
  min-width: 280px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
}

.scq-popup.is-left,
.scq-popup.is-right {
  max-width: 100vw;
  height: 100%;
  max-height: 100vh;
}

.scq-popup.is-top,
.scq-popup.is-bottom {
  width: 100%;
  max-width: 100vw;
  max-height: 100vh;
}

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
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #909399;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.scq-popup__close:hover {
  background: #f5f7fa;
  color: #606266;
}

.scq-popup__close-icon {
  font-size: 22px;
  line-height: 1;
}

.scq-popup__content {
  padding: 18px;
}

.scq-popup-fade-enter-active,
.scq-popup-fade-leave-active {
  transition: opacity 0.24s ease;
}

.scq-popup-fade-enter-active .scq-popup,
.scq-popup-fade-leave-active .scq-popup {
  transition: transform 0.24s ease, opacity 0.24s ease;
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
  transition: opacity 0.2s ease;
}

.scq-popup-slide-left-enter-active .scq-popup,
.scq-popup-slide-left-leave-active .scq-popup,
.scq-popup-slide-right-enter-active .scq-popup,
.scq-popup-slide-right-leave-active .scq-popup,
.scq-popup-slide-top-enter-active .scq-popup,
.scq-popup-slide-top-leave-active .scq-popup,
.scq-popup-slide-bottom-enter-active .scq-popup,
.scq-popup-slide-bottom-leave-active .scq-popup {
  transition: transform 0.24s ease;
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