<template>
  <div
    ref="rootRef"
    v-bind="field.rootAttrs.value"
    class="scq-select"
    :class="[`scq-select--${size}`, { 'is-open': visible, 'is-disabled': disabled }]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div
      ref="controlRef"
      class="scq-select__control"
      :role="filterable ? undefined : 'combobox'"
      :tabindex="filterable || disabled ? undefined : 0"
      :aria-expanded="filterable ? undefined : visible"
      :aria-disabled="disabled ? 'true' : 'false'"
      :aria-readonly="readonly || undefined"
      :aria-label="filterable ? undefined : ariaLabel || placeholder"
      :aria-controls="!filterable && visible ? listId : undefined"
      :aria-activedescendant="!filterable && visible && active >= 0 ? optionId(visibleOptions[active]) : undefined"
      :aria-haspopup="filterable ? undefined : 'listbox'"
      v-bind="filterable ? undefined : field.attrs.value"
      @mousedown="handleControlMousedown"
      @click="handleControlClick"
      @keydown="handleKeydown"
      @focusout="handleBlur"
    >
      <div class="scq-select__value">
        <template v-if="multiple">
          <template v-if="selectedOptions.length">
            <span v-for="option in selectedOptions" :key="optionKey(option)" class="scq-select__tag">
              {{ option.label }}
              <button
                v-if="!disabled && !readonly"
                type="button"
                class="scq-select__tag-close"
                :aria-label="text('remove')"
                @click.stop="removeTag(option.value)"
              >
                ×
              </button>
            </span>
          </template>
          <input
            v-if="filterable"
            ref="inputRef"
            v-model="composition.model.value"
            class="scq-select__inner"
            type="text"
            :placeholder="selectedOptions.length ? '' : placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :aria-label="ariaLabel || placeholder"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            :aria-expanded="visible"
            :aria-controls="visible ? listId : undefined"
            :aria-activedescendant="visible && active >= 0 ? optionId(visibleOptions[active]) : undefined"
            v-bind="field.attrs.value"
            @focus="handleInputFocus"
            @blur="field.touch"
            @compositionstart="beginComposition"
            @compositionend="composition.end"
          />
          <span v-else-if="!selectedOptions.length" class="scq-select__placeholder">{{ placeholder }}</span>
        </template>

        <template v-else>
          <input
            v-if="filterable"
            ref="inputRef"
            v-model="composition.model.value"
            class="scq-select__inner"
            type="text"
            :placeholder="selectedOptions[0] ? '' : placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :aria-label="ariaLabel || placeholder"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            :aria-expanded="visible"
            :aria-controls="visible ? listId : undefined"
            :aria-activedescendant="visible && active >= 0 ? optionId(visibleOptions[active]) : undefined"
            v-bind="field.attrs.value"
            @focus="handleInputFocus"
            @blur="field.touch"
            @compositionstart="beginComposition"
            @compositionend="composition.end"
          />
          <span v-else-if="selectedOptions[0]">{{ selectedOptions[0].label }}</span>
          <span v-else class="scq-select__placeholder">{{ placeholder }}</span>
        </template>
      </div>

      <div class="scq-select__actions">
        <button
          v-if="showClear"
          type="button"
          class="scq-select__clear"
          :aria-label="text('clear')"
          @click.stop="clearValue"
        >
          <span class="scq-select__clear-icon">×</span>
        </button>
        <span v-else class="scq-select__arrow" :class="{ 'is-open': visible }">
          <span class="scq-select__arrow-icon"></span>
        </span>
      </div>
    </div>

    <Teleport to="body" :disabled="!teleported">
      <Transition name="scq-select-drop">
        <div
          v-if="visible"
          ref="panelRef"
          class="scq-select__panel"
          :class="[`scq-select__panel--${size}`, `is-${dropdownPlacement}`]"
          :style="panelStyle"
          @focusout="handleBlur"
        >
          <div :id="listId" class="scq-select__list" :class="{ 'is-virtual': virtual }" role="listbox" :aria-label="ariaLabel || placeholder" :aria-multiselectable="multiple || undefined" :aria-busy="loading || undefined" @click.stop>
            <div v-if="loading" class="scq-select__empty" role="status">{{ text('selectLoading') }}</div>
            <div v-else-if="failed" class="scq-select__empty" role="alert">
              {{ text('loadError') }} <button type="button" @mousedown.prevent @click="refreshRemote">{{ text('retryAction') }}</button>
            </div>
            <VirtualList v-else-if="virtual" ref="virtualRef" :items="visibleOptions" :height="virtualHeight" :item-height="itemHeight" :overscan="overscan" :item-key="optionKey" :active-index="active >= 0 ? active : undefined" role="presentation" item-role="presentation" :tabindex="-1">
              <template #default="{ item, index }"><SelectOptionRow :option="item" :index="index" :total="visibleOptions.length" :id="optionId(item)" :selected="isSelected(item.value)" :active="active === index" @select="selectOption" @activate="active = $event"><template #default="scope"><slot name="option" v-bind="scope">{{ item.label }}</slot></template></SelectOptionRow></template>
              <template #empty><slot name="empty">{{ text('noMatch') }}</slot></template>
            </VirtualList>
            <div v-else role="presentation">
              <SelectOptionRow v-for="(option, index) in visibleOptions" :key="optionKey(option)" :option="option" :index="index" :total="visibleOptions.length" :id="optionId(option)" :selected="isSelected(option.value)" :active="active === index" @select="selectOption" @activate="active = $event"><template #default="scope"><slot name="option" v-bind="scope">{{ option.label }}</slot></template></SelectOptionRow>
              <div v-if="!visibleOptions.length" class="scq-select__empty" role="presentation"><slot name="empty">{{ text('noMatch') }}</slot></div>
            </div>
          </div>

          <div v-if="shouldShowPagination" class="scq-select__pager">
            <button
              type="button"
              class="scq-select__pager-btn"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              {{ text('previous') }}
            </button>
            <span class="scq-select__pager-text">{{ currentPage }} / {{ totalPages }}</span>
            <button
              type="button"
              class="scq-select__pager-btn"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              {{ text('next') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { useConfig, useLocale, useThemeStyle } from '../ConfigProvider/context'
import VirtualList, { VIRTUAL_LIST_DEFAULTS, type VirtualListExpose } from '../VirtualList'
import SelectOptionRow from './SelectOption.vue'
import { SELECT_DEFAULTS } from './constants'
import type { SelectOption, SelectRemoteMethod, SelectSize, SelectValue, RemoteResult } from './types'
import { useComponentId } from '../../utils/id'
import { MAX_TIMEOUT_DELAY, useLatestRequest } from '../../utils/async'
import { useLayer } from '../../utils/modal'
import { COMPOSITION_KEY_CODE, useCompositionModel } from '../../utils/composition'
import { useUpdateFocus } from '../../utils/focus'
import { useFormControl } from '../Form/useFormControl'
import { autoUpdate } from '@floating-ui/dom'
export type { SelectOption, RemoteResult } from './types'

defineOptions({
  name: 'Select',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: SelectValue | SelectValue[] | null
    options?: readonly SelectOption[]
    multiple?: boolean
    disabled?: boolean
    readonly?: boolean
    placeholder?: string
    clearable?: boolean
    filterable?: boolean
    remote?: boolean
    remoteMethod?: SelectRemoteMethod
    pagination?: boolean
    pageSize?: number
    debounce?: number
    size?: SelectSize
    teleported?: boolean
    popperZIndex?: number
    id?: string
    ariaLabel?: string
    virtual?: boolean
    height?: number
    itemHeight?: number
    overscan?: number
  }>(),
  {
    modelValue: null,
    options: () => [],
    multiple: false,
    disabled: undefined,
    readonly: false,
    clearable: true,
    filterable: false,
    remote: false,
    remoteMethod: undefined,
    pagination: false,
    pageSize: SELECT_DEFAULTS.pageSize,
    debounce: SELECT_DEFAULTS.debounce,
    teleported: true,
    virtual: false,
    height: SELECT_DEFAULTS.listHeight,
    itemHeight: VIRTUAL_LIST_DEFAULTS.itemHeight,
    overscan: VIRTUAL_LIST_DEFAULTS.overscan,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue | SelectValue[] | null): void
  (e: 'change', value: SelectValue | SelectValue[] | null): void
  (e: 'clear'): void
  (e: 'search', value: string): void
  (e: 'visible-change', visible: boolean): void
  (e: 'error', error: unknown): void
  (e: 'page-change', page: number): void
}>()

const config = useConfig()
const text = useLocale()
const themeStyle = useThemeStyle()
const size = computed(() => props.size ?? config.value.size)
const placeholder = computed(() => props.placeholder ?? text('choose'))
const rootRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const controlRef = ref<HTMLElement>()
useUpdateFocus(() => controlRef.value, undefined, () => inputRef.value ?? controlRef.value)
const virtualRef = ref<VirtualListExpose>()
const listId = useComponentId('scq-select-options')
const active = ref(-1)
let openingEdge: 'first' | 'last' = 'first'
const visible = ref(false)
const hovering = ref(false)
const searchKeyword = ref('')
const isFiltering = ref(false)
const currentPage = ref(1)
const remoteOptions = ref<SelectOption[]>([])
const remoteTotal = ref<number>()
const failed = ref(false)
const debouncing = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let inFlightKey: string | undefined
let mounted = false
let pointerHandled = false
let stopPosition: (() => void) | undefined
let positionVersion = 0
const panelRect = ref({ top: 0, bottom: 0, left: 0, width: 0, maxHeight: 0 })
const dropdownPlacement = ref<'bottom' | 'top'>('bottom')
const remoteCache = ref(new Map<string, RemoteResult>())
const knownOptions = ref(new Map<SelectValue, SelectOption>())
const request = useLatestRequest<{ key: string; result: RemoteResult }>(({ key, result }) => {
  remoteCache.value.set(key, result)
  remoteOptions.value = result.list
  remoteTotal.value = result.total ?? result.list.length
  result.list.forEach((option) => knownOptions.value.set(option.value, option))
  resetActive()
}, (error) => { failed.value = true; emit('error', error) })
const loading = computed(() => debouncing.value || request.pending.value)
const field = useFormControl({
  element: () => inputRef.value ?? controlRef.value,
  id: () => props.id, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel,
  busy: () => loading.value, composite: true,
  contains: (target) => Boolean(rootRef.value?.contains(target) || panelRef.value?.contains(target) || layer.contains(target)),
})
const disabled = field.disabled
const layer = useLayer(() => visible.value, panelRef, {
  lockScroll: () => false, trapFocus: false, reference: () => rootRef.value,
  closeOnPressEscape: () => true, onEscape: () => closePanel(),
  zIndex: () => props.popperZIndex, defaultZIndex: SELECT_DEFAULTS.panelZIndex,
})
const optionKey = (option: SelectOption) => `${typeof option.value}:${String(option.value)}`
const optionId = (option?: SelectOption) => option ? `${listId}-${encodeURIComponent(optionKey(option))}` : undefined

const normalizedModel = computed<SelectValue[]>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? [...new Set(props.modelValue)] : []
  }
  if (props.modelValue === null || Array.isArray(props.modelValue) || props.modelValue === undefined) {
    return []
  }
  return [props.modelValue]
})

const baseOptions = computed<readonly SelectOption[]>(() => {
  return props.remote ? remoteOptions.value : props.options
})

const filterKeyword = computed(() => {
  return props.filterable && isFiltering.value ? searchKeyword.value.trim() : ''
})

const filteredOptions = computed<readonly SelectOption[]>(() => {
  if (props.remote || !props.filterable) {
    return baseOptions.value
  }
  const keyword = filterKeyword.value.toLowerCase()
  if (!keyword) {
    return baseOptions.value
  }
  return baseOptions.value.filter((option) => option.label.toLowerCase().includes(keyword))
})

const selectedOptions = computed<SelectOption[]>(() => {
  return normalizedModel.value.map((value) => knownOptions.value.get(value) ?? { value, label: String(value) })
})

const totalCount = computed(() => {
  if (props.remote) {
    return remoteTotal.value ?? filteredOptions.value.length
  }
  return filteredOptions.value.length
})

const totalPages = computed(() => {
  if (!props.pagination) {
    return 1
  }
  return Math.max(1, Math.ceil(totalCount.value / props.pageSize))
})

const shouldShowPagination = computed(() => props.pagination && totalPages.value > 1)

const visibleOptions = computed<readonly SelectOption[]>(() => {
  if (!props.pagination || props.remote) {
    return filteredOptions.value
  }
  const start = (currentPage.value - 1) * props.pageSize
  return filteredOptions.value.slice(start, start + props.pageSize)
})

const hasValue = computed(() => normalizedModel.value.length > 0)
const showClear = computed(() => props.clearable && hasValue.value && !disabled.value && !props.readonly && (hovering.value || visible.value))
const remoteRequestKey = computed(() => JSON.stringify([filterKeyword.value, currentPage.value, props.pageSize]))
const virtualHeight = computed(() => Math.max(0, Math.min(props.height, panelRect.value.maxHeight ? panelRect.value.maxHeight - (shouldShowPagination.value ? SELECT_DEFAULTS.pagerHeight : 0) : props.height)))
const panelStyle = computed<CSSProperties>(() => {
  if (!props.teleported) {
    return { ...themeStyle.value, zIndex: layer.zIndex.value }
  }
  return {
    ...themeStyle.value,
    position: 'fixed',
    top: dropdownPlacement.value === 'bottom' ? `${panelRect.value.top}px` : 'auto',
    left: `${panelRect.value.left}px`,
    width: `${panelRect.value.width}px`,
    maxHeight: panelRect.value.maxHeight ? `${panelRect.value.maxHeight}px` : undefined,
    right: 'auto',
    bottom: dropdownPlacement.value === 'top' ? `${panelRect.value.bottom}px` : 'auto',
    zIndex: String(layer.zIndex.value),
  }
})

const ensurePageRange = () => {
  if (loading.value) return
  const next = Math.max(1, Math.min(currentPage.value, totalPages.value))
  if (next === currentPage.value) return
  currentPage.value = next
  if (mounted && props.remote && visible.value) void fetchRemoteOptions()
}

const cancelRequest = () => {
  request.cancel()
  if (debounceTimer !== undefined) clearTimeout(debounceTimer)
  debounceTimer = undefined
  debouncing.value = false
  inFlightKey = undefined
}
const validOption = (value: unknown): value is SelectOption => Boolean(value && typeof value === 'object'
  && 'label' in value && typeof value.label === 'string'
  && 'value' in value && (typeof value.value === 'string' || typeof value.value === 'number' && Number.isFinite(value.value))
  && (!('disabled' in value) || value.disabled === undefined || typeof value.disabled === 'boolean'))
const normalizeRemote = (input: unknown): RemoteResult => {
  const result = Array.isArray(input) ? { list: input } : input
  if (!result || typeof result !== 'object' || !('list' in result) || !Array.isArray(result.list) || !result.list.every(validOption)) {
    throw new TypeError('[scq-vue] Select remoteMethod must return options or { list, total? }.')
  }
  const total = 'total' in result ? result.total : undefined
  if (total !== undefined && (typeof total !== 'number' || !Number.isInteger(total) || total < 0)) {
    throw new TypeError('[scq-vue] Select remote total must be a non-negative integer.')
  }
  if (new Set(result.list.map((option) => option.value)).size !== result.list.length) {
    throw new TypeError('[scq-vue] Select remote option values must be unique.')
  }
  return { list: result.list, total }
}
const fetchRemoteOptions = (force = false) => {
  if (!props.remote || composition.composing.value) return Promise.resolve(false)
  const requestKey = remoteRequestKey.value
  if (!force && request.pending.value && inFlightKey === requestKey) return Promise.resolve(false)
  const cached = remoteCache.value.get(requestKey)
  cancelRequest()
  failed.value = false
  if (!force && cached) {
    remoteOptions.value = cached.list
    remoteTotal.value = cached.total ?? cached.list.length
    cached.list.forEach((option) => knownOptions.value.set(option.value, option))
    resetActive()
    return Promise.resolve(true)
  }
  remoteOptions.value = []
  active.value = -1
  inFlightKey = requestKey
  const method = props.remoteMethod
  const query = filterKeyword.value
  const page = currentPage.value
  const pageSize = props.pageSize
  return request.run(async (signal) => {
    if (!method) throw new TypeError('[scq-vue] Select remote mode requires remoteMethod.')
    return { key: requestKey, result: normalizeRemote(await method(query, page, pageSize, signal)) }
  })
}

const runSearch = () => {
  if (!isFiltering.value || disabled.value || props.readonly || composition.composing.value) return
  cancelRequest()
  emit('search', filterKeyword.value)
  currentPage.value = 1
  openingEdge = 'first'
  active.value = -1
  failed.value = false
  if (!props.remote) { resetActive(); return }
  remoteOptions.value = []
  remoteTotal.value = undefined
  debouncing.value = true
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined
    debouncing.value = false
    void fetchRemoteOptions()
  }, props.debounce)
}

const selectedKeys = computed(() => new Set(normalizedModel.value))
const isSelected = (value: SelectValue) => selectedKeys.value.has(value)
const sameValue = (first: SelectValue, second: SelectValue) => first === second || Object.is(first, second)
const resetActive = () => {
  const options = visibleOptions.value
  const selected = options.findIndex((option) => !option.disabled && isSelected(option.value))
  active.value = selected >= 0 ? selected : openingEdge === 'last'
    ? options.findLastIndex((option) => !option.disabled) : options.findIndex((option) => !option.disabled)
  if (visible.value) void revealActive()
}
const syncInputLabel = () => {
  if (!isFiltering.value && !props.multiple && !composition.composing.value) searchKeyword.value = selectedOptions.value[0]?.label ?? ''
}
const updateSearch = (value: string) => {
  if (disabled.value || props.readonly) return
  isFiltering.value = true
  searchKeyword.value = value
  if (!visible.value) visible.value = true
  runSearch()
}
const composition = useCompositionModel(() => searchKeyword.value, updateSearch)
const beginComposition = () => { composition.start(); isFiltering.value = true; cancelRequest() }

const selectOption = (option: SelectOption) => {
  if (disabled.value || props.readonly || loading.value || failed.value || composition.composing.value || option.disabled || !visibleOptions.value.includes(option)) {
    return
  }
  let nextValue: SelectValue | SelectValue[] | null = null
  if (props.multiple) {
    const current = [...normalizedModel.value]
    const index = current.findIndex((item) => sameValue(item, option.value))
    if (index === -1) {
      current.push(option.value)
    } else {
      current.splice(index, 1)
    }
    nextValue = current
  } else {
    nextValue = option.value
    isFiltering.value = false
    searchKeyword.value = option.label
    closePanel()
  }
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

const clearValue = () => {
  cancelRequest()
  composition.cancel(inputRef.value, '')
  const value = props.multiple ? [] : null
  emit('update:modelValue', value)
  emit('change', value)
  emit('clear')
  isFiltering.value = false
  searchKeyword.value = ''
  currentPage.value = 1
  active.value = -1
  if (visible.value && props.remote && !disabled.value && !props.readonly) void fetchRemoteOptions()
}

const openPanel = () => {
  if (disabled.value || props.readonly) {
    return
  }
  const wasVisible = visible.value
  if (!wasVisible && props.filterable) { isFiltering.value = false; currentPage.value = 1; syncInputLabel() }
  visible.value = true
  void updatePanelRect()
  if (!wasVisible) resetActive()
  if (!wasVisible && props.remote) {
    void fetchRemoteOptions()
  }
}

const toggleVisible = () => {
  if (visible.value) closePanel()
  else openPanel()
}

const handleControlMousedown = (event: MouseEvent) => {
  if (props.filterable || disabled.value || props.readonly || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
  event.preventDefault()
  pointerHandled = true
  toggleVisible()
  controlRef.value?.focus()
}

const handleControlClick = (event: MouseEvent) => {
  if (disabled.value || props.readonly) return
  if (pointerHandled && event.detail > 0) { pointerHandled = false; return }
  pointerHandled = false
  if (props.filterable) {
    openPanel()
    inputRef.value?.focus()
    return
  }
  toggleVisible()
}

const handleInputFocus = () => {
  if (!visible.value) {
    isFiltering.value = false
    currentPage.value = 1
  }
  openPanel()
}

const removeTag = (value: SelectValue) => {
  if (!props.multiple || disabled.value || props.readonly) {
    return
  }
  const next = normalizedModel.value.filter((item) => !sameValue(item, value))
  emit('update:modelValue', next)
  emit('change', next)
}

const closePanel = () => {
  visible.value = false
  cancelRequest()
  if (isFiltering.value) currentPage.value = 1
  isFiltering.value = false
  composition.cancel(inputRef.value, props.multiple ? '' : selectedOptions.value[0]?.label ?? '')
  searchKeyword.value = props.multiple ? '' : selectedOptions.value[0]?.label ?? ''
  typeahead = ''
}

const changePage = (page: number) => {
  if (disabled.value || props.readonly) return
  const next = Math.min(Math.max(page, 1), totalPages.value)
  if (next === currentPage.value) return
  currentPage.value = next
  emit('page-change', next)
  openingEdge = 'first'
  resetActive()
  if (props.remote) {
    void fetchRemoteOptions()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (!visible.value) return
  const target = event.target as Node
  if (rootRef.value?.contains(target)) {
    return
  }
  if (panelRef.value?.contains(target) || layer.contains(target)) {
    return
  }
  if (rootRef.value) {
    closePanel()
  }
}

const handleBlur = (event: FocusEvent) => {
  field.touch(event)
  const target = event.relatedTarget as Node | null
  if (!target || (!rootRef.value?.contains(target) && !panelRef.value?.contains(target) && !layer.contains(target))) closePanel()
}

const getEstimatedPanelHeight = () => {
  if (props.virtual && !loading.value && !failed.value) return props.height + (shouldShowPagination.value ? SELECT_DEFAULTS.pagerHeight : 0)
  const optionCount = loading.value || !visibleOptions.value.length ? 1 : visibleOptions.value.length
  const optionHeight = loading.value || !visibleOptions.value.length ? SELECT_DEFAULTS.emptyHeight : SELECT_DEFAULTS.optionHeights[size.value]
  const listHeight = Math.min(SELECT_DEFAULTS.listHeight, optionCount * optionHeight + SELECT_DEFAULTS.listPadding)
  return listHeight + (shouldShowPagination.value ? SELECT_DEFAULTS.pagerHeight : 0)
}

const updatePanelRect = async () => {
  if (!rootRef.value) {
    return
  }

  if (visible.value) {
    await nextTick()
  }

  if (!rootRef.value || !visible.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const panelHeight = Math.max(panelRef.value?.offsetHeight ?? 0, getEstimatedPanelHeight())
  const spaceBelow = window.innerHeight - rect.bottom - SELECT_DEFAULTS.viewportPadding - SELECT_DEFAULTS.panelGap
  const spaceAbove = rect.top - SELECT_DEFAULTS.viewportPadding - SELECT_DEFAULTS.panelGap
  const shouldPlaceTop = panelHeight > spaceBelow && spaceAbove > spaceBelow
  dropdownPlacement.value = shouldPlaceTop ? 'top' : 'bottom'

  const availableHeight = Math.max(0, shouldPlaceTop ? spaceAbove : spaceBelow)
  const width = Math.min(rect.width, Math.max(0, window.innerWidth - SELECT_DEFAULTS.viewportPadding * 2))
  panelRect.value = {
    top: rect.bottom + SELECT_DEFAULTS.panelGap,
    bottom: window.innerHeight - rect.top + SELECT_DEFAULTS.panelGap,
    left: Math.max(SELECT_DEFAULTS.viewportPadding, Math.min(rect.left, window.innerWidth - SELECT_DEFAULTS.viewportPadding - width)),
    width,
    maxHeight: availableHeight,
  }
}

const bindPositionListeners = async () => {
  const version = ++positionVersion
  await nextTick()
  if (version !== positionVersion || !visible.value || !rootRef.value || !panelRef.value) return
  stopPosition?.()
  stopPosition = autoUpdate(rootRef.value, panelRef.value, () => { void updatePanelRect() }, {
    elementResize: typeof ResizeObserver !== 'undefined',
    layoutShift: typeof IntersectionObserver !== 'undefined',
  })
}

const unbindPositionListeners = () => {
  positionVersion += 1
  stopPosition?.()
  stopPosition = undefined
}

watch(() => [props.pageSize, props.debounce, props.height], () => {
  if (!Number.isInteger(props.pageSize) || props.pageSize <= 0) throw new RangeError('[scq-vue] Select pageSize must be a positive integer.')
  if (!Number.isFinite(props.debounce) || props.debounce < 0 || props.debounce > MAX_TIMEOUT_DELAY) throw new RangeError(`[scq-vue] Select debounce must be between zero and ${MAX_TIMEOUT_DELAY}.`)
  if (!Number.isFinite(props.height) || props.height < 0) throw new RangeError('[scq-vue] Select height must be finite and non-negative.')
}, { immediate: true, flush: 'sync' })

watch(
  () => props.options,
  () => {
    props.options.forEach((option) => knownOptions.value.set(option.value, option))
    ensurePageRange()
  },
  { immediate: true, deep: true },
)

watch(
  () => [props.pageSize, props.pagination],
  () => {
    cancelRequest()
    remoteCache.value.clear()
    currentPage.value = 1
    ensurePageRange()
    if (mounted && props.remote) void fetchRemoteOptions()
  },
)

watch([totalPages, loading], ensurePageRange)
watch([disabled, () => props.readonly], ([locked, readonly]) => { if (locked || readonly) closePanel() }, { flush: 'sync' })
watch(() => selectedOptions.value.map((option) => option.label), syncInputLabel)
watch(visibleOptions, () => { if (!loading.value) resetActive() })

watch(
  () => [props.remoteMethod, props.remote],
  () => {
    cancelRequest()
    remoteCache.value.clear()
    knownOptions.value.clear()
    props.options.forEach((option) => knownOptions.value.set(option.value, option))
    remoteOptions.value = []
    remoteTotal.value = undefined
    currentPage.value = 1
    if (mounted && props.remote) void fetchRemoteOptions()
  },
  { flush: 'sync' },
)

watch(visible, (nextVisible) => {
  if (nextVisible) {
    void updatePanelRect()
    bindPositionListeners()
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('pointerdown', handleClickOutside)
  } else {
    cancelRequest()
    unbindPositionListeners()
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('pointerdown', handleClickOutside)
  }
  emit('visible-change', nextVisible)
})

watch([visibleOptions, shouldShowPagination, loading, size, () => props.height], () => {
  if (visible.value) {
    void updatePanelRect()
  }
})

const focus = () => {
  ;(inputRef.value ?? controlRef.value)?.focus()
}

const blur = () => {
  ;(inputRef.value ?? controlRef.value)?.blur()
}

const open = () => {
  openPanel()
}

const close = () => {
  closePanel()
}

const refreshRemote = async () => {
  if (!props.remote) {
    return
  }
  remoteCache.value.clear()
  await fetchRemoteOptions(true)
}

const clearCache = () => {
  cancelRequest()
  remoteCache.value.clear()
  knownOptions.value.clear()
  props.options.forEach((option) => knownOptions.value.set(option.value, option))
}
const revealActive = async () => {
  await nextTick()
  if (props.virtual && !virtualRef.value) await nextTick()
  if (!visible.value || active.value < 0) return
  if (props.virtual) virtualRef.value?.scrollToIndex(active.value, { align: 'auto' })
  await nextTick()
  const id = optionId(visibleOptions.value[active.value])
  if (id) panelRef.value?.ownerDocument.getElementById(id)?.scrollIntoView?.({ block: 'nearest' })
}
let typeahead = ''
let typeaheadTime = 0
const handleKeydown = (event: KeyboardEvent) => {
  if (disabled.value || props.readonly || event.defaultPrevented || composition.composing.value || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey) return
  if ((event.target as HTMLElement).closest('button') && event.key !== 'Escape') return
  if (event.key === 'Escape') {
    if (visible.value) { event.preventDefault(); event.stopPropagation(); closePanel(); focus() }
    return
  }
  if (event.key === 'Tab') { closePanel(); return }
  if (event.key === 'Backspace' && props.multiple && !searchKeyword.value && normalizedModel.value.length) {
    removeTag(normalizedModel.value.at(-1)!)
    return
  }
  if (event.key === 'Enter' || (!props.filterable && event.key === ' ')) {
    event.preventDefault()
    if (!visible.value) openPanel()
    else if (visibleOptions.value[active.value]) selectOption(visibleOptions.value[active.value])
    return
  }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    if (props.filterable && ['Home', 'End'].includes(event.key) && (!visible.value || event.ctrlKey || event.metaKey)) return
    event.preventDefault()
    openingEdge = event.key === 'ArrowUp' || event.key === 'End' ? 'last' : 'first'
    if (!visible.value) { openPanel(); return }
    const indexes = visibleOptions.value.flatMap((option, index) => option.disabled ? [] : [index])
    if (!indexes.length) return
    const current = indexes.indexOf(active.value)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? indexes.length - 1
      : event.key === 'ArrowDown' ? (current + 1) % indexes.length : (current < 0 ? indexes.length - 1 : (current - 1 + indexes.length) % indexes.length)
    active.value = indexes[next]
    void revealActive()
    return
  }
  if (props.pagination && ['PageDown', 'PageUp'].includes(event.key)) {
    event.preventDefault()
    changePage(currentPage.value + (event.key === 'PageDown' ? 1 : -1))
    return
  }
  if (!props.filterable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const now = Date.now()
    typeahead = now - typeaheadTime > SELECT_DEFAULTS.typeaheadDelay ? event.key.toLocaleLowerCase() : typeahead + event.key.toLocaleLowerCase()
    typeaheadTime = now
    if (!visible.value) openPanel()
    const repeated = [...typeahead].every((letter) => letter === typeahead[0])
    const query = repeated ? typeahead[0] : typeahead
    const options = visibleOptions.value
    const start = Math.max(0, active.value + (repeated ? 1 : 0))
    for (let offset = 0; offset < options.length; offset += 1) {
      const index = (start + offset) % options.length
      if (!options[index].disabled && options[index].label.toLocaleLowerCase().startsWith(query)) { active.value = index; void revealActive(); break }
    }
  }
}

defineExpose({
  focus,
  blur,
  open,
  close,
  clear: clearValue,
  refreshRemote,
  retry: refreshRemote,
  clearCache,
})

watch(
  () => props.modelValue,
  () => {
    if (composition.composing.value) return
    if (!props.filterable || props.multiple) {
      return
    }
    const wasFiltering = isFiltering.value
    isFiltering.value = false
    searchKeyword.value = selectedOptions.value[0]?.label ?? ''
    if (wasFiltering) {
      cancelRequest()
      currentPage.value = 1
      if (visible.value && props.remote) void fetchRemoteOptions()
    }
  },
)

onMounted(() => {
  mounted = true
  if (props.filterable && !props.multiple && selectedOptions.value[0]) {
    searchKeyword.value = selectedOptions.value[0].label
  }
  if (props.remote) {
    void fetchRemoteOptions()
  }
})

onBeforeUnmount(() => {
  mounted = false
  cancelRequest()
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('pointerdown', handleClickOutside)
  unbindPositionListeners()
})
watch(() => [props.pageSize, props.debounce], ([pageSize, debounce]) => {
  if (!Number.isInteger(pageSize) || pageSize <= 0 || !Number.isFinite(debounce) || debounce < 0) {
    throw new RangeError('[scq-vue] Select requires a positive integer pageSize and a non-negative debounce.')
  }
}, { immediate: true })
</script>

<style>
.scq-select {
  position: relative;
  width: 240px;
  max-width: 100%;
  font-size: 14px;
  color: var(--scq-text, #0f172a);
  --scq-select-height: 38px;
  --scq-select-inner-line-height: 28px;
  --scq-select-font-size: 14px;
  --scq-select-tag-font-size: 12px;
  --scq-select-option-height: 36px;
}

.scq-select--large {
  --scq-select-height: 44px;
  --scq-select-inner-line-height: 34px;
  --scq-select-font-size: 15px;
  --scq-select-tag-font-size: 13px;
  --scq-select-option-height: 40px;
}

.scq-select--small {
  --scq-select-height: 30px;
  --scq-select-inner-line-height: 22px;
  --scq-select-font-size: 12px;
  --scq-select-tag-font-size: 11px;
  --scq-select-option-height: 32px;
}

.scq-select__control {
  --scq-select-border-color: var(--scq-border, #dcdfe6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: var(--scq-select-height);
  padding: calc(4px + var(--scq-control-border-width, 1px)) calc(12px + var(--scq-control-border-width, 1px));
  border-radius: var(--scq-control-radius, 4px);
  border: 0;
  background: var(--scq-surface, #ffffff);
  box-shadow: 0 0 0 var(--scq-control-border-width, 1px) var(--scq-select-border-color) inset;
  box-sizing: border-box;
  cursor: pointer;
  transition: box-shadow var(--scq-transition-fast, 0.2s ease), background-color var(--scq-transition-fast, 0.2s ease);
}

.scq-select__control:hover {
  --scq-select-border-color: var(--scq-border-hover, #a8abb2);
}

.scq-select__control:focus-within,
.scq-select.is-open .scq-select__control {
  --scq-select-border-color: var(--scq-primary, #2563eb);
  outline: none;
}

.scq-select.is-disabled .scq-select__control {
  --scq-select-border-color: var(--scq-border, #dcdfe6);
  cursor: not-allowed;
  background: var(--scq-fill, #f8fafc);
  opacity: 0.65;
}

.scq-select__value {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
  min-height: var(--scq-select-inner-line-height);
}

.scq-select__placeholder {
  color: var(--scq-muted, #94a3b8);
}

.scq-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--scq-radius-sm, 6px);
  border: 1px solid var(--scq-color-primary-soft-border, #bfdbfe);
  background: var(--scq-color-primary-soft-bg, #eff6ff);
  color: var(--scq-primary, #2563eb);
  font-size: var(--scq-select-tag-font-size);
  font-weight: 500;
  transition: all 0.15s ease;
}

.scq-select__tag-close {
  border: none;
  background: transparent;
  color: var(--scq-primary, #2563eb);
  opacity: 0.7;
  padding: 0;
  width: 14px;
  height: 14px;
  line-height: 14px;
  cursor: pointer;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.scq-select__tag-close:hover {
  opacity: 1;
  background: rgba(37, 99, 235, 0.15);
}

.scq-select__inner {
  flex: 1;
  min-width: 24px;
  width: 100%;
  border: none;
  outline: none;
  font-size: var(--scq-select-font-size);
  color: inherit;
  background: transparent;
  line-height: var(--scq-select-inner-line-height);
}

.scq-select__inner::placeholder {
  color: var(--scq-muted, #94a3b8);
}

.scq-select__actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.scq-select__arrow {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--scq-muted, #94a3b8);
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s;
}

.scq-select__arrow-icon {
  width: 7px;
  height: 7px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.scq-select__arrow.is-open {
  transform: rotate(180deg) translateY(-1px);
  color: var(--scq-primary, #2563eb);
}

.scq-select__clear {
  border: none;
  background: transparent;
  color: var(--scq-muted, #94a3b8);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.scq-select__clear-icon {
  width: 16px;
  height: 16px;
  line-height: 16px;
  border-radius: 50%;
  background: var(--scq-muted, #94a3b8);
  color: #ffffff;
  font-size: 11px;
  text-align: center;
  display: inline-block;
  transition: all 0.2s ease;
}

.scq-select__clear:hover .scq-select__clear-icon {
  background: var(--scq-primary, #2563eb);
}

.scq-select__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  border-radius: var(--scq-radius-lg, 12px);
  border: 1px solid var(--scq-border, #e2e8f0);
  background: var(--scq-surface, #ffffff);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.scq-select__panel.is-top {
  top: auto;
  bottom: calc(100% + 6px);
}

.scq-select__list {
  flex: 1;
  min-height: 0;
  max-height: 274px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 60, 67, 0.42) transparent;
  padding: 6px;
  font-size: 14px;
  color: var(--scq-text, #0f172a);
}

.scq-select__list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scq-select__list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.4);
}

.scq-select__list::-webkit-scrollbar-track {
  background: transparent;
}

.scq-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: var(--scq-select-option-height, 36px);
  padding: 0 12px;
  margin: 2px 0;
  border-radius: var(--scq-radius-sm, 6px);
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-select__panel--large .scq-select__option {
  height: 40px;
}

.scq-select__panel--small .scq-select__option {
  height: 32px;
}

.scq-select__option:hover {
  background: var(--scq-fill, #f8fafc);
  color: var(--scq-primary, #2563eb);
}

.scq-select__option.is-selected {
  background: var(--scq-color-primary-soft-bg, #eff6ff);
  color: var(--scq-primary, #2563eb);
  font-weight: 600;
}

.scq-select__option.is-disabled {
  color: var(--scq-muted, #94a3b8);
  cursor: not-allowed;
  opacity: 0.55;
  background: transparent !important;
}

.scq-select__check {
  font-size: 12px;
  color: var(--scq-primary, #2563eb);
}

.scq-select__empty {
  height: 40px;
  line-height: 40px;
  text-align: center;
  color: var(--scq-muted, #94a3b8);
  font-size: 13px;
}

.scq-select__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--scq-border, #e2e8f0);
  background: var(--scq-fill, #f8fafc);
}

.scq-select__pager-btn {
  border: 1px solid var(--scq-border, #e2e8f0);
  background: var(--scq-surface, #ffffff);
  color: var(--scq-text, #0f172a);
  border-radius: var(--scq-radius-sm, 6px);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scq-select__pager-btn:hover:enabled {
  border-color: var(--scq-primary, #2563eb);
  color: var(--scq-primary, #2563eb);
}

.scq-select__pager-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.scq-select__pager-text {
  color: var(--scq-muted, #64748b);
  font-size: 12px;
}

.scq-select-drop-enter-active,
.scq-select-drop-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top center;
}

.scq-select__panel.is-top.scq-select-drop-enter-active,
.scq-select__panel.is-top.scq-select-drop-leave-active {
  transform-origin: bottom center;
}

.scq-select-drop-enter-from,
.scq-select-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.scq-select__panel.is-top.scq-select-drop-enter-from,
.scq-select__panel.is-top.scq-select-drop-leave-to {
  transform: translateY(6px) scale(0.98);
}

@media (max-width: 768px) {
  .scq-select {
    width: 100%;
  }
}
</style>
