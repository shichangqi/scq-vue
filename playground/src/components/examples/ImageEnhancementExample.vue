<script setup lang="ts">
import { computed, ref } from 'vue'
import ScqImage from '../../../../src/components/Image'
import ScqInput from '../../../../src/components/Input'
import ScqButton from '../../../../src/components/Button'
import ExampleSection from '../ExampleSection.vue'

const SETTINGS = { width: 320, height: 180, noteWidth: 180 } as const
const illustration = (color: string, label: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="${color}"/><text x="320" y="195" text-anchor="middle" fill="white" font-size="40">${label}</text></svg>`)}`
const first = illustration('#2563eb', 'First')
const second = illustration('#0f766e', 'Second')
const broken = ref(true)
const index = ref(0)
const failures = ref(0)
const image = ref<InstanceType<typeof ScqImage>>()
const visible = ref(false)
const note = ref('')
const previews = computed(() => [first, broken.value ? '/__scq-preview-missing.svg' : second])
</script>

<template>
  <div class="image-enhancement-example">
    <ExampleSection title="响应式图片与可恢复预览" subtitle="Responsive image &amp; preview">
    <p>Controlled index: {{ index }}</p>
    <ScqButton @click="image?.showPreview()">通过实例打开预览</ScqButton>
    <ScqImage ref="image" v-model:preview-visible="visible" v-model:preview-index="index" :src="first" :srcset="`${first} 1x, ${first} 2x`" sizes="(max-width: 375px) 100vw, 320px" :width="SETTINGS.width" :height="SETTINGS.height" decoding="async" fetchpriority="high" position="center top" alt="Interactive preview" :preview-src-list="previews" preview preview-wheel-zoom preview-pinch-zoom preview-double-click-reset @preview-error="failures += 1">
      <template #placeholder>正在加载本地示例图片…</template>
      <template #error>图片不可用，请重试。</template>
      <template #toolbar="{ index: active, scale, zoomIn, zoomOut, reset }">
        <span>{{ active + 1 }} / {{ previews.length }} · {{ Math.round(scale * 100) }}%</span>
        <ScqInput v-model="note" :full-width="false" :style="{ width: `${SETTINGS.noteWidth}px` }" aria-label="Preview note" placeholder="预览备注 / Note" />
        <button type="button" aria-label="Zoom out" @click="zoomOut">−</button>
        <button type="button" aria-label="Zoom in" @click="zoomIn">+</button>
        <button type="button" class="image-enhancement-example__action" @click="reset">Reset</button>
        <button type="button" class="image-enhancement-example__action" @click="image?.closePreview()">Close</button>
        <button v-if="broken" type="button" class="image-enhancement-example__action" @click="broken = false">Restore source</button>
      </template>
    </ScqImage>
    <p role="status">Preview visible: {{ visible }} · Preview failures: {{ failures }}</p>
    <p>切换到第二张查看失败和重试；Restore source 保留受控索引并恢复图片。滚轮/双指缩放与双击复位均显式开启。</p>
    </ExampleSection>
    <ExampleSection title="备用图片" subtitle="Backup source">
      <ScqImage src="/__scq-image-missing.svg" :fallback-src="second" :width="SETTINGS.width" :height="SETTINGS.height" alt="Backup image" />
      <p>不承诺跨源图片一定可下载或导出；业务操作通过 toolbar 插槽接入。</p>
    </ExampleSection>
  </div>
</template>

<style scoped>
.image-enhancement-example { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--scq-space-lg, 16px); min-width: 0; }
.image-enhancement-example__action { width: auto; padding-inline: 12px; border-radius: 6px; }
</style>
