<template>
  <Teleport :to="teleportTarget" :disabled="teleport === false">
    <Transition :name="transitionName" @after-leave="emit('closed')">
      <div
        v-if="visible"
        class="scq-message"
        :class="[`is-${type}`, `is-${resolvedPlacement}`, { 'is-closable': closable, 'is-standalone': standalone }]"
        :style="messageStyle"
        role="status"
      >
        <span v-if="showIcon" class="scq-message__icon" aria-hidden="true">{{ iconText }}</span>
        <span class="scq-message__content">
          <span class="scq-message__message"><slot>{{ message }}</slot></span>
          <span v-if="description" class="scq-message__description">{{ description }}</span>
        </span>
        <button v-if="closable" type="button" class="scq-message__close" aria-label="关闭" @click="close">×</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

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
    duration: 3000,
    showIcon: true,
    closable: false,
    placement: 'top',
    offset: 24,
    zIndex: 10000,
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
let closeTimer: ReturnType<typeof window.setTimeout> | null = null

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
  if (props.duration > 0) {
    closeTimer = window.setTimeout(() => {
      close()
    }, props.duration)
  }
}

const close = () => {
  clearCloseTimer()
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
    if (value) {
      startCloseTimer()
    } else {
      clearCloseTimer()
    }
  },
  { immediate: true },
)

onBeforeUnmount(clearCloseTimer)
</script>

<style scoped>
.scq-message {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 220px;
  max-width: min(520px, calc(100vw - 32px));
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #ffffff;
  color: #303133;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  padding: 10px 12px;
  line-height: 1.45;
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
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border-radius: 999px;
  margin-top: 1px;
  background: #409eff;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.scq-message.is-success .scq-message__icon {
  background: #67c23a;
}

.scq-message.is-warning .scq-message__icon {
  background: #e6a23c;
}

.scq-message.is-error .scq-message__icon {
  background: #f56c6c;
}

.scq-message.is-loading .scq-message__icon {
  background: #909399;
}

.scq-message__content {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.scq-message__message {
  overflow-wrap: anywhere;
  font-size: 14px;
}

.scq-message__description {
  color: #606266;
  font-size: 12px;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.scq-message__close {
  border: 0;
  background: transparent;
  color: #909399;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 0 0 4px;
}

.scq-message-slide-top-enter-active,
.scq-message-slide-top-leave-active,
.scq-message-slide-bottom-enter-active,
.scq-message-slide-bottom-leave-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
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