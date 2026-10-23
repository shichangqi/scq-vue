<script setup lang="ts">
import { ref } from 'vue'
import ScqCard from '../../../../src/components/Card'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqGrid from '../../../../src/components/Grid'
import ScqInput from '../../../../src/components/Input'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const BODY_MIN_HEIGHT = 180
const selected = ref(false)
const loading = ref(false)
const details = ref(0)
const opens = ref(0)
const draft = ref('')
</script>

<template>
  <ExampleSection class="card-enhancement-example" title="可选卡片与独立操作" subtitle="Interactive cards">
    <template #controls><ScqCheckbox v-model="loading">加载中</ScqCheckbox></template>
    <ScqGrid :columns="{ xs: 1, md: 2 }">
      <ScqCard v-model:selected="selected" header="Plan A" selectable :loading="loading" size="small" :body-style="{ minHeight: `${BODY_MIN_HEIGHT}px` }">
        <ScqSpace direction="vertical" align="stretch" fill>
          <ScqInput v-model="draft" aria-label="Card draft" placeholder="输入卡片草稿" />
          <ScqButton @click="details += 1">Details</ScqButton>
        </ScqSpace>
        <template #actions><ScqButton size="small" @click="details += 1">More</ScqButton></template>
        <template #footer>Selected: {{ selected }} · Details: {{ details }}</template>
      </ScqCard>
      <ScqCard header="Resource" clickable :media-ratio="16 / 9" @click="opens += 1">
        <template #media><div class="card-enhancement-example__media">16 : 9</div></template>
        <p>点击正文或聚焦整卡按钮后按 Enter/Space；内部按钮不触发整卡行为。</p>
        <template #footer>Opened: {{ opens }}</template>
      </ScqCard>
    </ScqGrid>
    <p>卡片支持鼠标点击和键盘操作，卡片内的按钮可独立使用。加载内容前可通过 bodyStyle 预留高度，减少布局跳动。</p>
  </ExampleSection>
</template>

<style scoped>
.card-enhancement-example p { margin: 0; line-height: 1.7; }
.card-enhancement-example__media { display: grid; place-items: center; background: var(--scq-fill); font-size: 24px; }
</style>
