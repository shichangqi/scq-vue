<template><component :is="as" class="scq-grid" :class="{ 'is-auto-fill': minItemWidth !== undefined }" :style="styles"><slot /></component></template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { GRID_DEFAULTS } from './constants'
import { isResponsiveValue, LAYOUT_BREAKPOINT_ORDER, resolveResponsiveValue, toCssGap, toCssLength, useLayoutBreakpoint, type LayoutBreakpoints, type ResponsiveValue, type SpacingValue } from '../../utils/layout'

export interface GridBreakpoints { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
export interface GridProps {
  columns?: number | GridBreakpoints
  gap?: ResponsiveValue<SpacingValue>
  breakpoints?: LayoutBreakpoints
  minItemWidth?: number | string
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'stretch'
  as?: 'div' | 'section' | 'ul'
}
defineOptions({ name: 'Grid' })
const props = withDefaults(defineProps<GridProps>(), { ...GRID_DEFAULTS, align: 'stretch', justify: 'stretch', as: 'div' })
const breakpoint = useLayoutBreakpoint(() => props.breakpoints, () => Boolean(props.breakpoints) || isResponsiveValue(props.gap))
const styles = computed(() => {
  const columns = typeof props.columns === 'number' ? { xs: props.columns } : props.columns
  let previous = 1
  const result: CSSProperties & Record<string, string | number | undefined> = {
    gap: toCssGap(resolveResponsiveValue<SpacingValue>(props.gap, breakpoint.value, GRID_DEFAULTS.gap)),
    alignItems: props.align, justifyItems: props.justify,
  }
  for (const key of LAYOUT_BREAKPOINT_ORDER) {
    const count = columns[key] ?? previous
    if (!Number.isFinite(count)) throw new RangeError('[scq-vue] Grid column counts must be finite.')
    previous = Math.max(1, Math.floor(count))
    result[`--scq-grid-${key}`] = previous
  }
  if (props.breakpoints) {
    result['--scq-grid-columns'] = result[`--scq-grid-${breakpoint.value}`]
    result.gridTemplateColumns = 'repeat(var(--scq-grid-columns), minmax(0, 1fr))'
  }
  if (props.minItemWidth !== undefined) {
    if (typeof props.minItemWidth === 'number' && props.minItemWidth <= 0) throw new RangeError('[scq-vue] Grid minItemWidth must be positive.')
    result.gridTemplateColumns = `repeat(auto-fill, minmax(min(100%, ${toCssLength(props.minItemWidth)}), 1fr))`
  }
  return result
})
</script>