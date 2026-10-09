<template>
  <div ref="listRef" class="scq-list" :aria-busy="loading">
    <slot />
    <div ref="sentinelRef" class="scq-list__sentinel" aria-hidden="true" />
    <div class="scq-list__status" role="status" aria-live="polite">
      <slot v-if="loading" name="loading">{{ loadingText || text('loading') }}</slot>
      <slot v-else-if="finished" name="finished">{{ finishedText || text('finished') }}</slot>
      <button v-else-if="error" type="button" @click="retry"><slot name="error">{{ errorText || text('retry') }}</slot></button>
      <button v-else type="button" :disabled="disabled || pending" @click="load">{{ text('loadMore') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale } from '../ConfigProvider/context'

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
}>(), { loading: false, finished: false, error: false, disabled: false, offset: 100, immediateCheck: true })
const emit = defineEmits<{
  (event: 'update:loading' | 'update:error', value: boolean): void
  (event: 'load'): void
}>()
const text = useLocale()
const listRef = ref<HTMLElement>()
const sentinelRef = ref<HTMLElement>()
const pending = ref(false)
let scrollTarget: HTMLElement | Window | undefined
let observer: ResizeObserver | undefined

const load = () => {
  if (pending.value || props.loading || props.finished || props.error || props.disabled) return
  pending.value = true
  emit('update:loading', true)
  emit('load')
  void nextTick(() => { if (!props.loading) pending.value = false })
}
const check = () => {
  if (!sentinelRef.value || !scrollTarget) return
  const rect = sentinelRef.value.getBoundingClientRect()
  if (!rect.width && !rect.height) return
  const bottom = scrollTarget === window ? window.innerHeight : (scrollTarget as HTMLElement).getBoundingClientRect().bottom
  if (rect.top <= bottom + Math.max(0, props.offset)) load()
}
const retry = async () => {
  if (props.disabled || props.loading || props.finished) return
  emit('update:error', false)
  await nextTick()
  load()
}
watch(() => [props.loading, props.error, props.finished, props.disabled], async () => {
  pending.value = false
  await nextTick()
  check()
})
onMounted(async () => {
  let parent = listRef.value?.parentElement
  while (parent && !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) parent = parent.parentElement
  scrollTarget = parent || window
  scrollTarget.addEventListener('scroll', check, { passive: true })
  window.addEventListener('resize', check)
  if (typeof ResizeObserver !== 'undefined' && listRef.value) {
    observer = new ResizeObserver(check)
    observer.observe(listRef.value)
  }
  await nextTick()
  if (props.immediateCheck) check()
})
onBeforeUnmount(() => {
  scrollTarget?.removeEventListener('scroll', check)
  window.removeEventListener('resize', check)
  observer?.disconnect()
})
defineExpose({ check })
</script>