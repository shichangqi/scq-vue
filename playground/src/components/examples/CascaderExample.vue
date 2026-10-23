<script setup lang="ts">
import { ref } from 'vue'
import ScqCascader from '../../../../src/components/Cascader'
import ScqSwitch from '../../../../src/components/Switch'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'
import type { CascaderOption, CascaderValue } from '../../../../src/index'

const value = ref<CascaderValue>(['engineering', 'platform', 'frontend'])
const changeOnSelect = ref(false)
const leaf = ref<CascaderValue>('frontend')
const readonly = ref(false)
const disabled = ref(false)
const status = ref('')
const options: CascaderOption[] = [
  { value: 'engineering', label: '研发中心', children: [{ value: 'platform', label: '平台开发', children: [{ value: 'frontend', label: '前端小组' }, { value: 'backend', label: '服务端小组' }] }, { value: 'quality', label: '质量保障' }] },
  { value: 'design', label: '设计中心', children: [{ value: 'product', label: '产品设计' }, { value: 'brand', label: '品牌设计' }] },
  { value: 'archive', label: '归档部门', disabled: true },
]
</script>

<template>
  <div class="cascader-example"><label>归属团队<ScqCascader v-model="value" :options="options" filterable :change-on-select="changeOnSelect" aria-label="归属团队" /></label><label class="cascader-example__toggle"><ScqSwitch v-model="changeOnSelect" aria-label="允许选择分组" />允许选择分组</label><output>{{ JSON.stringify(value) }}</output></div>
  <ExampleSection title="只返回末级值与输入状态" description="emitPath=false 返回末级 value，而不是完整路径；separator 只改变路径的显示分隔符。">
    <template #controls><ScqCheckbox v-model="readonly">只读</ScqCheckbox><ScqCheckbox v-model="disabled">禁用</ScqCheckbox></template>
    <ScqCascader v-model="leaf" :options="options" :emit-path="false" separator=" > " :readonly="readonly" :disabled="disabled" clearable size="small" placeholder="选择团队" name="team" aria-label="团队末级值" @change="status = `change: ${JSON.stringify($event)}`" @clear="status = '已清空'" />
    <output role="status">{{ status }} · {{ JSON.stringify(leaf) }}</output>
  </ExampleSection>
</template>

<style scoped>
.cascader-example { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; min-width: 0; }
.cascader-example label { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; min-width: 0; font-size: 13px; color: var(--scq-text); }
.cascader-example .scq-cascader { min-width: 0; max-width: 100%; }
.cascader-example .cascader-example__toggle { display: flex; align-items: center; }
.cascader-example output { color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
</style>