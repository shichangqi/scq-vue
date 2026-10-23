<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import Notification from '../../../../src/components/Notification'
import ScqButton from '../../../../src/components/Button'
import ScqSelect from '../../../../src/components/Select'
import type { NotificationInstance, NotificationPosition, NotificationType, SelectValue } from '../../../../src/index'

const POSITIONS = [{ label: '右上', value: 'top-right' }, { label: '左上', value: 'top-left' }, { label: '右下', value: 'bottom-right' }, { label: '左下', value: 'bottom-left' }] as const
const position = ref<NotificationPosition>('top-right')
const setPosition = (value: SelectValue | SelectValue[] | null) => {
  const option = POSITIONS.find(option => option.value === value)
  if (!option) throw new RangeError('Unknown notification position.')
  position.value = option.value
}
const notices = new Set<NotificationInstance>()
const messages: Record<NotificationType, { title: string; message: string }> = { success: { title: '发布成功', message: '项目文件已经同步到团队空间。' }, warning: { title: '存储空间提醒', message: '剩余可用空间为 1.2 GB。' }, error: { title: '同步失败', message: '网络连接暂时不可用，请稍后重试。' }, info: { title: '待确认的邀请', message: 'Ada 邀请你加入设计系统项目。' } }
const show = (type: NotificationType, duration = 4500) => {
  const notice = Notification.show({ ...messages[type], type, position: position.value, duration, onClosed: () => notices.delete(notice) })
  notices.add(notice)
}
const clear = () => notices.forEach((notice) => notice.close())
onBeforeUnmount(clear)
</script>

<template><div class="notification-example"><label>位置<ScqSelect :model-value="position" :options="[...POSITIONS]" :clearable="false" aria-label="通知位置" @update:model-value="setPosition" /></label><ScqButton @click="show('success')">发布成功</ScqButton><ScqButton @click="show('warning')">空间提醒</ScqButton><ScqButton @click="show('error')">同步失败</ScqButton><ScqButton @click="show('info', 0)">待办邀请</ScqButton><ScqButton @click="clear">清除通知</ScqButton></div></template>

<style scoped>
.notification-example { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.notification-example label { display: flex; align-items: center; gap: var(--scq-space-sm, 8px); max-width: 100%; color: var(--scq-muted); font-size: 13px; }
.notification-example .scq-select { min-width: 0; }
</style>