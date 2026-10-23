<script setup lang="ts">
import { ref } from 'vue'
import ScqDateTimePicker from '../../../../src/components/DateTimePicker'
import type { DateTimePickerValue } from '../../../../src/index'

const MAX_DAYS = 7
const OFFICE_TIMES: [string, string] = ['09:00', '18:00']
const NIGHT_TIMES: [string, string] = ['22:00:00', '06:00:00']
const reservation = ref<DateTimePickerValue>([])
const nightShift = ref<DateTimePickerValue>([])
const display = (value: DateTimePickerValue) => Array.isArray(value) ? value.join(' → ') || '未选择' : value
</script>

<template>
  <div class="datetime-range-example">
    <label>
      预约时间段 · 最多 {{ MAX_DAYS }} 天
      <ScqDateTimePicker
        v-model="reservation"
        type="datetimerange"
        :default-time="OFFICE_TIMES"
        :max-range="MAX_DAYS"
        name="reservation"
        aria-label="预约时间段"
      />
    </label>
    <output>{{ display(reservation) }}</output>
    <label>
      跨日夜班 · 分别选择开始、结束日期
      <ScqDateTimePicker
        v-model="nightShift"
        type="datetimerange"
        seconds
        :default-time="NIGHT_TIMES"
        range-separator=" → "
        aria-label="跨日夜班"
      />
    </label>
    <output>{{ display(nightShift) }}</output>
  </div>
  <p class="datetime-range-example__hint">
    使用面板顶部的开始/结束标签切换端点；同一天也可以选择不同时间。结束时间早于开始时间时会显示错误，不会悄悄交换端点。
    清空范围返回 []，原生表单字段使用 reservation[0] 和 reservation[1]。
  </p>
</template>

<style scoped>
.datetime-range-example { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
.datetime-range-example label { display: flex; flex-direction: column; gap: 8px; max-width: 100%; color: var(--scq-text); font-size: 13px; }
.datetime-range-example output { color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
.datetime-range-example__hint { margin-bottom: 0; color: var(--scq-muted); font-size: 13px; line-height: 1.7; }
</style>
