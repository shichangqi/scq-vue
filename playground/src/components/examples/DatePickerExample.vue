<script setup lang="ts">
import { ref } from 'vue'
import ScqDatePicker from '../../../../src/components/DatePicker'
import ScqSwitch from '../../../../src/components/Switch'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'
import type { DatePickerValue } from '../../../../src/index'

const day = ref<DatePickerValue>('2026-10-09')
const range = ref<DatePickerValue>([])
const locked = ref(false)
const disabledDate = (date: Date) => date.getDay() === 0
const OPTIONS = { maxRange: 7, firstDayOfWeek: 1, format: 'yyyy/MM/dd', minDate: '2026-10-01', maxDate: '2027-03-31' } as const
const picker = ref<InstanceType<typeof ScqDatePicker>>()
const readonly = ref(false)
const clearable = ref(true)
const limitedRange = ref<DatePickerValue>([])
const status = ref('最多选择七天')
</script>

<template>
  <div class="date-picker-example"><label>交付日期<ScqDatePicker v-model="day" :disabled="locked" min-date="2026-10-01" max-date="2027-03-31" :disabled-date="disabledDate" aria-label="交付日期" /></label><label>项目周期<ScqDatePicker v-model="range" type="daterange" :disabled="locked" min-date="2026-10-01" max-date="2027-03-31" placeholder="开始日期 ~ 结束日期" aria-label="项目周期" /></label><label class="date-picker-example__lock"><ScqSwitch v-model="locked" aria-label="锁定排期" />锁定排期</label></div><output class="date-picker-example__output">{{ day || '未排期' }} · {{ Array.isArray(range) ? range.join(' ~ ') : range }}</output>
  <ExampleSection title="范围限制、格式与实例控制" description="format 只改变显示格式，绑定值仍使用 yyyy-MM-dd。超过范围限制时不会提交，invalid 会反馈原因。">
    <template #controls><ScqCheckbox v-model="readonly">只读</ScqCheckbox><ScqCheckbox v-model="clearable">允许清空</ScqCheckbox></template>
    <ScqDatePicker ref="picker" v-model="limitedRange" type="daterange" v-bind="OPTIONS" :readonly="readonly" :clearable="clearable" :disabled="locked" size="small" name="schedule" aria-label="限期排程" @change="status = `change: ${JSON.stringify($event)}`" @clear="status = '已清空'" @invalid="status = `invalid: ${$event}`" />
    <ScqButton @click="picker?.show()">打开日历</ScqButton>
    <ScqButton @click="picker?.hide(); picker?.focus()">关闭并聚焦</ScqButton>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>

<style scoped>
.date-picker-example { display: flex; flex-wrap: wrap; align-items: end; gap: 20px; }
.date-picker-example > label { display: flex; flex-direction: column; gap: 8px; max-width: 100%; color: var(--scq-text); font-size: 13px; }
.date-picker-example .date-picker-example__lock { flex-direction: row; align-items: center; gap: 8px; min-height: 36px; }
.date-picker-example__output { display: block; margin-top: 20px; color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
</style>