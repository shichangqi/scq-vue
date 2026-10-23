<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqDivider from '../../../../src/components/Divider'
import ScqGrid from '../../../../src/components/Grid'
import ScqInput from '../../../../src/components/Input'
import ScqLayout from '../../../../src/components/Layout'
import ScqSpace from '../../../../src/components/Space'
import type { LayoutBreakpoints } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const EXAMPLE = {
  minimumCardWidth: 180,
  scrollHeight: 240,
  breakpoints: { sm: 560, md: 800, lg: 1100, xl: 1400 } satisfies LayoutBreakpoints,
  columns: { xs: 1, sm: 2, lg: 4 },
  featuredPlacement: { '--scq-grid-column-span': 2 },
  offsetPlacement: { '--scq-grid-column-start': 3, '--scq-grid-column-span': 2 },
  dividerTokens: {
    '--scq-divider-width': 'var(--scq-control-border-width)',
    '--scq-divider-color': 'var(--scq-primary)',
    '--scq-divider-inset': 'var(--layout-example-space-xl)',
  },
} as const
const showExtra = ref(true)
const draft = ref('')
const layoutDraft = ref('')
const rtl = ref(false)
const items = [
  { key: 'overview', title: '项目概览', caption: 'Overview' },
  { key: 'projects', title: '项目列表', caption: 'Projects' },
  { key: 'reports', title: '分析报告', caption: 'Reports' },
  { key: 'settings', title: '工作台设置', caption: 'Settings' },
]
</script>

<template>
  <div class="layout-foundation-example">
    <ExampleSection class="layout-foundation-example__section" title="响应式间距" subtitle="Responsive spacing" description="切换中间项，分隔符会随内容自动调整；输入的草稿会保留。">
      <template #controls><ScqCheckbox v-model="showExtra">显示中间项</ScqCheckbox></template>
      <ScqSpace class="layout-foundation-example__preview" :size="{ xs: 'sm', md: ['md', 'lg'] }" :breakpoints="EXAMPLE.breakpoints" fill>
        <ScqButton key="first" type="primary" plain>固定项</ScqButton>
        <ScqButton v-if="showExtra" key="extra">可选项</ScqButton>
        <ScqInput key="draft" v-model="draft" class="layout-foundation-example__draft" :full-width="false" placeholder="输入草稿" aria-label="Layout draft" />
        <template #separator><ScqDivider direction="vertical" /></template>
      </ScqSpace>
    </ExampleSection>

    <ExampleSection class="layout-foundation-example__section" title="响应式方向与栅格" subtitle="Responsive layout &amp; grid" description="缩放窗口可切换排列方向和列数，跨列与偏移会自动适配。">
      <template #controls><code class="layout-foundation-example__meta">{{ Object.values(EXAMPLE.columns).join(' / ') }} 列</code></template>
      <ScqLayout class="layout-foundation-example__preview layout-foundation-example__responsive" :direction="{ xs: 'vertical', md: 'horizontal' }" :gap="{ xs: 'sm', md: 'lg' }" :align="{ xs: 'stretch', md: 'center' }" :breakpoints="EXAMPLE.breakpoints">
        <strong>工作台</strong>
        <ScqInput v-model="layoutDraft" class="layout-foundation-example__draft" :full-width="false" placeholder="试试输入后调整窗口" aria-label="Responsive layout draft" />
        <p class="layout-foundation-example__state">当前草稿：<span>{{ layoutDraft || '尚未输入' }}</span></p>
      </ScqLayout>
      <ScqGrid :columns="EXAMPLE.columns" :gap="{ xs: 'sm', md: 'lg' }" :breakpoints="EXAMPLE.breakpoints">
        <article v-for="(item, index) in items" :key="item.key" class="scq-grid__item layout-foundation-example__card" :class="{ 'layout-foundation-example__card--featured': index === 0 }" :style="index === 0 ? EXAMPLE.featuredPlacement : undefined">
          <strong>{{ item.title }}</strong><span>{{ item.caption }}</span>
        </article>
        <article class="scq-grid__item layout-foundation-example__card layout-foundation-example__card--offset" :style="EXAMPLE.offsetPlacement">
          <strong>偏移与跨列</strong><span>Offset · 起始列与跨度自动约束</span>
        </article>
      </ScqGrid>
    </ExampleSection>

    <ExampleSection class="layout-foundation-example__section" title="最小宽度自动填充" subtitle="Auto-fill grid" description="根据可用空间自动排列，无需为每个断点指定列数。">
      <template #controls><code class="layout-foundation-example__meta">min {{ EXAMPLE.minimumCardWidth }}px</code></template>
      <ScqGrid :min-item-width="EXAMPLE.minimumCardWidth" gap="lg">
        <article v-for="item in items" :key="item.key" class="layout-foundation-example__card"><strong>{{ item.title }}</strong><span>{{ item.caption }}</span></article>
      </ScqGrid>
    </ExampleSection>

    <ExampleSection class="layout-foundation-example__section" title="分割线与阅读方向" subtitle="Dividers &amp; logical positions" description="使用主题变量定制分割线，Start / End 随阅读方向切换。">
      <template #controls><ScqCheckbox v-model="rtl">从右向左（RTL）</ScqCheckbox></template>
      <div class="layout-foundation-example__preview layout-foundation-example__dividers" :dir="rtl ? 'rtl' : 'ltr'" :style="EXAMPLE.dividerTokens">
        <ScqDivider content-position="start" aria-label="Section boundary"><span aria-hidden="true">Start</span></ScqDivider>
        <ScqDivider content-position="end" dashed aria-label="Next section"><span aria-hidden="true">End</span></ScqDivider>
        <div class="layout-foundation-example__inline"><span>行内内容</span><ScqDivider direction="vertical" /><span>垂直分隔</span></div>
      </div>
    </ExampleSection>

    <ExampleSection class="layout-foundation-example__section" title="固定区域与独立滚动" subtitle="Fixed regions &amp; scrollable content" description="仅中间内容滚动，顶部工具栏和底部状态栏始终保留。">
      <ScqLayout class="layout-foundation-example__scroll" :style="{ height: `${EXAMPLE.scrollHeight}px` }">
        <header class="layout-foundation-example__fixed"><strong>工作台</strong><span>固定工具栏</span></header>
        <div class="layout-foundation-example__flexible" tabindex="0" role="region" aria-label="Scrollable layout content">
          <p v-for="item in items" :key="item.key"><span>{{ item.title }}</span><span>{{ draft || item.caption }}</span></p>
        </div>
        <footer class="layout-foundation-example__fixed"><span>共 {{ items.length }} 个模块</span><span>固定状态栏</span></footer>
      </ScqLayout>
    </ExampleSection>
  </div>
</template>

<style scoped>
.layout-foundation-example {
  --layout-example-space-xs: var(--scq-space-xs, 4px);
  --layout-example-space-sm: var(--scq-space-sm, 8px);
  --layout-example-space-md: var(--scq-space-md, 12px);
  --layout-example-space-lg: var(--scq-space-lg, 16px);
  --layout-example-space-xl: var(--scq-space-xl, 24px);
  --layout-example-font-caption: 12px;
  --layout-example-font-body: 14px;
  --layout-example-line-height: 1.6;
  --layout-example-input-width: 220px;
  display: grid;
  gap: var(--layout-example-space-lg);
  min-width: 0;
  color: var(--scq-text);
  font-size: var(--layout-example-font-body);
  line-height: var(--layout-example-line-height);
}
.layout-foundation-example h3, .layout-foundation-example p { margin: 0; overflow-wrap: anywhere; }
.layout-foundation-example__meta { padding: var(--layout-example-space-xs) var(--layout-example-space-sm); border-radius: var(--scq-radius-sm); background: var(--scq-fill); color: var(--scq-muted); font-size: var(--layout-example-font-caption); }
.layout-foundation-example__state { color: var(--scq-muted); }
.layout-foundation-example__preview { box-sizing: border-box; min-width: 0; padding: var(--layout-example-space-lg); border-radius: var(--scq-radius-md); background: var(--scq-fill); }
.layout-foundation-example__preview :deep(.scq-divider--vertical) { margin-inline: 0; }
.layout-foundation-example .layout-foundation-example__draft { width: var(--layout-example-input-width); max-width: 100%; min-width: 0; }
.layout-foundation-example__responsive > strong { flex: none; }
.layout-foundation-example__state { flex: 1; min-width: 0; }
.layout-foundation-example__state span { color: var(--scq-text); }
.layout-foundation-example__card { display: flex; flex-direction: column; gap: var(--layout-example-space-xs); min-width: 0; padding: var(--layout-example-space-lg); border: var(--scq-control-border-width) solid var(--scq-border); border-radius: var(--scq-radius-md); background: var(--scq-fill); overflow-wrap: anywhere; }
.layout-foundation-example__card strong { font-weight: 500; }
.layout-foundation-example__card span { color: var(--scq-muted); font-size: var(--layout-example-font-caption); }
.layout-foundation-example__card--featured { border-color: var(--scq-color-primary-soft-border); background: var(--scq-color-primary-soft-bg); }
.layout-foundation-example__card--featured strong { color: var(--scq-primary); }
.layout-foundation-example__card--offset { border-style: dashed; background: var(--scq-surface); }
.layout-foundation-example__dividers { --scq-divider-margin: var(--layout-example-space-lg); }
.layout-foundation-example__inline { display: flex; align-items: center; gap: var(--layout-example-space-md); color: var(--scq-muted); }
.layout-foundation-example__scroll { min-width: 0; border: var(--scq-control-border-width) solid var(--scq-border); border-radius: var(--scq-radius-md); overflow: hidden; }
.layout-foundation-example__fixed { flex: none; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--layout-example-space-sm); padding: var(--layout-example-space-md) var(--layout-example-space-lg); background: var(--scq-fill); }
.layout-foundation-example__fixed span { color: var(--scq-muted); font-size: var(--layout-example-font-caption); }
.layout-foundation-example__flexible { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; padding-inline: var(--layout-example-space-lg); }
.layout-foundation-example__flexible:focus-visible { outline: none; box-shadow: var(--scq-focus-ring); }
.layout-foundation-example__flexible p { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--layout-example-space-sm); padding-block: var(--layout-example-space-md); border-bottom: var(--scq-control-border-width) solid var(--scq-border); }
.layout-foundation-example__flexible p:last-child { border-bottom: 0; }
.layout-foundation-example__flexible p span:last-child { color: var(--scq-muted); }
</style>
