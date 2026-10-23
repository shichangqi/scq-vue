<template>
  <ScqConfigProvider :tokens="customTheme ? CUSTOM_THEME : undefined" class="progress-example">
    <ScqCheckbox v-model="customTheme">自定义主题色</ScqCheckbox>
    <ScqCheckbox v-model="showText">显示进度文字</ScqCheckbox>
    <div class="progress-example__control"><span>上传进度</span><ScqInputNumber v-model="percentage" :min="0" :max="100" :step="10" aria-label="上传进度" /></div>
    <ScqProgress :percentage="percentage" :stroke-width="SIZES.stroke" :show-text="showText" aria-label="上传进度" />
    <div class="progress-example__rings"><ScqProgress type="circle" :width="SIZES.circle" :percentage="percentage" :buffer="75" :show-text="showText" aria-label="上传进度" /><ScqProgress type="dashboard" :percentage="percentage" :color="[{ percentage: 50, color: '#b45309' }, { percentage: 100, color: '#15803d' }]" aria-label="处理进度" /></div>
    <ScqProgress :percentage="100" status="success" :format="() => '完成'" aria-label="同步完成" />
    <ScqProgress :percentage="65" status="warning" aria-label="空间使用率" />
    <ScqProgress :percentage="42" status="exception" :format="() => '失败'" aria-label="传输失败" />
    <ScqProgress indeterminate aria-label="准备文件" />
  </ScqConfigProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScqInputNumber from '../../../../src/components/InputNumber'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqProgress from '../../../../src/components/Progress'
import ScqConfigProvider from '../../../../src/components/ConfigProvider'

const CUSTOM_THEME = { primary: '#9f1239', success: '#7c3aed', warning: '#0369a1', danger: '#c2410c' } as const
const customTheme = ref(false)
const SIZES = { stroke: 12, circle: 100 }
const showText = ref(true)
const percentage = ref<number | undefined>(36)
</script>

<style scoped>
.progress-example { display: grid; gap: 24px; width: 100%; max-width: 520px; padding: 16px; box-sizing: border-box; }
.progress-example__control { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; color: #606266; font-size: 14px; }
.progress-example__rings { display: flex; flex-wrap: wrap; gap: 24px; }
</style>