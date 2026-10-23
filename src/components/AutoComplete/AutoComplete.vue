<template>
  <div ref="rootRef" v-bind="field.rootAttrs.value" class="scq-auto-complete" @focusout="focusOut">
    <Popover :model-value="opened" :disabled="isDisabled || readonly" :teleport="teleport" placement="bottom-start" :width="width" :aria-label="ariaLabel || text('suggestions')" @update:model-value="togglePanel">
      <template #reference>
        <span class="scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]">
          <input
            ref="inputRef" v-model="composition.model.value" type="text" role="combobox" autocomplete="off"
            aria-autocomplete="list" aria-haspopup="listbox" :aria-expanded="opened"
            :aria-controls="opened ? listId : undefined" :aria-activedescendant="activeId"
            :aria-label="ariaLabel || (field.hasField ? undefined : placeholder || text('search'))"
            :name="name || undefined" :placeholder="placeholder" :disabled="isDisabled" :readonly="readonly"
            v-bind="field.attrs.value"
            @compositionstart="beginComposition" @compositionend="composition.end"
            @focus="focus" @blur="blur" @keydown="keydown" @click.stop="clickInput"
          />
          <button v-if="clearable && query && !isDisabled && !readonly" class="scq-field__clear" type="button" :aria-label="text('clear')" @mousedown.prevent @click.stop="clear"><Icon name="close" :size="AUTO_COMPLETE_CLEAR_ICON_SIZE" /></button>
        </span>
      </template>
      <div ref="contentRef" class="scq-auto-complete__content" @focusout.stop="focusOut">
        <div :id="listId" class="scq-auto-complete__options" :class="{ 'is-virtual': virtual }" :style="{ maxHeight: virtual ? undefined : `${height}px` }" role="listbox" :aria-label="ariaLabel || text('suggestions')" :aria-busy="loading || undefined">
          <div v-if="loading" class="scq-auto-complete__status" role="status">{{ text('loading') }}</div>
          <div v-else-if="failed" class="scq-auto-complete__status" role="alert">{{ text('loadError') }} <button type="button" @mousedown.prevent @click="refresh">{{ text('retryAction') }}</button></div>
          <VirtualList v-else-if="virtual" ref="virtualRef" :items="rows" :height="height" :item-height="itemHeight" :overscan="overscan" :item-key="rowKey" :active-index="activeRowIndex" role="presentation" item-role="presentation" :tabindex="-1">
            <template #default="{ item }">
              <div v-if="item.kind === 'group'" class="scq-auto-complete__group" role="presentation"><slot name="group" :group="item.group">{{ item.group }}</slot></div>
              <AutoCompleteOptionRow v-else :id="optionId(item)" :option="item.option" :index="item.index" :total="optionRows.length" :active="item.key === activeKey" :group="item.group" :query="query" :highlight="highlightMatch" @activate="activeKey = item.key" @select="select"><template v-if="$slots.default" #default="scope"><slot v-bind="scope" /></template></AutoCompleteOptionRow>
            </template>
            <template #empty><slot name="empty">{{ text('empty') }}</slot></template>
          </VirtualList>
          <template v-else>
            <template v-for="row in rows" :key="row.key">
              <div v-if="row.kind === 'group'" class="scq-auto-complete__group" role="presentation"><slot name="group" :group="row.group">{{ row.group }}</slot></div>
              <AutoCompleteOptionRow v-else :id="optionId(row)" :option="row.option" :index="row.index" :total="optionRows.length" :active="row.key === activeKey" :group="row.group" :query="query" :highlight="highlightMatch" @activate="activeKey = row.key" @select="select"><template v-if="$slots.default" #default="scope"><slot v-bind="scope" /></template></AutoCompleteOptionRow>
            </template>
            <div v-if="!optionRows.length" class="scq-auto-complete__status" role="presentation"><slot name="empty">{{ text('empty') }}</slot></div>
          </template>
        </div>
        <div v-if="pagination && totalPages > 1" class="scq-auto-complete__pager">
          <button type="button" :disabled="currentPage <= 1" @mousedown.prevent @click="changePage(currentPage - 1)">{{ text('previous') }}</button>
          <span aria-live="polite">{{ currentPage }} / {{ totalPages }}</span>
          <button type="button" :disabled="currentPage >= totalPages" @mousedown.prevent @click="changePage(currentPage + 1)">{{ text('next') }}</button>
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import VirtualList, { VIRTUAL_LIST_DEFAULTS, type VirtualListExpose } from '../VirtualList'
import AutoCompleteOptionRow from './AutoCompleteOption.vue'
import { AUTO_COMPLETE_CLEAR_ICON_SIZE, AUTO_COMPLETE_DEFAULTS } from './constants'
import type { AutoCompleteExpose, AutoCompleteOption, AutoCompleteProps, AutoCompleteResult, AutoCompleteSlots } from './types'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import { useComponentId } from '../../utils/id'
import { COMPOSITION_KEY_CODE, useCompositionModel } from '../../utils/composition'
import { MAX_TIMEOUT_DELAY, useLatestRequest } from '../../utils/async'

export type { AutoCompleteOption } from './types'
defineOptions({ name: 'AutoComplete', inheritAttrs: false })
const props = withDefaults(defineProps<AutoCompleteProps>(), {
  ...AUTO_COMPLETE_DEFAULTS, modelValue: '', options: () => [], showOnFocus: true,
  highlightFirstItem: false, highlightMatch: false, disabled: undefined, readonly: false,
  clearable: true, placeholder: '', ariaLabel: '', id: '', name: '', teleport: true,
  pagination: false, virtual: false, itemHeight: VIRTUAL_LIST_DEFAULTS.itemHeight, overscan: VIRTUAL_LIST_DEFAULTS.overscan,
})
defineSlots<AutoCompleteSlots>()
const emit = defineEmits<{
  (event: 'update:modelValue' | 'input' | 'change', value: string): void
  (event: 'select', value: AutoCompleteOption): void
  (event: 'clear'): void
  (event: 'focus' | 'blur', value: FocusEvent): void
  (event: 'error', error: unknown): void
  (event: 'page-change', page: number): void
}>()
interface OptionRow { kind: 'option'; key: string; option: AutoCompleteOption; index: number; group?: string }
interface GroupRow { kind: 'group'; key: string; group: string }
type SuggestionRow = OptionRow | GroupRow
const config = useConfig()
const text = useLocale()
const rootRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const contentRef = ref<HTMLElement>()
const virtualRef = ref<VirtualListExpose>()
const listId = useComponentId('scq-suggestions')
const query = ref(props.modelValue)
const opened = ref(false)
const activeKey = ref<string>()
const currentPage = ref(1)
const failed = ref(false)
const debouncing = ref(false)
const remote = ref<AutoCompleteOption[]>([])
const remoteTotal = ref<number>()
const cache = new Map<string, { result: AutoCompleteResult; expiresAt: number }>()
let timer: ReturnType<typeof setTimeout> | undefined
let inFlightKey: string | undefined
let openingEdge: 'first' | 'last' | undefined
let suppressFocusRequest = false
let disposed = false
const request = useLatestRequest<{ key: string; result: AutoCompleteResult }>(({ key, result }) => {
  if (props.cacheTtl > 0) cache.set(key, { result, expiresAt: Date.now() + props.cacheTtl })
  applyResult(result)
}, (error) => { failed.value = true; emit('error', error) })
const loading = computed(() => debouncing.value || request.pending.value)
const contains = (target: Node) => Boolean(rootRef.value?.contains(target) || contentRef.value?.contains(target))
const field = useFormControl({
  element: () => inputRef.value, id: () => props.id, disabled: () => props.disabled,
  ariaLabel: () => props.ariaLabel, busy: () => loading.value, contains, composite: true,
})
const isDisabled = field.disabled
const eligible = computed(() => query.value.length >= props.minLength)
const filteredOptions = computed(() => {
  if (!eligible.value) return []
  if (props.fetchSuggestions) return remote.value
  return props.options.filter((option) => props.filterMethod
    ? props.filterMethod(query.value, option)
    : (option.label || option.value).toLocaleLowerCase().includes(query.value.toLocaleLowerCase()))
})
const totalPages = computed(() => props.pagination
  ? Math.max(1, Math.ceil((props.fetchSuggestions ? remoteTotal.value ?? 0 : filteredOptions.value.length) / props.pageSize)) : 1)
const candidates = computed(() => props.pagination && !props.fetchSuggestions
  ? filteredOptions.value.slice((currentPage.value - 1) * props.pageSize, currentPage.value * props.pageSize) : filteredOptions.value)
const rows = computed<SuggestionRow[]>(() => {
  const groups = new Map<string | undefined, AutoCompleteOption[]>()
  for (const option of candidates.value) {
    const group = props.groupBy?.(option)
    const options = groups.get(group)
    if (options) options.push(option)
    else groups.set(group, [option])
  }
  const result: SuggestionRow[] = []
  const occurrences = new Map<string, number>()
  let index = 0
  for (const [group, options] of groups) {
    if (group !== undefined) result.push({ kind: 'group', key: `group:${group}`, group })
    for (const option of options) {
      const occurrence = occurrences.get(option.value) ?? 0
      occurrences.set(option.value, occurrence + 1)
      result.push({ kind: 'option', key: `option:${JSON.stringify([option.value, occurrence])}`, option, index: index++, group })
    }
  }
  return result
})
const optionRows = computed(() => rows.value.filter((row): row is OptionRow => row.kind === 'option'))
const rowKey = (row: SuggestionRow) => row.key
const activeOption = computed(() => optionRows.value.find((row) => row.key === activeKey.value && !row.option.disabled))
const activeRowIndex = computed(() => {
  const index = rows.value.findIndex((row) => row.key === activeKey.value)
  return index >= 0 ? index : undefined
})
const optionId = (row: OptionRow) => `${listId}-${row.index}`
const activeId = computed(() => opened.value && !loading.value && !failed.value && activeOption.value ? optionId(activeOption.value) : undefined)
const revealActive = async () => {
  await nextTick()
  if (!opened.value || !activeOption.value || loading.value || failed.value) return
  if (props.virtual && activeRowIndex.value !== undefined) virtualRef.value?.scrollToIndex(activeRowIndex.value, { align: 'auto' })
  await nextTick()
  if (activeId.value) inputRef.value?.ownerDocument.getElementById(activeId.value)?.scrollIntoView?.({ block: 'nearest' })
}
const syncActive = () => {
  if (!activeOption.value) {
    const enabled = optionRows.value.filter((row) => !row.option.disabled)
    activeKey.value = openingEdge === 'last' ? enabled.at(-1)?.key
      : activeKey.value !== undefined || props.highlightFirstItem || openingEdge === 'first' ? enabled[0]?.key : undefined
  }
  openingEdge = undefined
  if (opened.value) void revealActive()
}
const applyResult = (result: AutoCompleteResult) => {
  remote.value = result.list
  remoteTotal.value = result.total ?? result.list.length
  syncActive()
}
const cancel = () => {
  request.cancel()
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
  debouncing.value = false
  inFlightKey = undefined
}
const close = () => {
  opened.value = false
  cancel()
  activeKey.value = undefined
  openingEdge = undefined
  composition.cancel(inputRef.value, query.value)
}
const validOption = (value: unknown): value is AutoCompleteOption => Boolean(value && typeof value === 'object'
  && 'value' in value && typeof value.value === 'string'
  && (!('label' in value) || value.label === undefined || typeof value.label === 'string')
  && (!('disabled' in value) || value.disabled === undefined || typeof value.disabled === 'boolean'))
const normalizeResult = (input: unknown): AutoCompleteResult => {
  const result = Array.isArray(input) ? { list: input } : input
  if (!result || typeof result !== 'object' || !('list' in result) || !Array.isArray(result.list) || !result.list.every(validOption)) {
    throw new TypeError('[scq-vue] AutoComplete fetchSuggestions must return options or { list, total? }.')
  }
  const total = 'total' in result ? result.total : undefined
  if (total !== undefined && (typeof total !== 'number' || !Number.isInteger(total) || total < 0)) {
    throw new TypeError('[scq-vue] AutoComplete total must be a non-negative integer.')
  }
  return { list: result.list, total }
}
const suggest = (force = false, immediate = false): Promise<boolean> => {
  if (disposed || isDisabled.value || props.readonly || composition.composing.value) return Promise.resolve(false)
  if (!eligible.value) { close(); return Promise.resolve(false) }
  opened.value = true
  if (!props.fetchSuggestions) { failed.value = false; syncActive(); return Promise.resolve(true) }
  const key = JSON.stringify([query.value, currentPage.value, props.pageSize])
  if (!force && loading.value && inFlightKey === key) return Promise.resolve(false)
  cancel()
  failed.value = false
  const now = Date.now()
  for (const [cacheKey, cached] of cache) if (cached.expiresAt <= now) cache.delete(cacheKey)
  if (force) cache.delete(key)
  const cached = cache.get(key)
  if (!force && cached) { applyResult(cached.result); return Promise.resolve(true) }
  remote.value = []
  inFlightKey = key
  const provider = props.fetchSuggestions
  const keyword = query.value
  const context = { page: currentPage.value, pageSize: props.pageSize }
  const execute = () => {
    timer = undefined
    debouncing.value = false
    return request.run(async (signal) => ({ key, result: normalizeResult(await provider(keyword, signal, context)) }))
  }
  if (immediate || props.debounce === 0) return execute()
  debouncing.value = true
  timer = setTimeout(() => { void execute() }, props.debounce)
  return Promise.resolve(false)
}
const update = (value: string) => {
  if (isDisabled.value || props.readonly || value === query.value) return
  query.value = value
  currentPage.value = 1
  remoteTotal.value = undefined
  activeKey.value = undefined
  emit('update:modelValue', value)
  emit('input', value)
  void suggest()
}
const composition = useCompositionModel(() => query.value, update)
const beginComposition = () => { composition.start(); cancel(); activeKey.value = undefined }
const focus = (event: FocusEvent) => { emit('focus', event); if (props.showOnFocus && !suppressFocusRequest) void suggest() }
const clickInput = () => { if (!opened.value && props.showOnFocus) void suggest() }
const finishBlur = (event: FocusEvent) => {
  field.touch(event)
  if (event.relatedTarget instanceof Node && contains(event.relatedTarget)) return
  close()
  emit('change', query.value)
}
const blur = (event: FocusEvent) => { emit('blur', event); finishBlur(event) }
const focusOut = (event: FocusEvent) => { if (event.target !== inputRef.value) finishBlur(event) }
const restoreFocus = () => {
  suppressFocusRequest = true
  field.focus()
  suppressFocusRequest = false
}
const togglePanel = (value: boolean) => {
  if (value) { void suggest(); return }
  close()
  suppressFocusRequest = true
  void nextTick(() => { suppressFocusRequest = false })
}
const select = (option: AutoCompleteOption) => {
  if (disposed || isDisabled.value || props.readonly || loading.value || failed.value || composition.composing.value || option.disabled || !candidates.value.includes(option)) return
  query.value = option.value
  close()
  emit('update:modelValue', option.value)
  emit('change', option.value)
  emit('select', option)
  restoreFocus()
}
const clear = () => {
  if (isDisabled.value || props.readonly) return
  composition.cancel(inputRef.value, '')
  update('')
  emit('clear')
  restoreFocus()
}
const changePage = (page: number) => {
  if (isDisabled.value || props.readonly || composition.composing.value) return
  const next = Math.max(1, Math.min(page, totalPages.value))
  if (next === currentPage.value) return
  currentPage.value = next
  emit('page-change', next)
  void suggest(false, true)
}
const keydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || composition.composing.value || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey || isDisabled.value || props.readonly) return
  if (event.key === 'Escape') {
    if (opened.value) { event.preventDefault(); event.stopPropagation(); close() }
    return
  }
  if (event.key === 'Enter' && opened.value && activeOption.value && !loading.value && !failed.value) {
    event.preventDefault()
    select(activeOption.value.option)
    return
  }
  if (opened.value && props.pagination && ['PageDown', 'PageUp'].includes(event.key)) {
    event.preventDefault()
    changePage(currentPage.value + (event.key === 'PageDown' ? 1 : -1))
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  if (['Home', 'End'].includes(event.key) && (!opened.value || event.ctrlKey || event.metaKey)) return
  event.preventDefault()
  if (!opened.value) {
    openingEdge = event.key === 'ArrowUp' ? 'last' : 'first'
    void suggest()
    return
  }
  if (loading.value || failed.value) return
  const enabled = optionRows.value.filter((row) => !row.option.disabled)
  if (!enabled.length) return
  const current = enabled.findIndex((row) => row.key === activeKey.value)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1
    : event.key === 'ArrowDown' ? (current + 1) % enabled.length : (current < 0 ? enabled.length - 1 : (current - 1 + enabled.length) % enabled.length)
  activeKey.value = enabled[next].key
  void revealActive()
}
const refresh = () => suggest(true, true)
const clearCache = () => { cancel(); cache.clear() }
watch(() => props.modelValue, (value) => {
  if (value === query.value) return
  cancel()
  composition.cancel(inputRef.value, value)
  query.value = value
  currentPage.value = 1
  remoteTotal.value = undefined
  activeKey.value = undefined
  if (opened.value) void suggest()
}, { flush: 'sync' })
watch([isDisabled, () => props.readonly], ([disabled, readonly]) => { if (disabled || readonly) close() }, { flush: 'sync' })
watch([() => props.fetchSuggestions, () => props.pageSize, () => props.pagination, () => props.cacheTtl], () => {
  clearCache()
  remote.value = []
  remoteTotal.value = undefined
  failed.value = false
  currentPage.value = 1
  activeKey.value = undefined
  if (opened.value) void suggest()
}, { flush: 'sync' })
watch(() => props.minLength, () => {
  if (!eligible.value) close()
  else if (opened.value) void suggest()
})
watch(optionRows, () => { if (!loading.value) syncActive() })
watch([totalPages, loading], () => {
  if (loading.value || failed.value || currentPage.value <= totalPages.value) return
  currentPage.value = totalPages.value
  if (opened.value) void suggest(false, true)
})
watch(loading, (value) => { if (!value && !failed.value) void revealActive() })
watch(() => [props.virtual, props.height, props.itemHeight, props.overscan], () => { if (opened.value) void revealActive() })
watch(() => [props.debounce, props.minLength, props.cacheTtl, props.pageSize, props.height, props.itemHeight, props.overscan], () => {
  if (![props.debounce, props.cacheTtl].every((value) => Number.isFinite(value) && value >= 0)
    || props.debounce > MAX_TIMEOUT_DELAY
    || ![props.minLength, props.overscan].every((value) => Number.isInteger(value) && value >= 0)
    || !Number.isInteger(props.pageSize) || props.pageSize <= 0
    || ![props.height, props.itemHeight].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError(`[scq-vue] AutoComplete requires non-negative debounce/cacheTtl, debounce no greater than ${MAX_TIMEOUT_DELAY}, non-negative integer minLength/overscan, a positive integer pageSize and positive height/itemHeight.`)
  }
}, { immediate: true })
onBeforeUnmount(() => { disposed = true; cancel() })
defineExpose<AutoCompleteExpose>({ focus: () => { field.focus() }, blur: () => inputRef.value?.blur(), close, refresh, retry: refresh, clearCache })
</script>