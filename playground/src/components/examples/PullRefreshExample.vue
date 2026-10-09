<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ScqCell, ScqNavBar, ScqPullRefresh } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const refreshRef = ref<InstanceType<typeof ScqPullRefresh>>()
const refreshing = ref(false)
const version = ref(1)
const updatedAt = ref('10:24')
let timer: ReturnType<typeof setTimeout> | undefined
const load = () => {
  timer = setTimeout(() => {
    version.value += 1
    updatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    refreshing.value = false
    timer = undefined
  }, 700)
}
onBeforeUnmount(() => { if (timer !== undefined) clearTimeout(timer) })
</script>

<template>
  <PhonePreview screen-id="pull-refresh-inbox-preview">
    <ScqNavBar title="收件箱" right-icon="refresh" right-label="刷新收件箱" @click-right="refreshRef?.refresh()" />
    <ScqPullRefresh ref="refreshRef" v-model="refreshing" @refresh="load"><div class="refresh-example__body"><div class="refresh-example__summary"><strong>{{ version + 2 }} 条未读</strong><span>更新于 {{ updatedAt }}</span></div><ScqCell :title="`项目更新 #${version}`" label="本周的设计稿已更新，请查收。" /><ScqCell title="林一" label="周四下午的评审邀请" /><ScqCell title="团队日历" label="下周有 2 场会议" /><ScqCell title="文件助手" label="你的文件已同步到所有设备" /></div></ScqPullRefresh>
  </PhonePreview>
</template>

<style scoped>
.refresh-example__body { min-height: 490px; }
.refresh-example__summary { display: flex; justify-content: space-between; align-items: baseline; padding: 22px 16px; gap: 12px; }
.refresh-example__summary strong { font-size: 18px; color: var(--scq-text); }
.refresh-example__summary span { font-size: 12px; color: var(--scq-muted); }
</style>