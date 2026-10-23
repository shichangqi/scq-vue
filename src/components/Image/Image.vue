<template>
  <div class="scq-image" :style="{ width: length(width), height: length(height) }" :aria-busy="image.pending.value">
    <img v-if="image.available.value" ref="imageRef" :key="image.key.value" :data-image-key="image.key.value" :src="image.src.value || undefined" :srcset="image.srcset.value" :sizes="image.sizes.value" :alt="alt" :loading="loading" :decoding="decoding" :fetchpriority="fetchpriority" :width="typeof width === 'number' ? Math.max(0, width) : undefined" :height="typeof height === 'number' ? Math.max(0, height) : undefined" :crossorigin="crossorigin" :referrerpolicy="referrerpolicy" :style="{ objectFit: fit, objectPosition: position, opacity: image.pending.value ? 0 : 1 }" @load="image.loaded" @error="image.error" />
    <div v-if="image.pending.value" class="scq-image__placeholder" role="status"><slot name="placeholder"><Icon name="image" :size="IMAGE_DEFAULTS.placeholderIconSize" /><span>{{ text('loading') }}</span></slot></div>
    <div v-else-if="!image.available.value" class="scq-image__placeholder is-error" role="img" :aria-label="alt || text('imageError')"><slot name="error"><Icon name="image" :size="IMAGE_DEFAULTS.placeholderIconSize" /><span>{{ text('imageError') }}</span></slot></div>
    <button v-if="canPreview" type="button" class="scq-image__preview-trigger" :aria-label="`${text('preview')} ${alt}`" @click="showPreview()" />
    <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="teleport === false">
      <div v-if="mounted && visible && sources.length" ref="panelRef" class="scq-image-viewer" role="dialog" aria-modal="true" :aria-label="alt || text('preview')" :aria-busy="previewImage.pending.value || undefined" tabindex="-1" :style="{ ...themeStyle, zIndex: zIndex ?? modal.zIndex.value }" @keydown="keydown" @click.self="closeOnClickOverlay && closePreview()">
        <button type="button" class="scq-image-viewer__close" :aria-label="text('close')" :title="text('close')" @click="closePreview"><Icon name="close" :size="IMAGE_DEFAULTS.closeIconSize" /></button>
        <div ref="stageRef" class="scq-image-viewer__stage" @pointerdown="panStart" @pointermove="panMove" @pointerup="panEnd" @pointercancel="cancelPan" @lostpointercapture="lostPointer" @wheel="wheel" @dblclick="previewDoubleClickReset && reset()" @click="stageClick">
          <img v-if="previewImage.available.value" ref="previewRef" :key="previewImage.key.value" :data-image-key="previewImage.key.value" :src="previewImage.src.value" :alt="alt" draggable="false" :style="{ transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${scale})`, cursor: scale > IMAGE_DEFAULTS.minScale ? 'grab' : 'default', opacity: previewImage.pending.value ? 0 : 1 }" @load="previewImage.loaded" @error="previewImage.error" />
          <div v-if="previewImage.pending.value" class="scq-image-viewer__status" role="status">{{ text('loading') }}</div>
          <div v-else-if="previewImage.failed.value" class="scq-image-viewer__status" role="alert">{{ text('imageError') }}<button type="button" @click="retryPreview">{{ text('retryAction') }}</button></div>
        </div>
        <button v-if="sources.length > 1" type="button" class="scq-image-viewer__previous" :aria-label="text('previous')" :title="text('previous')" @click="change(-1)"><Icon name="chevronLeft" :size="IMAGE_DEFAULTS.navigationIconSize" /></button><button v-if="sources.length > 1" type="button" class="scq-image-viewer__next" :aria-label="text('next')" :title="text('next')" @click="change(1)"><Icon name="chevronRight" :size="IMAGE_DEFAULTS.navigationIconSize" /></button>
        <div class="scq-image-viewer__toolbar"><slot name="toolbar" v-bind="toolbar"><span aria-live="polite">{{ current + 1 }} / {{ sources.length }}</span><button type="button" :aria-label="text('zoomOut')" :title="text('zoomOut')" :disabled="scale <= IMAGE_DEFAULTS.minScale" @click="zoom(-IMAGE_DEFAULTS.zoomStep)"><Icon name="minus" :size="IMAGE_DEFAULTS.toolbarIconSize" /></button><output>{{ Math.round(scale * IMAGE_DEFAULTS.percentage) }}%</output><button type="button" :aria-label="text('zoomIn')" :title="text('zoomIn')" :disabled="scale >= IMAGE_DEFAULTS.maxScale" @click="zoom(IMAGE_DEFAULTS.zoomStep)"><Icon name="plus" :size="IMAGE_DEFAULTS.toolbarIconSize" /></button><button type="button" :aria-label="text('rotate')" :title="text('rotate')" @click="rotation += IMAGE_DEFAULTS.rotationStep"><Icon name="refresh" :size="IMAGE_DEFAULTS.toolbarIconSize" /></button></slot></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, useThemeStyle } from '../ConfigProvider/context'
import { useModal } from '../../utils/modal'
import { useImageSource } from '../../utils/image-source'
import { toCssLength as length } from '../../utils/layout'
import { EDITABLE_TARGET_SELECTOR } from '../../utils/focus'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { IMAGE_DEFAULTS } from './constants'
import type { ImageExpose, ImageProps, ImageSlots, ImageToolbar } from './types'

defineOptions({ name: 'Image' })
const props = withDefaults(defineProps<ImageProps>(), { src: '', alt: '', width: '100%', height: IMAGE_DEFAULTS.height, fit: 'cover', position: 'center', loading: 'lazy', decoding: 'auto', fetchpriority: 'auto', preview: false, previewVisible: undefined, previewSrcList: () => [], disabled: undefined, teleport: true, closeOnClickOverlay: true, previewWheelZoom: false, previewPinchZoom: false, previewDoubleClickReset: false })
defineSlots<ImageSlots>()
const emit = defineEmits<{
  (event: 'load' | 'error' | 'preview-error' | 'preview-load', value: Event): void
  (event: 'update:previewVisible', value: boolean): void
  (event: 'update:previewIndex', value: number): void
  (event: 'show' | 'switch', index: number): void
  (event: 'close'): void
}>()
const text = useLocale()
const config = useConfig()
const themeStyle = useThemeStyle()
const imageRef = ref<HTMLImageElement>()
const panelRef = ref<HTMLElement>()
const previewRef = ref<HTMLImageElement>()
const stageRef = ref<HTMLElement>()
const mounted = ref(false)
const image = useImageSource(() => ({ src: props.src, srcset: props.srcset, sizes: props.sizes, fallbackSrc: props.fallbackSrc, crossorigin: props.crossorigin, referrerpolicy: props.referrerpolicy }), () => imageRef.value,
  (event) => emit('load', event), (event) => emit('error', event))
const localVisible = ref(false)
const visible = computed(() => props.previewVisible ?? localVisible.value)
const sources = computed(() => props.previewSrcList.length ? props.previewSrcList : image.src.value ? [image.src.value] : [])
const localIndex = ref(0)
const normalizeIndex = (value: number) => {
  if (!Number.isInteger(value) || value < 0) throw new RangeError('[scq-vue] Image preview indices must be non-negative integers.')
  return Math.max(0, Math.min(sources.value.length - 1, value))
}
const current = computed(() => normalizeIndex(props.previewIndex ?? localIndex.value))
const previewSource = computed(() => sources.value[current.value] ?? '')
const previewImage = useImageSource(() => ({ src: visible.value ? previewSource.value : '' }), () => previewRef.value,
  (event) => emit('preview-load', event), (event) => emit('preview-error', event))
const scale = ref<number>(IMAGE_DEFAULTS.minScale)
const rotation = ref(0)
const panX = ref(0)
const panY = ref(0)
const panning = ref(false)
let startX = 0
let startY = 0
const pointers = new Map<number, { x: number; y: number; touch: boolean }>()
let pinch: { distance: number; scale: number } | undefined
let capturedClick = false
const canPreview = computed(() => !(props.disabled ?? config.value.disabled) && !image.pending.value && image.available.value && Boolean(props.preview || props.previewSrcList.length) && sources.value.length > 0)
const cancelPan = () => {
  const active = [...pointers.keys()]
  pointers.clear()
  pinch = undefined
  panning.value = false
  for (const id of active) if (stageRef.value?.hasPointerCapture?.(id)) stageRef.value.releasePointerCapture(id)
}
const reset = () => { cancelPan(); scale.value = IMAGE_DEFAULTS.minScale; rotation.value = 0; panX.value = 0; panY.value = 0 }
const closePreview = () => { if (visible.value) { localVisible.value = false; emit('update:previewVisible', false); emit('close') } }
const modal = useModal(() => visible.value && sources.value.length > 0, panelRef, { closeOnPressEscape: () => true, lockScroll: () => true, onEscape: closePreview, zIndex: () => props.zIndex })
const showPreview = (index?: number) => {
  if (!canPreview.value) return
  const next = normalizeIndex(props.previewIndex ?? index ?? props.initialIndex ?? Math.max(0, sources.value.indexOf(image.src.value)))
  localIndex.value = next
  emit('update:previewIndex', next)
  reset()
  localVisible.value = true
  emit('update:previewVisible', true)
  emit('show', next)
}
const change = (step: number) => {
  if (!sources.value.length) return
  const next = (current.value + step + sources.value.length) % sources.value.length
  localIndex.value = next
  emit('update:previewIndex', next)
  emit('switch', next)
}
const setScale = (value: number) => {
  scale.value = Math.max(IMAGE_DEFAULTS.minScale, Math.min(IMAGE_DEFAULTS.maxScale, value))
  if (scale.value === IMAGE_DEFAULTS.minScale) { panX.value = 0; panY.value = 0 }
}
const zoom = (amount: number) => setScale(scale.value + amount)
const retryPreview = () => { reset(); previewImage.retry() }
const toolbar = computed<ImageToolbar>(() => ({ index: current.value, src: previewSource.value, scale: scale.value, rotation: rotation.value, zoomIn: () => zoom(IMAGE_DEFAULTS.zoomStep), zoomOut: () => zoom(-IMAGE_DEFAULTS.zoomStep), reset, close: closePreview }))
const keydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey
    || (event.target instanceof Element && event.target.closest(EDITABLE_TARGET_SELECTOR))) return
  if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1) }
  if (event.key === 'ArrowRight') { event.preventDefault(); change(1) }
  if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(IMAGE_DEFAULTS.zoomStep) }
  if (event.key === '-') { event.preventDefault(); zoom(-IMAGE_DEFAULTS.zoomStep) }
}
const distance = () => {
  const [first, second] = [...pointers.values()]
  return first && second ? Math.hypot(second.x - first.x, second.y - first.y) : 0
}
const panStart = (event: PointerEvent) => {
  if (!pointers.size) capturedClick = false
  if (!pointers.size && event.target !== previewRef.value) return
  if (event.button > 0 || pointers.size >= 2 || scale.value <= IMAGE_DEFAULTS.minScale && !(props.previewPinchZoom && event.pointerType === 'touch')) return
  if (pointers.size && (!props.previewPinchZoom || event.pointerType !== 'touch' || [...pointers.values()].some((point) => !point.touch))) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' })
  capturedClick = true
  stageRef.value?.setPointerCapture?.(event.pointerId)
  if (pointers.size === 2) {
    const value = distance()
    pinch = value > 0 ? { distance: value, scale: scale.value } : undefined
    panning.value = false
    return
  }
  panning.value = scale.value > IMAGE_DEFAULTS.minScale
  startX = event.clientX - panX.value
  startY = event.clientY - panY.value
}
const panMove = (event: PointerEvent) => {
  if (!pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' })
  if (props.previewPinchZoom && pinch && pointers.size === 2) { event.preventDefault(); setScale(pinch.scale * distance() / pinch.distance); return }
  if (panning.value) { event.preventDefault(); panX.value = event.clientX - startX; panY.value = event.clientY - startY }
}
const panEnd = (event: PointerEvent) => {
  if (!pointers.delete(event.pointerId)) return
  if (stageRef.value?.hasPointerCapture?.(event.pointerId)) stageRef.value.releasePointerCapture(event.pointerId)
  pinch = undefined
  const remaining = [...pointers.values()][0]
  panning.value = Boolean(remaining && scale.value > IMAGE_DEFAULTS.minScale)
  if (remaining) { startX = remaining.x - panX.value; startY = remaining.y - panY.value }
}
const lostPointer = (event: PointerEvent) => { if (pointers.has(event.pointerId)) cancelPan() }
const stageClick = (event: MouseEvent) => {
  if (capturedClick) { capturedClick = false; return }
  if (event.target === event.currentTarget && props.closeOnClickOverlay) closePreview()
}
const wheel = (event: WheelEvent) => {
  if (!props.previewWheelZoom || event.deltaY === 0) return
  event.preventDefault()
  zoom(event.deltaY < 0 ? IMAGE_DEFAULTS.zoomStep : -IMAGE_DEFAULTS.zoomStep)
}
watch([previewSource, current], reset)
watch(sources, () => { localIndex.value = normalizeIndex(localIndex.value); reset(); if (!sources.value.length) closePreview() })
watch(visible, () => { cancelPan(); capturedClick = false })
watch(() => props.previewPinchZoom, cancelPan)
watch(() => [props.previewIndex, props.initialIndex], (indices) => {
  if (indices.some((index) => index !== undefined && (!Number.isInteger(index) || index < 0))) throw new RangeError('[scq-vue] Image preview indices must be non-negative integers.')
}, { immediate: true })
onMounted(() => { mounted.value = true })
onBeforeUnmount(cancelPan)
defineExpose<ImageExpose>({ showPreview, closePreview, retry: image.retry, retryPreview, resetPreview: reset })
</script>