<template>
  <div class="scq-loading" :class="{ 'has-content': $slots.default, 'is-loading': visible, 'is-nonblocking': !blocking || !loading }" :aria-busy="loading">
    <div v-if="$slots.default" ref="contentRef" class="scq-loading__content" :inert="(loading && blocking) || undefined"><slot /></div>
    <div v-if="visible" class="scq-loading__indicator" :role="loading ? 'status' : undefined" :aria-hidden="!loading || undefined" :aria-label="text || localeText('loading')">
      <slot name="indicator" :size="size" :loading="loading"><span class="scq-loading__spinner" :style="{ width: indicatorSize, height: indicatorSize }" aria-hidden="true"></span></slot>
      <span v-if="text" class="scq-loading__text">{{ text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { toCssLength } from '../../utils/layout'
import { useContentFocus } from '../../utils/focus'
export interface LoadingProps { loading?: boolean; text?: string; size?: number; delay?: number; minDuration?: number; blocking?: boolean }
defineOptions({ name: 'Loading' })
const props = withDefaults(defineProps<LoadingProps>(), { loading: true, text: '', size: 24, delay: 0, minDuration: 0, blocking: true })
const localeText = useLocale()
const duration = (value: number) => {
  if (!Number.isFinite(value)) throw new RangeError('[scq-vue] Loading timings must be finite.')
  return Math.max(0, value)
}
const timings = computed(() => ({ delay: duration(props.delay), minimum: duration(props.minDuration) }))
const indicatorSize = computed(() => toCssLength(props.size))
const contentRef = ref<HTMLElement>()
const visible = ref(props.loading && timings.value.delay === 0)
useContentFocus(() => contentRef.value, () => props.loading && props.blocking)
let timer: ReturnType<typeof setTimeout> | undefined
let shownAt = 0
let mounted = false
const clearTimer = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined }
const sync = () => {
  clearTimer()
  if (!mounted) { visible.value = props.loading && timings.value.delay === 0; return }
  if (props.loading) {
    if (visible.value) return
    const show = () => { timer = undefined; visible.value = true; shownAt = Date.now() }
    if (timings.value.delay) timer = setTimeout(show, timings.value.delay)
    else show()
  } else if (visible.value) {
    const remaining = Math.max(0, timings.value.minimum - (Date.now() - shownAt))
    const hide = () => { timer = undefined; visible.value = false }
    if (remaining) timer = setTimeout(hide, remaining)
    else hide()
  }
}
watch([() => props.loading, timings], sync, { flush: 'sync' })
onMounted(() => { mounted = true; if (visible.value) shownAt = Date.now(); sync() })
onBeforeUnmount(() => { mounted = false; clearTimer() })
</script>