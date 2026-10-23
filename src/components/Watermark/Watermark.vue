<template>
  <div ref="wrapperRef" class="scq-watermark" :style="rootStyle">
    <div class="scq-watermark__content" :style="{ position: 'relative', zIndex: 0 }"><slot /></div>
    <Teleport :to="host || 'body'" :disabled="!mounted || host === wrapperRef">
      <div ref="layerRef" class="scq-watermark__layer" :class="{ 'is-fullscreen': fullscreen, 'is-print-hidden': !print }" :style="layerStyle" aria-hidden="true"></div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useLatestRequest } from '../../utils/async'
import { WATERMARK_DEFAULTS } from './constants'
import { loadWatermarkImage } from './image'
import type { WatermarkProps, WatermarkRenderEvent } from './types'

defineOptions({ name: 'Watermark' })
const props = withDefaults(defineProps<WatermarkProps>(), {
  content: WATERMARK_DEFAULTS.content, color: WATERMARK_DEFAULTS.color,
  gap: WATERMARK_DEFAULTS.gap, size: WATERMARK_DEFAULTS.size,
  rotate: WATERMARK_DEFAULTS.rotate, zIndex: WATERMARK_DEFAULTS.zIndex,
  fontFamily: WATERMARK_DEFAULTS.fontFamily, fontWeight: WATERMARK_DEFAULTS.fontWeight,
  image: '', imageSize: () => [...WATERMARK_DEFAULTS.imageSize],
  imageOpacity: WATERMARK_DEFAULTS.imageOpacity, offset: () => [0, 0],
  fullscreen: false, print: true,
})
const emit = defineEmits<{
  (event: 'redraw' | 'restore', value: WatermarkRenderEvent): void
  (event: 'error', error: unknown): void
}>()
const wrapperRef = ref<HTMLElement>()
const layerRef = ref<HTMLElement>()
const mounted = ref(false)
const imageData = ref('')
let observer: MutationObserver | undefined
const imageRequest = useLatestRequest<string>((value) => { imageData.value = value }, (error) => emit('error', error))
const rootStyle: CSSProperties = { position: 'relative', display: 'block', overflow: 'hidden', isolation: 'isolate' }
const host = computed(() => {
  if (!mounted.value || !wrapperRef.value) return undefined
  if (props.container) {
    const target = typeof props.container === 'string' ? wrapperRef.value.ownerDocument.querySelector(props.container) : props.container
    if (!(target instanceof HTMLElement) || !target.isConnected) throw new Error('[scq-vue] Watermark container must resolve to a connected HTMLElement.')
    return target
  }
  return props.fullscreen ? wrapperRef.value.ownerDocument.body : wrapperRef.value
})
const gapPair = computed(() => typeof props.gap === 'number' ? [props.gap, props.gap] : props.gap)
const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const backgroundImage = computed(() => {
  const lines = (typeof props.content === 'string' ? [props.content] : props.content).flatMap((line) => line.split('\n'))
  const hasText = lines.some((line) => line.length > 0)
  const lineHeight = props.lineHeight ?? props.size * WATERMARK_DEFAULTS.lineHeightRatio
  const textHeight = hasText ? props.size + (lines.length - 1) * lineHeight : 0
  const imageHeight = imageData.value ? props.imageSize[1] : 0
  const contentHeight = textHeight + imageHeight + (textHeight && imageHeight ? WATERMARK_DEFAULTS.imageGap : 0)
  const width = Math.max(gapPair.value[0], props.size * WATERMARK_DEFAULTS.minimumWidthRatio, imageData.value ? props.imageSize[0] : 0)
  const height = Math.max(gapPair.value[1], props.size * WATERMARK_DEFAULTS.minimumHeightRatio, contentHeight)
  const centerY = imageData.value
    ? (height - contentHeight) / 2 + imageHeight + (hasText ? WATERMARK_DEFAULTS.imageGap + props.size / 2 : 0)
    : height / 2 - ((lines.length - 1) * lineHeight) / 2
  const image = imageData.value ? `<image href="${escapeXml(imageData.value)}" x="${(width - props.imageSize[0]) / 2}" y="${(height - contentHeight) / 2}" width="${props.imageSize[0]}" height="${props.imageSize[1]}" opacity="${props.imageOpacity}" />` : ''
  const content = hasText ? `<text x="50%" y="${centerY}" text-anchor="middle" dominant-baseline="middle" fill="${escapeXml(props.color)}" font-family="${escapeXml(props.fontFamily)}" font-size="${props.size}" font-weight="${escapeXml(String(props.fontWeight))}">${lines.map((line, index) => `<tspan x="50%" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join('')}</text>` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g transform="rotate(${props.rotate} ${width / 2} ${height / 2})">${image}${content}</g></svg>`
  const encoded = encodeURIComponent(svg).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
  return `url("data:image/svg+xml;charset=UTF-8,${encoded}")`
})
const layerStyle = computed<CSSProperties>(() => ({
  position: props.fullscreen ? 'fixed' : 'absolute', inset: '0',
  zIndex: String(Math.trunc(props.zIndex)),
  pointerEvents: 'none', userSelect: 'none', backgroundRepeat: 'repeat',
  backgroundPosition: `${props.offset[0]}px ${props.offset[1]}px`,
  backgroundSize: `${gapPair.value[0]}px ${gapPair.value[1]}px`,
  backgroundImage: backgroundImage.value,
}))
const observe = () => {
  if (!observer || !host.value || !layerRef.value || !wrapperRef.value) return
  observer.observe(host.value, { childList: true })
  observer.observe(layerRef.value, { childList: true, attributes: true, attributeFilter: ['class', 'style', 'aria-hidden', 'hidden'] })
  observer.observe(wrapperRef.value, { childList: host.value === wrapperRef.value, attributes: true, attributeFilter: ['class', 'style'] })
}
const synchronize = (restoring: boolean) => {
  const layer = layerRef.value, wrapper = wrapperRef.value, target = host.value
  if (!mounted.value || !layer || !wrapper || !target) return
  observer?.disconnect()
  let changed = false
  if (layer.parentElement !== target) { target.appendChild(layer); changed = true }
  if (layer.childNodes.length) { layer.replaceChildren(); changed = true }
  const expected = target.ownerDocument.createElement('div')
  Object.assign(expected.style, layerStyle.value)
  if (layer.style.cssText !== expected.style.cssText) { layer.style.cssText = expected.style.cssText; changed = true }
  const classes = ['scq-watermark__layer', ...(props.fullscreen ? ['is-fullscreen'] : []), ...(!props.print ? ['is-print-hidden'] : [])].join(' ')
  if (layer.className !== classes) { layer.className = classes; changed = true }
  if (layer.getAttribute('aria-hidden') !== 'true') { layer.setAttribute('aria-hidden', 'true'); changed = true }
  if (layer.hasAttribute('hidden')) { layer.removeAttribute('hidden'); changed = true }
  if (!wrapper.classList.contains('scq-watermark')) { wrapper.classList.add('scq-watermark'); changed = true }
  for (const [key, value] of Object.entries(rootStyle)) {
    if (wrapper.style.getPropertyValue(key) !== value) { wrapper.style.setProperty(key, String(value)); changed = true }
  }
  observe()
  const payload = { container: target, fullscreen: props.fullscreen, imageLoaded: Boolean(imageData.value) }
  if (!restoring) emit('redraw', payload)
  else if (changed) emit('restore', payload)
}
watch([host, layerStyle, layerRef, () => props.print], () => synchronize(false), { flush: 'post' })
watch(() => props.image, (source) => {
  imageRequest.cancel()
  imageData.value = ''
  if (mounted.value && source) void imageRequest.run((signal) => loadWatermarkImage(source, signal))
})
watch(() => [props.size, props.gap, props.offset, props.rotate, props.lineHeight, props.imageSize, props.imageOpacity, props.zIndex], () => {
  if (gapPair.value.length !== 2 || props.offset.length !== 2 || props.imageSize.length !== 2
    || !gapPair.value.every((value) => Number.isFinite(value) && value > 0)
    || !props.offset.every(Number.isFinite) || !Number.isFinite(props.rotate) || !Number.isFinite(props.zIndex)
    || !Number.isFinite(props.size) || props.size <= 0
    || props.lineHeight !== undefined && (!Number.isFinite(props.lineHeight) || props.lineHeight <= 0)
    || !props.imageSize.every((value) => Number.isFinite(value) && value > 0)
    || !Number.isFinite(props.imageOpacity) || props.imageOpacity < 0 || props.imageOpacity > 1) {
    throw new RangeError('[scq-vue] Watermark requires positive dimensions/lineHeight, finite offsets/rotation/zIndex and imageOpacity between zero and one.')
  }
}, { immediate: true, deep: true })
onMounted(() => {
  observer = new MutationObserver((records) => {
    const layer = layerRef.value
    if (layer && records.some((record) => record.target === layer || record.type === 'attributes' && record.target === wrapperRef.value || [...record.removedNodes].includes(layer))) synchronize(true)
  })
  mounted.value = true
  if (props.image) void imageRequest.run((signal) => loadWatermarkImage(props.image, signal))
})
onBeforeUnmount(() => { mounted.value = false; observer?.disconnect(); observer = undefined; imageRequest.cancel() })
defineExpose({ redraw: () => synchronize(false), pending: imageRequest.pending })
</script>

<style>
.scq-watermark { position: relative; display: block; overflow: hidden; isolation: isolate; }
.scq-watermark__content { position: relative; z-index: 0; }
.scq-watermark__layer { position: absolute; inset: 0; z-index: 1; pointer-events: none; user-select: none; background-repeat: repeat; background-position: 0 0; }
.scq-watermark__layer.is-fullscreen { position: fixed; }
@media print {
  .scq-watermark__layer { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .scq-watermark__layer.is-print-hidden { display: none !important; }
}
</style>
