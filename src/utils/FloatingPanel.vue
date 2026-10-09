<template>
  <span ref="reference" class="scq-floating-reference" :tabindex="hasFocusableChild ? undefined : 0" :aria-describedby="variant === 'tooltip' && visible ? panelId : undefined" :aria-expanded="variant === 'popover' ? visible : undefined" :aria-controls="variant === 'popover' && visible ? panelId : undefined" @mouseenter="scheduleOpen" @mouseleave="scheduleClose" @focusin="focusOpen" @focusout="focusOut" @click="clickToggle">
    <slot name="reference" />
    <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="teleport === false || !mounted">
      <div v-if="visible" :id="panelId" ref="panel" class="scq-floating-panel" :class="`scq-floating-panel--${variant}`" :role="variant === 'tooltip' ? 'tooltip' : 'dialog'" :aria-label="ariaLabel || undefined" :style="panelStyle" @mouseenter="clearTimer" @mouseleave="scheduleClose" @focusout="focusOut" @click.stop><slot>{{ content }}</slot></div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { useComponentId } from './id'
import type { FloatingProps } from './floating'
import { useThemeStyle } from '../components/ConfigProvider/context'

defineOptions({ name: 'ScqFloatingPanel' })
const props = withDefaults(defineProps<FloatingProps & { variant?: 'tooltip' | 'popover' }>(), { content: '', placement: 'top', trigger: 'hover', disabled: false, showDelay: 80, hideDelay: 100, teleport: true, variant: 'tooltip', ariaLabel: '', modelValue: undefined })
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'show' | 'hide'): void }>()
const reference = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const mounted = ref(false)
const hasFocusableChild = ref(false)
const localVisible = ref(false)
const visible = computed(() => !props.disabled && (props.modelValue ?? localVisible.value))
const panelId = useComponentId('scq-floating')
const positionStyle = ref<CSSProperties>({ visibility: 'hidden' })
const themeStyle = useThemeStyle()
const panelStyle = computed(() => ({ ...themeStyle.value, ...positionStyle.value, width: typeof props.width === 'number' ? `${props.width}px` : props.width }))
let timer: ReturnType<typeof setTimeout> | undefined
let cleanup: (() => void) | undefined
let describedTarget: HTMLElement | undefined
let originalDescription: string | null = null
let sequence = 0

const clearTimer = () => { if (timer) clearTimeout(timer); timer = undefined }
const setVisible = (value: boolean) => {
  clearTimer()
  if (props.disabled && value) return
  if (value === visible.value) return
  localVisible.value = value
  emit('update:modelValue', value)
}
const scheduleOpen = () => {
  if (props.trigger !== 'hover' || props.disabled) return
  clearTimer()
  timer = setTimeout(() => setVisible(true), props.showDelay)
}
const scheduleClose = () => {
  if (props.trigger !== 'hover') return
  clearTimer()
  timer = setTimeout(() => setVisible(false), props.hideDelay)
}
const focusOpen = () => { if (props.trigger !== 'click') setVisible(true) }
const focusOut = (event: FocusEvent) => {
  const target = event.relatedTarget as Node | null
  if (target && (reference.value?.contains(target) || panel.value?.contains(target))) return
  if (props.trigger !== 'click') setVisible(false)
}
const clickToggle = () => { if (props.trigger === 'click') setVisible(!visible.value) }
const handleOutside = (event: PointerEvent) => {
  const target = event.target as Node
  if (!reference.value?.contains(target) && !panel.value?.contains(target)) setVisible(false)
}
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && visible.value) {
    event.stopPropagation()
    setVisible(false)
    if (panel.value?.contains(document.activeElement)) reference.value?.querySelector<HTMLElement>('button, a[href], input, [tabindex]')?.focus()
  }
}
const restoreDescription = () => {
  if (describedTarget) {
    if (originalDescription === null) describedTarget.removeAttribute('aria-describedby')
    else describedTarget.setAttribute('aria-describedby', originalDescription)
    describedTarget = undefined
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
    describedTarget = reference.value.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]') || undefined
    if (describedTarget) {
      originalDescription = describedTarget.getAttribute('aria-describedby')
      describedTarget.setAttribute('aria-describedby', [originalDescription, panelId].filter(Boolean).join(' '))
    }
  }
  const update = async () => {
    if (!reference.value || !panel.value) return
    const result = await computePosition(reference.value, panel.value, { placement: props.placement, strategy: 'fixed', middleware: [offset(8), flip(), shift({ padding: 8 })] })
    if (currentSequence === sequence) positionStyle.value = { position: result.strategy, left: `${result.x}px`, top: `${result.y}px`, visibility: 'visible' }
  }
  cleanup = autoUpdate(reference.value, panel.value, () => { void update() }, { elementResize: typeof ResizeObserver !== 'undefined', layoutShift: typeof IntersectionObserver !== 'undefined' })
}

watch(visible, (value) => {
  if (value) void startPositioning()
  else { stopPositioning(); clearTimer() }
  emit(value ? 'show' : 'hide')
})
watch(() => [props.placement, props.width], () => { if (visible.value) void startPositioning() })
onMounted(() => {
  mounted.value = true
  hasFocusableChild.value = Boolean(reference.value?.querySelector('button, a[href], input, select, textarea, [tabindex]'))
  document.addEventListener('pointerdown', handleOutside)
  document.addEventListener('keydown', handleKeydown)
  if (visible.value) void startPositioning()
})
onBeforeUnmount(() => {
  clearTimer()
  stopPositioning()
  document.removeEventListener('pointerdown', handleOutside)
  document.removeEventListener('keydown', handleKeydown)
})
defineExpose({ show: () => setVisible(true), hide: () => setVisible(false) })
</script>