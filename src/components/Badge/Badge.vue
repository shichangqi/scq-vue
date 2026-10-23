<template><span class="scq-badge" :class="{ 'has-content': $slots.default }"><slot /><sup v-if="visible || (!hidden && $slots.content)" class="scq-badge__value" :class="[`scq-badge--${type}`, `scq-badge--${placement}`, { 'is-dot': isDot }]" :style="offsetStyle" :aria-label="label || undefined" :aria-live="live" aria-atomic="true"><slot name="content" :value="value" :display-value="displayValue">{{ isDot ? '' : displayValue }}</slot></sup><span v-if="text" class="scq-badge__text">{{ text }}</span></span></template>

<script setup lang="ts">
import { computed } from 'vue'
export interface BadgeProps { value?: string | number; max?: number; isDot?: boolean; hidden?: boolean; showZero?: boolean; label?: string; type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'; placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; offset?: readonly [number, number]; text?: string; live?: 'off' | 'polite' | 'assertive' }
defineOptions({ name: 'Badge' })
const props = withDefaults(defineProps<BadgeProps>(), { max: 99, isDot: false, hidden: false, showZero: false, label: '', type: 'danger', placement: 'top-right', offset: () => [0, 0], text: '', live: 'off' })
const visible = computed(() => !props.hidden && (props.isDot || (props.value != null && props.value !== '' && (props.showZero || props.value !== 0))))
const displayValue = computed(() => {
  if (typeof props.value !== 'number') return props.value
  if (!Number.isFinite(props.value)) throw new RangeError('[scq-vue] Badge numeric values must be finite.')
  if (Number.isNaN(props.max) || props.max < 0) throw new RangeError('[scq-vue] Badge max must be non-negative or Infinity.')
  return props.value > props.max ? `${props.max}+` : props.value
})
const offsetStyle = computed(() => {
  if (props.offset.length !== 2 || !props.offset.every(Number.isFinite)) throw new RangeError('[scq-vue] Badge offset must contain two finite numbers.')
  return { '--scq-badge-offset-x': `${props.offset[0]}px`, '--scq-badge-offset-y': `${props.offset[1]}px` }
})
</script>