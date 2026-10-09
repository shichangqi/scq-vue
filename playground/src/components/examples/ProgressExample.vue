<template>
  <div class="progress-example">
    <div class="progress-example__control"><span>上传进度</span><ScqInputNumber v-model="percentage" :min="0" :max="100" :step="10" aria-label="上传进度" /></div>
    <ScqProgress :percentage="percentage" aria-label="上传进度" />
    <ScqProgress :percentage="100" status="success" :format="() => '完成'" aria-label="同步完成" />
    <ScqProgress :percentage="65" status="warning" aria-label="空间使用率" />
    <ScqProgress :percentage="42" status="exception" :format="() => '失败'" aria-label="传输失败" />
    <ScqProgress indeterminate aria-label="准备文件" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScqInputNumber, ScqProgress } from '../../../../src/index'

const percentage = ref<number | undefined>(36)
</script>

<style scoped>
.progress-example { display: grid; gap: 24px; width: 100%; max-width: 520px; padding: 16px; box-sizing: border-box; }
.progress-example__control { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; color: #606266; font-size: 14px; }
</style>