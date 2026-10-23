<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqDrawer from '../../../../src/components/Drawer'
import ScqSteps from '../../../../src/components/Steps'
import ScqSwitch from '../../../../src/components/Switch'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const REQUEST_DELAY = 400
const items = [{ title: 'Draft' }, { title: 'Review' }, { title: 'Complete' }]
const enabled = ref(false)
const active = ref(0)
const opened = ref(false)
const rejectChange = ref(false)
const failChange = ref(false)
const error = ref('')
const approve = (_value: unknown, signal: AbortSignal) => new Promise<boolean>((resolve, reject) => {
  error.value = ''
  const abort = () => { clearTimeout(timer); resolve(false) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    if (failChange.value) reject(new Error('模拟服务失败 / Simulated service failure'))
    else resolve(!rejectChange.value)
  }, REQUEST_DELAY)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
const onError = (failure: unknown) => { error.value = failure instanceof Error ? failure.message : String(failure) }
</script>

<template>
  <ExampleSection title="异步操作与状态反馈" subtitle="Async interaction" description="切换拦截条件，观察等待、拒绝和失败时的交互。">
    <template #controls>
      <ScqCheckbox v-model="rejectChange">阻止操作</ScqCheckbox>
      <ScqCheckbox v-model="failChange">模拟请求失败</ScqCheckbox>
    </template>
    <ScqSwitch v-model="enabled" :before-change="approve" active-text="已开启" inactive-text="已关闭" aria-label="Guarded switch" @error="onError" />
    <ScqSteps v-model:active="active" :items="items" clickable :before-change="approve" @error="onError" />
    <ScqSpace>
      <ScqButton type="primary" @click="opened = true">异步关闭抽屉</ScqButton>
      <ScqButton @click="enabled = !enabled; active = (active + 1) % items.length">外部更新</ScqButton>
    </ScqSpace>
    <p v-if="error" role="alert">{{ error }}</p>
    <ScqDrawer v-model="opened" title="Async close guard" :before-close="approve" @error="onError">
      <p>关闭按钮、遮罩、Escape 和 close() 使用同一拦截规则。</p>
      <p>All close entrances use the same abortable guard.</p>
      <p v-if="error" role="alert">{{ error }}</p>
    </ScqDrawer>
  </ExampleSection>
</template>
