<script setup lang="ts">
import { ref } from 'vue'
import { ScqButton, ScqResult, type ResultStatus } from '../../../../src/index'

const status = ref<ResultStatus>('success')
const results: Record<ResultStatus, { title: string; subtitle: string }> = { success: { title: '提交成功', subtitle: '项目资料已保存，可以继续处理下一项任务。' }, warning: { title: '资料待补充', subtitle: '仍有两份附件尚未提供。' }, error: { title: '提交失败', subtitle: '网络暂不可用，稍后可以重新提交。' }, info: { title: '等待审核', subtitle: '负责人正在核对项目资料。' }, '403': { title: '无访问权限', subtitle: '请联系项目负责人确认你的访问范围。' }, '404': { title: '项目不存在', subtitle: '该项目可能已被移动或归档。' }, '500': { title: '服务暂不可用', subtitle: '请稍后重试。' } }
</script>

<template><label class="result-example__state">结果状态<select v-model="status"><option v-for="(result, key) in results" :key="key" :value="key">{{ result.title }}</option></select></label><ScqResult :status="status" :title="results[status].title" :subtitle="results[status].subtitle"><template #extra><ScqButton type="primary" @click="status = 'success'">重新提交</ScqButton><ScqButton @click="status = 'info'">查看进度</ScqButton></template></ScqResult></template>

<style scoped>
.result-example__state { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--scq-muted); }
.result-example__state select { max-width: 100%; min-height: 34px; padding: 6px 10px; border: 1px solid var(--scq-border); border-radius: var(--scq-radius); color: var(--scq-text); background: var(--scq-surface); font: inherit; }
</style>