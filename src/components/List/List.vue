<template>
  <div ref="listRef" class="scq-list" :aria-busy="loading || pending || retrying">
    <slot />
    <div ref="sentinelRef" class="scq-list__sentinel" aria-hidden="true" />
    <div ref="statusRef" class="scq-list__status" role="status" aria-live="polite" tabindex="-1">
      <slot v-if="loading" name="loading">{{ loadingText || text('loading') }}</slot>
      <slot v-else-if="finished" name="finished">{{ finishedText || text('finished') }}</slot>
      <button v-else-if="error" type="button" :disabled="disabled || pending || retrying" @click="retry"><slot name="error">{{ errorText || text('retry') }}</slot></button>
      <button v-else type="button" :disabled="disabled || pending || retrying" @click="load">{{ text('loadMore') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useContentFocus } from '../../utils/focus'
import { getScrollParent, isScrollWindow } from '../../utils/scroll'

defineOptions({ name: 'List' })
const props = withDefaults(defineProps<{
  loading?: boolean
  finished?: boolean
  error?: boolean
  disabled?: boolean
  offset?: number
  immediateCheck?: boolean
  loadingText?: string
  finishedText?: string
  errorText?: string
}>(), { loading: false, finished: false, error: false, disabled: undefined, offset: 100, immediateCheck: true })
const emit = defineEmits<{
  (event: 'update:loading' | 'update:error', value: boolean): void
  (event: 'load'): void
}>()
const text = useLocale()
const config = useConfig()
const disabled = computed(() => props.disabled ?? config.value.disabled)
const listRef = ref<HTMLElement>()
const sentinelRef = ref<HTMLElement>()
const statusRef = ref<HTMLElement>()
const pending = ref(false)
const retrying = ref(false)
useContentFocus(() => statusRef.value, () => props.loading || pending.value || retrying.value,
  () => statusRef.value?.querySelector<HTMLButtonElement>('button:not(:disabled)') || statusRef.value)
let scrollTarget: HTMLElement | Window | undefined
let observer: ResizeObserver | undefined
let disposed = false

const bindScrollParent = () => {
  if (!listRef.value || disposed) return
  const target = getScrollParent(listRef.value)
  if (target === scrollTarget) return
  scrollTarget?.removeEventListener('scroll', check)
  scrollTarget = target
  scrollTarget.addEventListener('scroll', check, { passive: true })
}

const load = () => {
  if (disposed || pending.value || retrying.value || props.loading || props.finished || props.error || disabled.value) return
  pending.value = true
  emit('update:loading', true)
  if (disposed) return
  emit('load')
  void nextTick(() => { if (!props.loading) pending.value = false })
}
const check = () => {
  if (disposed) return
  bindScrollParent()
  if (!sentinelRef.value || !scrollTarget) return
  const rect = sentinelRef.value.getBoundingClientRect()
  if (!rect.width && !rect.height) return
  const bottom = isScrollWindow(scrollTarget) ? scrollTarget.innerHeight : scrollTarget.getBoundingClientRect().bottom
  if (rect.top <= bottom + Math.max(0, props.offset)) load()
}
const retry = async () => {
  if (disposed || disabled.value || props.loading || props.finished || pending.value || retrying.value) return
  retrying.value = true
  emit('update:error', false)
  await nextTick()
  retrying.value = false
  load()
}
watch(() => props.offset, offset => {
  if (!Number.isFinite(offset)) throw new RangeError('[scq-vue] List offset must be finite.')
  if (scrollTarget) void nextTick(check)
}, { immediate: true, flush: 'sync' })
watch(() => [props.loading, props.error, props.finished, disabled.value], async () => {
  pending.value = false
  await nextTick()
  check()
})
onMounted(async () => {
  bindScrollParent()
  window.addEventListener('resize', check)
  if (typeof ResizeObserver !== 'undefined' && listRef.value) {
    observer = new ResizeObserver(check)
    observer.observe(listRef.value)
  }
  await nextTick()
  if (props.immediateCheck) check()
})
onBeforeUnmount(() => {
  disposed = true
  scrollTarget?.removeEventListener('scroll', check)
  window.removeEventListener('resize', check)
  observer?.disconnect()
})
defineExpose({ check })
</script>