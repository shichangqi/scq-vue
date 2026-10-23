<script setup lang="ts">
import { ref } from 'vue'
import { addDays, endOfDay, format, set, startOfDay } from 'date-fns'
import ScqDateTimePicker from '../../../../src/components/DateTimePicker'
import type { DateTimePickerShortcut, DateTimePickerValue } from '../../../../src/index'

const SCHEDULE = {
  format: 'yyyy-MM-dd HH:mm',
  windowDays: 14,
  minuteStep: 15,
  openingHour: 9,
  closingHour: 18,
  lunchHour: 12,
  closedWeekday: 0,
  morningHour: 10,
  afternoonHour: 15,
}
const today = startOfDay(new Date())
const min = format(today, SCHEDULE.format)
const max = format(endOfDay(addDays(today, SCHEDULE.windowDays)), SCHEDULE.format)
const appointment = ref<DateTimePickerValue>('')
const disabledDate = (date: Date) => date.getDay() === SCHEDULE.closedWeekday
const disabledTime = (date: Date) => date.getHours() < SCHEDULE.openingHour || date.getHours() >= SCHEDULE.closingHour || date.getHours() === SCHEDULE.lunchHour
const shortcutValue = (days: number, hours: number) => format(set(addDays(new Date(), days), { hours, minutes: 0, seconds: 0 }), SCHEDULE.format)
const shortcuts: DateTimePickerShortcut[] = [
  { label: '今天上午', value: () => shortcutValue(0, SCHEDULE.morningHour), disabled: disabledDate(today) },
  { label: '明天下午', value: () => shortcutValue(1, SCHEDULE.afternoonHour), disabled: disabledDate(addDays(today, 1)) },
  { label: '午休时段（不可预约）', value: () => shortcutValue(0, SCHEDULE.lunchHour) },
]
</script>

<template>
  <div class="datetime-options-example">
    <ScqDateTimePicker
      v-model="appointment"
      :min="min"
      :max="max"
      :minute-step="SCHEDULE.minuteStep"
      :disabled-date="disabledDate"
      :disabled-time="disabledTime"
      :shortcuts="shortcuts"
      aria-label="服务预约"
    />
    <ul>
      <li>可选范围：{{ min }} ～ {{ max }}</li>
      <li>周日不开放，营业时间 {{ SCHEDULE.openingHour }}:00～{{ SCHEDULE.closingHour }}:00，{{ SCHEDULE.lunchHour }}:00～{{ SCHEDULE.lunchHour + 1 }}:00 午休。</li>
      <li>分钟步长为 {{ SCHEDULE.minuteStep }}；选日期时自动匹配可用时间，小时和分钟列同步禁用不可选项。</li>
      <li>“此时”和快捷选项也遵守所有限制，快捷选项选中后仍需确认。</li>
    </ul>
    <output>已确认：{{ appointment || '未预约' }}</output>
  </div>
</template>

<style scoped>
.datetime-options-example { color: var(--scq-text); font-size: 13px; line-height: 1.8; }
.datetime-options-example ul { padding-left: 20px; color: var(--scq-muted); overflow-wrap: anywhere; }
.datetime-options-example output { display: block; overflow-wrap: anywhere; }
</style>
