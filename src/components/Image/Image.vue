<template>
  <div class="scq-image" :style="{ width: length(width), height: length(height) }" :aria-busy="pending">
    <img v-if="!failed && src" ref="imageRef" :src="src" :alt="alt" :loading="loading" :crossorigin="crossorigin" :referrerpolicy="referrerpolicy" :style="{ objectFit: fit, objectPosition: position, opacity: pending ? 0 : 1 }" @load="loaded" @error="error" />
    <div v-if="pending" class="scq-image__placeholder" role="status"><slot name="placeholder"><Icon name="image" :size="26" /><span>{{ text('loading') }}</span></slot></div>
    <div v-else-if="failed || !src" class="scq-image__placeholder is-error" role="img" :aria-label="alt || text('imageError')"><slot name="error"><Icon name="image" :size="26" /><span>{{ text('imageError') }}</span></slot></div>
    <button v-if="canPreview" type="button" class="scq-image__preview-trigger" :aria-label="`${text('preview')} ${alt}`" @click="showPreview()" />
    <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="teleport === false">
      <div v-if="mounted && visible && sources.length" ref="panelRef" class="scq-image-viewer" role="dialog" aria-modal="true" :aria-label="alt || text('preview')" tabindex="-1" :style="{ ...themeStyle, zIndex: zIndex ?? modal.zIndex.value }" @keydown="keydown" @click.self="closeOnClickOverlay && closePreview()">
        <button type="button" class="scq-image-viewer__close" :aria-label="text('close')" :title="text('close')" @click="closePreview"><Icon name="close" :size="22" /></button>
        <div class="scq-image-viewer__stage" @pointerdown="panStart" @pointermove="panMove" @pointerup="panning = false" @pointercancel="panning = false" @click.self="closeOnClickOverlay && closePreview()"><img :key="sources[current]" :src="sources[current]" :alt="alt" draggable="false" :style="{ transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${scale})`, cursor: scale > 1 ? 'grab' : 'default' }" @error="emit('preview-error', $event)" /></div>
        <button v-if="sources.length > 1" type="button" class="scq-image-viewer__previous" :aria-label="text('previous')" :title="text('previous')" @click="change(-1)"><Icon name="chevronLeft" :size="24" /></button><button v-if="sources.length > 1" type="button" class="scq-image-viewer__next" :aria-label="text('next')" :title="text('next')" @click="change(1)"><Icon name="chevronRight" :size="24" /></button>
        <div class="scq-image-viewer__toolbar"><span aria-live="polite">{{ current + 1 }} / {{ sources.length }}</span><button type="button" :aria-label="text('zoomOut')" :title="text('zoomOut')" :disabled="scale <= 1" @click="zoom(-.25)"><Icon name="minus" :size="20" /></button><output>{{ Math.round(scale * 100) }}%</output><button type="button" :aria-label="text('zoomIn')" :title="text('zoomIn')" :disabled="scale >= 5" @click="zoom(.25)"><Icon name="plus" :size="20" /></button><button type="button" :aria-label="text('rotate')" :title="text('rotate')" @click="rotation += 90"><Icon name="refresh" :size="20" /></button></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, useThemeStyle } from '../ConfigProvider/context'
import { useModal } from '../../utils/modal'

defineOptions({ name: 'Image' })
const props = withDefaults(defineProps<{ src?: string; alt?: string; width?: string | number; height?: string | number; fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'; position?: string; loading?: 'lazy' | 'eager'; crossorigin?: '' | 'anonymous' | 'use-credentials'; referrerpolicy?: ReferrerPolicy; preview?: boolean; previewVisible?: boolean; previewSrcList?: string[]; initialIndex?: number; disabled?: boolean; teleport?: boolean | string; zIndex?: number; closeOnClickOverlay?: boolean }>(), { src: '', alt: '', width: '100%', height: 200, fit: 'cover', position: 'center', loading: 'lazy', preview: false, previewVisible: undefined, previewSrcList: () => [], disabled: undefined, teleport: true, closeOnClickOverlay: true })
const emit = defineEmits<{
  (event: 'load' | 'error' | 'preview-error', value: Event): void
  (event: 'update:previewVisible', value: boolean): void
  (event: 'show' | 'switch', index: number): void
  (event: 'close'): void
}>()
const text = useLocale()
const config = useConfig()
const themeStyle = useThemeStyle()
const imageRef = ref<HTMLImageElement>()
const panelRef = ref<HTMLElement>()
const mounted = ref(false)
const pending = ref(Boolean(props.src))
const failed = ref(false)
const localVisible = ref(false)
const visible = computed(() => props.previewVisible ?? localVisible.value)
const sources = computed(() => props.previewSrcList.length ? props.previewSrcList : props.src ? [props.src] : [])
const current = ref(0)
const scale = ref(1)
const rotation = ref(0)
const panX = ref(0)
const panY = ref(0)
const panning = ref(false)
let startX = 0
let startY = 0
const canPreview = computed(() => !(props.disabled ?? config.value.disabled) && !pending.value && !failed.value && Boolean(props.preview || props.previewSrcList.length) && sources.value.length > 0)
const length = (value: string | number) => typeof value === 'number' ? `${Math.max(0, value)}px` : value
const reset = () => { scale.value = 1; rotation.value = 0; panX.value = 0; panY.value = 0; panning.value = false }
const closePreview = () => { if (visible.value) { localVisible.value = false; emit('update:previewVisible', false); emit('close') } }
const modal = useModal(() => visible.value && sources.value.length > 0, panelRef, { closeOnPressEscape: () => true, lockScroll: () => true, onEscape: closePreview, zIndex: () => props.zIndex })
const showPreview = (index?: number) => {
  if (!canPreview.value) return
  current.value = Math.max(0, Math.min(sources.value.length - 1, index ?? props.initialIndex ?? Math.max(0, sources.value.indexOf(props.src))))
  reset()
  localVisible.value = true
  emit('update:previewVisible', true)
  emit('show', current.value)
}
const change = (step: number) => { current.value = (current.value + step + sources.value.length) % sources.value.length; reset(); emit('switch', current.value) }
const zoom = (amount: number) => { scale.value = Math.max(1, Math.min(5, scale.value + amount)); if (scale.value === 1) { panX.value = 0; panY.value = 0 } }
const loaded = (event: Event) => { pending.value = false; failed.value = false; emit('load', event) }
const error = (event: Event) => { pending.value = false; failed.value = true; emit('error', event) }
const keydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1) }
  if (event.key === 'ArrowRight') { event.preventDefault(); change(1) }
  if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(.25) }
  if (event.key === '-') { event.preventDefault(); zoom(-.25) }
}
const panStart = (event: PointerEvent) => {
  if (scale.value <= 1 || event.button > 0) return
  panning.value = true
  startX = event.clientX - panX.value
  startY = event.clientY - panY.value
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}
const panMove = (event: PointerEvent) => { if (panning.value) { panX.value = event.clientX - startX; panY.value = event.clientY - startY } }
watch(() => props.src, () => { pending.value = Boolean(props.src); failed.value = false })
watch(sources, () => { current.value = Math.max(0, Math.min(current.value, sources.value.length - 1)); reset(); if (!sources.value.length) closePreview() })
onMounted(() => { mounted.value = true; if (imageRef.value?.complete && imageRef.value.naturalWidth > 0) pending.value = false })
defineExpose({ showPreview, closePreview })
</script>