<template><component :is="as" class="scq-grid" :style="styles"><slot /></component></template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

export interface GridBreakpoints { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
defineOptions({ name: 'Grid' })
const props = withDefaults(defineProps<{ columns?: number | GridBreakpoints; gap?: number | string | [number, number]; align?: 'start' | 'center' | 'end' | 'stretch'; justify?: 'start' | 'center' | 'end' | 'stretch'; as?: 'div' | 'section' | 'ul' }>(), { columns: 3, gap: 16, align: 'stretch', justify: 'stretch', as: 'div' })
const styles = computed(() => {
  const columns = typeof props.columns === 'number' ? { xs: props.columns } : props.columns
  let previous = 1
  const result: CSSProperties & Record<string, string | number | undefined> = { gap: Array.isArray(props.gap) ? props.gap.map((value) => `${Math.max(0, value)}px`).join(' ') : typeof props.gap === 'number' ? `${Math.max(0, props.gap)}px` : props.gap, alignItems: props.align, justifyItems: props.justify }
  for (const key of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
    const count = columns[key] ?? previous
    previous = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : previous
    result[`--scq-grid-${key}`] = previous
  }
  return result
})
</script>