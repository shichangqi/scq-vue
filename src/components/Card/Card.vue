<template><article class="scq-card" :class="[`scq-card--${shadow}`, { 'is-bordered': bordered }]" :aria-busy="loading"><div v-if="$slots.media" class="scq-card__media"><slot name="media" /></div><header v-if="header || $slots.header" class="scq-card__header"><slot name="header">{{ header }}</slot><div v-if="$slots.extra" class="scq-card__extra"><slot name="extra" /></div></header><div class="scq-card__body" :style="{ padding: typeof padding === 'number' ? `${padding}px` : padding, ...bodyStyle }"><Skeleton v-if="loading" :rows="3" /><div v-show="!loading"><slot /></div></div><footer v-if="$slots.footer" class="scq-card__footer"><slot name="footer" /></footer></article></template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import Skeleton from '../Skeleton/Skeleton.vue'
defineOptions({ name: 'Card' })
withDefaults(defineProps<{ header?: string; shadow?: 'never' | 'hover' | 'always'; bordered?: boolean; padding?: number | string; bodyStyle?: CSSProperties; loading?: boolean }>(), { header: '', shadow: 'never', bordered: true, padding: 20, loading: false })
</script>