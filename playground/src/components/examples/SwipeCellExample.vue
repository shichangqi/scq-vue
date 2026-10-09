<script setup lang="ts">
import { ref } from 'vue'
import { ScqCell, ScqEmpty, ScqNavBar, ScqSwipeCell } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const initial = [{ id: 1, title: '设计评审', description: '明天 14:00 · 会议室 A', pinned: false }, { id: 2, title: '开发周报', description: '周五前提交本周进展', pinned: false }, { id: 3, title: '项目资料', description: '新的参考文件已到达', pinned: false }]
const items = ref(initial.map((item) => ({ ...item })))
const remove = (id: number) => { items.value = items.value.filter((item) => item.id !== id) }
const restore = () => { items.value = initial.map((item) => ({ ...item })) }
</script>

<template>
  <PhonePreview screen-id="swipe-cell-inbox-preview"><ScqNavBar title="消息" right-icon="refresh" right-label="恢复消息" @click-right="restore" /><div class="swipe-cell-example__summary">{{ items.length }} 条消息</div><ScqSwipeCell v-for="item in items" :key="item.id" :aria-label="item.title"><template #left><button class="swipe-cell-example__pin" type="button" @click="item.pinned = !item.pinned">{{ item.pinned ? '取消置顶' : '置顶' }}</button></template><ScqCell :title="item.title" :label="item.description" :icon="item.pinned ? 'star' : 'bell'" /><template #right><button class="swipe-cell-example__delete" type="button" @click="remove(item.id)">删除</button></template></ScqSwipeCell><ScqEmpty v-if="!items.length" description="暂无消息" /></PhonePreview>
</template>

<style scoped>
.swipe-cell-example__summary { padding: 18px 16px; font-size: 13px; color: var(--scq-muted); }
.swipe-cell-example__pin, .swipe-cell-example__delete { border: 0; width: 84px; padding: 10px; color: white; background: var(--scq-primary); font: inherit; font-size: 14px; cursor: pointer; }
.swipe-cell-example__delete { background: var(--scq-danger); }
</style>