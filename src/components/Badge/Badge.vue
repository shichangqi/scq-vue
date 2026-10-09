<template><span class="scq-badge" :class="{ 'has-content': $slots.default }"><slot /><sup v-if="visible" class="scq-badge__value" :class="[`scq-badge--${type}`, { 'is-dot': isDot }]" :aria-label="label || undefined">{{ isDot ? '' : displayValue }}</sup></span></template>

<script setup lang="ts">
import { computed } from 'vue'
defineOptions({ name: 'Badge' })
const props = withDefaults(defineProps<{ value?: string | number; max?: number; isDot?: boolean; hidden?: boolean; showZero?: boolean; label?: string; type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' }>(), { max: 99, isDot: false, hidden: false, showZero: false, label: '', type: 'danger' })
const visible = computed(() => !props.hidden && (props.isDot || (props.value != null && props.value !== '' && (props.showZero || props.value !== 0))))
const displayValue = computed(() => typeof props.value === 'number' && props.value > props.max ? `${props.max}+` : props.value)
</script>