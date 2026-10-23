<template>
  <div v-bind="field.rootAttrs.value" class="scq-cascader">
    <Popover v-model="opened" :disabled="isDisabled || readonly" :teleport="teleport" :initial-focus="keyboardEdge ? initialFocus : undefined" width="max-content" placement="bottom-start" :aria-label="ariaLabel || text('choose')">
      <template #reference="{ panelId, visible }"><span ref="fieldRef" class="scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]" @focusout="field.touch"><button :id="id || undefined" ref="triggerRef" class="scq-field__trigger" type="button" :disabled="isDisabled || readonly" aria-haspopup="dialog" :aria-expanded="visible" :aria-controls="visible ? panelId : undefined" :aria-label="ariaLabel || placeholder || text('choose')" v-bind="field.attrs.value" @keydown="triggerKeydown"><span class="scq-field__value" :class="{ 'scq-field__placeholder': !selectedPath.length }">{{ selectedPath.map(option => option.label).join(separator) || placeholder || text('choose') }}</span><Icon name="chevronDown" :size="CASCADER_ICON_SIZE.trigger" /></button><button v-if="clearable && selectedPath.length && !isDisabled && !readonly" class="scq-field__clear" type="button" :aria-label="text('clear')" @click.stop="clear"><Icon name="close" :size="CASCADER_ICON_SIZE.action" /></button></span></template>
      <div ref="panelRef" class="scq-cascader__panel" tabindex="-1" @focusout="field.touch">
        <input v-if="filterable" ref="filterRef" v-model="query" type="search" class="scq-cascader__filter" :placeholder="text('search')" :aria-label="text('search')" :aria-controls="filterQuery ? resultsId : undefined" @keydown="filterKeydown" />
        <ul v-if="filterQuery" :id="resultsId" class="scq-cascader__results" role="listbox" :aria-label="text('suggestions')"><li v-for="(path, index) in results" :key="index" role="presentation"><button type="button" role="option" :aria-selected="samePath(path, selectedPath)" @click="commit(path)" @keydown="resultKeydown">{{ path.map(option => option.label).join(separator) }}</button></li><li v-if="!results.length" role="presentation" class="scq-cascader__empty">{{ text('empty') }}</li></ul>
        <div v-else class="scq-cascader__columns"><ul v-for="(column, columnIndex) in columns" :key="columnIndex" role="listbox" :aria-label="`${ariaLabel || text('choose')} ${columnIndex + 1}`"><li v-for="option in column" :key="option.value" role="presentation"><button type="button" role="option" :aria-selected="expanded[columnIndex] === option.value" :aria-disabled="option.disabled || undefined" :disabled="option.disabled" @click="choose(columnIndex, option)" @keydown="keydown($event, columnIndex, option)"><slot :option="option">{{ option.label }}</slot><Icon v-if="option.children?.length" name="chevronRight" :size="CASCADER_ICON_SIZE.action" /></button></li><li v-if="!column.length" role="presentation" class="scq-cascader__empty">{{ text('empty') }}</li></ul></div>
      </div>
    </Popover>
    <input v-if="name" type="hidden" :name="name" :value="Array.isArray(value) ? JSON.stringify(value) : value ?? ''" :disabled="isDisabled" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import type { PickerOption, PickerValue } from '../Picker/Picker.vue'
import { useFormControl } from '../Form/useFormControl'
import { cloneFieldValue, equalFieldValue } from '../Form/context'
import { useComponentId } from '../../utils/id'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { EDITABLE_TARGET_SELECTOR } from '../../utils/focus'

export type CascaderOption = PickerOption
export type CascaderValue = PickerValue | PickerValue[] | null
defineOptions({ name: 'Cascader', inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue?: CascaderValue | readonly PickerValue[]; options?: readonly CascaderOption[]; emitPath?: boolean; changeOnSelect?: boolean; filterable?: boolean; separator?: string; disabled?: boolean; readonly?: boolean; clearable?: boolean; placeholder?: string; size?: ComponentSize; ariaLabel?: string; id?: string; name?: string; teleport?: boolean | string }>(), { options: () => [], emitPath: true, changeOnSelect: false, filterable: false, separator: ' / ', disabled: undefined, readonly: false, clearable: true, placeholder: '', ariaLabel: '', id: '', name: '', teleport: true })
const emit = defineEmits<{
  (event: 'update:modelValue', value: CascaderValue): void
  (event: 'change', value: CascaderValue, path: CascaderOption[]): void
  (event: 'clear'): void
}>()
const config = useConfig()
const text = useLocale()
const internal = ref<CascaderValue>(null)
const value = computed(() => props.modelValue !== undefined ? props.modelValue : internal.value)
const opened = ref(false)
const query = ref('')
const filterQuery = computed(() => props.filterable ? query.value.trim() : '')
const resultsId = useComponentId('scq-cascader-results')
const CASCADER_ICON_SIZE = { trigger: 16, action: 14 } as const
const OPTION_SELECTOR = '[role="option"]:not(:disabled)'
const fieldRef = ref<HTMLElement>()
const triggerRef = ref<HTMLButtonElement>()
const panelRef = ref<HTMLElement>()
const filterRef = ref<HTMLInputElement>()
const keyboardEdge = ref<'first' | 'last'>()
let disposed = false
const field = useFormControl({ element: () => triggerRef.value, id: () => props.id, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, composite: true, contains: (target) => Boolean(fieldRef.value?.contains(target) || panelRef.value?.contains(target)) })
const isDisabled = field.disabled
const expanded = ref<PickerValue[]>([])
const paths = computed(() => {
  const result: CascaderOption[][] = []
  const walk = (options: readonly CascaderOption[], path: CascaderOption[]) => options.forEach((option) => { const next = [...path, option]; result.push(next); if (option.children) walk(option.children, next) })
  walk(props.options, [])
  return result
})
const selectedPath = computed(() => {
  const current = value.value
  return paths.value.find(path => typeof current === 'string' || typeof current === 'number' || current === null
    ? path[path.length - 1].value === current
    : path.length === current.length && path.every((option, index) => option.value === current[index])) || []
})
const samePath = (left: CascaderOption[], right: CascaderOption[]) => left.length === right.length && left.every((option, index) => option.value === right[index]?.value)
const results = computed(() => paths.value.filter((path) => !path.some((option) => option.disabled) && (props.changeOnSelect || !path[path.length - 1].children?.length) && path.map((option) => option.label).join(props.separator).toLocaleLowerCase().includes(filterQuery.value.toLocaleLowerCase())))
const columns = computed(() => {
  const result: (readonly CascaderOption[])[] = [props.options]
  for (const key of expanded.value) {
    const option = result[result.length - 1].find((entry) => entry.value === key)
    if (!option?.children?.length || option.disabled) break
    result.push(option.children)
  }
  return result
})
const commit = (path: CascaderOption[], close = true) => {
  if (disposed || isDisabled.value || props.readonly || path.some((option) => option.disabled)) return
  if (path.length && !opened.value) return
  if (path.length && !paths.value.some(current => current.length === path.length && current.every((option, index) => option === path[index]))) return
  const next = props.emitPath ? path.map((option) => option.value) : path[path.length - 1]?.value ?? null
  internal.value = next
  emit('update:modelValue', next)
  if (disposed) return
  emit('change', next, path)
  if (close) { opened.value = false; triggerRef.value?.focus() }
}
const choose = (columnIndex: number, option: CascaderOption) => {
  if (disposed || !opened.value || option.disabled || isDisabled.value || props.readonly || !columns.value[columnIndex]?.includes(option)) return
  const next = [...expanded.value.slice(0, columnIndex), option.value]
  const path = paths.value.find(entry => entry.length === next.length && entry[entry.length - 1] === option && entry.every((item, index) => item.value === next[index]))
  if (!path) return
  expanded.value = next
  if (!option.children?.length || props.changeOnSelect) commit(path, !option.children?.length)
}
const clear = () => { if (disposed || isDisabled.value || props.readonly) return; commit([]); expanded.value = []; if (!disposed) emit('clear') }
const ownsKey = (event: KeyboardEvent) => !disposed && !isDisabled.value && !props.readonly && !event.defaultPrevented
  && !event.isComposing && event.keyCode !== COMPOSITION_KEY_CODE && !event.ctrlKey && !event.metaKey && !event.altKey
const focusTarget = () => {
  if (props.filterable && filterRef.value) return filterRef.value
  const selected = panelRef.value?.querySelectorAll<HTMLElement>(`${OPTION_SELECTOR}[aria-selected="true"]`)
  const options = panelRef.value?.querySelectorAll<HTMLElement>(OPTION_SELECTOR)
  return selected?.[selected.length - 1] || (keyboardEdge.value === 'last' ? options?.[options.length - 1] : options?.[0]) || panelRef.value
}
const revealFocus = (target?: HTMLElement) => target?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
const initialFocus = () => {
  const target = focusTarget()
  keyboardEdge.value = undefined
  void nextTick(() => { if (opened.value && target?.ownerDocument.activeElement === target) revealFocus(target) })
  return target ?? null
}
const focusPanel = () => {
  const target = focusTarget()
  target?.focus({ preventScroll: true })
  if (target && target.ownerDocument.activeElement === target) { keyboardEdge.value = undefined; revealFocus(target) }
}
const triggerKeydown = async (event: KeyboardEvent) => {
  if (!ownsKey(event) || !['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return
  event.preventDefault()
  if (opened.value && (event.key === 'Enter' || event.key === ' ')) { opened.value = false; return }
  const wasOpen = opened.value
  keyboardEdge.value = event.key === 'ArrowUp' ? 'last' : 'first'
  opened.value = true
  await nextTick()
  if (wasOpen && opened.value && !disposed) focusPanel()
}
const navigateList = (event: KeyboardEvent) => {
  const button = event.currentTarget
  if (!(button instanceof HTMLElement)) return false
  const buttons = Array.from(button.closest('ul')?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) || [])
  const index = buttons.indexOf(button)
  if (index < 0) return false
  const target = event.key === 'ArrowDown' ? (index + 1) % buttons.length : event.key === 'ArrowUp' ? (index - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : -1
  if (target < 0) return false
  event.preventDefault()
  buttons[target]?.focus()
  return true
}
const resultKeydown = (event: KeyboardEvent) => { if (ownsKey(event)) navigateList(event) }
const filterKeydown = (event: KeyboardEvent) => {
  if (!ownsKey(event)) return
  if (event.key === 'Enter') { event.preventDefault(); return }
  if (event.shiftKey) return
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  const options = panelRef.value?.querySelectorAll<HTMLElement>(OPTION_SELECTOR)
  const target = event.key === 'ArrowUp' ? options?.[options.length - 1] : options?.[0]
  if (target) { event.preventDefault(); target.focus() }
}
const keydown = async (event: KeyboardEvent, columnIndex: number, option: CascaderOption) => {
  if (!ownsKey(event) || option.disabled || !columns.value[columnIndex]?.includes(option) || (event.target instanceof Element && event.target.closest(EDITABLE_TARGET_SELECTOR))) return
  const list = (event.currentTarget as HTMLElement).closest('ul')
  if (!list || navigateList(event)) return
  if (event.key === 'ArrowRight' && option.children?.length) { event.preventDefault(); choose(columnIndex, option); await nextTick(); if (opened.value) list.nextElementSibling?.querySelector<HTMLElement>(OPTION_SELECTOR)?.focus() }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); list.previousElementSibling?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')?.focus() }
}
const refreshExpanded = async (reset: boolean) => {
  if (!opened.value) return
  const panel = panelRef.value
  const previous = panel?.ownerDocument.activeElement
  const owned = previous instanceof HTMLElement && panel?.contains(previous)
  if (reset) { query.value = ''; expanded.value = selectedPath.value.map(option => option.value) }
  else {
    let column = props.options
    const next: PickerValue[] = []
    for (const key of expanded.value) {
      const option = column.find(item => item.value === key && !item.disabled)
      if (!option) break
      next.push(key)
      column = option.children || []
    }
    expanded.value = next.length ? next : selectedPath.value.map(option => option.value)
  }
  await nextTick()
  if (!owned || !previous || !panel || !opened.value || disposed || (previous.isConnected && !previous.matches(':disabled'))) return
  const current = panel.ownerDocument.activeElement
  if (current === previous || current === panel.ownerDocument.body) focusPanel()
}
let previousValue = cloneFieldValue(value.value)
watch(value, current => {
  if (equalFieldValue(current, previousValue)) return
  previousValue = cloneFieldValue(current)
  void refreshExpanded(true)
}, { deep: true })
watch(() => props.options, () => { void refreshExpanded(false) }, { deep: true })
watch(() => props.filterable, async () => {
  const previous = filterRef.value
  const focused = previous?.ownerDocument.activeElement === previous
  query.value = ''
  await nextTick()
  if (focused && previous && opened.value && !disposed && previous.ownerDocument.activeElement === previous.ownerDocument.body) focusPanel()
})
watch(opened, (value) => { query.value = ''; if (value) expanded.value = selectedPath.value.map((option) => option.value); else keyboardEdge.value = undefined })
watch([isDisabled, () => props.readonly], () => { opened.value = false })
onBeforeUnmount(() => { disposed = true })
defineExpose({ focus: field.focus, clear })
</script>