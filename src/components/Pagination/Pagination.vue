<template>
  <nav v-if="unknownTotal || !hideOnSinglePage || pageCount > 1" class="scq-pagination" :class="{ 'is-simple': simple }" :aria-label="text('pagination')" :aria-busy="loading || undefined">
    <slot name="prefix" :page="current" />
    <span v-if="showTotal && !unknownTotal" class="scq-pagination__total"><slot name="total" :total="normalizedTotal">{{ text('paginationTotal').replace('{total}', String(normalizedTotal)) }}</slot></span>
    <Select v-if="pageSizes.length" class="scq-pagination__size" :model-value="normalizedSize" :options="pageSizeOptions" size="small" :clearable="false" :aria-label="text('pageSize')" :disabled="isDisabled" @update:model-value="changeSize" />
    <div class="scq-pagination__navigation">
      <button type="button" class="scq-pagination__button" :aria-label="text('previous')" :disabled="isDisabled || current <= PAGINATION_DEFAULTS.page" @click="go(current - 1)"><Icon name="chevronLeft" /></button>
      <div v-if="!unknownTotal" class="scq-pagination__pages">
        <template v-for="page in pages" :key="page">
          <button v-if="typeof page === 'string'" type="button" class="scq-pagination__button scq-pagination__ellipsis" :aria-label="`${text(page === 'previous-more' ? 'previous' : 'next')} ${pagerLimit - 2} ${text('page')}`" :disabled="isDisabled" @click="go(current + (page === 'previous-more' ? -1 : 1) * (pagerLimit - 2))">...</button>
          <button v-else type="button" class="scq-pagination__button" :class="{ 'is-active': page === current }" :aria-label="`${text('page')} ${page}`" :aria-current="page === current ? 'page' : undefined" :disabled="isDisabled" @click="go(page)">{{ page }}</button>
        </template>
      </div>
      <span class="scq-pagination__counter" :class="{ 'is-unknown': unknownTotal }" aria-live="polite">{{ current }}<template v-if="!unknownTotal"> / {{ pageCount }}</template></span>
      <button type="button" class="scq-pagination__button" :aria-label="text('next')" :disabled="isDisabled || (unknownTotal ? !hasNext : current >= pageCount)" @click="go(current + 1)"><Icon name="chevronRight" /></button>
    </div>
    <span v-if="showJumper && !unknownTotal" class="scq-pagination__jumper">
      <span>{{ text('paginationGoto') }}</span>
      <Input
        ref="jumpInput"
        v-model="jumpValue"
        class="scq-pagination__input"
        type="number"
        size="default"
        :full-width="false"
        inputmode="numeric"
        :min="PAGINATION_DEFAULTS.page"
        :max="pageCount"
        :aria-label="text('jumpToPage')"
        :disabled="isDisabled"
        @focus="jumpInput?.select()"
        @keydown.enter="jumpKeydown"
        @blur="commitJump"
        @compositionstart="jumpComposing = true"
        @compositionend="jumpComposing = false"
      />
      <span v-if="text('paginationPage')">{{ text('paginationPage') }}</span>
    </span>
    <slot name="suffix" :page="current" />
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Input from '../Input/Input.vue'
import Select from '../Select/Select.vue'
import type { SelectValue } from '../Select/types'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { PAGINATION_DEFAULTS, PAGINATION_PAGER_LIMIT } from './constants'

defineOptions({ name: 'Pagination' })
export interface PaginationProps { modelValue?: number; total?: number; pageSize?: number; pagerCount?: number; pageSizes?: readonly number[]; disabled?: boolean; simple?: boolean; showTotal?: boolean; hideOnSinglePage?: boolean; showJumper?: boolean; unknownTotal?: boolean; hasNext?: boolean; loading?: boolean }
const props = withDefaults(defineProps<PaginationProps>(), { modelValue: PAGINATION_DEFAULTS.page, total: PAGINATION_DEFAULTS.total, pageSize: PAGINATION_DEFAULTS.pageSize, pagerCount: PAGINATION_DEFAULTS.pagerCount, pageSizes: () => [], disabled: undefined, simple: false, showTotal: false, hideOnSinglePage: false, showJumper: false, unknownTotal: false, hasNext: false, loading: false })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change', value: number): void
  (event: 'update:pageSize' | 'size-change', value: number): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.loading || (props.disabled ?? config.value.disabled))
const normalizedTotal = computed(() => Number.isFinite(props.total) ? Math.max(0, Math.floor(props.total)) : 0)
const normalizedSize = computed(() => Number.isFinite(props.pageSize) ? Math.max(1, Math.floor(props.pageSize)) : PAGINATION_DEFAULTS.pageSize)
const pageCount = computed(() => Math.max(1, Math.ceil(normalizedTotal.value / normalizedSize.value)))
const current = computed(() => Math.max(1, Math.min(props.unknownTotal ? Infinity : pageCount.value, Number.isFinite(props.modelValue) ? Math.floor(props.modelValue) : 1)))
const validPageSizes = computed(() => [...new Set([...props.pageSizes, normalizedSize.value])].filter((size) => Number.isInteger(size) && size > 0).sort((left, right) => left - right))
const pageSizeOptions = computed(() => validPageSizes.value.map((size) => ({ value: size, label: text('paginationPerPage').replace('{size}', String(size)) })))
const pagerLimit = computed(() => Number.isFinite(props.pagerCount) ? Math.max(PAGINATION_PAGER_LIMIT.min, Math.min(PAGINATION_PAGER_LIMIT.max, Math.floor(props.pagerCount / 2) * 2 + 1)) : PAGINATION_DEFAULTS.pagerCount)
const pages = computed<(number | string)[]>(() => {
  const limit = pagerLimit.value
  const count = pageCount.value
  if (count <= limit) return Array.from({ length: count }, (_, index) => index + 1)
  const half = Math.floor(limit / 2)
  if (current.value <= half + 1) return [...Array.from({ length: limit - 2 }, (_, index) => index + 1), 'next-more', count]
  if (current.value >= count - half) return [1, 'previous-more', ...Array.from({ length: limit - 2 }, (_, index) => count - limit + 3 + index)]
  return [1, 'previous-more', ...Array.from({ length: limit - 4 }, (_, index) => current.value - (half - 2) + index), 'next-more', count]
})
const go = (page: number) => {
  if (isDisabled.value || !Number.isFinite(page) || (props.unknownTotal && page > current.value && !props.hasNext)) return
  const next = Math.max(1, Math.min(props.unknownTotal ? Infinity : pageCount.value, Math.floor(page)))
  if (next === props.modelValue) return
  emit('update:modelValue', next)
  emit('change', next)
}
const jumpInput = ref<InstanceType<typeof Input>>()
const jumpPage = ref<string | number>()
const jumpComposing = ref(false)
const jumpValue = computed({
  get: () => jumpPage.value ?? current.value,
  set: (value: string | number) => { jumpPage.value = value },
})
const commitJump = () => {
  if (jumpComposing.value) return
  const value = String(jumpPage.value ?? '').trim()
  jumpPage.value = undefined
  if (value) go(Number(value))
}
const jumpKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE) return
  event.preventDefault()
  commitJump()
}
const changeSize = (size: SelectValue | SelectValue[] | null) => {
  if (isDisabled.value || size === normalizedSize.value) return
  if (typeof size !== 'number' || !validPageSizes.value.includes(size)) {
    console.warn('[scq-vue] Pagination page size must match an available option.')
    return
  }
  emit('update:pageSize', size)
  emit('size-change', size)
  go(PAGINATION_DEFAULTS.page)
}
watch([current, normalizedSize, isDisabled, () => props.unknownTotal, () => props.showJumper], () => {
  jumpPage.value = undefined
  jumpComposing.value = false
})
watch(() => [props.total, props.pageSize, props.unknownTotal, isDisabled.value], () => {
  if (current.value !== props.modelValue) go(current.value)
})
</script>