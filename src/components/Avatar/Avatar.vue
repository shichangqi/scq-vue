<template>
  <span class="scq-avatar" :class="`scq-avatar--${shape}`" :style="avatarStyle" :role="!src || failed ? 'img' : undefined" :aria-label="!src || failed ? alt || undefined : undefined">
    <img v-if="src && !failed" :key="src" :src="src" :alt="alt" :loading="loading" :style="{ objectFit: fit }" @error="handleError" @load="emit('load', $event)" />
    <slot v-else><Icon :name="icon" :size="Math.round(pixelSize * 0.5)" /></slot>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useConfig, type ComponentSize } from '../ConfigProvider/context'

defineOptions({ name: 'Avatar' })
const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  size?: number | ComponentSize
  shape?: 'circle' | 'square'
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  icon?: IconName
  loading?: 'eager' | 'lazy'
}>(), { src: '', alt: '', shape: 'circle', fit: 'cover', icon: 'user', loading: 'lazy' })
const emit = defineEmits<{ (event: 'error' | 'load', value: Event): void }>()
const config = useConfig()
const failed = ref(false)
const pixelSize = computed(() => {
  const size = props.size ?? config.value.size
  return typeof size === 'number' ? Number.isFinite(size) && size > 0 ? size : 40 : { small: 32, default: 40, large: 56 }[size]
})
const avatarStyle = computed(() => ({ '--scq-avatar-size': `${pixelSize.value}px`, fontSize: `${Math.round(pixelSize.value * 0.36)}px` }) as CSSProperties)
const handleError = (event: Event) => { failed.value = true; emit('error', event) }
watch(() => props.src, () => { failed.value = false })
</script>