<template><div class="scq-divider" :class="[`scq-divider--${direction}`, `scq-divider--${contentPosition}`, { 'is-dashed': dashed }]" role="separator" :aria-orientation="direction"><Label v-if="$slots.default && direction === 'horizontal'"><slot /></Label></div></template>

<script setup lang="ts">
import { h, type FunctionalComponent } from 'vue'
import { hasSlotContent } from '../../utils/slots'

defineOptions({ name: 'Divider' })
withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  contentPosition?: 'left' | 'center' | 'right' | 'start' | 'end'
  dashed?: boolean
}>(), { direction: 'horizontal', contentPosition: 'center', dashed: false })
const Label: FunctionalComponent = (_props, { slots }) => {
  const children = slots.default?.() ?? []
  return hasSlotContent(children) ? h('span', { class: 'scq-divider__text' }, children) : null
}
</script>