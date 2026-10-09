<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ScqCalendar, ScqCell, ScqNavBar, Toast, type CalendarValue } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const dates = ref<CalendarValue>(['2026-10-12'])
const booking = ref('尚未确认')
const disabledDate = (date: Date) => date.getDay() === 0 || date.getDay() === 6
const confirm = (value: CalendarValue) => { booking.value = Array.isArray(value) ? value.join(' ~ ') : value; Toast.success({ message: '预约已确认', teleport: '#calendar-booking-preview' }) }
const invalid = () => Toast.fail({ message: '请选择连续的工作日，最多 5 天', teleport: '#calendar-booking-preview' })
onBeforeUnmount(() => Toast.clear('#calendar-booking-preview'))
</script>

<template>
  <PhonePreview screen-id="calendar-booking-preview"><ScqNavBar title="会议室预约" /><ScqCell title="创意会议室" label="4-8 人 · 视频会议 · 白板" /><div class="calendar-example__calendar"><ScqCalendar v-model="dates" type="range" min-date="2026-10-01" max-date="2027-03-31" :disabled-date="disabledDate" :max-range="5" show-confirm confirm-text="确认预约" @confirm="confirm" @invalid="invalid" /></div><ScqCell title="预约日期" :label="booking" /></PhonePreview>
</template>

<style scoped>
.calendar-example__calendar { padding: 8px; background: var(--scq-surface); }
</style>