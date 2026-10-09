<template><div class="scq-divider" :class="[`scq-divider--${direction}`, `scq-divider--${contentPosition}`, { 'is-dashed': dashed }]" role="separator" :aria-orientation="direction"><span v-if="$slots.default && direction === 'horizontal'" class="scq-divider__text"><slot /></span></div></template>

<script setup lang="ts">
defineOptions({ name: 'Divider' })
withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  contentPosition?: 'left' | 'center' | 'right'
  dashed?: boolean
}>(), { direction: 'horizontal', contentPosition: 'center', dashed: false })
</script>