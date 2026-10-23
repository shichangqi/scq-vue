<script setup lang="ts">
import { ref } from 'vue'
import ScqLayout from '../../../../src/components/Layout'
import ScqRadio from '../../../../src/components/Radio'
import ScqRadioGroup from '../../../../src/components/RadioGroup'
import type { RadioValue } from '../../../../src/index'

const direction = ref<'horizontal' | 'vertical'>('horizontal')
const setDirection = (value: RadioValue) => {
  if (value !== 'horizontal' && value !== 'vertical') throw new RangeError('Unknown layout direction.')
  direction.value = value
}
const statuses = [{ title: '处理中', count: 12 }, { title: '待确认', count: 4 }, { title: '已完成', count: 38 }]
</script>

<template><fieldset class="layout-example__mode"><legend>排列方向</legend><ScqRadioGroup :model-value="direction" aria-label="排列方向" @update:model-value="setDirection"><ScqRadio value="horizontal">水平</ScqRadio><ScqRadio value="vertical">垂直</ScqRadio></ScqRadioGroup></fieldset><ScqLayout class="layout-example__content" :direction="direction" gap="md" wrap><div v-for="status in statuses" :key="status.title" class="layout-example__item"><span>{{ status.title }}</span><strong>{{ status.count }}</strong></div></ScqLayout></template>

<style scoped>
.layout-example__mode { display: flex; gap: 16px; margin: 0 0 18px; padding: 0; border: 0; color: var(--scq-muted); font-size: 13px; }
.layout-example__mode legend { margin-bottom: 10px; }
.layout-example__content { --layout-example-item-width: 140px; }
.layout-example__item { flex: 1; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; min-width: min(100%, var(--layout-example-item-width)); min-height: 70px; padding: 12px 18px; box-sizing: border-box; background: var(--scq-fill); color: var(--scq-text); border-left: 3px solid var(--scq-primary); }
.layout-example__item:nth-child(2) { border-left-color: var(--scq-warning); }
.layout-example__item:nth-child(3) { border-left-color: var(--scq-success); }
.layout-example__item span { font-size: 13px; }
.layout-example__item strong { font-size: 24px; }
</style>