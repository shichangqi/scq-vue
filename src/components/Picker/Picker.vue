<template>
  <section ref="rootRef" class="scq-picker" :class="{ 'scq-picker--wheel': mode === 'wheel' }" :style="wheelStyle" role="group" :aria-busy="loading" :aria-disabled="isDisabled" :aria-label="field.attrs.value['aria-labelledby'] ? undefined : title || text('choose')" v-bind="{ ...$attrs, ...field.attrs.value }" @focusout="field.touch($event)">
    <header v-if="showToolbar" class="scq-picker__toolbar">
      <button type="button" class="scq-picker__cancel" @click="cancel">{{ cancelText || text('cancel') }}</button>
      <strong>{{ title }}</strong>
      <button type="button" class="scq-picker__confirm" :disabled="isDisabled || loading || !complete" @click="confirm">{{ confirmText || text('confirm') }}</button>
    </header>
    <div v-if="loading" class="scq-picker__loading" role="status">{{ text('loading') }}</div>
    <div v-else ref="columnsRef" class="scq-picker__columns">
      <div v-for="(column, columnIndex) in state.columns" :key="columnIndex" class="scq-picker__column" :data-column-index="columnIndex" role="listbox" :tabindex="isDisabled || selectionBlocked ? -1 : 0" :aria-label="`${title || text('choose')} ${columnIndex + 1}`" :aria-disabled="isDisabled || selectionBlocked" :aria-activedescendant="state.selected[columnIndex] ? `${pickerId}-${columnIndex}-${column.indexOf(state.selected[columnIndex]!)}` : undefined" @keydown="keydown($event, columnIndex)" @scroll.passive="scroll($event, columnIndex)" @scrollend="settle(columnIndex)" @wheel.passive="beginScroll(columnIndex)" @pointerdown="beginScroll(columnIndex)" @touchstart.passive="touchStart(columnIndex)" @touchend.passive="touchEnd($event, columnIndex)" @touchcancel.passive="touchCancel(columnIndex)">
        <button v-for="(option, optionIndex) in column" :id="`${pickerId}-${columnIndex}-${optionIndex}`" :key="option.value" type="button" role="option" tabindex="-1" :aria-selected="option.value === state.selected[columnIndex]?.value" :aria-disabled="Boolean(isDisabled || selectionBlocked || option.disabled)" :disabled="isDisabled || selectionBlocked || option.disabled" @click="choose(columnIndex, option)"><slot name="option" :option="option" :column-index="columnIndex">{{ option.label }}</slot></button>
        <span v-if="!column.length" class="scq-picker__empty">{{ text('empty') }}</span>
      </div>
      <span v-if="!state.columns.length" class="scq-picker__empty">{{ text('empty') }}</span>
      <span v-if="mode === 'wheel' && state.columns.length" class="scq-picker__indicator" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { formItemKey } from '../Form/context'
import { useFormControl } from '../Form/useFormControl'
import { useComponentId } from '../../utils/id'
import { PICKER_DEFAULTS, PICKER_SCROLL_IDLE_MS } from './constants'
import type { PickerOption, PickerProps, PickerSelection, PickerValue } from './types'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { EDITABLE_TARGET_SELECTOR, useContentFocus } from '../../utils/focus'

export type { PickerMode, PickerOption, PickerProps, PickerSelection, PickerValue } from './types'
defineOptions({ name: 'Picker', inheritAttrs: false })
const props = withDefaults(defineProps<PickerProps>(), { columns: () => [], title: '', showToolbar: true, disabled: undefined, loading: false, ...PICKER_DEFAULTS })
const emit = defineEmits<{
  (event: 'update:modelValue', value: PickerValue[]): void
  (event: 'change' | 'confirm', value: PickerSelection): void
  (event: 'cancel'): void
}>()
const text = useLocale()
const pickerId = useComponentId('scq-picker')
const rootRef = ref<HTMLElement>()
const columnsRef = ref<HTMLElement>()
const internal = ref<PickerValue[]>([])
const field = useFormControl({
  element: () => rootRef.value,
  disabled: () => props.disabled,
  ariaLabel: () => props.title || undefined,
  busy: () => props.loading,
  focus: (options) => {
    const target = focusTarget()
    if (!target) return false
    target.focus(options)
    return target.ownerDocument.activeElement === target
  },
})
provide(formItemKey, null)
const isDisabled = field.disabled
const wheelStyle = computed(() => props.mode === 'wheel' ? {
  '--scq-picker-option-height': `${props.optionHeight}px`,
  '--scq-picker-wheel-height': `${props.optionHeight * props.visibleOptionCount}px`,
  '--scq-picker-wheel-padding': `${props.optionHeight * (props.visibleOptionCount - 1) / 2}px`,
} : undefined)
watch(() => [props.mode, props.optionHeight, props.visibleOptionCount], () => {
  if (props.mode !== 'list' && props.mode !== 'wheel') throw new TypeError('[scq-vue/Picker] mode must be "list" or "wheel".')
  if (!Number.isFinite(props.optionHeight) || props.optionHeight <= 0) throw new RangeError('[scq-vue/Picker] optionHeight must be a finite positive number.')
  if (!Number.isSafeInteger(props.visibleOptionCount) || props.visibleOptionCount <= 0 || props.visibleOptionCount % 2 !== 1) throw new RangeError('[scq-vue/Picker] visibleOptionCount must be a positive odd integer.')
  if (!Number.isFinite(props.optionHeight * props.visibleOptionCount)) throw new RangeError('[scq-vue/Picker] The total wheel height must be finite.')
}, { immediate: true, flush: 'sync' })
const isIndependentColumns = (columns: NonNullable<PickerProps['columns']>): columns is readonly (readonly PickerOption[])[] => Array.isArray(columns[0])
const independent = computed(() => isIndependentColumns(props.columns))
const normalize = (values: readonly PickerValue[]) => {
  const columns: (readonly PickerOption[])[] = []
  const selected: (PickerOption | undefined)[] = []
  const source = props.columns
  if (isIndependentColumns(source)) {
    for (const [index, column] of source.entries()) {
      columns.push(column)
      selected.push(column.find((option) => option.value === values[index] && !option.disabled) || column.find((option) => !option.disabled))
    }
  } else if (source.length) {
    let column: readonly PickerOption[] = source
    while (column) {
      const option = column.find((item) => item.value === values[columns.length] && !item.disabled) || column.find((item) => !item.disabled)
      columns.push(column)
      selected.push(option)
      if (!option?.children) break
      column = option.children
    }
  }
  return { columns, selected }
}
const state = computed(() => normalize(props.modelValue ?? internal.value))
const complete = computed(() => state.value.selected.length > 0 && state.value.selected.every(Boolean))
const selectionBlocked = computed(() => independent.value && !complete.value)
const focusTarget = () => {
  if (isDisabled.value || props.loading || selectionBlocked.value) return undefined
  const selected = rootRef.value?.querySelector<HTMLElement>('.scq-picker__column [role="option"][aria-selected="true"]:not(:disabled)')
  return props.mode === 'wheel' ? selected?.closest<HTMLElement>('[role="listbox"]') : selected
}
useContentFocus(() => columnsRef.value, () => props.loading,
  () => focusTarget() || rootRef.value?.querySelector<HTMLButtonElement>('.scq-picker__cancel:not(:disabled)') || undefined)
const selection = (selected = state.value.selected): PickerSelection => {
  if (independent.value && selected.some(option => !option)) return { values: [], options: [] }
  const options = selected.filter((option): option is PickerOption => Boolean(option))
  return { values: options.map((option) => option.value), options }
}
const choose = (columnIndex: number, option: PickerOption) => {
  if (disposed || isDisabled.value || props.loading || selectionBlocked.value || option.disabled || !state.value.columns[columnIndex]?.includes(option)) return
  const values = selection().values
  values[columnIndex] = option.value
  const result = selection(normalize(values).selected)
  internal.value = result.values
  emit('update:modelValue', result.values)
  emit('change', result)
  if (props.mode === 'wheel') {
    clearScrolls()
    void nextTick(syncColumns)
  }
}
const keydown = (event: KeyboardEvent, columnIndex: number) => {
  if (disposed || isDisabled.value || props.loading || selectionBlocked.value || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey
    || (event.target instanceof Element && event.target.closest(EDITABLE_TARGET_SELECTOR))) return
  const column = state.value.columns[columnIndex]
  if (!column) return
  const options = column.filter((option) => !option.disabled)
  const index = options.findIndex((option) => option.value === state.value.selected[columnIndex]?.value)
  const pageStep = props.mode === 'wheel' ? props.visibleOptionCount : 0
  let target = -1
  switch (event.key) {
    case 'Home': target = 0; break
    case 'End': target = options.length - 1; break
    case 'ArrowDown': target = Math.min(index + 1, options.length - 1); break
    case 'ArrowUp': target = Math.max(index - 1, 0); break
    case 'PageDown': if (pageStep) target = Math.min(index + pageStep, options.length - 1); break
    case 'PageUp': if (pageStep) target = Math.max(index - pageStep, 0); break
  }
  if (target >= 0 && options[target]) {
    event.preventDefault()
    choose(columnIndex, options[target])
  } else if (event.key === 'Enter') { event.preventDefault(); confirm() }
  else if (props.mode === 'wheel' && event.key === ' ') event.preventDefault()
}
const commit = () => {
  if (disposed || isDisabled.value || props.loading || !complete.value) return
  const result = selection()
  internal.value = result.values
  emit('update:modelValue', result.values)
  if (disposed) return
  emit('confirm', result)
}
const confirm = () => {
  if (disposed) return
  if (props.mode !== 'wheel') return commit()
  for (const index of [...scrolling]) settle(index)
  return nextTick(() => { syncColumns(); commit() })
}

const timers = new Map<number, ReturnType<typeof setTimeout>>()
const scrolling = new Set<number>()
const touching = new Set<number>()
const previousOffsets = new Map<number, number>()
const directions = new Map<number, number>()
let disposed = false
const columnElement = (index: number) => rootRef.value?.querySelector<HTMLElement>(`[data-column-index="${index}"]`)
const clearTimer = (index: number) => {
  clearTimeout(timers.get(index))
  timers.delete(index)
}
const clearScrolls = () => {
  timers.forEach(clearTimeout)
  timers.clear()
  scrolling.clear()
  touching.clear()
  directions.clear()
}
const syncColumns = () => {
  if (disposed || props.mode !== 'wheel') return
  state.value.columns.forEach((column, index) => {
    const element = columnElement(index)
    if (!element) return
    const selectedIndex = column.findIndex((option) => option === state.value.selected[index])
    const top = Math.max(0, selectedIndex) * props.optionHeight
    if (element.scrollTop !== top) element.scrollTop = top
    previousOffsets.set(index, top)
  })
}
const beginScroll = (index: number) => {
  if (!disposed && props.mode === 'wheel' && !isDisabled.value && !props.loading && !selectionBlocked.value) scrolling.add(index)
}
const scheduleSettle = (index: number) => {
  clearTimer(index)
  timers.set(index, setTimeout(() => settle(index), PICKER_SCROLL_IDLE_MS))
}
const scroll = (event: Event, index: number) => {
  if (props.mode !== 'wheel' || !scrolling.has(index)) return
  const element = event.currentTarget as HTMLElement
  const previous = previousOffsets.get(index) ?? element.scrollTop
  if (previous !== element.scrollTop) directions.set(index, Math.sign(element.scrollTop - previous))
  previousOffsets.set(index, element.scrollTop)
  scheduleSettle(index)
}
const settle = (index: number) => {
  clearTimer(index)
  if (disposed || touching.has(index) || !scrolling.has(index) || props.mode !== 'wheel' || isDisabled.value || props.loading) return
  scrolling.delete(index)
  const column = state.value.columns[index]
  const element = columnElement(index)
  if (!column || !element) return
  const center = element.scrollTop / props.optionHeight
  const direction = directions.get(index) ?? 1
  let nearest: PickerOption | undefined
  let nearestDistance = Infinity
  column.forEach((option, optionIndex) => {
    if (option.disabled) return
    const distance = Math.abs(optionIndex - center)
    if (distance < nearestDistance || (distance === nearestDistance && direction > 0)) {
      nearest = option
      nearestDistance = distance
    }
  })
  if (nearest && nearest.value !== state.value.selected[index]?.value) choose(index, nearest)
  // An ignored controlled update must not leave the wheel centered on an unselected value.
  void nextTick(syncColumns)
}
const touchStart = (index: number) => {
  beginScroll(index)
  if (scrolling.has(index)) touching.add(index)
}
const touchEnd = (event: TouchEvent, index: number) => {
  if (event.touches.length) return
  touching.delete(index)
  if (scrolling.has(index)) scheduleSettle(index)
}
const touchCancel = (index: number) => {
  touching.delete(index)
  scrolling.delete(index)
  clearTimer(index)
  syncColumns()
}
const cancel = () => {
  if (disposed) return
  clearScrolls()
  syncColumns()
  emit('cancel')
}
watch([state, isDisabled, () => props.loading, () => props.mode, () => props.optionHeight, () => props.visibleOptionCount], () => {
  clearScrolls()
  void nextTick(syncColumns)
}, { deep: true, immediate: true, flush: 'sync' })
onBeforeUnmount(() => { disposed = true; clearScrolls() })
defineExpose({ confirm, getSelected: () => selection() })
</script>