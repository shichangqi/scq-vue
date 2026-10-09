<template>
  <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="teleport === false || !mounted">
    <Transition name="scq-toast-fade" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div
        v-if="mounted && visible"
        class="scq-toast-layer"
        :class="[`is-${position}`, { 'has-overlay': overlay, 'is-blocking': forbidClick || overlay }]"
        :style="layerStyle"
        @click.self="closeOnClickOverlay && close()"
      >
        <div
          class="scq-toast"
          :class="[`scq-toast--${type}`, { 'has-icon': type !== 'text' || icon || $slots.icon }]"
          :role="type === 'fail' ? 'alert' : 'status'"
          :aria-live="type === 'fail' ? 'assertive' : 'polite'"
          aria-atomic="true"
          :aria-busy="type === 'loading' || undefined"
          @click="handleClick"
        >
          <span v-if="type !== 'text' || icon || $slots.icon" class="scq-toast__icon" aria-hidden="true">
            <slot name="icon">
              <span v-if="type === 'loading'" class="scq-toast__spinner"></span>
              <Icon v-else :name="icon || (type === 'success' ? 'check' : 'close')" :size="32" />
            </slot>
          </span>
          <div v-if="message || $slots.default || type === 'loading'" class="scq-toast__message">
            <slot>{{ message || (type === 'loading' ? text('loading') : '') }}</slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useLocale, useThemeStyle } from '../ConfigProvider/context'

export type ToastType = 'text' | 'success' | 'fail' | 'loading'
export type ToastPosition = 'top' | 'middle' | 'bottom'

defineOptions({ name: 'Toast' })

const props = withDefaults(defineProps<{
  modelValue?: boolean
  message?: string
  type?: ToastType
  position?: ToastPosition
  duration?: number
  icon?: IconName
  overlay?: boolean
  forbidClick?: boolean
  closeOnClick?: boolean
  closeOnClickOverlay?: boolean
  teleport?: boolean | string
  zIndex?: number
}>(), {
  modelValue: false,
  message: '',
  type: 'text',
  position: 'middle',
  overlay: false,
  forbidClick: false,
  closeOnClick: false,
  closeOnClickOverlay: false,
  teleport: true,
  zIndex: 4000,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'open' | 'opened' | 'close' | 'closed'): void
  (event: 'click', value: MouseEvent): void
}>()

const mounted = ref(false)
const visible = ref(props.modelValue)
const themeStyle = useThemeStyle()
const text = useLocale()
const layerStyle = computed(() => ({ ...themeStyle.value, zIndex: props.zIndex }))
let timer: ReturnType<typeof setTimeout> | undefined

const clearTimer = () => {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

const close = () => {
  clearTimer()
  if (!visible.value) return
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

const startTimer = () => {
  clearTimer()
  const duration = props.duration ?? (props.type === 'loading' ? 0 : 2000)
  if (mounted.value && visible.value && Number.isFinite(duration) && duration > 0) {
    timer = setTimeout(close, duration)
  }
}

const handleClick = (event: MouseEvent) => {
  emit('click', event)
  if (props.closeOnClick) close()
}

watch(() => props.modelValue, (value) => { visible.value = value })
watch(visible, (value) => {
  if (value && mounted.value) emit('open')
})
watch([visible, () => props.message, () => props.type, () => props.duration], startTimer)
onMounted(() => {
  mounted.value = true
  if (visible.value) emit('open')
  startTimer()
})
onBeforeUnmount(clearTimer)

defineExpose({ close })
</script>