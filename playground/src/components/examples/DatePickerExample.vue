<script setup lang="ts">
import { ref } from 'vue'
import { ScqDatePicker, ScqSwitch, type DatePickerValue } from '../../../../src/index'

const day = ref<DatePickerValue>('2026-10-09')
const range = ref<DatePickerValue>([])
const locked = ref(false)
const disabledDate = (date: Date) => date.getDay() === 0
</script>

<template>
  <div class="date-picker-example"><label>交付日期<ScqDatePicker v-model="day" :disabled="locked" min-date="2026-10-01" max-date="2027-03-31" :disabled-date="disabledDate" aria-label="交付日期" /></label><label>项目周期<ScqDatePicker v-model="range" type="daterange" :disabled="locked" min-date="2026-10-01" max-date="2027-03-31" placeholder="开始日期 ~ 结束日期" aria-label="项目周期" /></label><label class="date-picker-example__lock"><ScqSwitch v-model="locked" aria-label="锁定排期" />锁定排期</label></div><output class="date-picker-example__output">{{ day || '未排期' }} · {{ Array.isArray(range) ? range.join(' ~ ') : range }}</output>
</template>

<style scoped>
.date-picker-example { display: flex; flex-wrap: wrap; align-items: end; gap: 20px; }
.date-picker-example label { display: flex; flex-direction: column; gap: 8px; max-width: 100%; color: var(--scq-text); font-size: 13px; }
.date-picker-example .date-picker-example__lock { flex-direction: row; align-items: center; min-height: 36px; }
.date-picker-example__output { display: block; margin-top: 20px; color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
</style>