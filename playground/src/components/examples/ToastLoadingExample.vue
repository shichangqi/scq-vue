<template>
  <PhonePreview :screen-id="previewId">
    <div class="toast-loading-example">
      <ScqNavBar title="云端备份" />
      <div class="toast-loading-example__summary">
        <ScqIcon name="cloud-upload" :size="42" />
        <h3>设计资源包</h3>
        <p>Design-assets.zip</p>
      </div>
      <ScqCellGroup inset>
        <ScqCell title="文件大小" value="24.6 MB" />
        <ScqCell title="目标空间" value="Design workspace" />
        <ScqCell title="状态" :value="progress === 100 ? '备份完成' : running ? '正在传输' : '等待备份'" />
      </ScqCellGroup>
      <div class="toast-loading-example__actions">
        <ScqProgress :percentage="progress" :status="progress === 100 ? 'success' : 'normal'" aria-label="备份进度" />
        <ScqButton type="primary" :disabled="running" @click="startBackup">{{ progress === 100 ? '重新备份' : '开始备份' }}</ScqButton>
      </div>
    </div>
  </PhonePreview>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ScqButton, ScqCell, ScqCellGroup, ScqIcon, ScqNavBar, ScqProgress, Toast, type ToastInstance } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const previewId = 'toast-loading-preview'
const teleport = `#${previewId}`
const progress = ref(0)
const running = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
let instance: ToastInstance | undefined

const startBackup = () => {
  if (running.value) return
  progress.value = 0
  running.value = true
  instance = Toast.loading({ message: '正在备份 0%', forbidClick: true, teleport })
  timer = setInterval(() => {
    progress.value += 20
    instance?.update({ message: `正在备份 ${progress.value}%` })
    if (progress.value === 100) {
      clearInterval(timer)
      timer = undefined
      running.value = false
      instance?.update({ type: 'success', message: '备份完成', duration: 1800, forbidClick: false })
    }
  }, 350)
}

onBeforeUnmount(() => {
  if (timer !== undefined) clearInterval(timer)
  Toast.clear(teleport)
})
</script>

<style scoped>
.toast-loading-example { min-height: 100%; background: #f6f8fb; }
.toast-loading-example__summary { padding: 28px 16px 20px; text-align: center; }
.toast-loading-example__summary .scq-icon { color: #409eff; }
.toast-loading-example__summary h3 { margin: 12px 0 4px; color: #303133; font-size: 17px; }
.toast-loading-example__summary p { margin: 0; color: #73767a; font-size: 12px; }
.toast-loading-example__actions { display: grid; gap: 22px; padding: 24px 16px; }
.toast-loading-example__actions .my-btn { min-height: 44px; width: 100%; }
</style>