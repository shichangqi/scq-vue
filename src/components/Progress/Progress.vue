<template>
  <div class="scq-progress" :class="[`scq-progress--${status}`, { 'is-indeterminate': indeterminate }]" :style="progressStyle">
    <div class="scq-progress__track" role="progressbar" :aria-label="ariaLabel || text('progress')" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="indeterminate ? undefined : value" :aria-valuetext="indeterminate ? text('loading') : formattedText">
      <div class="scq-progress__fill" :style="{ width: indeterminate ? '36%' : `${value}%` }"></div>
    </div>
    <span v-if="showText" class="scq-progress__text"><slot :percentage="value">{{ indeterminate ? text('loading') : formattedText }}</slot></span>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { useLocale } from '../ConfigProvider/context'

export type ProgressStatus = 'normal' | 'success' | 'warning' | 'exception'
defineOptions({ name: 'Progress' })

const props = withDefaults(defineProps<{
  percentage?: number
  status?: ProgressStatus
  strokeWidth?: number
  color?: string
  showText?: boolean
  indeterminate?: boolean
  format?: (percentage: number) => string
  ariaLabel?: string
}>(), { percentage: 0, status: 'normal', strokeWidth: 8, color: '', showText: true, indeterminate: false, ariaLabel: '' })

const text = useLocale()
const value = computed(() => Number.isFinite(props.percentage) ? Math.min(100, Math.max(0, props.percentage)) : 0)
const formattedText = computed(() => props.format ? props.format(value.value) : `${Math.round(value.value)}%`)
const progressStyle = computed(() => ({
  '--scq-progress-height': `${Number.isFinite(props.strokeWidth) ? Math.max(2, props.strokeWidth) : 8}px`,
  ...(props.color ? { '--scq-progress-color': props.color } : {}),
}) as CSSProperties)
</script>