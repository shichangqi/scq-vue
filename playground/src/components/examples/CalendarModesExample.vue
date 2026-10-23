<script setup lang="ts">
import { ref } from 'vue'
import ScqCalendar from '../../../../src/components/Calendar'
import type { CalendarValue } from '../../../../src/components/Calendar'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { initialMonth: '2026-10', firstDayOfWeek: 0, maxSelected: 3, markedDay: 15 } as const
const single = ref<CalendarValue>('2026-10-15')
const multiple = ref<CalendarValue>([])
const month = ref<string>(CONFIG.initialMonth)
const disabled = ref(false)
const status = ref('点击月份或年份标题，可以切换月份 / 年份面板。')
</script>

<template>
  <ExampleSection title="单选、多选与日期插槽">
    <template #controls><ScqCheckbox v-model="disabled">禁用日历</ScqCheckbox></template>
    <ScqCalendar v-model="single" v-model:month="month" type="single" :first-day-of-week="CONFIG.firstDayOfWeek" :disabled="disabled" :show-today="false" aria-label="单选日历" @panel-change="status = `panel-change: ${$event}`" @select="status = `select: ${$event}`">
      <template #day="{ date }">{{ date.getDate() }}{{ date.getDate() === CONFIG.markedDay ? ' ·' : '' }}</template>
    </ScqCalendar>
    <ScqCalendar v-model="multiple" :month="month" type="multiple" :max-selected="CONFIG.maxSelected" :disabled="disabled" aria-label="多选日历" @update:month="month = $event" @invalid="status = `最多选择 ${CONFIG.maxSelected} 天：${$event}`" @change="status = `change: ${JSON.stringify($event)}`" />
    <output role="status">{{ status }} · 已选择：{{ JSON.stringify(multiple) }}</output>
  </ExampleSection>
</template>
