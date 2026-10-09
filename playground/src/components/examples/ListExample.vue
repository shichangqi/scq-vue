<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ScqCell, ScqList, ScqNavBar, ScqSwitch } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const items = ref(Array.from({ length: 8 }, (_, index) => index + 1))
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
    items.value.push(...Array.from({ length: Math.min(6, 26 - last) }, (_, index) => last + index + 1))
    finished.value = items.value.length >= 26
    loading.value = false
  }, 400)
}
onBeforeUnmount(() => { if (timer !== undefined) clearTimeout(timer) })
</script>

<template>
  <PhonePreview screen-id="list-files-preview">
    <ScqNavBar title="团队文件" />
    <div class="list-example__summary"><span>{{ items.length }} 个文件</span><label>离线 <ScqSwitch v-model="offline" aria-label="离线模式" /></label></div>
    <ScqList v-model:loading="loading" v-model:error="error" :finished="finished" @load="load"><ScqCell v-for="item in items" :key="item" :title="`项目记录 ${String(item).padStart(2, '0')}`" label="产品设计 · 128 KB" icon="file" /></ScqList>
  </PhonePreview>
</template>

<style scoped>
.list-example__summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px; color: var(--scq-muted); font-size: 12px; }
.list-example__summary label { display: flex; align-items: center; gap: 8px; }
</style>