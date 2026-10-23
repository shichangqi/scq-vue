<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqTabs from '../../../../src/components/Tabs'
import ExampleSection from '../ExampleSection.vue'
import LocalDraft from './LocalDraft.vue'

const ITEMS = [{ name: 'draft', label: '草稿' }, { name: 'preview', label: '预览' }, { name: 'locked', label: '归档', disabled: true }]
const CHANGE_DELAY = 600
const tabs = ref<InstanceType<typeof ScqTabs>>()
const active = ref('draft')
const destroyInactive = ref(false)
const block = ref(false)
const fail = ref(false)
const status = ref('尚未切换')
const onError = (error: unknown) => { status.value = error instanceof Error ? error.message : String(error) }
const beforeChange = (_name: string | number, signal: AbortSignal) => new Promise<boolean>((resolve, reject) => {
  status.value = '正在确认切换，可取消等待'
  const abort = () => { clearTimeout(timer); resolve(false) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    if (fail.value) reject(new Error('当前不允许切换，请关闭“模拟失败”后重试'))
    else {
      if (block.value) status.value = '切换被拒绝，仍保留当前面板'
      resolve(!block.value)
    }
  }, CHANGE_DELAY)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
</script>

<template>
  <ExampleSection title="销毁策略与切换拦截" description="在草稿框输入内容后切换页签：lazy 保留面板内部状态；destroyInactive 销毁内部状态。父组件持有的 v-model 不会因销毁而清空。">
    <template #controls>
      <ScqCheckbox v-model="destroyInactive">销毁非活动面板</ScqCheckbox>
      <ScqCheckbox v-model="block">阻止切换</ScqCheckbox>
      <ScqCheckbox v-model="fail">模拟失败</ScqCheckbox>
    </template>
    <ScqTabs ref="tabs" v-model="active" :items="ITEMS" lazy :destroy-inactive="destroyInactive" :before-change="beforeChange" aria-label="草稿生命周期" @change="status = `change: ${$event}`" @error="onError">
      <template #label="{ tab }">{{ tab.label }} · {{ tab.name }}</template>
      <template #draft><LocalDraft label="局部草稿" /></template>
      <template #default="{ tab }"><p>{{ tab.label }}面板，使用 default 插槽。</p></template>
    </ScqTabs>
    <ScqButton @click="tabs?.cancelPending(); status = '已取消等待'">取消等待</ScqButton>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>
