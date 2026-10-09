<script setup lang="ts">
import { ref } from 'vue'
import { ScqCascader, ScqSwitch, type CascaderOption, type CascaderValue } from '../../../../src/index'

const value = ref<CascaderValue>(['engineering', 'platform'])
const changeOnSelect = ref(false)
const options: CascaderOption[] = [
  { value: 'engineering', label: '研发中心', children: [{ value: 'platform', label: '平台开发', children: [{ value: 'frontend', label: '前端小组' }, { value: 'backend', label: '服务端小组' }] }, { value: 'quality', label: '质量保障' }] },
  { value: 'design', label: '设计中心', children: [{ value: 'product', label: '产品设计' }, { value: 'brand', label: '品牌设计' }] },
  { value: 'archive', label: '归档部门', disabled: true },
]
</script>

<template>
  <div class="cascader-example"><label>归属团队<ScqCascader v-model="value" :options="options" filterable :change-on-select="changeOnSelect" aria-label="归属团队" /></label><label class="cascader-example__toggle"><ScqSwitch v-model="changeOnSelect" aria-label="允许选择分组" />允许选择分组</label><output>{{ JSON.stringify(value) }}</output></div>
</template>

<style scoped>
.cascader-example { display: grid; gap: 16px; }
.cascader-example label { display: grid; gap: 8px; font-size: 13px; color: var(--scq-text); }
.cascader-example .cascader-example__toggle { display: flex; align-items: center; }
.cascader-example output { color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
</style>