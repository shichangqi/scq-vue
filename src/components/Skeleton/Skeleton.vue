<template>
  <div v-if="loading" class="scq-skeleton" :class="[presetOptions ? `scq-skeleton--${preset}` : undefined, { 'is-animated': animated, 'has-image': showImage }]" role="status" :aria-label="text('loading')" aria-busy="true" v-bind="$attrs">
    <slot name="template">
      <div v-if="showImage" class="scq-skeleton__image" aria-hidden="true"></div>
      <div v-if="showAvatar" class="scq-skeleton__avatar" aria-hidden="true"></div>
      <div class="scq-skeleton__lines" aria-hidden="true">
        <div v-if="showTitle" class="scq-skeleton__title"></div>
        <div v-for="row in rowCount" :key="row" class="scq-skeleton__row" :style="rowStyle(row - 1)"></div>
        <div v-if="showButton" class="scq-skeleton__button"></div>
      </div>
    </slot>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { SKELETON_DEFAULT_ROWS, SKELETON_MAX_ROWS, SKELETON_PRESETS } from './constants'
import type { SkeletonProps } from './types'

defineOptions({ name: 'Skeleton', inheritAttrs: false })
const props = withDefaults(defineProps<SkeletonProps>(), {
  loading: true,
  animated: true,
  avatar: undefined,
  title: undefined,
  image: undefined,
  button: undefined,
})
const presetOptions = computed(() => {
  if (!props.preset) return undefined
  if (!Object.hasOwn(SKELETON_PRESETS, props.preset)) throw new RangeError('[scq-vue] Unknown Skeleton preset.')
  return SKELETON_PRESETS[props.preset]
})
const rowCount = computed(() => {
  const rows = props.rows ?? presetOptions.value?.rows ?? SKELETON_DEFAULT_ROWS
  return Number.isFinite(rows) ? Math.max(0, Math.min(SKELETON_MAX_ROWS, Math.floor(rows))) : SKELETON_DEFAULT_ROWS
})
const showAvatar = computed(() => props.avatar ?? presetOptions.value?.avatar ?? false)
const showTitle = computed(() => props.title ?? presetOptions.value?.title ?? false)
const showImage = computed(() => props.image ?? presetOptions.value?.image ?? false)
const showButton = computed(() => props.button ?? presetOptions.value?.button ?? false)
const rowWidths = computed(() => props.rowWidths ?? presetOptions.value?.rowWidths)
const rowStyle = (index: number) => {
  const width = rowWidths.value?.[index]
  if (width === undefined) return undefined
  if (typeof width === 'number') return Number.isFinite(width) && width >= 0 ? { width: `${width}px` } : undefined
  return { width }
}
const text = useLocale()
</script>