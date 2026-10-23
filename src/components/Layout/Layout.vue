<template><component :is="as" class="scq-layout" :class="{ 'is-wrap': wrap, 'is-reverse': reverse }" :style="styles"><slot /></component></template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { isResponsiveValue, resolveResponsiveValue, toCssGap, useLayoutBreakpoint, type LayoutBreakpoints, type ResponsiveValue, type SpacingValue } from '../../utils/layout'

defineOptions({ name: 'Layout' })
export interface LayoutProps {
  direction?: ResponsiveValue<'vertical' | 'horizontal'>
  gap?: ResponsiveValue<SpacingValue>
  align?: ResponsiveValue<'stretch' | 'start' | 'center' | 'end' | 'baseline'>
  justify?: ResponsiveValue<'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'>
  breakpoints?: LayoutBreakpoints
  wrap?: boolean
  reverse?: boolean
  as?: 'div' | 'section' | 'main' | 'nav'
}
const props = withDefaults(defineProps<LayoutProps>(), { direction: 'vertical', gap: 0, align: 'stretch', justify: 'start', wrap: false, reverse: false, as: 'div' })
const breakpoint = useLayoutBreakpoint(() => props.breakpoints, () => [props.direction, props.gap, props.align, props.justify].some(isResponsiveValue))
const styles = computed<CSSProperties>(() => {
  const direction = resolveResponsiveValue<'horizontal' | 'vertical'>(props.direction, breakpoint.value, 'vertical')
  return {
    flexDirection: direction === 'vertical' ? (props.reverse ? 'column-reverse' : 'column') : (props.reverse ? 'row-reverse' : 'row'),
    gap: toCssGap(resolveResponsiveValue<SpacingValue>(props.gap, breakpoint.value, 0)),
    alignItems: resolveResponsiveValue(props.align, breakpoint.value, 'stretch'),
    justifyContent: resolveResponsiveValue(props.justify, breakpoint.value, 'start'),
  }
})
</script>