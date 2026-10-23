<template>
  <div ref="rootRef" class="scq-pull-refresh" tabindex="-1" :class="{ 'is-dragging': dragging }" :aria-busy="modelValue || pending" @touchstart.passive="touchStart" @touchmove="touchMove" @touchend="finish" @touchcancel="reset" @pointerdown="pointerStart" @pointermove="pointerMove" @pointerup="pointerFinish" @pointercancel="pointerCancel" @lostpointercapture.self="pointerCancel">
    <button ref="keyboardRef" class="scq-pull-refresh__keyboard" type="button" :disabled="isDisabled || modelValue || pending" @click="refresh">{{ text('refresh') }}</button>
    <div v-if="outcome === 'error' && !holding && !modelValue && !pending" class="scq-pull-refresh__feedback" role="status">
      <span>{{ errorText || text('refreshFailed') }}</span>
      <button type="button" class="scq-pull-refresh__retry" :disabled="isDisabled" @click="retry">{{ retryText || text('retryAction') }}</button>
    </div>
    <div class="scq-pull-refresh__track" :style="{ transform: `translateY(${offset}px)` }">
      <div ref="headRef" class="scq-pull-refresh__head" :class="`is-${status}`" :style="{ height: `${headHeight}px`, top: `-${headHeight}px` }" :aria-hidden="offset === 0" :inert="offset === 0 || undefined" role="status" aria-live="polite">
        <slot name="head" :status="status" :distance="offset" :retry="retry">
          <span>{{ statusText }}</span>
          <button v-if="status === 'error'" type="button" class="scq-pull-refresh__retry" :disabled="isDisabled" @click="retry">{{ retryText || text('retryAction') }}</button>
        </slot>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { MAX_RESULT_DURATION, PULL_REFRESH_DAMPING, PULL_REFRESH_DEFAULTS, PULL_REFRESH_MAX_DISTANCE_RATIO, REFRESH_INTERACTIVE_SELECTOR } from './constants'
import type { PullRefreshChange, PullRefreshProps, PullRefreshResult, PullRefreshStatus } from './types'
import { getScrollParent, isScrollWindow } from '../../utils/scroll'
import { useContentFocus } from '../../utils/focus'

export type { PullRefreshChange, PullRefreshProps, PullRefreshResult, PullRefreshStatus } from './types'
defineOptions({ name: 'PullRefresh' })
const props = withDefaults(defineProps<PullRefreshProps>(), { modelValue: false, disabled: undefined, ...PULL_REFRESH_DEFAULTS })
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'refresh' | 'retry'): void
  (event: 'complete', value: PullRefreshResult): void
  (event: 'change', value: PullRefreshChange): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const rootRef = ref<HTMLElement>()
const keyboardRef = ref<HTMLButtonElement>()
const headRef = ref<HTMLElement>()
const distance = ref(0)
const dragging = ref(false)
const pending = ref(false)
const outcome = ref<PullRefreshResult>()
const holding = ref(false)
useContentFocus(() => {
  const root = rootRef.value
  const activeElement = root?.ownerDocument.activeElement
  return activeElement instanceof HTMLElement && root?.contains(activeElement)
    && (headRef.value?.contains(activeElement) || activeElement.classList.contains('scq-pull-refresh__retry')) ? activeElement : keyboardRef.value
}, () => isDisabled.value || props.modelValue || pending.value,
() => rootRef.value?.querySelector<HTMLButtonElement>('.scq-pull-refresh__retry:not(:disabled)') || keyboardRef.value)
const offset = computed(() => props.modelValue || pending.value || holding.value ? props.headHeight : distance.value)
const status = computed<PullRefreshStatus>(() => props.modelValue || pending.value ? 'loading' : holding.value && outcome.value ? outcome.value : distance.value >= props.pullDistance ? 'loosing' : distance.value ? 'pulling' : 'normal')
const statusText = computed(() => {
  if (status.value === 'loading') return props.loadingText || text('refreshing')
  if (status.value === 'success') return props.successText || text('refreshSuccess')
  if (status.value === 'error') return props.errorText || text('refreshFailed')
  if (status.value === 'loosing') return props.loosingText || text('release')
  return props.pullingText || text('pullDown')
})
let startX = 0
let startY = 0
let active = false
let pointerId: number | undefined
let resultTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
watch(() => [props.headHeight, props.pullDistance, props.resultDuration, props.result], () => {
  for (const name of ['headHeight', 'pullDistance'] as const) {
    if (!Number.isFinite(props[name]) || props[name] <= 0) throw new RangeError(`[scq-vue/PullRefresh] ${name} must be a finite positive number.`)
  }
  if (!Number.isFinite(props.resultDuration) || props.resultDuration < 0 || props.resultDuration > MAX_RESULT_DURATION) throw new RangeError(`[scq-vue/PullRefresh] resultDuration must be between 0 and ${MAX_RESULT_DURATION} milliseconds.`)
  if (props.result !== undefined && props.result !== 'success' && props.result !== 'error') throw new TypeError('[scq-vue/PullRefresh] result must be "success", "error", or undefined.')
}, { immediate: true, flush: 'sync' })
const clearResult = () => {
  clearTimeout(resultTimer)
  resultTimer = undefined
  holding.value = false
  outcome.value = undefined
}
const scheduleResultEnd = () => {
  clearTimeout(resultTimer)
  resultTimer = setTimeout(() => {
    resultTimer = undefined
    if (disposed) return
    holding.value = false
    emit('change', { status: status.value, distance: offset.value })
  }, props.resultDuration)
}
const showResult = (result: PullRefreshResult | undefined) => {
  clearResult()
  if (!result) return
  outcome.value = result
  holding.value = true
  emit('complete', result)
  emit('change', { status: result, distance: offset.value })
  scheduleResultEnd()
}
const atTop = () => {
  if (!rootRef.value) return false
  const parent = getScrollParent(rootRef.value)
  return (isScrollWindow(parent) ? parent.scrollY : parent.scrollTop) <= 0
}
const start = (clientX: number, clientY: number) => {
  if (disposed || isDisabled.value || props.modelValue || pending.value || holding.value || !atTop()) return
  startX = clientX
  startY = clientY
  active = true
}
const move = (clientX: number, clientY: number, event: Event) => {
  if (!active) return
  if (event.defaultPrevented || !atTop()) { reset(); return }
  const vertical = clientY - startY
  if (!dragging.value && (vertical < 0 || Math.abs(clientX - startX) > Math.abs(vertical))) { active = false; return }
  if (vertical <= 0) { distance.value = 0; return }
  dragging.value = true
  if (event.cancelable) event.preventDefault()
  distance.value = Math.min(props.pullDistance * PULL_REFRESH_MAX_DISTANCE_RATIO, vertical / PULL_REFRESH_DAMPING)
  emit('change', { status: status.value, distance: distance.value })
}
const reset = () => {
  const captured = pointerId
  pointerId = undefined
  active = false
  dragging.value = false
  distance.value = 0
  if (captured !== undefined && rootRef.value?.hasPointerCapture?.(captured)) rootRef.value.releasePointerCapture?.(captured)
}
const requestRefresh = (isRetry: boolean) => {
  if (disposed || isDisabled.value || props.modelValue || pending.value) return
  clearResult()
  reset()
  pending.value = true
  if (isRetry) emit('retry')
  if (disposed) return
  emit('update:modelValue', true)
  if (disposed) return
  emit('refresh')
}
const refresh = () => requestRefresh(false)
const retry = () => { if (outcome.value === 'error') requestRefresh(true) }
const finish = () => {
  if (active && distance.value >= props.pullDistance) refresh()
  reset()
}
const interactiveTarget = (event: Event) => (event.target as Element | null)?.closest?.(REFRESH_INTERACTIVE_SELECTOR)
const touchStart = (event: TouchEvent) => {
  reset()
  if (event.touches.length === 1 && !event.defaultPrevented && !interactiveTarget(event)) start(event.touches[0].clientX, event.touches[0].clientY)
}
const touchMove = (event: TouchEvent) => {
  if (event.touches.length !== 1) { reset(); return }
  move(event.touches[0].clientX, event.touches[0].clientY, event)
}
const pointerStart = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || event.button !== 0 || event.defaultPrevented || interactiveTarget(event)) return
  reset()
  start(event.clientX, event.clientY)
  if (active) pointerId = event.pointerId
}
const pointerMove = (event: PointerEvent) => {
  if (pointerId === undefined || event.pointerId !== pointerId) return
  move(event.clientX, event.clientY, event)
  if (!active) { reset(); return }
  if (dragging.value && !rootRef.value?.hasPointerCapture?.(event.pointerId)) rootRef.value?.setPointerCapture?.(event.pointerId)
}
const pointerFinish = (event: PointerEvent) => { if (pointerId !== undefined && event.pointerId === pointerId) finish() }
const pointerCancel = (event: PointerEvent) => { if (pointerId !== undefined && event.pointerId === pointerId) reset() }
watch(() => [props.headHeight, props.pullDistance], reset, { flush: 'sync' })
watch(() => offset.value === 0, hidden => {
  if (hidden && headRef.value?.contains(headRef.value.ownerDocument.activeElement)) {
    const target = isDisabled.value ? rootRef.value : keyboardRef.value
    target?.focus({ preventScroll: true })
  }
})
watch([() => props.modelValue, () => props.result], ([loading, result], previous) => {
  const [wasLoading, previousResult] = previous ?? []
  if (loading) {
    pending.value = false
    reset()
    clearResult()
  } else if (wasLoading || (result !== previousResult && result !== undefined)) {
    pending.value = false
    reset()
    showResult(result)
  } else if (result !== previousResult) {
    clearResult()
  }
}, { immediate: true })
watch(() => props.resultDuration, () => { if (holding.value) scheduleResultEnd() })
watch(isDisabled, (value) => { if (value) reset() })
onBeforeUnmount(() => { disposed = true; clearResult(); reset() })
defineExpose({ refresh, retry })
</script>