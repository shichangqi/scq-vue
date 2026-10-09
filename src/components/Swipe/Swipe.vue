<template>
  <section class="scq-swipe" :style="{ '--scq-swipe-height': typeof height === 'number' ? `${height}px` : height }" :aria-label="ariaLabel || text('carousel')" aria-roledescription="carousel" @mouseenter="hovered = pauseOnHover" @mouseleave="hovered = false" @focusin="focused = true" @focusout="focusOut">
    <div ref="viewportRef" class="scq-swipe__viewport" :tabindex="isDisabled ? -1 : 0" @keydown="keydown">
      <div class="scq-swipe__track">
        <div v-for="(item, index) in items" :key="item.key ?? index" class="scq-swipe__slide" role="group" aria-roledescription="slide" :aria-label="`${index + 1} / ${items.length}`" :aria-hidden="index !== active" :inert="index !== active ? true : undefined"><slot :item="item" :index="index" :active="index === active"><img v-if="item.src" :src="item.src" :alt="item.alt || ''" :loading="index === 0 ? 'eager' : 'lazy'" draggable="false" /><span v-else>{{ item.title }}</span></slot></div>
      </div>
    </div>
    <div v-if="showIndicators && items.length > 1" class="scq-swipe__indicators"><button v-for="(_, index) in items" :key="index" type="button" :aria-label="`${text('page')} ${index + 1}`" :aria-current="index === active ? 'true' : undefined" :disabled="isDisabled" @click="swipeTo(index)" /></div>
    <template v-if="showArrows && items.length > 1"><button class="scq-swipe__arrow scq-swipe__arrow--previous" type="button" :aria-label="text('previous')" :disabled="isDisabled || (!loop && active === 0)" @click="prev"><Icon name="chevronLeft" :size="20" /></button><button class="scq-swipe__arrow scq-swipe__arrow--next" type="button" :aria-label="text('next')" :disabled="isDisabled || (!loop && active === items.length - 1)" @click="next"><Icon name="chevronRight" :size="20" /></button></template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'

export interface SwipeItem { key?: string | number; src?: string; alt?: string; title?: string; [key: string]: unknown }
defineOptions({ name: 'Swipe' })
const props = withDefaults(defineProps<{ modelValue?: number; items?: SwipeItem[]; loop?: boolean; autoplay?: number; pauseOnHover?: boolean; showIndicators?: boolean; showArrows?: boolean; height?: string | number; disabled?: boolean; ariaLabel?: string }>(), { items: () => [], loop: true, autoplay: 0, pauseOnHover: true, showIndicators: true, showArrows: false, height: 180, disabled: undefined, ariaLabel: '' })
const emit = defineEmits<{ (event: 'update:modelValue' | 'change', value: number): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const active = ref(props.modelValue ?? 0)
const hovered = ref(false)
const focused = ref(false)
const dragging = ref(false)
const reducedMotion = ref(false)
const hidden = ref(false)
const [viewportRef, api] = emblaCarouselVue(computed(() => ({ loop: props.loop, startIndex: props.modelValue ?? 0, watchDrag: !isDisabled.value, duration: reducedMotion.value ? 0 : 25 })))
let timer: ReturnType<typeof setTimeout> | undefined
let media: MediaQueryList | undefined
const clearTimer = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined }
const schedule = () => {
  clearTimer()
  if (!api.value || props.autoplay <= 0 || props.items.length < 2 || hovered.value || focused.value || dragging.value || hidden.value || reducedMotion.value || isDisabled.value) return
  timer = setTimeout(() => {
    if (api.value?.canScrollNext()) api.value.scrollNext()
    else api.value?.scrollTo(0)
    schedule()
  }, Math.max(300, props.autoplay))
}
const sync = () => {
  const index = api.value?.selectedScrollSnap() ?? 0
  if (index !== active.value) { active.value = index; emit('update:modelValue', index); emit('change', index) }
  schedule()
}
const pause = () => { dragging.value = true }
const resume = () => { dragging.value = false }
const swipeTo = (index: number) => { if (!isDisabled.value) api.value?.scrollTo(Math.max(0, Math.min(props.items.length - 1, Math.trunc(index)))) }
const prev = () => { if (!isDisabled.value) api.value?.scrollPrev() }
const next = () => { if (!isDisabled.value) api.value?.scrollNext() }
const focusOut = (event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) focused.value = false }
const keydown = (event: KeyboardEvent) => {
  if (event.target !== event.currentTarget) return
  if (event.key === 'ArrowLeft') { event.preventDefault(); prev() }
  if (event.key === 'ArrowRight') { event.preventDefault(); next() }
  if (event.key === 'Home') { event.preventDefault(); swipeTo(0) }
  if (event.key === 'End') { event.preventDefault(); swipeTo(props.items.length - 1) }
}
const visibility = () => { hidden.value = document.hidden }
const motion = () => { reducedMotion.value = media?.matches ?? false }
watch(api, (value, previous) => {
  previous?.off('select', sync).off('reInit', sync).off('pointerDown', pause).off('pointerUp', resume)
  value?.on('select', sync).on('reInit', sync).on('pointerDown', pause).on('pointerUp', resume)
  sync()
})
watch(() => props.modelValue, (value) => { if (value !== undefined && value !== active.value) swipeTo(value) })
watch([hovered, focused, dragging, hidden, reducedMotion, isDisabled, () => props.autoplay], schedule)
onMounted(() => {
  if (typeof window.matchMedia === 'function') { media = window.matchMedia('(prefers-reduced-motion: reduce)'); media.addEventListener('change', motion); motion() }
  visibility()
  document.addEventListener('visibilitychange', visibility)
  schedule()
})
onBeforeUnmount(() => { clearTimer(); media?.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility) })
defineExpose({ prev, next, swipeTo })
</script>