<template>
  <div ref="rootRef" class="scq-pull-refresh" :class="{ 'is-dragging': dragging }" :aria-busy="modelValue || pending" @touchstart.passive="touchStart" @touchmove="touchMove" @touchend="finish" @touchcancel="reset" @pointerdown="pointerStart" @pointermove="pointerMove" @pointerup="finish" @pointercancel="reset">
    <button class="scq-pull-refresh__keyboard" type="button" :disabled="isDisabled || modelValue || pending" @click="refresh">{{ text('refresh') }}</button>
    <div class="scq-pull-refresh__track" :style="{ transform: `translateY(${offset}px)` }">
      <div class="scq-pull-refresh__head" :style="{ height: `${headHeight}px`, top: `-${headHeight}px` }" role="status" aria-live="polite"><slot name="head" :status="status" :distance="offset">{{ status === 'loading' ? (loadingText || text('refreshing')) : status === 'loosing' ? (loosingText || text('release')) : (pullingText || text('pullDown')) }}</slot></div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useConfig, useLocale } from '../ConfigProvider/context'

export type PullRefreshStatus = 'normal' | 'pulling' | 'loosing' | 'loading'
defineOptions({ name: 'PullRefresh' })
const props = withDefaults(defineProps<{ modelValue?: boolean; disabled?: boolean; headHeight?: number; pullDistance?: number; pullingText?: string; loosingText?: string; loadingText?: string }>(), { modelValue: false, disabled: undefined, headHeight: 56, pullDistance: 64 })
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'refresh'): void
  (event: 'change', value: { status: PullRefreshStatus; distance: number }): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const rootRef = ref<HTMLElement>()
const distance = ref(0)
const dragging = ref(false)
const pending = ref(false)
const offset = computed(() => props.modelValue || pending.value ? Math.max(1, props.headHeight) : distance.value)
const threshold = computed(() => Math.max(1, props.pullDistance))
const status = computed<PullRefreshStatus>(() => props.modelValue || pending.value ? 'loading' : distance.value >= threshold.value ? 'loosing' : distance.value ? 'pulling' : 'normal')
let startX = 0
let startY = 0
let active = false
let mouse = false
const atTop = () => {
  let parent = rootRef.value?.parentElement
  while (parent) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent.scrollTop <= 0
    parent = parent.parentElement
  }
  return window.scrollY <= 0
}
const start = (clientX: number, clientY: number) => {
  if (isDisabled.value || props.modelValue || pending.value || !atTop()) return
  startX = clientX
  startY = clientY
  active = true
}
const move = (clientX: number, clientY: number, event: Event) => {
  if (!active) return
  const vertical = clientY - startY
  if (!dragging.value && (vertical < 0 || Math.abs(clientX - startX) > Math.abs(vertical))) { active = false; return }
  if (vertical <= 0) { distance.value = 0; return }
  dragging.value = true
  if (event.cancelable) event.preventDefault()
  distance.value = Math.min(threshold.value * 2, vertical / 2)
  emit('change', { status: status.value, distance: distance.value })
}
const reset = () => { active = false; mouse = false; dragging.value = false; distance.value = 0 }
const refresh = () => {
  if (isDisabled.value || props.modelValue || pending.value) return
  pending.value = true
  emit('update:modelValue', true)
  emit('refresh')
}
const finish = () => {
  if (active && distance.value >= threshold.value) refresh()
  reset()
}
const touchStart = (event: TouchEvent) => { if (event.touches.length === 1) start(event.touches[0].clientX, event.touches[0].clientY) }
const touchMove = (event: TouchEvent) => { if (event.touches.length === 1) move(event.touches[0].clientX, event.touches[0].clientY, event) }
const pointerStart = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return
  mouse = true
  start(event.clientX, event.clientY)
  if (active) (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}
const pointerMove = (event: PointerEvent) => { if (mouse) move(event.clientX, event.clientY, event) }
watch(() => props.modelValue, () => { pending.value = false; reset() })
watch(isDisabled, (value) => { if (value) reset() })
defineExpose({ refresh })
</script>