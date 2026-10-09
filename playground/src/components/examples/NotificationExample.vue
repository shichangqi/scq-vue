<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Notification, ScqButton, type NotificationInstance, type NotificationPosition, type NotificationType } from '../../../../src/index'

const position = ref<NotificationPosition>('top-right')
const notices = new Set<NotificationInstance>()
const messages: Record<NotificationType, { title: string; message: string }> = { success: { title: '发布成功', message: '项目文件已经同步到团队空间。' }, warning: { title: '存储空间提醒', message: '剩余可用空间为 1.2 GB。' }, error: { title: '同步失败', message: '网络连接暂时不可用，请稍后重试。' }, info: { title: '待确认的邀请', message: 'Ada 邀请你加入设计系统项目。' } }
const show = (type: NotificationType, duration = 4500) => {
  const notice = Notification.show({ ...messages[type], type, position: position.value, duration, onClosed: () => notices.delete(notice) })
  notices.add(notice)
}
const clear = () => notices.forEach((notice) => notice.close())
onBeforeUnmount(clear)
</script>

<template><div class="notification-example"><label>位置<select v-model="position"><option value="top-right">右上</option><option value="top-left">左上</option><option value="bottom-right">右下</option><option value="bottom-left">左下</option></select></label><ScqButton @click="show('success')">发布成功</ScqButton><ScqButton @click="show('warning')">空间提醒</ScqButton><ScqButton @click="show('error')">同步失败</ScqButton><ScqButton @click="show('info', 0)">待办邀请</ScqButton><ScqButton @click="clear">清除通知</ScqButton></div></template>

<style scoped>
.notification-example { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.notification-example label { display: flex; align-items: center; gap: 8px; color: var(--scq-muted); font-size: 13px; }
.notification-example select { min-height: 36px; border: 1px solid var(--scq-border); border-radius: var(--scq-radius); background: var(--scq-surface); color: var(--scq-text); padding: 6px 10px; font: inherit; }
</style>