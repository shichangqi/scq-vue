<script setup lang="ts">
import { ScqTypography } from '../../../../src/index'
</script>

<template><div class="typography-example"><ScqTypography as="h3">Q4 交付概览</ScqTypography><ScqTypography as="p" type="secondary" :lines="2">设计阶段已经完成，研发与质量保障正在并行推进。所有交付文件将在评审通过后同步到项目空间，相关成员会收到版本更新通知。</ScqTypography><div><ScqTypography bold type="success">进展正常</ScqTypography><ScqTypography mark>10 月 24 日交付</ScqTypography></div><ScqTypography code copyable>PRJ-2026-042</ScqTypography><ScqTypography ellipsis class="typography-example__single">项目资料 / 2026 / 第四季度 / 交付评审 / 产品与研发联合评审记录</ScqTypography></div></template>

<style scoped>
.typography-example { display: grid; justify-items: start; gap: 16px; max-width: 560px; }
.typography-example > div { display: flex; flex-wrap: wrap; gap: 16px; }
.typography-example__single { width: 320px; max-width: 100%; }
</style>