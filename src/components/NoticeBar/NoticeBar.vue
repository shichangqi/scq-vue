<template>
  <div v-if="visible" class="scq-notice-bar" :class="[`scq-notice-bar--${type}`, { 'is-wrap': wrap, 'is-scrollable': scrollable && !wrap, 'is-scrolling': scrolling, 'is-paused': isPaused }]" role="status" @click="emit('click', $event)">
    <Icon v-if="icon !== false" :name="icon || 'bell'" :size="NOTICE_BAR_DEFAULTS.iconSize" class="scq-notice-bar__icon" />
    <div ref="viewport" class="scq-notice-bar__viewport">
      <div ref="content" class="scq-notice-bar__content" :style="scrollStyle"><slot>{{ text }}</slot></div>
    </div>
    <button v-if="closable" type="button" class="scq-notice-bar__close" :aria-label="localeText('close')" @click.stop="close"><Icon name="close" :size="NOTICE_BAR_DEFAULTS.closeIconSize" /></button>
    <slot v-else name="right" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch, type CSSProperties, type PropType } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useLocale } from '../ConfigProvider/context'
import { NOTICE_BAR_DEFAULTS } from './constants'

export type NoticeBarType = 'info' | 'success' | 'warning' | 'danger'
export interface NoticeBarProps { modelValue?: boolean; text?: string; type?: NoticeBarType; icon?: IconName | false; closable?: boolean; wrap?: boolean; scrollable?: boolean; speed?: number; delay?: number; paused?: boolean }
export interface NoticeBarExpose { pause: () => void; resume: () => void; play: () => void; paused: boolean }
defineOptions({ name: 'NoticeBar' })
const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  paused: { type: Boolean, default: undefined },
  text: { type: String, default: '' },
  type: { type: String as PropType<NoticeBarType>, default: 'warning' },
  icon: { type: [String, Boolean] as PropType<IconName | false>, default: 'bell' },
  closable: { type: Boolean, default: false },
  wrap: { type: Boolean, default: true },
  scrollable: { type: Boolean, default: false },
  speed: { type: Number, default: NOTICE_BAR_DEFAULTS.speed },
  delay: { type: Number, default: NOTICE_BAR_DEFAULTS.delay },
})
const emit = defineEmits<{ (event: 'click' | 'close', value: MouseEvent): void; (event: 'update:modelValue' | 'update:paused', value: boolean): void }>()
const localeText = useLocale()
const localVisible = ref(true)
const closeRequested = ref(false)
const visible = computed(() => props.modelValue ?? localVisible.value)
const localPaused = ref(false)
const isPaused = computed(() => props.paused ?? localPaused.value)
const setPaused = (value: boolean) => { if (isPaused.value === value) return; localPaused.value = value; emit('update:paused', value) }
const pause = () => setPaused(true)
const resume = () => setPaused(false)
const viewport = ref<HTMLElement>()
const content = ref<HTMLElement>()
const distance = ref(0)
const scrolling = computed(() => props.scrollable && !props.wrap && distance.value > 0)
const scrollStyle = computed<CSSProperties>(() => {
  const speed = Number.isFinite(props.speed) && props.speed > 0 ? props.speed : NOTICE_BAR_DEFAULTS.speed
  const duration = Math.max(NOTICE_BAR_DEFAULTS.minDuration, distance.value / speed)
  if (!Number.isFinite(duration)) throw new RangeError('[scq-vue] NoticeBar scroll duration must be finite.')
  return {
    '--scq-notice-distance': `${-distance.value}px`,
    '--scq-notice-duration': `${duration}s`,
    '--scq-notice-delay': `${Number.isFinite(props.delay) ? Math.max(0, props.delay) : NOTICE_BAR_DEFAULTS.delay}ms`,
  }
})
let observer: ResizeObserver | undefined
const measure = () => { distance.value = Math.max(0, (content.value?.scrollWidth || 0) - (viewport.value?.clientWidth || 0)) }
const observe = () => {
  observer?.disconnect()
  measure()
  if (!visible.value) return
  if (viewport.value) observer?.observe(viewport.value)
  if (content.value) observer?.observe(content.value)
}
const close = (event: MouseEvent) => { if (!visible.value || closeRequested.value) return; closeRequested.value = true; localVisible.value = false; emit('update:modelValue', false); emit('close', event) }
watch(visible, (value) => { if (value) closeRequested.value = false; void nextTick(observe) })
watch(() => [props.text, props.wrap, props.scrollable], () => { void nextTick(measure) })
onUpdated(measure)
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
  }
  observe()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => { observer?.disconnect(); window.removeEventListener('resize', measure) })
defineExpose({ pause, resume, play: resume, paused: isPaused })
</script>