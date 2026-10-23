<script setup lang="ts">
import { ref } from 'vue'
import ScqRate from '../../../../src/components/Rate'
import ScqSwitch from '../../../../src/components/Switch'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'

const score = ref(3.5)
const readonly = ref(false)
const texts = ['不满意', '一般', '还不错', '满意', '非常满意']
const CUSTOM = { max: 3, size: 32, color: '#7c3aed' }
const quick = ref(2)
const disabled = ref(false)
const event = ref('再次点击当前评分可清空')
</script>

<template>
  <div class="rate-example"><div><span>本次服务</span><ScqRate v-model="score" allow-half :readonly="readonly" show-text :texts="texts" aria-label="本次服务评分" /></div><label><ScqSwitch v-model="readonly" aria-label="只读评分" />已提交</label><div><span>用户平均</span><ScqRate :model-value="4.5" readonly allow-half show-text aria-label="用户平均评分" /></div></div>
  <ExampleSection title="自定义星数、颜色与清空">
    <template #controls><ScqCheckbox v-model="disabled">禁用</ScqCheckbox></template>
    <ScqRate v-model="quick" v-bind="CUSTOM" clearable :disabled="disabled" aria-label="快捷评分" @change="event = `change: ${$event}`" @hover-change="event = `hover-change: ${$event}`" />
    <output role="status">{{ event }} · 当前：{{ quick }}</output>
  </ExampleSection>
</template>

<style scoped>
.rate-example { display: flex; flex-wrap: wrap; align-items: center; gap: 28px; }
.rate-example > div { display: grid; gap: 10px; min-width: 0; }
.rate-example > div > span, .rate-example > label { color: var(--scq-muted); font-size: 13px; }
.rate-example > label { display: flex; align-items: center; gap: 8px; }
</style>