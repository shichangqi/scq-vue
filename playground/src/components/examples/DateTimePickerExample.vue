<script setup lang="ts">
import { ref } from 'vue'
import ScqDateTimePicker from '../../../../src/components/DateTimePicker'
import type { DateTimePickerValue } from '../../../../src/index'

const DEFAULT_TIMES = { meeting: '09:30', reminder: '08:30:15', delivery: '12:00' }
const meeting = ref<DateTimePickerValue>('')
const reminder = ref<DateTimePickerValue>('')
const delivery = ref<DateTimePickerValue>('')
const preview = ref<DateTimePickerValue>('')
</script>

<template>
  <div class="datetime-example">
    <label>
      会议开始 · 分钟精度
      <ScqDateTimePicker
        v-model="meeting"
        :default-time="DEFAULT_TIMES.meeting"
        aria-label="会议开始"
        @draft-change="preview = $event"
      />
    </label>
    <label>
      定时提醒 · 秒级精度
      <ScqDateTimePicker v-model="reminder" seconds :default-time="DEFAULT_TIMES.reminder" aria-label="定时提醒" />
    </label>
    <label>
      自定义显示格式
      <ScqDateTimePicker v-model="delivery" format="yyyy/MM/dd HH:mm" :default-time="DEFAULT_TIMES.delivery" aria-label="交付时间" />
    </label>
  </div>
  <div class="datetime-example__result" aria-live="polite">
    <p>面板草稿：{{ preview || '未选择' }}</p>
    <p>已确认的会议时间：{{ meeting || '未提交' }}</p>
    <p>提醒：{{ reminder || '未设置' }} · 交付绑定值：{{ delivery || '未设置' }}</p>
  </div>
  <p class="datetime-example__hint">在同一面板中选择日期和时间，点击“确定”才更新绑定值；取消、Escape 或点击外部均保留原值。</p>
</template>

<style scoped>
.datetime-example { display: flex; flex-wrap: wrap; gap: 20px; }
.datetime-example label { display: flex; flex-direction: column; gap: 8px; max-width: 100%; color: var(--scq-text); font-size: 13px; }
.datetime-example__result { margin-top: 20px; padding: 12px 16px; background: var(--scq-fill); border-radius: var(--scq-radius); color: var(--scq-text); font-size: 13px; overflow-wrap: anywhere; }
.datetime-example__result p { margin: 4px 0; }
.datetime-example__hint { color: var(--scq-muted); font-size: 13px; line-height: 1.7; }
</style>
