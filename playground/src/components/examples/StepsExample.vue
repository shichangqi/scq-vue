<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqSteps from '../../../../src/components/Steps'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'
import type { StepItem } from '../../../../src/index'

const active = ref(0)
const vertical = ref(false)
const disabled = ref(false)
const failed = ref(false)
const status = ref('')
const items: StepItem[] = [{ title: '填写资料', description: '基本信息与负责人' }, { title: '校验文件', description: '格式与完整性' }, { title: '团队确认', description: '项目成员审核' }, { title: '完成交付', description: '文件归档与通知' }]
const next = () => { active.value = active.value >= items.length ? 0 : active.value + 1 }
</script>

<template>
  <ExampleSection title="方向、步骤状态与禁用">
    <template #controls><ScqCheckbox v-model="vertical">纵向</ScqCheckbox><ScqCheckbox v-model="disabled">禁止点击步骤</ScqCheckbox><ScqCheckbox v-model="failed">当前步骤失败</ScqCheckbox></template>
    <ScqSteps v-model:active="active" :items="items" :direction="vertical ? 'vertical' : 'horizontal'" :disabled="disabled" :process-status="failed ? 'error' : 'process'" clickable aria-label="项目交付流程" @change="status = `change: ${$event}`" />
    <div class="steps-example__actions"><ScqButton :disabled="active === 0" @click="active -= 1">上一步</ScqButton><ScqButton type="primary" @click="next">{{ active >= items.length ? '重新开始' : '下一步' }}</ScqButton></div>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>

<style scoped>
.steps-example__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
</style>