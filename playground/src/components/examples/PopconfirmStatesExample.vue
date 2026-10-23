<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqPopconfirm from '../../../../src/components/Popconfirm'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { delay: 800, width: 300 }
const opened = ref(false)
const fail = ref(true)
const allowCancel = ref(true)
const custom = ref(false)
const status = ref('默认模拟失败，关闭模拟后可重试')
const confirm = (signal: AbortSignal) => new Promise<boolean>((resolve, reject) => {
  const abort = () => { clearTimeout(timer); resolve(false) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    if (fail.value) reject(new Error('模拟删除失败'))
    else resolve(true)
  }, CONFIG.delay)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
const onError = (error: unknown) => { status.value = error instanceof Error ? error.message : String(error) }
</script>

<template>
  <ExampleSection title="失败重试、取消与自定义操作">
    <template #controls>
      <ScqCheckbox v-model="fail">模拟失败</ScqCheckbox>
      <ScqCheckbox v-model="allowCancel">等待时允许取消</ScqCheckbox>
      <ScqCheckbox v-model="custom">自定义操作区</ScqCheckbox>
    </template>
    <ScqPopconfirm v-model="opened" danger placement="bottom" :width="CONFIG.width" confirm-text="删除" cancel-text="保留" :allow-cancel-while-pending="allowCancel" :before-confirm="confirm" @confirm="status = '已确认删除（本地演示）'" @cancel="status = '已取消删除'" @error="onError">
      <template #reference><ScqButton type="danger">删除草稿</ScqButton></template>
      <template #title>确认删除草稿？</template>
      <template #content>失败后保持打开，可以关闭模拟失败后再次确认。<ScqCheckbox v-model="fail">模拟失败</ScqCheckbox></template>
      <template #error>{{ status }}</template>
      <template v-if="custom" #actions="{ confirm: accept, cancel, pending }">
        <ScqButton :disabled="pending && !allowCancel" @click="cancel">保留草稿</ScqButton>
        <ScqButton type="danger" :loading="pending" @click="accept">确认删除</ScqButton>
      </template>
    </ScqPopconfirm>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>
