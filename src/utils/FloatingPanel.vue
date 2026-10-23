<template>
  <span ref="reference" class="scq-floating-reference" :role="!hasFocusableChild && trigger === 'click' ? 'button' : undefined" :tabindex="hasFocusableChild ? undefined : 0" :aria-describedby="variant === 'tooltip' && visible ? panelId : undefined" :aria-expanded="variant === 'popover' ? visible : undefined" :aria-controls="variant === 'popover' && visible ? panelId : undefined" @mouseenter="scheduleOpen" @mouseleave="scheduleClose" @focusin="focusOpen" @focusout="focusOut"   @click="clickToggle" @keydown="keydown">
    <slot name="reference" v-bind="{ panelId, visible }" />
    <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="teleport === false || !mounted">
      <div v-if="visible" :id="panelId" ref="panel" class="scq-floating-panel" :class="`scq-floating-panel--${variant}`" :role="variant === 'tooltip' ? 'tooltip' : 'dialog'" :aria-label="ariaLabel || undefined" :tabindex="initialFocus ? -1 : undefined" :style="panelStyle"       @mouseenter="enterPanel" @mouseleave="scheduleClose" @focusin="focusOpen" @focusout="focusOut" @click.stop><slot>{{ content }}</slot></div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch, type CSSProperties } from 'vue'
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { useComponentId } from './id'
import { FLOATING_DEFAULTS, FLOATING_FOCUSABLE_SELECTOR, type FloatingProps } from './floating'
import { MAX_TIMEOUT_DELAY } from './async'
import { COMPOSITION_KEY_CODE } from './composition'
import { toCssLength } from './layout'
import { useConfig, useThemeStyle } from '../components/ConfigProvider/context'
import { useLayer } from './modal'

defineOptions({ name: 'ScqFloatingPanel' })
const props = withDefaults(defineProps<FloatingProps & { variant?: 'tooltip' | 'popover' }>(), { content: '', placement: 'top', trigger: 'hover', disabled: undefined, showDelay: FLOATING_DEFAULTS.showDelay, hideDelay: FLOATING_DEFAULTS.hideDelay, teleport: true, variant: 'tooltip', ariaLabel: '', modelValue: undefined, shiftCrossAxis: false })
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'show' | 'hide'): void }>()
const reference = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const mounted = ref(false)
const hasFocusableChild = ref(false)
const localVisible = ref(false)
const config = useConfig()
const disabled = computed(() => props.disabled ?? config.value.disabled)
const visible = computed(() => !disabled.value && (props.modelValue ?? localVisible.value))
const panelId = useComponentId('scq-floating')
const positionStyle = ref<CSSProperties>({ visibility: 'hidden' })
const themeStyle = useThemeStyle()
const panelStyle = computed(() => ({ ...themeStyle.value, ...positionStyle.value, zIndex: layer.zIndex.value, width: props.width === undefined ? undefined : toCssLength(props.width) }))
let timer: ReturnType<typeof setTimeout> | undefined
let cleanup: (() => void) | undefined
let describedTarget: HTMLElement | undefined
let sequence = 0
let hovered = false
let focused = false
let suppressFocusOpen = false

const clearTimer = () => { if (timer) clearTimeout(timer); timer = undefined }
const setVisible = (value: boolean) => {
  clearTimer()
  if (disabled.value && value) return
  if (value === visible.value) return
  localVisible.value = value
  emit('update:modelValue', value)
}
const scheduleOpen = () => {
  if (props.trigger !== 'hover' || disabled.value) return
  hovered = true
  clearTimer()
  timer = setTimeout(() => setVisible(true), props.showDelay)
}
const enterPanel = () => { hovered = true; clearTimer() }
const scheduleClose = () => {
  if (props.trigger !== 'hover') return
  hovered = false
  clearTimer()
  if (focused) return
  timer = setTimeout(() => setVisible(false), props.hideDelay)
}
const focusOpen = () => { focused = true; if (props.trigger !== 'click' && !suppressFocusOpen) setVisible(true) }
const focusOut = (event: FocusEvent) => {
  const target = event.relatedTarget as Node | null
  if (target && (reference.value?.contains(target) || panel.value?.contains(target) || layer.contains(target))) return
  focused = false
  if (props.trigger === 'focus' || props.trigger === 'hover' && !hovered) setVisible(false)
}
const clickToggle = () => { if (props.trigger === 'click') setVisible(!visible.value) }
const keydown = (event: KeyboardEvent) => {
  if (event.target !== reference.value || props.trigger !== 'click' || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey) return
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setVisible(!visible.value) }
}
const referenceTarget = () => [...(reference.value?.querySelectorAll<HTMLElement>(FLOATING_FOCUSABLE_SELECTOR) ?? [])].find(target => !panel.value?.contains(target))
const syncReference = () => {
  hasFocusableChild.value = Boolean(referenceTarget())
  if (visible.value && props.variant === 'tooltip') syncDescription()
}
const handleOutside = (event: PointerEvent) => {
  const target = event.target as Node
  if (!reference.value?.contains(target) && !panel.value?.contains(target) && !layer.contains(target)) setVisible(false)
}
const handleEscape = () => {
  const restore = panel.value?.contains(panel.value.ownerDocument.activeElement)
  setVisible(false)
  if (restore) {
    suppressFocusOpen = true
    ;(referenceTarget() ?? reference.value)?.focus({ preventScroll: true })
    suppressFocusOpen = false
  }
}
const layer = useLayer(() => visible.value, panel, {
  closeOnPressEscape: () => true, lockScroll: () => false, onEscape: handleEscape,
  zIndex: () => props.zIndex, defaultZIndex: FLOATING_DEFAULTS.zIndex, trapFocus: false,
  reference: () => reference.value,
})
const restoreDescription = () => {
  if (describedTarget) {
    const description = (describedTarget.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== panelId).join(' ')
    if (description) describedTarget.setAttribute('aria-describedby', description)
    else describedTarget.removeAttribute('aria-describedby')
    describedTarget = undefined
  }
}
const syncDescription = () => {
  const target = referenceTarget()
  if (target === describedTarget) return
  restoreDescription()
  describedTarget = target
  if (target) {
    const ids = new Set((target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean))
    ids.add(panelId)
    target.setAttribute('aria-describedby', [...ids].join(' '))
  }
}
const stopPositioning = () => {
  sequence += 1
  cleanup?.()
  cleanup = undefined
  restoreDescription()
}
const startPositioning = async () => {
  stopPositioning()
  const currentSequence = sequence
  positionStyle.value = { visibility: 'hidden' }
  await nextTick()
  if (!visible.value || !reference.value || !panel.value || currentSequence !== sequence) return
  if (props.variant === 'tooltip') {
    syncDescription()
  }
  let focused = false
  const update = async () => {
    if (!reference.value || !panel.value) return
    const result = await computePosition(reference.value, panel.value, { placement: props.placement, strategy: 'fixed', middleware: [offset(FLOATING_DEFAULTS.gap), flip(), shift({ padding: FLOATING_DEFAULTS.viewportPadding, crossAxis: props.shiftCrossAxis })] })
    if (currentSequence === sequence) positionStyle.value = { position: result.strategy, left: `${result.x}px`, top: `${result.y}px`, visibility: 'visible' }
    if (!focused && props.initialFocus && currentSequence === sequence) {
      focused = true
      await nextTick()
      if (currentSequence !== sequence || !panel.value) return
      const target = typeof props.initialFocus === 'function' ? props.initialFocus() ?? panel.value
        : typeof props.initialFocus === 'string' ? panel.value.querySelector<HTMLElement>(props.initialFocus) : props.initialFocus
      if (!target) throw new Error('[scq-vue] Initial focus target was not found in the floating panel.')
      target.focus({ preventScroll: true })
    }
  }
  cleanup = autoUpdate(reference.value, panel.value, () => { void update() }, { elementResize: typeof ResizeObserver !== 'undefined', layoutShift: typeof IntersectionObserver !== 'undefined' })
}

watch(visible, (value) => {
  if (value) void startPositioning()
  else { stopPositioning(); clearTimer() }
  emit(value ? 'show' : 'hide')
})
watch(() => [props.placement, props.width, props.shiftCrossAxis], () => { if (visible.value) void startPositioning() })
watch([disabled, () => props.trigger], ([blocked]) => {
  clearTimer()
  if (blocked) {
    hovered = false
    focused = false
    localVisible.value = false
    if (props.modelValue) emit('update:modelValue', false)
  }
}, { flush: 'sync' })
watch(() => [props.showDelay, props.hideDelay], values => {
  if (values.some(value => !Number.isFinite(value) || value < 0 || value > MAX_TIMEOUT_DELAY)) throw new RangeError(`[scq-vue] Floating delays must be between zero and ${MAX_TIMEOUT_DELAY}.`)
  clearTimer()
}, { immediate: true, flush: 'sync' })
onUpdated(syncReference)
onMounted(() => {
  mounted.value = true
  syncReference()
  document.addEventListener('pointerdown', handleOutside)
  if (visible.value) void startPositioning()
})
onBeforeUnmount(() => {
  clearTimer()
  stopPositioning()
  document.removeEventListener('pointerdown', handleOutside)
})
defineExpose({ show: () => setVisible(true), hide: () => setVisible(false) })
</script>