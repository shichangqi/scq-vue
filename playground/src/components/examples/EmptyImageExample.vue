<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqEmpty from '../../../../src/components/Empty'
import ScqIcon from '../../../../src/components/Icon'
import ExampleSection from '../ExampleSection.vue'

const IMAGE = {
  valid: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="10" y="20" width="80" height="60" rx="8" fill="#dbeafe"/><path d="M30 40h40M30 55h25" stroke="#2563eb" stroke-width="6"/></svg>')}`,
  invalid: 'data:image/png;base64,invalid',
  size: 100,
}
const empty = ref<InstanceType<typeof ScqEmpty>>()
const broken = ref(false)
const custom = ref(false)
const status = ref('等待图片加载')
</script>

<template>
  <ExampleSection title="图片回退、重试与内容插槽" description="图片使用本地 data URL，不需要外部服务；模拟失败后回退为预设图标。">
    <template #controls>
      <ScqCheckbox v-model="broken">模拟图片失败</ScqCheckbox>
      <ScqCheckbox v-model="custom">自定义图片</ScqCheckbox>
    </template>
    <ScqEmpty ref="empty" :image="broken ? IMAGE.invalid : IMAGE.valid" :image-size="IMAGE.size" preset="unconfigured" @load="status = 'load：图片已加载'" @error="status = 'error：已回退到图标'">
      <template v-if="custom" #image><ScqIcon name="settings" :size="IMAGE.size" /></template>
      <template #description>当前还没有配置数据源。</template>
      <ScqButton @click="empty?.retry()">重试图片</ScqButton>
    </ScqEmpty>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>
