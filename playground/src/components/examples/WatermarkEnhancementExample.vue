<script setup lang="ts">
import { computed, ref } from 'vue'
import ScqWatermark from '../../../../src/components/Watermark'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqConfigProvider from '../../../../src/components/ConfigProvider'
import ScqInput from '../../../../src/components/Input'
import type { WatermarkRenderEvent } from '../../../../src/components/Watermark'
import ExampleSection from '../ExampleSection.vue'

const SETTINGS = { gap: [200, 144], offset: [20, 12], imageSize: [48, 32] } as const
const logo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32"><rect width="48" height="32" rx="6" fill="#2563eb"/><text x="24" y="22" text-anchor="middle" font-size="16" fill="white">SCQ</text></svg>')}`
const identity = ref('member@example.com')
const dark = ref(false)
const printable = ref(true)
const external = ref(false)
const host = ref<HTMLElement>()
const restored = ref(0)
const redraws = ref(0)
const failure = ref('')
const content = computed(() => ['PROJECT COPY', identity.value])
const onRedraw = (_event: WatermarkRenderEvent) => { redraws.value += 1 }
const onError = (error: unknown) => { failure.value = error instanceof Error ? error.message : String(error) }
</script>

<template>
  <ExampleSection class="watermark-enhancement-example" title="文字与图片水印" subtitle="Text &amp; image watermark">
    <template #controls>
      <ScqCheckbox v-model="dark">深色内容</ScqCheckbox>
      <ScqCheckbox v-model="printable">打印水印</ScqCheckbox>
      <ScqCheckbox v-model="external">切换目标容器</ScqCheckbox>
    </template>
    <ScqInput v-model="identity" aria-label="业务传入的标识 / Supplied identity" placeholder="输入水印标识" />
    <ScqConfigProvider :theme="dark ? 'dark' : 'light'" class="watermark-enhancement-example__surfaces">
      <ScqWatermark class="watermark-enhancement-example__surface" :content="content" :image="logo" :image-size="SETTINGS.imageSize" :image-opacity=".2" :gap="SETTINGS.gap" :offset="SETTINGS.offset" :color="dark ? 'rgba(255,255,255,.3)' : 'rgba(15,23,42,.2)'" font-family="Arial, sans-serif" :font-weight="600" :line-height="24" :container="external ? host : undefined" :print="printable" @redraw="onRedraw" @restore="restored += 1" @error="onError">
        <h3>Text + image</h3><p>身份信息由业务传入；组件不会获取用户身份。</p><ScqButton>水印不会阻挡点击</ScqButton>
      </ScqWatermark>
      <div ref="host" class="watermark-enhancement-example__surface"><p>独立定位容器 / Separate positioned container</p></div>
    </ScqConfigProvider>
    <p role="status">Redraws: {{ redraws }} · Restores: {{ restored }}</p>
    <p v-if="failure" role="alert">{{ failure }}</p>
    <p>前端水印不是不可移除的安全边界，也不能阻止截图。远程图片需允许 CORS；打印背景最终受浏览器和打印设置控制。</p>
  </ExampleSection>
</template>

<style scoped>
.watermark-enhancement-example p, .watermark-enhancement-example h3 { margin: 0; line-height: 1.7; overflow-wrap: anywhere; }
.watermark-enhancement-example__surfaces { display: grid; gap: var(--example-space-lg); }
.watermark-enhancement-example__surface { display: flex; flex-direction: column; align-items: start; gap: var(--example-space-md); position: relative; min-height: 180px; padding: var(--example-space-lg); border: var(--scq-control-border-width) solid var(--scq-border); border-radius: var(--scq-radius); color: var(--scq-text); background: var(--scq-surface); box-sizing: border-box; }
</style>
