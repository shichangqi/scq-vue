<template>
  <div v-if="visible" class="scq-notice-bar" :class="[`scq-notice-bar--${type}`, { 'is-wrap': wrap, 'is-scrollable': scrollable && !wrap, 'is-scrolling': scrolling }]" role="status" @click="emit('click', $event)">
    <Icon v-if="icon !== false" :name="icon || 'bell'" :size="18" class="scq-notice-bar__icon" />
    <div ref="viewport" class="scq-notice-bar__viewport">
      <div ref="content" class="scq-notice-bar__content" :style="scrollStyle"><slot>{{ text }}</slot></div>
    </div>
    <button v-if="closable" type="button" class="scq-notice-bar__close" :aria-label="localeText('close')" @click.stop="close"><Icon name="close" :size="16" /></button>
    <slot v-else name="right" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch, type CSSProperties, type PropType } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useLocale } from '../ConfigProvider/context'

export type NoticeBarType = 'info' | 'success' | 'warning' | 'danger'
defineOptions({ name: 'NoticeBar' })
const props = defineProps({
  text: { type: String, default: '' },
  type: { type: String as PropType<NoticeBarType>, default: 'warning' },
  icon: { type: [String, Boolean] as PropType<IconName | false>, default: 'bell' },
  closable: { type: Boolean, default: false },
  wrap: { type: Boolean, default: true },
  scrollable: { type: Boolean, default: false },
  speed: { type: Number, default: 40 },
  delay: { type: Number, default: 1000 },
})
const emit = defineEmits<{ (event: 'click' | 'close', value: MouseEvent): void }>()
const localeText = useLocale()
const visible = ref(true)
const viewport = ref<HTMLElement>()
const content = ref<HTMLElement>()
const distance = ref(0)
const scrolling = computed(() => props.scrollable && !props.wrap && distance.value > 0)
const scrollStyle = computed(() => ({
  '--scq-notice-distance': `${-distance.value}px`,
  '--scq-notice-duration': `${Math.max(2, distance.value / (Number.isFinite(props.speed) && props.speed > 0 ? props.speed : 40))}s`,
  '--scq-notice-delay': `${Number.isFinite(props.delay) ? Math.max(0, props.delay) : 1000}ms`,
}) as CSSProperties)
let observer: ResizeObserver | undefined
const measure = () => { distance.value = Math.max(0, (content.value?.scrollWidth || 0) - (viewport.value?.clientWidth || 0)) }
const close = (event: MouseEvent) => { visible.value = false; observer?.disconnect(); emit('close', event) }
watch(() => [props.text, props.wrap, props.scrollable], () => { void nextTick(measure) })
onUpdated(measure)
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (viewport.value) observer.observe(viewport.value)
    if (content.value) observer.observe(content.value)
  }
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => { observer?.disconnect(); window.removeEventListener('resize', measure) })
</script>