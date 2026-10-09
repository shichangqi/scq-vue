<template>
  <div ref="rootRef" class="scq-swipe-cell" :class="{ 'is-dragging': dragging }" @keydown="keydown">
    <div ref="leftRef" class="scq-swipe-cell__actions scq-swipe-cell__actions--left" :aria-hidden="offset <= 0" :inert="offset <= 0 ? true : undefined" @click="action('left')"><slot name="left" /></div>
    <div ref="rightRef" class="scq-swipe-cell__actions scq-swipe-cell__actions--right" :aria-hidden="offset >= 0" :inert="offset >= 0 ? true : undefined" @click="action('right')"><slot name="right" /></div>
    <div class="scq-swipe-cell__content" :tabindex="isDisabled ? undefined : 0" :aria-label="ariaLabel || undefined" :aria-expanded="position !== ''" :style="{ transform: `translateX(${offset}px)` }" @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="cancelDrag" @click.capture="contentClick"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useConfig } from '../ConfigProvider/context'

export type SwipeCellPosition = '' | 'left' | 'right'
export interface SwipeCellClose { position: SwipeCellPosition; reason: 'cell' | 'action' | 'keyboard' | 'method' }
defineOptions({ name: 'SwipeCell' })
const props = withDefaults(defineProps<{ modelValue?: SwipeCellPosition; disabled?: boolean; leftWidth?: number; rightWidth?: number; ariaLabel?: string; beforeClose?: (context: SwipeCellClose) => boolean | void | Promise<boolean | void> }>(), { disabled: undefined, ariaLabel: '' })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'open', value: SwipeCellPosition): void
  (event: 'close', value: SwipeCellClose): void
  (event: 'click', value: 'left' | 'right' | 'cell'): void
  (event: 'error', error: unknown): void
}>()
const config = useConfig()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const rootRef = ref<HTMLElement>()
const leftRef = ref<HTMLElement>()
const rightRef = ref<HTMLElement>()
const localPosition = ref<SwipeCellPosition>('')
const position = computed(() => props.modelValue ?? localPosition.value)
const leftSize = ref(0)
const rightSize = ref(0)
const dragging = ref(false)
const dragOffset = ref(0)
const offset = computed(() => isDisabled.value ? 0 : dragging.value ? dragOffset.value : position.value === 'left' ? leftSize.value : position.value === 'right' ? -rightSize.value : 0)
let startX = 0
let startY = 0
let initialOffset = 0
let active = false
let suppressClick = false
let closing = false
let sequence = 0
let observer: ResizeObserver | undefined
const measure = () => { leftSize.value = Math.max(0, props.leftWidth ?? leftRef.value?.getBoundingClientRect().width ?? 0); rightSize.value = Math.max(0, props.rightWidth ?? rightRef.value?.getBoundingClientRect().width ?? 0) }
const setPosition = (value: SwipeCellPosition) => { localPosition.value = value; emit('update:modelValue', value) }
const open = (value: Exclude<SwipeCellPosition, ''>) => {
  measure()
  if (isDisabled.value || (value === 'left' ? !leftSize.value : !rightSize.value)) return
  sequence += 1
  closing = false
  if (value !== position.value) { setPosition(value); emit('open', value) }
}
const close = async (reason: SwipeCellClose['reason'] = 'method') => {
  if (!position.value || closing) return
  closing = true
  const current = ++sequence
  const context = { position: position.value, reason }
  try {
    const allowed = await props.beforeClose?.(context)
    if (current !== sequence || allowed === false) return
    setPosition('')
    emit('close', context)
  } catch (error) { if (current === sequence) emit('error', error) }
  finally { if (current === sequence) closing = false }
}
const start = (event: PointerEvent) => {
  if (isDisabled.value || event.button > 0 || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return
  measure()
  startX = event.clientX
  startY = event.clientY
  initialOffset = offset.value
  dragOffset.value = initialOffset
  active = true
  suppressClick = false
}
const move = (event: PointerEvent) => {
  if (!active) return
  const horizontal = event.clientX - startX
  const vertical = event.clientY - startY
  if (!dragging.value && Math.abs(vertical) > Math.abs(horizontal)) { active = false; return }
  if (Math.abs(horizontal) < 6 && !dragging.value) return
  dragging.value = true
  suppressClick = true
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  dragOffset.value = Math.max(-rightSize.value, Math.min(leftSize.value, initialOffset + horizontal))
}
const cancelDrag = () => { active = false; dragging.value = false }
const finish = () => {
  if (!active) return
  const value = dragOffset.value
  const moved = dragging.value
  cancelDrag()
  if (!moved) return
  if (value > leftSize.value / 2 && leftSize.value) open('left')
  else if (value < -rightSize.value / 2 && rightSize.value) open('right')
  else void close('cell')
}
const contentClick = (event: MouseEvent) => {
  if (suppressClick || position.value) { event.preventDefault(); event.stopPropagation() }
  if (suppressClick) { suppressClick = false; return }
  emit('click', 'cell')
  void close('cell')
}
const action = (value: 'left' | 'right') => { emit('click', value); void close('action') }
const keydown = (event: KeyboardEvent) => {
  if (isDisabled.value || (event.target as HTMLElement).closest('input, textarea, select')) return
  if (event.key === 'ArrowLeft') { event.preventDefault(); open('right') }
  if (event.key === 'ArrowRight') { event.preventDefault(); open('left') }
  if (event.key === 'Escape') { event.preventDefault(); void close('keyboard') }
}
watch(() => [props.leftWidth, props.rightWidth], measure)
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (leftRef.value) observer.observe(leftRef.value)
    if (rightRef.value) observer.observe(rightRef.value)
  }
})
onBeforeUnmount(() => { sequence += 1; observer?.disconnect() })
defineExpose({ open, close })
</script>