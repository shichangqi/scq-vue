<template><div class="scq-space" :class="{ 'is-vertical': direction === 'vertical', 'is-fill': fill }" :style="spaceStyle"><slot /></div></template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

defineOptions({ name: 'Space' })
const props = withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  size?: number | [number, number]
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around'
  wrap?: boolean
  fill?: boolean
}>(), { direction: 'horizontal', size: 12, align: 'center', justify: 'start', wrap: true, fill: false })
const spaceStyle = computed(() => ({
  gap: Array.isArray(props.size) ? `${props.size[0]}px ${props.size[1]}px` : `${props.size}px`,
  alignItems: props.align,
  justifyContent: props.justify,
  flexWrap: props.wrap ? 'wrap' : 'nowrap',
}) as CSSProperties)
</script>