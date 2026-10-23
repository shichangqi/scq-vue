<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import ScqCalendar from '../../../../src/components/Calendar'
import ScqCell from '../../../../src/components/Cell'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqSwitch from '../../../../src/components/Switch'
import Toast from '../../../../src/components/Toast'
import type { CalendarValue } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const BOOKING_RANGE = { min: 2, max: 5, lateStartDay: 20 } as const
const dates = ref<CalendarValue>(['2026-10-12'])
const booking = ref('尚未确认')
const lateOnly = ref(false)
const disabledDate = (date: Date) => date.getDay() === 0 || date.getDay() === 6 || (lateOnly.value && date.getDate() < BOOKING_RANGE.lateStartDay)
const confirm = (value: CalendarValue) => { booking.value = Array.isArray(value) ? value.join(' ~ ') : value; Toast.success({ message: '预约已确认', teleport: '#calendar-booking-preview' }) }
const invalid = () => Toast.fail({ message: `请选择连续 ${BOOKING_RANGE.min} 至 ${BOOKING_RANGE.max} 个工作日`, teleport: '#calendar-booking-preview' })
onBeforeUnmount(() => Toast.clear('#calendar-booking-preview'))
</script>

<template>
  <PhonePreview screen-id="calendar-booking-preview"><ScqNavBar title="会议室预约" /><ScqCell title="创意会议室" label="4-8 人 · 视频会议 · 白板" /><label class="calendar-example__filter"><ScqSwitch v-model="lateOnly" aria-label="仅开放月末预约" />仅开放每月 {{ BOOKING_RANGE.lateStartDay }} 日起的工作日</label><div class="calendar-example__calendar"><ScqCalendar v-model="dates" type="range" min-date="2026-10-01" max-date="2027-03-31" :disabled-date="disabledDate" :min-range="BOOKING_RANGE.min" :max-range="BOOKING_RANGE.max" range-preview show-confirm confirm-text="确认预约" @confirm="confirm" @invalid="invalid" /></div><ScqCell title="预约日期" :label="booking" /></PhonePreview>
</template>

<style scoped>
.calendar-example__calendar { padding: var(--scq-picker-gap); background: var(--scq-surface); }
.calendar-example__filter { display: flex; align-items: center; gap: var(--scq-picker-gap); padding: var(--scq-picker-gap); color: var(--scq-text); font-size: 13px; }
</style>