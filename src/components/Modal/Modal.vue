<template>
  <teleport :to="teleportTarget" :disabled="teleportDisabled">
    <transition
      name="scq-modal-fade"
      @after-enter="emit('opened')"
      @after-leave="emit('closed')"
    >
      <div
        v-if="visible"
        class="scq-modal__overlay"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
        <div
          class="scq-modal"
          :class="[
            `is-${type}`,
            {
              'is-fullscreen': fullscreen,
            },
          ]"
          :style="modalStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'Modal'"
        >
          <header class="scq-modal__header" v-if="hasHeader">
            <slot name="header" :close="handleCloseIcon" :title="title">
              <div class="scq-modal__title-wrap">
                <slot name="title" :title="title">
                  <span class="scq-modal__title">{{ title }}</span>
                </slot>
              </div>
              <button
                v-if="showClose"
                type="button"
                class="scq-modal__close"
                aria-label="Close modal"
                @click="handleCloseIcon"
              >
                &times;
              </button>
            </slot>
          </header>

          <section class="scq-modal__body">
            <slot />
          </section>

          <footer
            v-if="hasFooter"
            class="scq-modal__footer"
            :class="{
              'is-slot-footer': hasFooterSlot,
              'is-default-footer': hasDefaultFooterActions,
              'is-single-action': actionButtonCount === 1,
              'is-double-action': actionButtonCount === 2,
            }"
          >
            <slot name="footer" :cancel="handleCancel" :confirm="handleConfirm">
              <button
                v-if="resolvedShowCancelButton"
                type="button"
                class="scq-modal__action scq-modal__action--cancel"
                @click="handleCancel"
              >
                {{ cancelButtonText }}
              </button>
              <button
                v-if="resolvedShowConfirmButton"
                type="button"
                class="scq-modal__action scq-modal__action--confirm"
                :class="`is-${resolvedConfirmButtonType}`"
                :disabled="confirmLoading"
                :aria-busy="confirmLoading ? 'true' : 'false'"
                @click="handleConfirm"
              >
                {{ confirmButtonText }}
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useSlots, watch } from 'vue'

defineOptions({
  name: 'Modal',
})

export type ModalType = 'info' | 'confirm' | 'custom'
export type ModalCloseReason = 'cancel' | 'confirm' | 'close-icon' | 'mask' | 'esc' | 'api'
type BeforeCloseHandler = (reason: ModalCloseReason) => boolean | void | Promise<boolean | void>
type ModalOriginPoint = { x: number; y: number }
type ModalOrigin = ModalOriginPoint | MouseEvent | HTMLElement | null
type ModalButtonType = 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'

const slots = useSlots()

let pointerTrackerBound = false
let lastPointerOrigin: (ModalOriginPoint & { time: number }) | null = null

const bindPointerTracker = () => {
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

const normalizeOrigin = (origin: ModalOrigin | undefined): ModalOriginPoint | null => {
  if (!origin) {
    return null
  }

  if (typeof MouseEvent !== 'undefined' && origin instanceof MouseEvent) {
    return { x: origin.clientX, y: origin.clientY }
  }

  if (typeof HTMLElement !== 'undefined' && origin instanceof HTMLElement) {
    const rect = origin.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  const maybePoint = origin as ModalOriginPoint
  if (typeof maybePoint.x === 'number' && typeof maybePoint.y === 'number') {
    return {
      x: maybePoint.x,
      y: maybePoint.y,
    }
  }

  return null
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    type?: ModalType
    width?: string | number
    zIndex?: number
    fullscreen?: boolean
    showClose?: boolean
    showFooter?: boolean
    showCancelButton?: boolean
    showConfirmButton?: boolean
    cancelButtonText?: string
    confirmButtonText?: string
    confirmButtonType?: ModalButtonType
    confirmLoading?: boolean
    closeOnClickModal?: boolean
    closeOnPressEscape?: boolean
    openFromTrigger?: boolean
    teleport?: boolean | string
    origin?: ModalOrigin
    beforeClose?: BeforeCloseHandler
    autoCloseOnCancel?: boolean
    autoCloseOnConfirm?: boolean
  }>(),
  {
    modelValue: false,
    title: '',
    type: 'info',
    width: 270,
    zIndex: 2100,
    fullscreen: false,
    showClose: false,
    showFooter: true,
    showCancelButton: false,
    showConfirmButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    confirmButtonType: undefined,
    confirmLoading: false,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    openFromTrigger: false,
    teleport: true,
    origin: null,
    beforeClose: undefined,
    autoCloseOnCancel: true,
    autoCloseOnConfirm: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close', reason: ModalCloseReason): void
  (e: 'closed'): void
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()

const visible = ref(Boolean(props.modelValue))
const isClosing = ref(false)
const originPoint = ref<ModalOriginPoint | null>(null)

const resolvedShowCancelButton = computed(() => {
  return props.showCancelButton
})

const resolvedShowConfirmButton = computed(() => {
  return props.showConfirmButton
})

const hasFooterSlot = computed(() => {
  return Boolean(slots.footer)
})

const hasHeaderSlot = computed(() => {
  return Boolean(slots.header)
})

const hasTitleSlot = computed(() => {
  return Boolean(slots.title)
})

const hasHeader = computed(() => {
  return hasHeaderSlot.value || hasTitleSlot.value || Boolean(props.title) || props.showClose
})

const actionButtonCount = computed(() => {
  return Number(resolvedShowCancelButton.value) + Number(resolvedShowConfirmButton.value)
})

const hasDefaultFooterActions = computed(() => {
  return !hasFooterSlot.value && actionButtonCount.value > 0
})

const hasFooter = computed(() => {
  if (!props.showFooter) {
    return false
  }
  return hasFooterSlot.value || resolvedShowCancelButton.value || resolvedShowConfirmButton.value
})

const resolvedConfirmButtonType = computed<ModalButtonType>(() => {
  if (props.confirmButtonType) {
    return props.confirmButtonType
  }

  return 'primary'
})

const overlayStyle = computed(() => {
  return {
    zIndex: String(props.zIndex),
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

const modalStyle = computed(() => {
  const originStyle = originPoint.value
    ? {
        '--scq-modal-origin-x': `${originPoint.value.x}px`,
        '--scq-modal-origin-y': `${originPoint.value.y}px`,
      }
    : {}

  if (props.fullscreen) {
    return originStyle
  }

  const normalizedWidth = typeof props.width === 'number' ? `${props.width}px` : props.width
  return {
    ...originStyle,
    '--scq-modal-width': normalizedWidth,
  }
})

const updateOriginPoint = () => {
  const explicitOrigin = normalizeOrigin(props.origin)
  if (explicitOrigin) {
    originPoint.value = explicitOrigin
    return
  }

  if (props.openFromTrigger && lastPointerOrigin && Date.now() - lastPointerOrigin.time < 1800) {
    originPoint.value = {
      x: lastPointerOrigin.x,
      y: lastPointerOrigin.y,
    }
    return
  }

  if (typeof window !== 'undefined') {
    originPoint.value = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
  }
}

const openModal = () => {
  if (!visible.value) {
    visible.value = true
    emit('open')
  }
}

const shouldClose = async (reason: ModalCloseReason): Promise<boolean> => {
  if (typeof props.beforeClose !== 'function') {
    return true
  }

  const result = await props.beforeClose(reason)
  return result !== false
}

const closeModal = async (reason: ModalCloseReason) => {
  if (!visible.value || isClosing.value) {
    return
  }

  isClosing.value = true
  try {
    const allowClose = await shouldClose(reason)
    if (!allowClose) {
      return
    }

    visible.value = false
    emit('update:modelValue', false)
    emit('close', reason)
  } finally {
    isClosing.value = false
  }
}

const handleOverlayClick = () => {
  if (props.closeOnClickModal) {
    void closeModal('mask')
  }
}

const handleCloseIcon = () => {
  void closeModal('close-icon')
}

const handleCancel = () => {
  emit('cancel')
  if (props.autoCloseOnCancel) {
    void closeModal('cancel')
  }
}

const handleConfirm = () => {
  emit('confirm')
  if (props.autoCloseOnConfirm) {
    void closeModal('confirm')
  }
}

const handleEsc = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') {
    return
  }
  if (!visible.value || !props.closeOnPressEscape) {
    return
  }

  void closeModal('esc')
}

watch(
  () => props.modelValue,
  (next: boolean) => {
    if (next) {
      updateOriginPoint()
      openModal()
      return
    }

    if (visible.value) {
      visible.value = false
    }
  },
)

onMounted(() => {
  bindPointerTracker()
  updateOriginPoint()
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
</script>
