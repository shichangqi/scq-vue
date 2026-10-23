<template>
  <component
    :is="as"
    ref="rootRef"
    class="scq-typography"
    :class="[`scq-typography--${type}`, {
      'is-bold': bold,
      'is-italic': italic,
      'is-underline': underline,
      'is-code': code,
      'is-mark': mark,
      'is-ellipsis': ellipsis && !isExpanded,
      'is-clamped': lineCount > 0 && !isExpanded,
      'is-expandable': expandable,
      'is-expanded': isExpanded,
    }]"
    :style="{ fontSize, '--scq-typography-lines': lineCount }"
  ><span ref="contentRef" :id="expandable ? contentId : undefined" class="scq-typography__content" :title="expandable && overflowing && !isExpanded ? fullText : undefined"><slot>{{ content }}</slot></span><button v-if="showToggle" type="button" class="scq-typography__toggle" :aria-expanded="isExpanded" :aria-controls="contentId" @click="toggleExpanded">{{ text(isExpanded ? 'collapse' : 'expand') }}</button><button v-if="copyable" type="button" class="scq-typography__copy" :disabled="copying" :aria-busy="copying || undefined" :aria-label="text(copied ? 'copied' : 'copy')" :title="text(copied ? 'copied' : 'copy')" @click="copy"><Icon :name="copied ? 'check' : 'copy'" :size="TYPOGRAPHY_COPY_ICON_SIZE" /></button></component>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'
import { toCssLength } from '../../utils/layout'
import { TYPOGRAPHY_COPY_FEEDBACK_MS, TYPOGRAPHY_COPY_ICON_SIZE, TYPOGRAPHY_DEFAULTS } from './constants'
import type { TypographyProps } from './types'

defineOptions({ name: 'Typography' })
const props = withDefaults(defineProps<TypographyProps>(), TYPOGRAPHY_DEFAULTS)
const emit = defineEmits<{
  (event: 'copy', value: string): void
  (event: 'copy-error', error: unknown): void
  (event: 'update:expanded' | 'expand-change', expanded: boolean): void
}>()
const text = useLocale()
const contentId = useComponentId('scq-typography-content')
const rootRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const copied = ref(false)
const copying = ref(false)
const fontSize = computed(() => props.size === undefined ? undefined : toCssLength(props.size))
const lineCount = computed(() => {
  if (!Number.isFinite(props.lines)) throw new RangeError('[scq-vue] Typography lines must be finite.')
  return Math.max(0, Math.floor(props.lines))
})
const localExpanded = ref(props.expanded ?? props.defaultExpanded)
const isExpanded = computed(() => props.expandable && (props.expanded ?? localExpanded.value))
const truncatable = computed(() => props.ellipsis || lineCount.value > 0)
const overflowing = ref(false)
const fullText = ref('')
const showToggle = computed(() => props.expandable && (isExpanded.value || overflowing.value))
let timer: ReturnType<typeof setTimeout> | undefined
let resizeFrame: number | undefined
let disposed = false
let measureQueued = false
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let observedRoot: HTMLElement | undefined
let observedContent: HTMLElement | undefined
let observingOverflow = false
let copyVersion = 0
let pendingCopyValue: string | undefined
let copiedValue: string | undefined
const copyValue = () => props.copyText ?? contentRef.value?.textContent ?? props.content
const resetCopyFeedback = () => {
  copied.value = false
  copiedValue = undefined
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}
const syncCopyFeedback = () => {
  const expected = pendingCopyValue ?? copiedValue
  if (expected !== undefined && (!props.copyable || expected !== copyValue())) {
    copyVersion += 1
    pendingCopyValue = undefined
    resetCopyFeedback()
  }
}

watch(() => props.expanded, (value) => {
  if (value !== undefined) localExpanded.value = value
}, { flush: 'sync' })

const toggleExpanded = () => {
  const value = !isExpanded.value
  if (props.expanded === undefined) localExpanded.value = value
  emit('update:expanded', value)
  emit('expand-change', value)
}

const measure = () => {
  if (disposed) return
  syncCopyFeedback()
  const element = contentRef.value
  if (!props.expandable || !truncatable.value || !element) {
    overflowing.value = false
    fullText.value = ''
    return
  }
  fullText.value = element.textContent ?? props.content
  // Expanded content must keep its collapse control even when it no longer overflows.
  if (isExpanded.value) return
  overflowing.value = (element.clientWidth > 0 && element.scrollWidth > element.clientWidth)
    || (element.clientHeight > 0 && element.scrollHeight > element.clientHeight)
}

const scheduleMeasure = () => {
  if (disposed || measureQueued) return
  measureQueued = true
  void nextTick(() => {
    measureQueued = false
    measure()
  })
}

const scheduleResizeMeasure = () => {
  if (disposed || resizeFrame !== undefined) return
  if (typeof requestAnimationFrame === 'undefined') {
    scheduleMeasure()
    return
  }
  // Defer overflow-driven DOM changes outside the ResizeObserver delivery cycle.
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = undefined
    scheduleMeasure()
  })
}

const stopMeasuring = () => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  resizeObserver = undefined
  mutationObserver = undefined
  observedRoot = undefined
  observedContent = undefined
  observingOverflow = false
  if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame)
  resizeFrame = undefined
  window.removeEventListener('resize', scheduleMeasure)
}

const syncMeasurement = () => {
  const needsOverflow = props.expandable && truncatable.value
  if ((!needsOverflow && !props.copyable) || !rootRef.value || !contentRef.value) {
    stopMeasuring()
    measure()
    return
  }
  if (observedRoot !== rootRef.value || observedContent !== contentRef.value || observingOverflow !== needsOverflow) {
    stopMeasuring()
    observedRoot = rootRef.value
    observedContent = contentRef.value
    observingOverflow = needsOverflow
    if (needsOverflow && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleResizeMeasure)
      resizeObserver.observe(observedRoot)
      resizeObserver.observe(observedContent)
    }
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(scheduleMeasure)
      mutationObserver.observe(observedContent, { childList: true, characterData: true, subtree: true, attributes: true })
    }
    if (needsOverflow) window.addEventListener('resize', scheduleMeasure)
  }
  scheduleMeasure()
}

const copy = async (event: MouseEvent) => {
  if (copying.value || !props.copyable) return
  const trigger = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : undefined
  const restoreFocus = trigger?.ownerDocument.activeElement === trigger
  const value = copyValue()
  const version = ++copyVersion
  resetCopyFeedback()
  pendingCopyValue = value
  copying.value = true
  try {
    if (!navigator.clipboard) throw new Error('Clipboard API requires a secure context')
    await navigator.clipboard.writeText(value)
    if (disposed || version !== copyVersion || !props.copyable || value !== copyValue()) return
    copiedValue = value
    copied.value = true
    timer = setTimeout(resetCopyFeedback, TYPOGRAPHY_COPY_FEEDBACK_MS)
    emit('copy', value)
  } catch (error) {
    if (!disposed && version === copyVersion && props.copyable && value === copyValue()) emit('copy-error', error)
  } finally {
    pendingCopyValue = undefined
    if (!disposed) {
      copying.value = false
      await nextTick()
      if (restoreFocus && trigger?.isConnected && !trigger.disabled && trigger.ownerDocument.activeElement === trigger.ownerDocument.body) trigger.focus({ preventScroll: true })
    }
  }
}

onMounted(syncMeasurement)
onUpdated(syncMeasurement)
onBeforeUnmount(() => {
  disposed = true
  stopMeasuring()
  if (timer !== undefined) clearTimeout(timer)
})
</script>