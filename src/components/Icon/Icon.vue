<template>
  <i class="scq-icon" :class="[`scq-icon--${resolvedName}`, `scq-icon--${renderVariant}`]" :style="iconStyle" aria-hidden="true">
    <svg viewBox="0 0 24 24" :fill="svgFill" :stroke="svgStroke" :stroke-width="svgStrokeWidth" stroke-linecap="round" stroke-linejoin="round">
      <path v-for="path in paths" :key="path" :d="path" />
    </svg>
  </i>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconPaths, solidIconPaths, type IconName, type IconVariant } from './icons'

defineOptions({
  name: 'Icon',
})

const props = withDefaults(
  defineProps<{
    name: IconName | string
    variant?: IconVariant
    size?: number | string
    color?: string
  }>(),
  {
    variant: 'outline',
    size: '1em',
    color: '',
  },
)

const resolvedName = computed<IconName>(() => {
  return props.name in iconPaths ? (props.name as IconName) : 'file'
})

const resolvedVariant = computed<IconVariant>(() => {
  return props.variant === 'solid' ? 'solid' : 'outline'
})

const renderVariant = computed<IconVariant>(() => {
  return resolvedVariant.value === 'solid' && solidIconPaths[resolvedName.value] ? 'solid' : 'outline'
})

const paths = computed(() => {
  return renderVariant.value === 'solid' ? solidIconPaths[resolvedName.value] || iconPaths[resolvedName.value] : iconPaths[resolvedName.value]
})

const svgFill = computed(() => {
  return renderVariant.value === 'solid' ? 'currentColor' : 'none'
})

const svgStroke = computed(() => {
  return renderVariant.value === 'solid' ? 'none' : 'currentColor'
})

const svgStrokeWidth = computed(() => {
  return renderVariant.value === 'solid' ? 0 : 2
})

const normalizedSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const iconStyle = computed(() => {
  return {
    '--scq-icon-size': normalizedSize.value,
    color: props.color || undefined,
  }
})
</script>

<style scoped>
.scq-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--scq-icon-size, 1em);
  height: var(--scq-icon-size, 1em);
  flex: 0 0 auto;
  line-height: 1;
  color: inherit;
  vertical-align: -0.125em;
}

.scq-icon svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>