<template><component :is="as" class="scq-layout" :class="{ 'is-wrap': wrap, 'is-reverse': reverse }" :style="{ flexDirection: direction === 'vertical' ? (reverse ? 'column-reverse' : 'column') : (reverse ? 'row-reverse' : 'row'), gap: typeof gap === 'number' ? `${gap}px` : gap, alignItems: align, justifyContent: justify }"><slot /></component></template>

<script setup lang="ts">
defineOptions({ name: 'Layout' })
withDefaults(defineProps<{ direction?: 'vertical' | 'horizontal'; gap?: number | string; align?: 'stretch' | 'start' | 'center' | 'end' | 'baseline'; justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'; wrap?: boolean; reverse?: boolean; as?: 'div' | 'section' | 'main' | 'nav' }>(), { direction: 'vertical', gap: 0, align: 'stretch', justify: 'start', wrap: false, reverse: false, as: 'div' })
</script>