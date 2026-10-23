<template>
  <Teleport :to="teleportTarget" :disabled="teleport === false">
    <Transition :name="transitionName" @after-leave="emit('closed')">
      <div
        v-if="visible"
        class="scq-message"
        :class="[`is-${type}`, `is-${resolvedPlacement}`, { 'is-closable': closable, 'is-standalone': standalone }]"
        :style="[themeStyle, messageStyle]"
        role="status"
      >
        <span v-if="showIcon" class="scq-message__icon" aria-hidden="true">{{ iconText }}</span>
        <span class="scq-message__content">
          <span class="scq-message__message"><slot>{{ message }}</slot></span>
          <span v-if="description" class="scq-message__description">{{ description }}</span>
        </span>
        <button v-if="closable" type="button" class="scq-message__close" :aria-label="text('close')" @click="close">×</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale, useThemeStyle } from '../ConfigProvider/context'
import { MESSAGE_DEFAULTS, validateFeedbackOptions } from '../../utils/feedback'

defineOptions({
  name: 'Message',
})

export type MessageType = 'info' | 'success' | 'warning' | 'error' | 'loading'
export type MessagePlacement = 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    type?: MessageType
    message?: string
    description?: string
    duration?: number
    showIcon?: boolean
    closable?: boolean
    placement?: MessagePlacement
    offset?: number
    zIndex?: number
    teleport?: boolean | string
    standalone?: boolean
  }>(),
  {
    modelValue: true,
    type: 'info',
    message: '',
    description: '',
    duration: MESSAGE_DEFAULTS.duration,
    showIcon: true,
    closable: false,
    placement: 'top',
    offset: MESSAGE_DEFAULTS.offset,
    zIndex: MESSAGE_DEFAULTS.zIndex,
    teleport: true,
    standalone: true,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'close'): void
  (event: 'closed'): void
}>()

const visible = ref(props.modelValue)
const text = useLocale()
const themeStyle = useThemeStyle()
let closeTimer: ReturnType<typeof window.setTimeout> | null = null
let mounted = false
watch(() => [props.duration, props.offset, props.zIndex], () => validateFeedbackOptions(props, 'Message'), { immediate: true, flush: 'sync' })

const iconMap: Record<MessageType, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '×',
  loading: '…',
}

const iconText = computed(() => iconMap[props.type])

const resolvedPlacement = computed<MessagePlacement>(() => props.placement)

const transitionName = computed(() => {
  return resolvedPlacement.value.startsWith('bottom') ? 'scq-message-slide-bottom' : 'scq-message-slide-top'
})

const teleportTarget = computed(() => {
  return typeof props.teleport === 'string' ? props.teleport : 'body'
})

const messageStyle = computed(() => {
  if (!props.standalone) {
    return undefined
  }

  const placement = resolvedPlacement.value
  const style: Record<string, string | number> = {
    zIndex: props.zIndex,
  }

  if (placement.startsWith('bottom')) {
    style.bottom = `${props.offset}px`
  } else {
    style.top = `${props.offset}px`
  }

  if (placement.endsWith('left')) {
    style.left = `${props.offset}px`
  } else if (placement.endsWith('right')) {
    style.right = `${props.offset}px`
  } else {
    style.left = '50%'
  }

  return style
})

const clearCloseTimer = () => {
  if (closeTimer) {
    window.clearTimeout(closeTimer)
    closeTimer = null
  }
}

const startCloseTimer = () => {
  clearCloseTimer()
  if (mounted && visible.value && props.duration > 0) {
    closeTimer = window.setTimeout(() => {
      close()
    }, props.duration)
  }
}

const close = () => {
  clearCloseTimer()
  if (!mounted || !visible.value) return
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
  },
  { immediate: true },
)

watch([visible, () => props.duration, () => props.message, () => props.description], startCloseTimer)
onMounted(() => { mounted = true; startCloseTimer() })
onBeforeUnmount(() => { mounted = false; clearCloseTimer() })
</script>

<style scoped>
.scq-message {
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 220px;
  max-width: min(520px, calc(100vw - 32px));
  border: 1px solid var(--scq-border, #e2e8f0);
  border-radius: var(--scq-radius-lg, 12px);
  background: var(--scq-surface, #ffffff);
  color: var(--scq-text, #0f172a);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04);
  padding: 12px 16px;
  line-height: 1.5;
}

.scq-message.is-standalone {
  position: fixed;
}

.scq-message.is-standalone.is-top,
.scq-message.is-standalone.is-bottom {
  left: 50%;
  transform: translateX(-50%);
}

.scq-message__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  border-radius: 999px;
  margin-top: 1px;
  background: var(--scq-primary, #2563eb);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.scq-message.is-success .scq-message__icon {
  background: var(--scq-success, #10b981);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
}

.scq-message.is-warning .scq-message__icon {
  background: var(--scq-warning, #f59e0b);
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.25);
}

.scq-message.is-error .scq-message__icon {
  background: var(--scq-danger, #ef4444);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
}

.scq-message.is-loading .scq-message__icon {
  background: var(--scq-info, #64748b);
  box-shadow: none;
}

.scq-message__content {
  display: grid;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.scq-message__message {
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 550;
  color: var(--scq-text, #0f172a);
}

.scq-message__description {
  color: var(--scq-muted, #64748b);
  font-size: 13px;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.scq-message__close {
  border: 0;
  background: transparent;
  color: var(--scq-muted, #94a3b8);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.scq-message__close:hover {
  color: var(--scq-text, #0f172a);
  background: var(--scq-fill, #f8fafc);
}

.scq-message-slide-top-enter-active,
.scq-message-slide-top-leave-active,
.scq-message-slide-bottom-enter-active,
.scq-message-slide-bottom-leave-active {
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-message-slide-top-move,
.scq-message-slide-bottom-move {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.scq-message-slide-top-enter-from,
.scq-message-slide-top-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
}

.scq-message-slide-bottom-enter-from,
.scq-message-slide-bottom-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.scq-message.is-standalone.is-top.scq-message-slide-top-enter-from,
.scq-message.is-standalone.is-top.scq-message-slide-top-leave-to {
  transform: translate(-50%, -12px) scale(0.98);
}

.scq-message.is-standalone.is-bottom.scq-message-slide-bottom-enter-from,
.scq-message.is-standalone.is-bottom.scq-message-slide-bottom-leave-to {
  transform: translate(-50%, 12px) scale(0.98);
}
</style>