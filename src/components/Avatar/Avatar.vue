<template>
  <span ref="rootRef" class="scq-avatar" :class="`scq-avatar--${shape}`" :style="avatarStyle" :role="fallback() === 'image' || !hasFallbackName() ? undefined : 'img'" :aria-label="fallback() === 'image' ? undefined : alt || text || undefined">
    <img v-if="fallback() === 'image'" ref="imageRef" :key="image.key.value" :data-image-key="image.key.value" :src="image.src.value || undefined" :srcset="image.srcset.value" :sizes="image.sizes.value" :alt="alt || text" :loading="loading" :style="{ objectFit: fit }" @error="image.error" @load="image.loaded" />
    <span v-else-if="fallback() === 'slot' || fallback() === 'text'" ref="textRef" class="scq-avatar__text" :style="{ transform: `scale(${textScale})` }"><slot v-if="fallback() === 'slot'" /><template v-else>{{ text }}</template></span>
    <Icon v-else-if="fallback() === 'icon'" :name="icon" :size="Math.round(pixelSize * AVATAR_DEFAULTS.iconRatio)" />
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useSlots, watch, type CSSProperties } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig } from '../ConfigProvider/context'
import { useImageSource } from '../../utils/image-source'
import { hasSlotContent } from '../../utils/slots'
import { AVATAR_DEFAULTS } from './constants'
import type { AvatarProps } from './types'

defineOptions({ name: 'Avatar' })
const props = withDefaults(defineProps<AvatarProps>(), { src: '', alt: '', text: '', shape: 'circle', fit: 'cover', icon: 'user', loading: 'lazy', autoSize: true, gap: AVATAR_DEFAULTS.gap, fallbackOrder: () => [...AVATAR_DEFAULTS.fallbackOrder] })
const emit = defineEmits<{ (event: 'error' | 'load', value: Event): void }>()
const config = useConfig()
const slots = useSlots()
const attrs = useAttrs()
const rootRef = ref<HTMLElement>()
const textRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()
const textScale = ref(1)
let observer: ResizeObserver | undefined
let listening = false
const image = useImageSource(() => ({ src: props.src, srcset: props.srcset, sizes: props.sizes, fallbackSrc: props.fallbackSrc }), () => imageRef.value,
  (event) => emit('load', event), (event) => emit('error', event))
const fallback = () => props.fallbackOrder.find((kind) =>
  kind === 'image' ? image.available.value : kind === 'slot' ? hasSlotContent(slots.default?.() ?? []) : kind === 'text' ? Boolean(props.text) : Boolean(props.icon))
const hasFallbackName = () => Boolean(props.alt || props.text || attrs['aria-label'] || attrs['aria-labelledby'])
const pixelSize = computed(() => {
  const size = props.size ?? config.value.size
  return typeof size === 'number' ? Number.isFinite(size) && size > 0 ? size : AVATAR_DEFAULTS.sizes.default : AVATAR_DEFAULTS.sizes[size]
})
const avatarStyle = computed<CSSProperties>(() => ({ '--scq-avatar-size': `${pixelSize.value}px`, fontSize: `${Math.round(pixelSize.value * AVATAR_DEFAULTS.fontRatio)}px` }))
const measure = () => {
  const available = Math.max(0, (rootRef.value?.clientWidth || pixelSize.value) - props.gap * 2)
  const width = textRef.value?.scrollWidth ?? 0
  textScale.value = props.autoSize && width > 0 ? Math.min(1, available / width) : 1
}
watch(textRef, (element, previous) => {
  if (previous) observer?.unobserve(previous)
  if (element) observer?.observe(element)
  measure()
}, { flush: 'post' })
watch(() => [props.gap, props.autoSize, props.text, pixelSize.value], () => { void nextTick(measure) })
watch(() => [props.gap, props.fallbackOrder], () => {
  if (!Number.isFinite(props.gap) || props.gap < 0 || !props.fallbackOrder.every((kind) => AVATAR_DEFAULTS.fallbackOrder.includes(kind))) {
    throw new RangeError('[scq-vue] Avatar requires a non-negative gap and a valid fallbackOrder.')
  }
}, { immediate: true, deep: true })
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (rootRef.value) observer.observe(rootRef.value)
    if (textRef.value) observer.observe(textRef.value)
  } else { window.addEventListener('resize', measure); listening = true }
  measure()
})
onUpdated(measure)
onBeforeUnmount(() => { observer?.disconnect(); if (listening) window.removeEventListener('resize', measure) })
defineExpose({ retry: image.retry })
</script>