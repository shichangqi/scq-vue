<template>
  <nav v-if="!hideOnSinglePage || pageCount > 1" class="scq-pagination" :class="{ 'is-simple': simple }" :aria-label="text('pagination')">
    <span v-if="showTotal" class="scq-pagination__total">{{ text('total') }}: {{ normalizedTotal }}</span>
    <button type="button" class="scq-pagination__button" :aria-label="text('previous')" :disabled="isDisabled || current <= 1" @click="go(current - 1)"><Icon name="chevronLeft" /></button>
    <div class="scq-pagination__pages">
      <template v-for="page in pages" :key="page">
        <span v-if="typeof page === 'string'" class="scq-pagination__ellipsis" aria-hidden="true">...</span>
        <button v-else type="button" class="scq-pagination__button" :class="{ 'is-active': page === current }" :aria-label="`${text('page')} ${page}`" :aria-current="page === current ? 'page' : undefined" :disabled="isDisabled" @click="go(page)">{{ page }}</button>
      </template>
    </div>
    <span class="scq-pagination__counter" aria-live="polite">{{ current }} / {{ pageCount }}</span>
    <button type="button" class="scq-pagination__button" :aria-label="text('next')" :disabled="isDisabled || current >= pageCount" @click="go(current + 1)"><Icon name="chevronRight" /></button>
    <select v-if="pageSizes.length" class="scq-pagination__size" :value="pageSize" :aria-label="text('pageSize')" :disabled="isDisabled" @change="changeSize"><option v-for="size in validPageSizes" :key="size" :value="size">{{ size }} / {{ text('page') }}</option></select>
  </nav>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'

defineOptions({ name: 'Pagination' })
const props = withDefaults(defineProps<{ modelValue?: number; total?: number; pageSize?: number; pagerCount?: number; pageSizes?: number[]; disabled?: boolean; simple?: boolean; showTotal?: boolean; hideOnSinglePage?: boolean }>(), { modelValue: 1, total: 0, pageSize: 10, pagerCount: 7, pageSizes: () => [], disabled: undefined, simple: false, showTotal: false, hideOnSinglePage: false })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change', value: number): void
  (event: 'update:pageSize' | 'size-change', value: number): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const normalizedTotal = computed(() => Number.isFinite(props.total) ? Math.max(0, Math.floor(props.total)) : 0)
const normalizedSize = computed(() => Number.isFinite(props.pageSize) ? Math.max(1, Math.floor(props.pageSize)) : 10)
const pageCount = computed(() => Math.max(1, Math.ceil(normalizedTotal.value / normalizedSize.value)))
const current = computed(() => Math.max(1, Math.min(pageCount.value, Number.isFinite(props.modelValue) ? Math.floor(props.modelValue) : 1)))
const validPageSizes = computed(() => [...new Set([...props.pageSizes, normalizedSize.value])].filter((size) => Number.isInteger(size) && size > 0).sort((left, right) => left - right))
const pages = computed<(number | string)[]>(() => {
  const limit = Number.isFinite(props.pagerCount) ? Math.max(5, Math.min(11, Math.floor(props.pagerCount / 2) * 2 + 1)) : 7
  const count = pageCount.value
  if (count <= limit) return Array.from({ length: count }, (_, index) => index + 1)
  const half = Math.floor(limit / 2)
  if (current.value <= half + 1) return [...Array.from({ length: limit - 2 }, (_, index) => index + 1), 'next-more', count]
  if (current.value >= count - half) return [1, 'previous-more', ...Array.from({ length: limit - 2 }, (_, index) => count - limit + 3 + index)]
  return [1, 'previous-more', ...Array.from({ length: limit - 4 }, (_, index) => current.value - (half - 2) + index), 'next-more', count]
})
const go = (page: number) => {
  if (isDisabled.value) return
  const next = Math.max(1, Math.min(pageCount.value, page))
  if (next === props.modelValue) return
  emit('update:modelValue', next)
  emit('change', next)
}
const changeSize = (event: Event) => {
  if (isDisabled.value) return
  const size = Number((event.target as HTMLSelectElement).value)
  emit('update:pageSize', size)
  emit('size-change', size)
  go(1)
}
watch(() => [props.total, props.pageSize], () => {
  if (current.value !== props.modelValue) go(current.value)
})
</script>