<template>
  <section class="scq-swipe" :class="{ 'is-vertical': vertical }" :style="{ '--scq-swipe-height': toCssLength(height), '--scq-swipe-gap': toCssLength(gap) }" :aria-label="ariaLabel || text('carousel')" aria-roledescription="carousel" @mouseenter="hovered = true" @mouseleave="hovered = false" @focusin="focused = true" @focusout="focusOut">
    <div ref="viewportRef" class="scq-swipe__viewport" :tabindex="isDisabled ? -1 : 0" @keydown="keydown">
      <div class="scq-swipe__track">
        <div v-for="(item, index) in items" :key="item.key ?? index" class="scq-swipe__slide" role="group" aria-roledescription="slide" :aria-label="`${index + 1} / ${items.length}`" :aria-hidden="index !== active" :inert="index !== active ? true : undefined"><div class="scq-swipe__content"><slot :item="item" :index="index" :active="index === active"><img v-if="item.src" :src="item.src" :alt="item.alt || ''" :loading="index === 0 ? 'eager' : 'lazy'" draggable="false" /><span v-else>{{ item.title }}</span></slot></div></div>
      </div>
    </div>
    <div v-if="showIndicators && items.length > 1" class="scq-swipe__indicators" :class="{ 'is-custom': $slots.indicators }"><slot name="indicators" :active="active" :count="items.length" :swipe-to="swipeTo"><button v-for="(_, index) in items" :key="index" type="button" :aria-label="`${text('page')} ${index + 1}`" :aria-current="index === active ? 'true' : undefined" :disabled="isDisabled" @click="swipeTo(index)" /></slot></div>
    <template v-if="showArrows && items.length > 1"><button class="scq-swipe__arrow scq-swipe__arrow--previous" type="button" :aria-label="text('previous')" :disabled="isDisabled || (!loop && active === 0)" @click="prev"><Icon :name="vertical ? 'chevronUp' : 'chevronLeft'" :size="SWIPE_ICON_SIZE" /></button><button class="scq-swipe__arrow scq-swipe__arrow--next" type="button" :aria-label="text('next')" :disabled="isDisabled || (!loop && active === items.length - 1)" @click="next"><Icon :name="vertical ? 'chevronDown' : 'chevronRight'" :size="SWIPE_ICON_SIZE" /></button></template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { toCssLength } from '../../utils/layout'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { MAX_TIMEOUT_DELAY } from '../../utils/async'
import { useUpdateFocus } from '../../utils/focus'

export interface SwipeItem { key?: string | number; src?: string; alt?: string; title?: string; [key: string]: unknown }
export interface SwipeProps { modelValue?: number; items?: readonly SwipeItem[]; loop?: boolean; autoplay?: number; pauseOnHover?: boolean; showIndicators?: boolean; showArrows?: boolean; height?: string | number; disabled?: boolean; ariaLabel?: string; vertical?: boolean; gap?: number }
export interface SwipeExpose { prev: () => void; next: () => void; swipeTo: (index: number) => void; pause: () => void; play: () => void; resume: () => void; paused: boolean }
const SWIPE_TIMING = { duration: 25, minimumAutoplay: 300 } as const
const SWIPE_ICON_SIZE = 20
defineOptions({ name: 'Swipe' })
const props = withDefaults(defineProps<SwipeProps>(), { items: () => [], loop: true, autoplay: 0, pauseOnHover: true, showIndicators: true, showArrows: false, height: 180, disabled: undefined, ariaLabel: '', vertical: false, gap: 0 })
watch(() => props.autoplay, value => {
  if (!Number.isFinite(value) || value > MAX_TIMEOUT_DELAY) throw new RangeError(`[scq-vue] Swipe autoplay must be finite and no greater than ${MAX_TIMEOUT_DELAY}.`)
}, { immediate: true, flush: 'sync' })
const emit = defineEmits<{ (event: 'update:modelValue' | 'change', value: number): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const normalizeIndex = (index: number) => Math.max(0, Math.min(props.items.length - 1, Number.isFinite(index) ? Math.trunc(index) : 0))
const active = ref(normalizeIndex(props.modelValue ?? 0))
const hovered = ref(false)
const focused = ref(false)
const dragging = ref(false)
const reducedMotion = ref(false)
const hidden = ref(false)
const manualPaused = ref(false)
const isPaused = computed(() => manualPaused.value || (props.pauseOnHover && hovered.value) || focused.value || dragging.value || hidden.value || reducedMotion.value || isDisabled.value)
const [viewportRef, api] = emblaCarouselVue(computed(() => ({ axis: props.vertical ? 'y' : 'x', loop: props.loop, watchDrag: !isDisabled.value, duration: reducedMotion.value ? 0 : SWIPE_TIMING.duration })))
let timer: ReturnType<typeof setTimeout> | undefined
let media: MediaQueryList | undefined
useUpdateFocus(() => viewportRef.value, (target, viewport) =>
  Boolean(viewport.querySelectorAll<HTMLElement>(':scope > .scq-swipe__track > .scq-swipe__slide')[active.value]?.contains(target)))
const clearTimer = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined }
const schedule = () => {
  clearTimer()
  if (!api.value || !Number.isFinite(props.autoplay) || props.autoplay <= 0 || props.items.length < 2 || isPaused.value) return
  timer = setTimeout(() => {
    if (api.value?.canScrollNext()) api.value.scrollNext()
    else api.value?.scrollTo(0)
    schedule()
  }, Math.max(SWIPE_TIMING.minimumAutoplay, props.autoplay))
}
const sync = () => {
  const index = normalizeIndex(api.value?.selectedScrollSnap() ?? 0)
  if (index !== active.value) { active.value = index; emit('update:modelValue', index); emit('change', index) }
  schedule()
}
const dragStart = () => { dragging.value = true }
const dragEnd = () => { dragging.value = false }
const pause = () => { manualPaused.value = true; clearTimer() }
const play = () => { manualPaused.value = false }
const swipeTo = (index: number) => { if (!isDisabled.value) api.value?.scrollTo(normalizeIndex(index)) }
const prev = () => { if (!isDisabled.value) api.value?.scrollPrev() }
const next = () => { if (!isDisabled.value) api.value?.scrollNext() }
const focusOut = (event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) focused.value = false }
const keydown = (event: KeyboardEvent) => {
  if (isDisabled.value || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey) return
  if (event.target !== event.currentTarget) return
  if (event.key === (props.vertical ? 'ArrowUp' : 'ArrowLeft')) { event.preventDefault(); prev() }
  if (event.key === (props.vertical ? 'ArrowDown' : 'ArrowRight')) { event.preventDefault(); next() }
  if (event.key === 'Home') { event.preventDefault(); swipeTo(0) }
  if (event.key === 'End') { event.preventDefault(); swipeTo(props.items.length - 1) }
}
const visibility = () => { hidden.value = document.hidden }
const motion = () => { reducedMotion.value = media?.matches ?? false }
watch(api, (value, previous) => {
  previous?.off('select', sync).off('reInit', sync).off('pointerDown', dragStart).off('pointerUp', dragEnd)
  value?.scrollTo(normalizeIndex(props.modelValue ?? active.value), true)
  value?.on('select', sync).on('reInit', sync).on('pointerDown', dragStart).on('pointerUp', dragEnd)
  sync()
})
watch(() => props.modelValue, (value) => { if (value !== undefined && value !== active.value) api.value?.scrollTo(normalizeIndex(value)) })
watch([() => props.vertical, () => props.gap], () => api.value?.reInit(), { flush: 'post' })
watch([isPaused, () => props.autoplay], schedule)
watch(() => props.items.length, () => {
  const index = normalizeIndex(active.value)
  if (index !== active.value) { active.value = index; api.value?.scrollTo(index, true); emit('update:modelValue', index); emit('change', index) }
  schedule()
})
onMounted(() => {
  if (typeof window.matchMedia === 'function') { media = window.matchMedia('(prefers-reduced-motion: reduce)'); media.addEventListener('change', motion); motion() }
  visibility()
  document.addEventListener('visibilitychange', visibility)
  schedule()
})
onBeforeUnmount(() => { clearTimer(); media?.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility) })
defineExpose({ prev, next, swipeTo, pause, play, resume: play, paused: isPaused })
</script>