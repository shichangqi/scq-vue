<script setup lang="ts">
import { ref } from 'vue'
import { ScqTimePicker, type TimePickerValue } from '../../../../src/index'

const meeting = ref<TimePickerValue>('09:30')
const hours = ref<TimePickerValue>(['09:00', '18:00'])
const alarm = ref<TimePickerValue>('08:30:15')
const invalid = ref(false)
</script>

<template>
  <div class="time-picker-example"><label>会议开始<ScqTimePicker v-model="meeting" min="08:00" max="20:00" aria-label="会议开始" /></label><label>营业时间<ScqTimePicker v-model="hours" is-range min="07:00" max="23:00" aria-label="营业时间" @invalid="invalid = true" @change="invalid = false" /></label><label>定时提醒<ScqTimePicker v-model="alarm" seconds aria-label="定时提醒" /></label></div><p v-if="invalid" class="time-picker-example__error" role="alert">结束时间不能早于开始时间。</p>
</template>

<style scoped>
.time-picker-example { display: flex; flex-wrap: wrap; gap: 20px; }
.time-picker-example label { display: flex; flex-direction: column; gap: 8px; max-width: 100%; color: var(--scq-text); font-size: 13px; }
.time-picker-example__error { color: var(--scq-danger); font-size: 13px; margin: 12px 0 0; }
</style>