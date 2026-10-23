<template>
  <teleport :to="teleportTarget" :disabled="teleportDisabled">
    <transition
      name="scq-modal-fade"
      @after-enter="emit('opened')"
      @after-leave="emit('closed')"
    >
      <div
        v-if="visible || (rendered && !destroyOnClose)"
        v-show="visible"
        class="scq-modal__overlay"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
        <div
          ref="panel"
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
          :aria-label="title || text('modal')"
          :aria-busy="isClosing || confirmLoading || cancelLoading || undefined"
          tabindex="-1"
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
                :aria-label="text('closeModal')"
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
                :disabled="isClosing || cancelLoading"
                :aria-busy="cancelLoading || undefined"
                @click="handleCancel"
              >
                {{ cancelButtonText ?? text('cancel') }}
              </button>
              <button
                v-if="resolvedShowConfirmButton"
                type="button"
                class="scq-modal__action scq-modal__action--confirm"
                :class="`is-${resolvedConfirmButtonType}`"
                :disabled="confirmLoading || cancelLoading || isClosing"
                :aria-busy="confirmLoading || isClosing ? 'true' : 'false'"
                @click="handleConfirm"
              >
                {{ confirmButtonText ?? text('confirm') }}
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { useLocale, useThemeStyle } from '../ConfigProvider/context'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'
import { toCssLength } from '../../utils/layout'
import { useContentFocus } from '../../utils/focus'
import { getPointerOrigin, MODAL_DEFAULTS, resolveOrigin, retainPointerOrigin, useModal as useModalLayer, type InitialFocus, type OriginPoint, type OverlayOrigin } from '../../utils/modal'

defineOptions({
  name: 'Modal',
})

export type ModalType = 'info' | 'confirm'
export type ModalCloseReason = 'cancel' | 'confirm' | 'close-icon' | 'mask' | 'esc' | 'api'
type BeforeCloseHandler = AsyncGuard<ModalCloseReason>
type ModalOriginPoint = OriginPoint
type ModalOrigin = OverlayOrigin
type ModalButtonType = 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'

const slots = useSlots()
const text = useLocale()
const themeStyle = useThemeStyle()
const modalThemeTokens = ['surface', 'text', 'muted', 'fill', 'border', 'primary', 'success', 'warning', 'danger', 'radius'] as const

let releasePointer: (() => void) | undefined

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
    cancelLoading?: boolean
    closeOnClickModal?: boolean
    closeOnPressEscape?: boolean
    openFromTrigger?: boolean
    teleport?: boolean | string
    origin?: ModalOrigin
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
    type: 'info',
    width: 270,
    fullscreen: false,
    showClose: false,
    showFooter: true,
    showCancelButton: false,
    showConfirmButton: true,
    confirmButtonType: undefined,
    confirmLoading: false,
    cancelLoading: false,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    openFromTrigger: false,
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
  (e: 'close', reason: ModalCloseReason): void
  (e: 'closed'): void
  (e: 'error', error: unknown, reason: ModalCloseReason): void
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
  onEscape: () => { void closeModal('esc') }, zIndex: () => props.zIndex,
  defaultZIndex: MODAL_DEFAULTS.legacyZIndex, initialFocus: () => props.initialFocus,
})
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
    ...themeStyle.value,
    ...Object.fromEntries(modalThemeTokens.map((key) => [`--scq-modal-${key}`, themeStyle.value[`--scq-${key}`]])),
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

  const normalizedWidth = toCssLength(props.width)
  return {
    ...originStyle,
    '--scq-modal-width': normalizedWidth,
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

const openModal = () => {
  rendered.value = true
  if (!visible.value) {
    visible.value = true
    emit('open')
  }
}

const closeModal = (reason: ModalCloseReason) => {
  if (!visible.value) return Promise.resolve(false)
  return closeGuard.run(reason, () => {
    visible.value = false
    emit('update:modelValue', false)
    emit('close', reason)
  })
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
  if (!visible.value || isClosing.value || props.cancelLoading) return
  emit('cancel')
  if (props.autoCloseOnCancel) {
    void closeModal('cancel')
  }
}

const handleConfirm = () => {
  if (!visible.value || isClosing.value || props.confirmLoading || props.cancelLoading) return
  emit('confirm')
  if (props.autoCloseOnConfirm) {
    void closeModal('confirm')
  }
}

watch(
  () => props.modelValue,
  (next: boolean) => {
    closeGuard.cancel()
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
  releasePointer = retainPointerOrigin(document)
  updateOriginPoint()
  if (visible.value) {
    emit('open')
  }
})

onBeforeUnmount(() => releasePointer?.())
defineExpose({ close: () => closeModal('api'), pending: isClosing })
</script>
