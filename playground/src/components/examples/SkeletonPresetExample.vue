<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqSkeleton from '../../../../src/components/Skeleton'
import ScqTypography from '../../../../src/components/Typography'

const PREVIEW_ROWS = 2
const SUMMARY_WIDTHS = ['90%', '60%'] as const
const loading = ref(true)
</script>

<template>
  <div class="skeleton-preset-example">
    <ScqCheckbox v-model="loading" class="skeleton-preset-example__control">显示加载占位</ScqCheckbox>
    <div class="skeleton-preset-example__grid">
      <section class="skeleton-preset-example__card" aria-label="项目卡片">
        <ScqSkeleton preset="card" :loading="loading">
          <div class="skeleton-preset-example__cover" aria-hidden="true">SCQ VUE</div>
          <ScqTypography as="h3">组件体验更新</ScqTypography>
          <ScqTypography as="p" type="secondary">让占位内容接近最终布局，减少加载完成时的视觉跳动。</ScqTypography>
          <ScqButton type="primary" @click="loading = true">重新加载预览</ScqButton>
        </ScqSkeleton>
      </section>
      <section class="skeleton-preset-example__card" aria-label="紧凑摘要">
        <ScqTypography as="h4">显式属性优先</ScqTypography>
        <ScqSkeleton preset="list-item" :loading="loading" :avatar="false" :rows="PREVIEW_ROWS" :row-widths="SUMMARY_WIDTHS" :animated="false">
          <ScqTypography as="p" bold>交付评审已通过</ScqTypography>
          <ScqTypography as="p" type="secondary">这个列表预设显式隐藏头像、自定义行宽并关闭动画。</ScqTypography>
        </ScqSkeleton>
      </section>
    </div>
  </div>
</template>

<style scoped>
.skeleton-preset-example { display: grid; gap: 16px; width: 100%; }
.skeleton-preset-example__control { display: inline-flex; align-items: center; gap: 6px; color: var(--scq-muted); font-size: 13px; }
.skeleton-preset-example__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
.skeleton-preset-example__card { display: grid; align-content: start; justify-items: start; gap: 16px; min-width: 0; padding: 20px; border: 1px solid var(--scq-border); border-radius: var(--scq-radius-md); background: var(--scq-surface); }
.skeleton-preset-example__cover { display: grid; place-items: center; width: 100%; aspect-ratio: 16 / 9; border-radius: var(--scq-radius-md); background: var(--scq-fill); color: var(--scq-primary); font-weight: 700; }
</style>
