<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqIcon from '../../../../src/components/Icon'
import ScqLoading from '../../../../src/components/Loading'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const TIMING = { delay: 300, minDuration: 1000, fast: 100, slow: 600, size: 28 }
const loading = ref(false)
const blocking = ref(true)
const clicks = ref(0)
let timer: ReturnType<typeof setTimeout> | undefined
const run = (duration: number) => {
  clearTimeout(timer)
  loading.value = true
  timer = setTimeout(() => { loading.value = false }, duration)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <ExampleSection title="延迟显示、最短展示与阻塞" :description="`指示器延迟 ${TIMING.delay}ms 显示，显示后至少保留 ${TIMING.minDuration}ms。请求结束即解除内容阻塞，不必等待动画消失。`">
    <template #controls><ScqCheckbox v-model="blocking">阻塞内容交互</ScqCheckbox></template>
    <ScqSpace wrap>
      <ScqButton :disabled="loading" @click="run(TIMING.fast)">快速完成（不闪烁）</ScqButton>
      <ScqButton :disabled="loading" @click="run(TIMING.slow)">慢速完成（最短展示）</ScqButton>
    </ScqSpace>
    <ScqLoading :loading="loading" :delay="TIMING.delay" :min-duration="TIMING.minDuration" :blocking="blocking" :size="TIMING.size" text="正在处理">
      <template #indicator="{ size }"><ScqIcon name="refresh" :size="size" /></template>
      <ScqButton @click="clicks++">内容操作：{{ clicks }}</ScqButton>
    </ScqLoading>
    <output role="status">请求状态：{{ loading ? '进行中' : '已结束' }}</output>
  </ExampleSection>
</template>
