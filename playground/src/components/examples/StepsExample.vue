<script setup lang="ts">
import { ref } from 'vue'
import { ScqButton, ScqSteps, type StepItem } from '../../../../src/index'

const active = ref(0)
const items: StepItem[] = [{ title: '填写资料', description: '基本信息与负责人' }, { title: '校验文件', description: '格式与完整性' }, { title: '团队确认', description: '项目成员审核' }, { title: '完成交付', description: '文件归档与通知' }]
const next = () => { active.value = active.value >= items.length ? 0 : active.value + 1 }
</script>

<template><ScqSteps v-model:active="active" :items="items" clickable aria-label="项目交付流程" /><div class="steps-example__actions"><ScqButton :disabled="active === 0" @click="active -= 1">上一步</ScqButton><ScqButton type="primary" @click="next">{{ active >= items.length ? '重新开始' : '下一步' }}</ScqButton></div></template>

<style scoped>
.steps-example__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
</style>