<script setup lang="ts">
import { ref } from 'vue'
import ScqTimePicker from '../../../../src/components/TimePicker'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'
import type { TimePickerValue } from '../../../../src/index'

const meeting = ref<TimePickerValue>('09:30')
const hours = ref<TimePickerValue>(['09:00', '18:00'])
const alarm = ref<TimePickerValue>('08:30:15')
const invalid = ref(false)
const OPTIONS = { step: 15, lunchStart: '12:00', lunchEnd: '13:00' }
const overnight = ref<TimePickerValue>(['22:00', '06:00'])
const appointment = ref<TimePickerValue>('09:00')
const readonly = ref(false)
const disabled = ref(false)
const status = ref('午休时段不可选；夜班允许跨日。')
const disabledTime = (value: string) => value >= OPTIONS.lunchStart && value < OPTIONS.lunchEnd
</script>

<template>
  <div class="time-picker-example"><label>会议开始<ScqTimePicker v-model="meeting" min="08:00" max="20:00" aria-label="会议开始" /></label><label>营业时间<ScqTimePicker v-model="hours" is-range min="07:00" max="23:00" aria-label="营业时间" @invalid="invalid = true" @change="invalid = false" /></label><label>定时提醒<ScqTimePicker v-model="alarm" seconds aria-label="定时提醒" /></label></div><p v-if="invalid" class="time-picker-example__error" role="alert">结束时间不能早于开始时间。</p>
  <ExampleSection title="跨日、步长与禁用时段">
    <template #controls><ScqCheckbox v-model="readonly">只读</ScqCheckbox><ScqCheckbox v-model="disabled">禁用</ScqCheckbox></template>
    <ScqTimePicker v-model="overnight" is-range allow-overnight :step="OPTIONS.step" :readonly="readonly" :disabled="disabled" :clearable="false" aria-label="跨日夜班" @change="status = `夜班：${JSON.stringify($event)}`" />
    <ScqTimePicker v-model="appointment" :step="OPTIONS.step" :disabled-time="disabledTime" :readonly="readonly" :disabled="disabled" size="small" name="appointment" placeholder="选择预约时间" aria-label="预约时间" @invalid="status = `不可用时间：${$event}`" @change="status = `预约：${$event}`" @clear="status = '已清空预约'" />
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>

<style scoped>
.time-picker-example { display: flex; flex-wrap: wrap; gap: 20px; }
.time-picker-example label { display: flex; flex-direction: column; gap: 8px; max-width: 100%; color: var(--scq-text); font-size: 13px; }
.time-picker-example__error { color: var(--scq-danger); font-size: 13px; margin: 12px 0 0; }
</style>