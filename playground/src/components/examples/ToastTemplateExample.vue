<template>
  <PhonePreview :screen-id="previewId">
    <div class="toast-template-example">
      <ScqNavBar title="消息设置" />
      <ScqCellGroup title="提示选项" inset>
        <ScqCell title="显示位置">
          <select v-model="position" aria-label="显示位置"><option value="top">顶部</option><option value="middle">居中</option><option value="bottom">底部</option></select>
        </ScqCell>
        <ScqCell title="点击提示关闭"><ScqSwitch v-model="closeOnClick" aria-label="点击提示关闭" /></ScqCell>
        <ScqCell title="显示遮罩"><ScqSwitch v-model="overlay" aria-label="显示遮罩" /></ScqCell>
      </ScqCellGroup>
      <div class="toast-template-example__actions">
        <ScqButton type="primary" @click="visible = true">发送测试消息</ScqButton>
        <p role="status">已关闭 {{ closedCount }} 次</p>
      </div>
      <ScqToast v-if="ready" v-model="visible" message="新消息已送达" :position="position" :overlay="overlay" :close-on-click="closeOnClick" close-on-click-overlay :duration="2500" :teleport="`#${previewId}`" @close="closedCount++" />
    </div>
  </PhonePreview>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ScqButton, ScqCell, ScqCellGroup, ScqNavBar, ScqSwitch, ScqToast, type ToastPosition } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const previewId = 'toast-template-preview'
const ready = ref(false)
const visible = ref(false)
const closeOnClick = ref(true)
const overlay = ref(false)
const position = ref<ToastPosition>('middle')
const closedCount = ref(0)
onMounted(() => { ready.value = true })
</script>

<style scoped>
.toast-template-example { min-height: 100%; background: #f6f8fb; }
.toast-template-example select { min-height: 36px; max-width: 100%; border: 1px solid #dcdfe6; border-radius: 4px; padding: 4px 8px; background: #fff; color: #303133; font-size: 14px; }
.toast-template-example__actions { display: grid; gap: 14px; padding: 24px 16px; }
.toast-template-example__actions .my-btn { width: 100%; min-height: 44px; }
.toast-template-example__actions p { margin: 0; color: #73767a; text-align: center; font-size: 13px; }
</style>