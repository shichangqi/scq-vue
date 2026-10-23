<script setup lang="ts">
import { ref } from 'vue'
import ScqContainer from '../../../../src/components/Container'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqInput from '../../../../src/components/Input'
import ScqSlider from '../../../../src/components/Slider'
import ExampleSection from '../ExampleSection.vue'

const EXAMPLE = { height: 400, minAsideWidth: 160, maxAsideWidth: 360, widthStep: 10, initialAsideWidth: 220, rows: 12 } as const
const collapsed = ref(false)
const opened = ref(false)
const right = ref(false)
const asideWidth = ref<number>(EXAMPLE.initialAsideWidth)
const sideDraft = ref('')
const mainDraft = ref('')
const resizeAside = (value: number | [number, number]) => {
  if (Array.isArray(value)) throw new TypeError('The sidebar width example expects a single slider value.')
  asideWidth.value = value
}
</script>

<template>
  <ExampleSection class="container-layout-example" title="可调整的工作台" subtitle="Responsive workspace">
    <template #controls><ScqCheckbox v-model="right">右侧栏</ScqCheckbox></template>
    <label>侧栏宽度 / Sidebar width: {{ asideWidth }}px<ScqSlider :model-value="asideWidth" :min="EXAMPLE.minAsideWidth" :max="EXAMPLE.maxAsideWidth" :step="EXAMPLE.widthStep" aria-label="Sidebar width" @update:model-value="resizeAside" /></label>
    <p>拖动滑块可调整侧栏宽度，也可使用方向键微调。缩小窗口后，侧栏以抽屉形式打开；本示例不会保存布局偏好。</p>
    <ScqContainer v-model:collapsed="collapsed" v-model:aside-open="opened" class="container-layout-example__workspace" collapsible aside-mode="drawer" :aside-position="right ? 'right' : 'left'" :aside-width="asideWidth" :height="EXAMPLE.height" :padding="0" scrollable aside-title="工作台侧栏 / Workspace sidebar">
      <template #header><header class="container-layout-example__fixed">Fixed header · {{ collapsed ? 'Collapsed' : 'Expanded' }}</header></template>
      <template #aside>
        <div class="container-layout-example__aside">
          <ScqInput v-model="sideDraft" aria-label="Sidebar draft" placeholder="侧栏草稿" />
          <ScqButton type="primary" plain>Overview</ScqButton><ScqButton>Projects</ScqButton>
          <p>折叠和响应式切换保留这份草稿 / The same sidebar instance retains its draft</p>
        </div>
      </template>
      <div class="container-layout-example__main">
        <ScqInput v-model="mainDraft" aria-label="Main draft" placeholder="内容草稿" />
        <p v-for="index in EXAMPLE.rows" :key="index">Scrollable content {{ index }} · {{ mainDraft || 'Main content is independent of the drawer.' }}</p>
      </div>
      <template #footer><footer class="container-layout-example__fixed">Fixed footer</footer></template>
    </ScqContainer>
  </ExampleSection>
</template>

<style scoped>
.container-layout-example p, .container-layout-example__aside p { margin: 0; font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
.container-layout-example__workspace { border: var(--scq-control-border-width) solid var(--scq-border); border-radius: var(--scq-radius-md); overflow: hidden; }
.container-layout-example__fixed { padding: var(--example-space-md); background: var(--scq-fill); }
.container-layout-example__aside, .container-layout-example__main { --container-example-gap: var(--scq-space-md, 12px); display: grid; gap: var(--container-example-gap); padding: var(--container-example-gap); min-width: 0; }
</style>
