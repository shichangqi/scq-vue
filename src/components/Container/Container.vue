<template>
  <div class="scq-container" :class="{ 'has-aside': $slots.aside, 'is-aside-right': asidePosition === 'right', 'is-fluid': fluid }" :style="{ maxWidth: fluid ? undefined : length(maxWidth), padding: length(padding), '--scq-container-aside': length(asideWidth), gap: length(gap) }"><header v-if="$slots.header" class="scq-container__header"><slot name="header" /></header><div class="scq-container__body" :style="{ gap: length(gap) }"><aside v-if="$slots.aside" class="scq-container__aside"><slot name="aside" /></aside><div class="scq-container__main"><slot /></div></div><footer v-if="$slots.footer" class="scq-container__footer"><slot name="footer" /></footer></div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Container' })
withDefaults(defineProps<{ maxWidth?: number | string; padding?: number | string; gap?: number | string; fluid?: boolean; asideWidth?: number | string; asidePosition?: 'left' | 'right' }>(), { maxWidth: 1200, padding: 24, gap: 16, fluid: false, asideWidth: 220, asidePosition: 'left' })
const length = (value: number | string) => typeof value === 'number' ? `${Math.max(0, value)}px` : value
</script>