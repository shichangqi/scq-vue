<template>
  <div
    ref="rootRef"
    class="scq-select"
    :class="[`scq-select--${size}`, { 'is-open': visible, 'is-disabled': disabled }]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div
      class="scq-select__control"
      role="combobox"
      :aria-expanded="visible ? 'true' : 'false'"
      :aria-disabled="disabled ? 'true' : 'false'"
      @click="handleControlClick"
    >
      <div class="scq-select__value">
        <template v-if="multiple">
          <template v-if="selectedOptions.length">
            <span v-for="option in selectedOptions" :key="option.value" class="scq-select__tag">
              {{ option.label }}
              <button
                v-if="!disabled"
                type="button"
                class="scq-select__tag-close"
                aria-label="Remove"
                @click.stop="removeTag(option.value)"
              >
                ×
              </button>
            </span>
          </template>
          <input
            v-if="filterable"
            ref="inputRef"
            v-model="searchKeyword"
            class="scq-select__inner"
            type="text"
            :placeholder="selectedOptions.length ? '' : placeholder"
            :disabled="disabled"
            @focus="handleInputFocus"
            @input="handleInput"
          />
          <span v-else-if="!selectedOptions.length" class="scq-select__placeholder">{{ placeholder }}</span>
        </template>

        <template v-else>
          <input
            v-if="filterable"
            ref="inputRef"
            v-model="searchKeyword"
            class="scq-select__inner"
            type="text"
            :placeholder="selectedOptions[0] ? '' : placeholder"
            :disabled="disabled"
            @focus="handleInputFocus"
            @input="handleInput"
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
          aria-label="Clear"
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
        >
          <div class="scq-select__list" @click.stop>
            <div v-if="loading" class="scq-select__empty">加载中...</div>
            <div
              v-for="option in visibleOptions"
              :key="option.value"
              class="scq-select__option"
              :class="{ 'is-selected': isSelected(option.value), 'is-disabled': option.disabled }"
              @click="selectOption(option)"
            >
              <span>{{ option.label }}</span>
              <span v-if="isSelected(option.value)" class="scq-select__check">✓</span>
            </div>

            <div v-if="!loading && !visibleOptions.length" class="scq-select__empty">无匹配数据</div>
          </div>

          <div v-if="shouldShowPagination" class="scq-select__pager">
            <button
              type="button"
              class="scq-select__pager-btn"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </button>
            <span class="scq-select__pager-text">{{ currentPage }} / {{ totalPages }}</span>
            <button
              type="button"
              class="scq-select__pager-btn"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              下一页
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

defineOptions({
  name: 'Select',
})

type SelectValue = string | number
type SelectSize = 'large' | 'default' | 'small'

export interface SelectOption {
  label: string
  value: SelectValue
  disabled?: boolean
}

export interface RemoteResult {
  list: SelectOption[]
  total?: number
}

type RemoteMethod = (query: string, page: number, pageSize: number) => Promise<SelectOption[] | RemoteResult>

const props = withDefaults(
  defineProps<{
    modelValue?: SelectValue | SelectValue[] | null
    options?: SelectOption[]
    multiple?: boolean
    disabled?: boolean
    placeholder?: string
    clearable?: boolean
    filterable?: boolean
    remote?: boolean
    remoteMethod?: RemoteMethod
    pagination?: boolean
    pageSize?: number
    debounce?: number
    size?: SelectSize
    teleported?: boolean
    popperZIndex?: number
  }>(),
  {
    modelValue: null,
    options: () => [],
    multiple: false,
    disabled: false,
    placeholder: '请选择',
    clearable: true,
    filterable: false,
    remote: false,
    remoteMethod: undefined,
    pagination: false,
    pageSize: 8,
    debounce: 300,
    size: 'default',
    teleported: true,
    popperZIndex: 2100,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue | SelectValue[] | null): void
  (e: 'change', value: SelectValue | SelectValue[] | null): void
  (e: 'clear'): void
  (e: 'search', value: string): void
  (e: 'visible-change', visible: boolean): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const visible = ref(false)
const hovering = ref(false)
const searchKeyword = ref('')
const isFiltering = ref(false)
const currentPage = ref(1)
const remoteOptions = ref<SelectOption[]>([])
const remoteTotal = ref(0)
const loading = ref(false)
let debounceTimer: number | null = null
const panelRect = ref({ top: 0, bottom: 0, left: 0, width: 0, maxHeight: 0 })
const dropdownPlacement = ref<'bottom' | 'top'>('bottom')
const remoteCache = ref(new Map<string, RemoteResult>())
const panelGap = 6
const viewportPadding = 8
const listPaddingY = 12
const listMaxHeight = 274
const emptyHeight = 34
const pagerHeight = 45

const normalizedModel = computed<SelectValue[]>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  if (props.modelValue === null || Array.isArray(props.modelValue) || props.modelValue === undefined) {
    return []
  }
  return [props.modelValue]
})

const baseOptions = computed<SelectOption[]>(() => {
  return props.remote ? remoteOptions.value : props.options
})

const filterKeyword = computed(() => {
  return props.filterable && isFiltering.value ? searchKeyword.value.trim() : ''
})

const filteredOptions = computed<SelectOption[]>(() => {
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
  const map = new Map<SelectValue, SelectOption>()
  ;[...props.options, ...remoteOptions.value].forEach((option) => {
    map.set(option.value, option)
  })
  return normalizedModel.value.map((value) => map.get(value)).filter((item): item is SelectOption => Boolean(item))
})

const totalCount = computed(() => {
  if (props.remote) {
    return remoteTotal.value || filteredOptions.value.length
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

const visibleOptions = computed<SelectOption[]>(() => {
  if (!props.pagination || props.remote) {
    return filteredOptions.value
  }
  const start = (currentPage.value - 1) * props.pageSize
  return filteredOptions.value.slice(start, start + props.pageSize)
})

const hasValue = computed(() => normalizedModel.value.length > 0)
const showClear = computed(() => props.clearable && hasValue.value && !props.disabled && hovering.value)
const remoteRequestKey = computed(() => `${filterKeyword.value}__${currentPage.value}__${props.pageSize}`)
const panelStyle = computed<CSSProperties>(() => {
  if (!props.teleported) {
    return {}
  }
  return {
    position: 'fixed',
    top: dropdownPlacement.value === 'bottom' ? `${panelRect.value.top}px` : 'auto',
    left: `${panelRect.value.left}px`,
    width: `${panelRect.value.width}px`,
    maxHeight: panelRect.value.maxHeight ? `${panelRect.value.maxHeight}px` : undefined,
    right: 'auto',
    bottom: dropdownPlacement.value === 'top' ? `${panelRect.value.bottom}px` : 'auto',
    zIndex: String(props.popperZIndex),
  }
})

const ensurePageRange = () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  if (currentPage.value < 1) {
    currentPage.value = 1
  }
}

const fetchRemoteOptions = async (force = false) => {
  if (!props.remote || !props.remoteMethod) {
    return
  }

  const requestKey = remoteRequestKey.value
  const cached = remoteCache.value.get(requestKey)
  if (!force && cached) {
    remoteOptions.value = cached.list
    remoteTotal.value = cached.total ?? cached.list.length
    return
  }

  loading.value = true
  try {
    const result = await props.remoteMethod(filterKeyword.value, currentPage.value, props.pageSize)
    if (Array.isArray(result)) {
      remoteOptions.value = result
      remoteTotal.value = result.length
      remoteCache.value.set(requestKey, {
        list: result,
        total: result.length,
      })
    } else {
      remoteOptions.value = result.list
      remoteTotal.value = result.total ?? result.list.length
      remoteCache.value.set(requestKey, {
        list: result.list,
        total: result.total ?? result.list.length,
      })
    }
  } finally {
    loading.value = false
  }
}

const runSearch = () => {
  if (!isFiltering.value) {
    return
  }
  emit('search', filterKeyword.value)
  currentPage.value = 1
  if (!props.remote) {
    return
  }
  if (debounceTimer) {
    window.clearTimeout(debounceTimer)
  }
  debounceTimer = window.setTimeout(() => {
    void fetchRemoteOptions()
  }, props.debounce)
}

const isSelected = (value: SelectValue) => normalizedModel.value.includes(value)

const selectOption = (option: SelectOption) => {
  if (option.disabled) {
    return
  }
  let nextValue: SelectValue | SelectValue[] | null = null
  if (props.multiple) {
    const current = [...normalizedModel.value]
    const index = current.findIndex((item) => item === option.value)
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
    visible.value = false
  }
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

const clearValue = () => {
  const value = props.multiple ? [] : null
  emit('update:modelValue', value)
  emit('change', value)
  emit('clear')
  isFiltering.value = false
  searchKeyword.value = ''
}

const openPanel = () => {
  if (props.disabled) {
    return
  }
  const wasVisible = visible.value
  updatePanelRect()
  visible.value = true
  void updatePanelRect()
  if (!wasVisible && props.remote) {
    void fetchRemoteOptions()
  }
}

const toggleVisible = () => {
  if (props.disabled) {
    return
  }
  const nextVisible = !visible.value
  if (nextVisible) {
    updatePanelRect()
  }
  visible.value = !visible.value
  if (nextVisible) {
    void updatePanelRect()
  }
  if (nextVisible && props.remote) {
    void fetchRemoteOptions()
  }
}

const handleControlClick = () => {
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

const handleInput = () => {
  isFiltering.value = true
}

const removeTag = (value: SelectValue) => {
  if (!props.multiple || props.disabled) {
    return
  }
  const next = normalizedModel.value.filter((item) => item !== value)
  emit('update:modelValue', next)
  emit('change', next)
}

const closePanel = () => {
  visible.value = false
}

const changePage = (page: number) => {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
  if (props.remote) {
    void fetchRemoteOptions()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (rootRef.value?.contains(target)) {
    return
  }
  if (panelRef.value?.contains(target)) {
    return
  }
  if (rootRef.value) {
    closePanel()
  }
}

const getEstimatedPanelHeight = () => {
  const optionCount = loading.value || !visibleOptions.value.length ? 1 : visibleOptions.value.length
  const optionHeightMap: Record<SelectSize, number> = {
    large: 36,
    default: 34,
    small: 30,
  }
  const optionHeight = loading.value || !visibleOptions.value.length ? emptyHeight : optionHeightMap[props.size]
  const listHeight = Math.min(listMaxHeight, optionCount * optionHeight + listPaddingY)
  return listHeight + (shouldShowPagination.value ? pagerHeight : 0)
}

const updatePanelRect = async () => {
  if (!rootRef.value) {
    return
  }

  if (visible.value) {
    await nextTick()
  }

  const rect = rootRef.value.getBoundingClientRect()
  const panelHeight = panelRef.value?.offsetHeight || getEstimatedPanelHeight()
  const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - panelGap
  const spaceAbove = rect.top - viewportPadding - panelGap
  const shouldPlaceTop = panelHeight > spaceBelow && spaceAbove > spaceBelow
  dropdownPlacement.value = shouldPlaceTop ? 'top' : 'bottom'

  if (!props.teleported) {
    return
  }

  const availableHeight = Math.max(0, shouldPlaceTop ? spaceAbove : spaceBelow)
  const nextHeight = panelHeight ? Math.min(panelHeight, availableHeight) : availableHeight
  panelRect.value = {
    top: rect.bottom + panelGap,
    bottom: window.innerHeight - rect.top + panelGap,
    left: rect.left,
    width: rect.width,
    maxHeight: availableHeight,
  }
}

const bindPositionListeners = () => {
  if (!props.teleported) {
    return
  }
  window.addEventListener('resize', updatePanelRect)
  window.addEventListener('scroll', updatePanelRect, true)
}

const unbindPositionListeners = () => {
  if (!props.teleported) {
    return
  }
  window.removeEventListener('resize', updatePanelRect)
  window.removeEventListener('scroll', updatePanelRect, true)
}

watch(
  () => props.options,
  () => {
    ensurePageRange()
  },
)

watch(
  () => [props.pageSize, props.pagination],
  () => {
    currentPage.value = 1
    ensurePageRange()
  },
)

watch(searchKeyword, runSearch)
watch(totalPages, ensurePageRange)

watch(
  () => props.pageSize,
  () => {
    remoteCache.value.clear()
  },
)

watch(
  () => props.remoteMethod,
  () => {
    remoteCache.value.clear()
  },
)

watch(visible, (nextVisible) => {
  if (nextVisible) {
    void updatePanelRect()
    bindPositionListeners()
  } else {
    unbindPositionListeners()
  }
  emit('visible-change', nextVisible)
})

watch([visibleOptions, shouldShowPagination, loading], () => {
  if (visible.value) {
    void updatePanelRect()
  }
})

const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
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

defineExpose({
  focus,
  blur,
  open,
  close,
  clear: clearValue,
  refreshRemote,
})

watch(
  () => props.modelValue,
  () => {
    if (!props.filterable || props.multiple) {
      return
    }
    isFiltering.value = false
    searchKeyword.value = selectedOptions.value[0]?.label ?? ''
  },
)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  if (props.filterable && !props.multiple && selectedOptions.value[0]) {
    searchKeyword.value = selectedOptions.value[0].label
  }
  if (props.remote) {
    void fetchRemoteOptions()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  unbindPositionListeners()
  if (debounceTimer) {
    window.clearTimeout(debounceTimer)
  }
})
</script>

<style>
.scq-select {
  position: relative;
  width: 240px;
  max-width: 100%;
  font-size: 14px;
  color: #303133;
  --scq-select-height: 40px;
  --scq-select-inner-line-height: 30px;
  --scq-select-font-size: 14px;
  --scq-select-tag-font-size: 12px;
  --scq-select-option-height: 34px;
}

.scq-select--large {
  --scq-select-height: 44px;
  --scq-select-inner-line-height: 34px;
  --scq-select-font-size: 14px;
  --scq-select-tag-font-size: 12px;
  --scq-select-option-height: 36px;
}

.scq-select--small {
  --scq-select-height: 32px;
  --scq-select-inner-line-height: 24px;
  --scq-select-font-size: 12px;
  --scq-select-tag-font-size: 11px;
  --scq-select-option-height: 30px;
}

.scq-select__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: var(--scq-select-height);
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.scq-select.is-open .scq-select__control {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.18);
}

.scq-select.is-disabled .scq-select__control {
  cursor: not-allowed;
  background: #f5f7fa;
}

.scq-select__value {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
  min-height: var(--scq-select-inner-line-height);
}

.scq-select__placeholder {
  color: #c0c4cc;
}

.scq-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  background: #f4f4f5;
  color: #606266;
  font-size: var(--scq-select-tag-font-size);
}

.scq-select__tag-close {
  border: none;
  background: transparent;
  color: #909399;
  padding: 0;
  width: 14px;
  height: 14px;
  line-height: 14px;
  cursor: pointer;
}

.scq-select__inner {
  flex: 1;
  min-width: 24px;
  width: 100%;
  border: none;
  outline: none;
  font-size: var(--scq-select-font-size);
  color: #303133;
  background: transparent;
  line-height: var(--scq-select-inner-line-height);
}

.scq-select__inner::placeholder {
  color: #c0c4cc;
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
  color: #c0c4cc;
  transition: transform 0.24s, color 0.2s;
}

.scq-select__arrow-icon {
  width: 8px;
  height: 8px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.scq-select__arrow.is-open {
  transform: rotate(180deg) translateY(-1px);
}

.scq-select__clear {
  border: none;
  background: transparent;
  color: #ffffff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.scq-select__clear-icon {
  width: 16px;
  height: 16px;
  line-height: 16px;
  border-radius: 50%;
  background: #c0c4cc;
  color: #ffffff;
  font-size: 12px;
  text-align: center;
  display: inline-block;
}

.scq-select__clear:hover {
  background: transparent;
}

.scq-select__clear:hover .scq-select__clear-icon {
  background: #909399;
}

.scq-select__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  padding: 6px 0;
  font-size: 14px;
  color: #606266;
}

.scq-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: var(--scq-select-option-height, 34px);
  padding: 0 20px;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.2s;
}

.scq-select__panel--large .scq-select__option {
  height: 36px;
}

.scq-select__panel--small .scq-select__option {
  height: 30px;
}

.scq-select__option:hover {
  background: #f5f7fa;
}

.scq-select__option.is-selected {
  color: #409eff;
  font-weight: 600;
}

.scq-select__option.is-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.scq-select__check {
  font-size: 12px;
}

.scq-select__empty {
  height: 34px;
  line-height: 34px;
  text-align: center;
  color: #999;
}

.scq-select__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-top: 1px solid #f0f2f5;
  background: #fff;
}

.scq-select__pager-btn {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
}

.scq-select__pager-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.scq-select__pager-text {
  color: #606266;
  font-size: 12px;
}

.scq-select-drop-enter-active,
.scq-select-drop-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
  transform-origin: top center;
}

.scq-select__panel.is-top.scq-select-drop-enter-active,
.scq-select__panel.is-top.scq-select-drop-leave-active {
  transform-origin: bottom center;
}

.scq-select-drop-enter-from,
.scq-select-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.scq-select__panel.is-top.scq-select-drop-enter-from,
.scq-select__panel.is-top.scq-select-drop-leave-to {
  transform: translateY(4px);
}

@media (max-width: 768px) {
  .scq-select {
    width: 100%;
  }
}
</style>
