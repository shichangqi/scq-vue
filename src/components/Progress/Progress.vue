<template>
  <div class="scq-progress" :class="[`scq-progress--${status}`, { 'is-indeterminate': indeterminate, 'is-circular': type !== 'line' }]" :style="progressStyle">
    <div class="scq-progress__track" role="progressbar" :aria-label="ariaLabel || text('progress')" :aria-valuemin="0" :aria-valuemax="GEOMETRY.maximum" :aria-valuenow="indeterminate ? undefined : value" :aria-valuetext="indeterminate ? text('loading') : formattedText">
      <svg v-if="type !== 'line'" :viewBox="GEOMETRY.viewBox" class="scq-progress__ring" aria-hidden="true">
        <circle class="scq-progress__ring-track" :cx="GEOMETRY.center" :cy="GEOMETRY.center" :r="radius" fill="none" :stroke-width="ringStroke" :stroke-dasharray="`${arcLength} ${circumference}`" :transform="rotation" />
        <circle v-if="buffer !== undefined && !indeterminate" class="scq-progress__ring-buffer" :cx="GEOMETRY.center" :cy="GEOMETRY.center" :r="radius" fill="none" :stroke-width="ringStroke" :stroke-dasharray="`${arcLength * bufferValue / GEOMETRY.maximum} ${circumference}`" :transform="rotation" />
        <circle class="scq-progress__ring-fill" :cx="GEOMETRY.center" :cy="GEOMETRY.center" :r="radius" fill="none" :stroke-width="ringStroke" :stroke-dasharray="`${arcLength * (indeterminate ? GEOMETRY.indeterminateValue : value) / GEOMETRY.maximum} ${circumference}`" :transform="rotation" />
      </svg>
      <template v-else><div v-if="buffer !== undefined && !indeterminate" class="scq-progress__buffer" :style="{ width: `${bufferValue}%` }"></div><div class="scq-progress__fill" :style="{ width: `${indeterminate ? GEOMETRY.lineIndeterminateValue : value}%`, background: resolvedColor || undefined }"></div></template>
    </div>
    <span v-if="showText" class="scq-progress__text"><slot :percentage="value">{{ indeterminate ? text('loading') : formattedText }}</slot></span>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { PROGRESS_GEOMETRY as GEOMETRY } from './constants'

export type ProgressStatus = 'normal' | 'success' | 'warning' | 'exception'
export interface ProgressColorStop { percentage: number; color: string }
export interface ProgressProps {
  percentage?: number; status?: ProgressStatus; strokeWidth?: number; color?: string | ProgressColorStop[]; showText?: boolean; indeterminate?: boolean; format?: (percentage: number) => string; ariaLabel?: string; type?: 'line' | 'circle' | 'dashboard'; width?: number; buffer?: number
}
defineOptions({ name: 'Progress' })

const props = withDefaults(defineProps<ProgressProps>(), { percentage: 0, status: 'normal', strokeWidth: GEOMETRY.defaultStroke, color: '', showText: true, indeterminate: false, ariaLabel: '', type: 'line', width: GEOMETRY.defaultWidth })

const text = useLocale()
const normalize = (value: number) => Number.isFinite(value) ? Math.min(GEOMETRY.maximum, Math.max(0, value)) : 0
const value = computed(() => normalize(props.percentage))
const bufferValue = computed(() => Math.max(value.value, normalize(props.buffer ?? 0)))
const ringStroke = computed(() => Math.min(GEOMETRY.maxStroke, Math.max(GEOMETRY.minStroke, Number.isFinite(props.strokeWidth) ? props.strokeWidth : GEOMETRY.defaultStroke)))
const radius = computed(() => GEOMETRY.center - ringStroke.value / 2)
const circumference = computed(() => Math.PI * radius.value * 2)
const arcLength = computed(() => circumference.value * (props.type === 'dashboard' ? GEOMETRY.dashboardArc : 1))
const rotation = computed(() => `rotate(${props.type === 'dashboard' ? GEOMETRY.dashboardRotation : GEOMETRY.circleRotation} ${GEOMETRY.center} ${GEOMETRY.center})`)
const resolvedColor = computed(() => {
  if (typeof props.color === 'string') return props.color
  const stops = props.color.filter(stop => Number.isFinite(stop.percentage)).slice().sort((left, right) => left.percentage - right.percentage)
  return (stops.find(stop => value.value <= stop.percentage) ?? stops.at(-1))?.color ?? ''
})
const formattedText = computed(() => props.format ? props.format(value.value) : `${Math.round(value.value)}%`)
const progressStyle = computed<CSSProperties>(() => ({
  '--scq-progress-height': `${Number.isFinite(props.strokeWidth) ? Math.max(GEOMETRY.minStroke, props.strokeWidth) : GEOMETRY.defaultStroke}px`,
  ...(resolvedColor.value ? { '--scq-progress-color': resolvedColor.value } : {}),
  ...(props.type !== 'line' ? { width: `${Number.isFinite(props.width) ? Math.max(GEOMETRY.minimumWidth, props.width) : GEOMETRY.defaultWidth}px` } : {}),
}))
</script>