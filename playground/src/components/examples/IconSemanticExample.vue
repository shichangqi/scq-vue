<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqIcon from '../../../../src/components/Icon'
import ScqTypography from '../../../../src/components/Typography'

const ICON_SIZE = 24
const refreshCount = ref(0)
</script>

<template>
  <div class="icon-semantic-example">
    <div class="icon-semantic-example__row">
      <ScqButton type="primary" @click="refreshCount += 1"><ScqIcon name="refresh" /> 刷新任务</ScqButton>
      <ScqButton circle aria-label="刷新任务列表" title="刷新任务列表" @click="refreshCount += 1"><ScqIcon name="refresh" /></ScqButton>
      <ScqTypography type="secondary">按钮已有名称，内部图标保持默认装饰语义。</ScqTypography>
    </div>
    <div class="icon-semantic-example__row">
      <ScqIcon name="check" :size="ICON_SIZE" :decorative="false" aria-label="全部任务已完成" class="icon-semantic-example__success" />
      <ScqIcon name="wechat" :size="ICON_SIZE" :decorative="false" title="微信通知已开启" />
      <ScqTypography type="secondary">独立语义图标通过 aria-label 或 SVG title 提供名称。</ScqTypography>
    </div>
    <ScqTypography as="p" type="secondary">decorative=false 时不能省略名称：组件会报告 accessibility-error；未处理时同时输出警告，并保持图标对辅助技术隐藏。</ScqTypography>
    <p class="icon-semantic-example__result" role="status">已刷新 {{ refreshCount }} 次</p>
  </div>
</template>

<style scoped>
.icon-semantic-example { display: grid; gap: 16px; }
.icon-semantic-example__row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.icon-semantic-example__success { color: var(--scq-success); }
.icon-semantic-example__result { margin: 0; color: var(--scq-muted); font-size: 13px; }
</style>
