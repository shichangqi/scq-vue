<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import ScqCell from '../../../../src/components/Cell'
import ScqList from '../../../../src/components/List'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqSwitch from '../../../../src/components/Switch'
import ScqButton from '../../../../src/components/Button'
import PhonePreview from '../PhonePreview.vue'

const CONFIG = { initial: 8, batch: 6, total: 26, delay: 400, offset: 80 }
const items = ref(Array.from({ length: CONFIG.initial }, (_, index) => index + 1))
const list = ref<InstanceType<typeof ScqList>>()
const disabled = ref(false)
const loading = ref(false)
const finished = ref(false)
const error = ref(false)
const offline = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const load = () => {
  if (timer !== undefined) return
  timer = setTimeout(() => {
    timer = undefined
    if (offline.value) { error.value = true; loading.value = false; return }
    const last = items.value.at(-1) || 0
    items.value.push(...Array.from({ length: Math.min(CONFIG.batch, CONFIG.total - last) }, (_, index) => last + index + 1))
    finished.value = items.value.length >= CONFIG.total
    loading.value = false
  }, CONFIG.delay)
}
onBeforeUnmount(() => { if (timer !== undefined) clearTimeout(timer) })
</script>

<template>
  <PhonePreview screen-id="list-files-preview">
    <ScqNavBar title="团队文件" />
    <div class="list-example__summary"><span>{{ items.length }} 个文件</span><label>离线 <ScqSwitch v-model="offline" aria-label="离线模式" /></label></div>
    <div class="list-example__summary"><label>暂停加载 <ScqSwitch v-model="disabled" aria-label="暂停加载" /></label><ScqButton size="small" :disabled="disabled" @click="list?.check()">检查加载位置</ScqButton></div>
    <ScqList ref="list" v-model:loading="loading" v-model:error="error" :finished="finished" :disabled="disabled" :offset="CONFIG.offset" :immediate-check="false" @load="load">
      <ScqCell v-for="item in items" :key="item" :title="`项目记录 ${String(item).padStart(2, '0')}`" label="产品设计 · 128 KB" icon="file" />
      <template #loading>正在读取下一批文件…</template>
      <template #finished>已加载全部 {{ items.length }} 个文件。</template>
      <template #error>读取失败，请关闭离线模式后点击重试。</template>
    </ScqList>
  </PhonePreview>
</template>

<style scoped>
.list-example__summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px; color: var(--scq-muted); font-size: 12px; }
.list-example__summary label { display: flex; align-items: center; gap: 8px; }
</style>