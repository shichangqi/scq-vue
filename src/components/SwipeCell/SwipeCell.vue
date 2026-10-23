<template>
  <div ref="rootRef" class="scq-swipe-cell" :class="{ 'is-dragging': dragging, 'is-pending': pending }" :data-swipe-cell-id="cellId" :aria-busy="pending" @keydown="keydown">
    <div ref="leftRef" class="scq-swipe-cell__actions scq-swipe-cell__actions--left" :aria-hidden="offset <= 0" :inert="offset <= 0 || pending || (group !== undefined && position !== 'left') ? true : undefined" @click.capture="guardActionClick($event, 'left')" @click="action('left')"><slot name="left" /></div>
    <div ref="rightRef" class="scq-swipe-cell__actions scq-swipe-cell__actions--right" :aria-hidden="offset >= 0" :inert="offset >= 0 || pending || (group !== undefined && position !== 'right') ? true : undefined" @click.capture="guardActionClick($event, 'right')" @click="action('right')"><slot name="right" /></div>
    <div ref="contentRef" class="scq-swipe-cell__content" :tabindex="isDisabled ? -1 : 0" :aria-label="ariaLabel || undefined" :aria-expanded="position !== ''" :style="{ transform: `translateX(${offset}px)` }" @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="cancelPointer" @lostpointercapture.self="cancelPointer" @click.capture="contentClick"><slot /></div>
    <span v-if="pending" class="scq-swipe-cell__pending" role="status">{{ text('pending') }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useAsyncGuard } from '../../utils/async'
import { useComponentId } from '../../utils/id'
import { SWIPE_CELL_ACTION_SELECTOR, SWIPE_CELL_DRAG_THRESHOLD, SWIPE_CELL_INTERACTIVE_SELECTOR, SWIPE_CELL_OPEN_RATIO } from './constants'
import { registerSwipeCell, untilCancelled, type SwipeCellMember, type SwipeCellRegistration } from './group'
import type { SwipeCellClose, SwipeCellGroupConflict, SwipeCellPosition, SwipeCellProps } from './types'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { useContentFocus } from '../../utils/focus'
import { focusFirstControl } from '../Form/useFormControl'

export type { SwipeCellClose, SwipeCellCloseReason, SwipeCellGroup, SwipeCellGroupConflict, SwipeCellPosition, SwipeCellProps } from './types'
defineOptions({ name: 'SwipeCell' })
const props = withDefaults(defineProps<SwipeCellProps>(), { disabled: undefined, ariaLabel: '', closeOnClickOutside: false })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'open', value: SwipeCellPosition): void
  (event: 'close', value: SwipeCellClose): void
  (event: 'click', value: 'left' | 'right' | 'cell'): void
  (event: 'error', error: unknown): void
  (event: 'group-conflict', value: SwipeCellGroupConflict): void
}>()
const config = useConfig()
const text = useLocale()
const instance = getCurrentInstance()!
const cellId = useComponentId('scq-swipe-cell')
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const rootRef = ref<HTMLElement>()
const leftRef = ref<HTMLElement>()
const rightRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const localPosition = ref<SwipeCellPosition>('')
const position = computed(() => props.modelValue ?? localPosition.value)
const leftSize = ref(0)
const rightSize = ref(0)
const dragging = ref(false)
const dragOffset = ref(0)
const openingPending = ref(false)
const closingPending = ref(false)
const guard = useAsyncGuard<SwipeCellClose>(() => props.beforeClose, (error) => emit('error', error))
const pending = computed(() => openingPending.value || closingPending.value || guard.pending.value)
useContentFocus(() => {
  const activeElement = rootRef.value?.ownerDocument.activeElement
  if (activeElement && leftRef.value?.contains(activeElement)) return leftRef.value
  if (activeElement && rightRef.value?.contains(activeElement)) return rightRef.value
  return undefined
}, () => pending.value || isDisabled.value, () => contentRef.value)
const offset = computed(() => isDisabled.value ? 0 : dragging.value ? dragOffset.value : position.value === 'left' ? leftSize.value : position.value === 'right' ? -rightSize.value : 0)
let startX = 0
let startY = 0
let initialOffset = 0
let active = false
let pointerId: number | undefined
let suppressClick = false
let disposed = false
let observer: ResizeObserver | undefined
let outsideDocument: Document | undefined
let registration: SwipeCellRegistration | undefined
let openRequest: { value: Exclude<SwipeCellPosition, ''>; promise: Promise<boolean> } | undefined
let closeRequest: { context: SwipeCellClose; controller: AbortController; accepted: boolean; promise: Promise<boolean> } | undefined
watch(() => [props.leftWidth, props.rightWidth, props.group, props.modelValue], () => {
  for (const name of ['leftWidth', 'rightWidth'] as const) {
    const width = props[name]
    if (width !== undefined && (!Number.isFinite(width) || width < 0)) throw new RangeError(`[scq-vue/SwipeCell] ${name} must be a finite non-negative number.`)
  }
  if (props.group !== undefined && typeof props.group !== 'string' && (typeof props.group !== 'number' || !Number.isFinite(props.group))) throw new TypeError('[scq-vue/SwipeCell] group must be a string or finite number.')
  if (props.modelValue !== undefined && !['', 'left', 'right'].includes(props.modelValue)) throw new TypeError('[scq-vue/SwipeCell] modelValue must be "", "left", or "right".')
}, { immediate: true, flush: 'sync' })
const measure = () => {
  const left = props.leftWidth ?? leftRef.value?.getBoundingClientRect().width ?? 0
  const right = props.rightWidth ?? rightRef.value?.getBoundingClientRect().width ?? 0
  if (left !== leftSize.value || right !== rightSize.value) cancelDrag()
  leftSize.value = left
  rightSize.value = right
  if (openRequest && !(openRequest.value === 'left' ? leftSize.value : rightSize.value)) cancelOpen()
}
const setPosition = (value: SwipeCellPosition) => { localPosition.value = value; emit('update:modelValue', value) }
const cancelOpen = () => {
  registration?.cancel()
  openRequest = undefined
  openingPending.value = false
}
const cancelClose = () => {
  guard.cancel()
  closeRequest?.controller.abort()
  closeRequest = undefined
  closingPending.value = false
}
const cancelPending = () => { cancelOpen(); cancelClose() }
const waitForPosition = (value: SwipeCellPosition, signal: AbortSignal): Promise<boolean> => {
  if (disposed || signal.aborted) return Promise.resolve(false)
  if (position.value === value) return Promise.resolve(true)
  return new Promise((resolve) => {
    const finish = (accepted: boolean) => { stop(); signal.removeEventListener('abort', cancel); resolve(accepted) }
    const cancel = () => finish(false)
    const stop = watch(position, (next) => finish(next === value), { flush: 'sync' })
    signal.addEventListener('abort', cancel, { once: true })
  })
}
const applyOpen = (value: Exclude<SwipeCellPosition, ''>, signal?: AbortSignal): Promise<boolean> => {
  measure()
  if (disposed || isDisabled.value || signal?.aborted || !(value === 'left' ? leftSize.value : rightSize.value)) return Promise.resolve(false)
  if (value === position.value) return Promise.resolve(true)
  setPosition(value)
  emit('open', value)
  return signal ? waitForPosition(value, signal) : Promise.resolve(true)
}
const open = (value: Exclude<SwipeCellPosition, ''>): Promise<boolean> => {
  if (value !== 'left' && value !== 'right') throw new TypeError('[scq-vue/SwipeCell] open expects "left" or "right".')
  measure()
  if (disposed || isDisabled.value || !(value === 'left' ? leftSize.value : rightSize.value)) return Promise.resolve(false)
  cancelClose()
  if (value === position.value) { cancelOpen(); return Promise.resolve(true) }
  if (!registration) return applyOpen(value)
  if (openRequest) return openRequest.value === value ? openRequest.promise : Promise.resolve(false)
  openingPending.value = true
  const request = { value, promise: registration.open(value) }
  openRequest = request
  request.promise = request.promise.finally(() => {
    if (openRequest === request) { openRequest = undefined; openingPending.value = false }
  })
  return request.promise
}
const close = (reason: SwipeCellClose['reason'] = 'method', signal?: AbortSignal): Promise<boolean> => {
  cancelOpen()
  if (disposed || signal?.aborted) return Promise.resolve(false)
  if (!position.value) return Promise.resolve(true)
  if (closeRequest) return signal ? untilCancelled(closeRequest.promise, signal) : closeRequest.promise
  const request = {
    context: { position: position.value, reason },
    controller: new AbortController(),
    accepted: false,
    promise: Promise.resolve(false),
  }
  closeRequest = request
  closingPending.value = true
  const cancel = () => { if (closeRequest === request) cancelClose() }
  signal?.addEventListener('abort', cancel, { once: true })
  const work = guard.run(request.context, () => {
    if (disposed || request.controller.signal.aborted || position.value !== request.context.position) return
    request.accepted = true
    setPosition('')
    emit('close', request.context)
  }).then((accepted) => accepted && request.accepted ? waitForPosition('', request.controller.signal) : false)
  request.promise = untilCancelled(work, request.controller.signal).finally(() => {
    signal?.removeEventListener('abort', cancel)
    if (closeRequest === request) { closeRequest = undefined; closingPending.value = false }
  })
  return request.promise
}
const start = (event: PointerEvent) => {
  if (active && event.pointerId !== pointerId) { cancelDrag(); return }
  if (disposed || isDisabled.value || pending.value || event.defaultPrevented || event.button > 0 || !(event.target instanceof Element) || event.target.closest(SWIPE_CELL_INTERACTIVE_SELECTOR)) return
  cancelDrag()
  measure()
  startX = event.clientX
  startY = event.clientY
  initialOffset = offset.value
  dragOffset.value = initialOffset
  active = true
  pointerId = event.pointerId
  suppressClick = false
}
const move = (event: PointerEvent) => {
  if (!active || event.pointerId !== pointerId) return
  if (event.defaultPrevented) { cancelDrag(); return }
  const horizontal = event.clientX - startX
  const vertical = event.clientY - startY
  if (!dragging.value && Math.abs(vertical) > Math.abs(horizontal)) { cancelDrag(); return }
  if (Math.abs(horizontal) < SWIPE_CELL_DRAG_THRESHOLD && !dragging.value) return
  dragging.value = true
  suppressClick = true
  if (event.cancelable) event.preventDefault()
  if (pointerId !== undefined && !contentRef.value?.hasPointerCapture?.(pointerId)) contentRef.value?.setPointerCapture?.(pointerId)
  dragOffset.value = Math.max(-rightSize.value, Math.min(leftSize.value, initialOffset + horizontal))
}
const cancelDrag = () => {
  const captured = pointerId
  pointerId = undefined
  active = false
  dragging.value = false
  if (captured !== undefined && contentRef.value?.hasPointerCapture?.(captured)) contentRef.value.releasePointerCapture?.(captured)
}
const cancelPointer = (event: PointerEvent) => { if (active && event.pointerId === pointerId) cancelDrag() }
const finish = (event: PointerEvent) => {
  if (!active || event.pointerId !== pointerId) return
  const value = dragOffset.value
  const moved = dragging.value
  cancelDrag()
  if (!moved) return
  if (value > leftSize.value * SWIPE_CELL_OPEN_RATIO && leftSize.value) void open('left')
  else if (value < -rightSize.value * SWIPE_CELL_OPEN_RATIO && rightSize.value) void open('right')
  else void close('cell')
}
const contentClick = (event: MouseEvent) => {
  const suppress = suppressClick && event.detail > 0
  suppressClick = false
  if (suppress || position.value || pending.value) { event.preventDefault(); event.stopPropagation() }
  if (suppress) return
  if (pending.value) return
  emit('click', 'cell')
  void close('cell')
}
const action = (value: 'left' | 'right') => { emit('click', value); void close('action') }
const guardActionClick = (event: MouseEvent, value: Exclude<SwipeCellPosition, ''>) => {
  if (pending.value || (props.group !== undefined && position.value !== value)) { event.preventDefault(); event.stopPropagation() }
}
const keyboardOpen = async (value: Exclude<SwipeCellPosition, ''>, origin: Element) => {
  const owner = origin.ownerDocument
  const focused = origin === owner.activeElement || origin.contains(owner.activeElement)
  if (!await open(value) || !focused) return
  await nextTick()
  if (disposed || isDisabled.value || pending.value || position.value !== value) return
  const current = owner.activeElement
  if (current !== origin && current !== contentRef.value && current !== owner.body) return
  focusFirstControl(value === 'left' ? leftRef.value : rightRef.value, { preventScroll: true }, SWIPE_CELL_ACTION_SELECTOR)
}
const keydown = (event: KeyboardEvent) => {
  if (isDisabled.value || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey
    || !(event.target instanceof Element) || event.target.closest(SWIPE_CELL_INTERACTIVE_SELECTOR) || (pending.value && event.key !== 'Escape')) return
  if (event.key === 'ArrowLeft') { event.preventDefault(); void keyboardOpen('right', event.target) }
  if (event.key === 'ArrowRight') { event.preventDefault(); void keyboardOpen('left', event.target) }
  if (event.key === 'Escape') { event.preventDefault(); void close('keyboard') }
}
const outsideClick = (event: MouseEvent) => {
  const root = rootRef.value
  if (!root || !position.value || event.composedPath().includes(root) || root.contains(event.target as Node)) return
  void close('outside')
}
const syncOutsideListener = () => {
  outsideDocument?.removeEventListener('click', outsideClick, true)
  outsideDocument = props.closeOnClickOutside ? rootRef.value?.ownerDocument : undefined
  outsideDocument?.addEventListener('click', outsideClick, true)
}
const member: SwipeCellMember = {
  id: cellId,
  position: () => position.value,
  close: (signal) => close('group', signal),
  open: applyOpen,
  conflict: (context) => { emit('group-conflict', context); return Boolean(instance.vnode.props?.onGroupConflict) },
}
watch(() => props.group, (value) => {
  cancelPending()
  registration?.unregister()
  registration = value === undefined ? undefined : registerSwipeCell(instance.appContext, value, member)
}, { immediate: true, flush: 'sync' })
watch(position, (value, previous) => {
  cancelDrag()
  if (closeRequest && value !== closeRequest.context.position && (value !== '' || !closeRequest.accepted)) cancelClose()
  registration?.changed(previous)
}, { flush: 'sync' })
watch(offset, value => {
  const activeElement = rootRef.value?.ownerDocument.activeElement
  if (activeElement && ((value <= 0 && leftRef.value?.contains(activeElement)) || (value >= 0 && rightRef.value?.contains(activeElement)))) contentRef.value?.focus({ preventScroll: true })
})
watch(() => props.beforeClose, cancelClose, { flush: 'sync' })
watch(isDisabled, (value) => { if (value) { cancelDrag(); cancelPending() } }, { flush: 'sync' })
watch(() => [props.leftWidth, props.rightWidth], measure)
watch(() => props.closeOnClickOutside, (value) => {
  syncOutsideListener()
  if (!value && closeRequest?.context.reason === 'outside') cancelClose()
})
onMounted(() => {
  measure()
  syncOutsideListener()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (leftRef.value) observer.observe(leftRef.value)
    if (rightRef.value) observer.observe(rightRef.value)
  }
})
onBeforeUnmount(() => {
  disposed = true
  cancelDrag()
  cancelPending()
  registration?.unregister()
  observer?.disconnect()
  outsideDocument?.removeEventListener('click', outsideClick, true)
})
defineExpose({ open, close, cancelPending, pending })
</script>