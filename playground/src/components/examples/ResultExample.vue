<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqResult from '../../../../src/components/Result'
import ScqSelect from '../../../../src/components/Select'
import type { ResultStatus, SelectValue } from '../../../../src/index'

const status = ref<ResultStatus>('success')
const results: Record<ResultStatus, { title: string; subtitle: string }> = { success: { title: '提交成功', subtitle: '项目资料已保存，可以继续处理下一项任务。' }, warning: { title: '资料待补充', subtitle: '仍有两份附件尚未提供。' }, error: { title: '提交失败', subtitle: '网络暂不可用，稍后可以重新提交。' }, info: { title: '等待审核', subtitle: '负责人正在核对项目资料。' }, '403': { title: '无访问权限', subtitle: '请联系项目负责人确认你的访问范围。' }, '404': { title: '项目不存在', subtitle: '该项目可能已被移动或归档。' }, '500': { title: '服务暂不可用', subtitle: '请稍后重试。' } }
const isStatus = (value: unknown): value is ResultStatus => typeof value === 'string' && Object.hasOwn(results, value)
const setStatus = (value: SelectValue | SelectValue[] | null) => {
  if (!isStatus(value)) throw new RangeError('Unknown result status.')
  status.value = value
}
const options = Object.entries(results).map(([value, result]) => ({ label: result.title, value }))
</script>

<template><label class="result-example__state">结果状态<ScqSelect :model-value="status" :options="options" :clearable="false" aria-label="结果状态" @update:model-value="setStatus" /></label><ScqResult :status="status" :title="results[status].title" :subtitle="results[status].subtitle"><template #extra><ScqButton type="primary" @click="status = 'success'">重新提交</ScqButton><ScqButton @click="status = 'info'">查看进度</ScqButton></template></ScqResult></template>

<style scoped>
.result-example__state { display: flex; flex-wrap: wrap; align-items: center; gap: var(--scq-space-md, 12px); font-size: 13px; color: var(--scq-muted); }
.result-example__state .scq-select { min-width: 0; max-width: 100%; }
</style>