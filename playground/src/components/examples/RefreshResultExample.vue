<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import ScqCell from '../../../../src/components/Cell'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqPullRefresh from '../../../../src/components/PullRefresh'
import type { PullRefreshStatus } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const REQUEST_DELAY_MS = 700
const RESULT_HOLD_MS = 1200
const refreshRef = ref<InstanceType<typeof ScqPullRefresh>>()
const refreshing = ref(false)
const result = ref<Extract<PullRefreshStatus, 'success' | 'error'>>()
const failNext = ref(true)
const revision = ref(1)
const feedback = ref('首次刷新模拟失败；失败提示会保留重试入口。')
let timer: ReturnType<typeof setTimeout> | undefined

const load = () => {
  result.value = undefined
  const shouldFail = failNext.value
  timer = setTimeout(() => {
    timer = undefined
    result.value = shouldFail ? 'error' : 'success'
    if (!shouldFail) revision.value += 1
    failNext.value = false
    refreshing.value = false
    feedback.value = shouldFail ? '刷新失败，已保留当前内容。请点击重试。' : '刷新成功，内容已更新。'
  }, REQUEST_DELAY_MS)
}
onBeforeUnmount(() => { clearTimeout(timer) })
</script>

<template>
  <PhonePreview screen-id="refresh-result-preview">
    <ScqNavBar title="刷新结果与重试" right-icon="refresh" right-label="刷新内容" @click-right="refreshRef?.refresh()" />
    <ScqPullRefresh ref="refreshRef" v-model="refreshing" :result="result" :result-duration="RESULT_HOLD_MS" @refresh="load" @retry="feedback = '正在重试…'">
      <div class="refresh-result-example__body">
        <p class="refresh-result-example__hint">{{ feedback }}</p>
        <ScqCheckbox v-model="failNext" class="refresh-result-example__option" :disabled="refreshing">下一次刷新模拟失败</ScqCheckbox>
        <ScqCell :title="`数据版本 #${revision}`" label="在顶部下拉，或使用导航栏刷新按钮。" />
        <ScqCell title="刷新结果" label="请求结束时先设置 result，再将 refreshing 设为 false。" />
        <ScqCell title="失败后重试" label="点击重试可重新加载；加载期间请等待当前请求完成。" />
      </div>
    </ScqPullRefresh>
  </PhonePreview>
</template>

<style scoped>
.refresh-result-example__body { min-height: 450px; }
.refresh-result-example__hint { margin: 0; padding: 16px; font-size: 13px; color: var(--scq-muted); line-height: 1.6; }
.refresh-result-example__option { display: flex; align-items: center; gap: 8px; padding: 0 16px 16px; font-size: 13px; }
</style>
