<template>
  <PhonePreview :screen-id="previewId">
    <div class="toast-feedback-example">
      <ScqNavBar title="个人空间" />
      <div class="toast-feedback-example__identity">
        <ScqAvatar :size="48" alt="Ada Lovelace">AL</ScqAvatar>
        <div><strong>Ada Lovelace</strong><span>Design workspace</span></div>
        <ScqIcon name="shield-check" :size="22" />
      </div>
      <ScqCellGroup title="快捷操作" inset>
        <ScqCell title="加入稍后阅读" icon="bookmark" is-link @click="showText" />
        <ScqCell title="保存偏好设置" icon="check" is-link @click="showSuccess" />
        <ScqCell title="重试网络请求" icon="refresh" is-link @click="showFail" />
      </ScqCellGroup>
      <ScqCellGroup title="提醒位置" inset>
        <ScqCell title="顶部消息" value="top" is-link @click="showPosition('top')" />
        <ScqCell title="底部消息" value="bottom" is-link @click="showPosition('bottom')" />
      </ScqCellGroup>
      <p class="toast-feedback-example__footer">SCQ Cloud · 已同步</p>
    </div>
  </PhonePreview>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { ScqAvatar, ScqCell, ScqCellGroup, ScqIcon, ScqNavBar, Toast, type ToastPosition } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const previewId = 'toast-feedback-preview'
const teleport = `#${previewId}`
const showText = () => Toast.show({ message: '已加入稍后阅读', teleport })
const showSuccess = () => Toast.success({ message: '保存成功', teleport })
const showFail = () => Toast.fail({ message: '网络暂不可用\n请稍后重试', teleport })
const showPosition = (position: ToastPosition) => Toast.show({ message: '消息已送达', position, teleport })

onBeforeUnmount(() => Toast.clear(teleport))
</script>

<style scoped>
.toast-feedback-example { min-height: 100%; background: #f6f8fb; }
.toast-feedback-example__identity { display: flex; align-items: center; gap: 12px; padding: 24px 18px 12px; }
.toast-feedback-example__identity > div { flex: 1; min-width: 0; }
.toast-feedback-example__identity > div strong, .toast-feedback-example__identity > div span { display: block; overflow-wrap: anywhere; }
.toast-feedback-example__identity strong { color: #303133; font-size: 15px; }
.toast-feedback-example__identity span { margin-top: 4px; color: #73767a; font-size: 12px; }
.toast-feedback-example__identity > .scq-icon { color: #168563; }
.toast-feedback-example__footer { margin: 30px 0 0; text-align: center; color: #909399; font-size: 12px; }
</style>