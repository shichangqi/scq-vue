<script setup lang="ts">
import { ref } from 'vue'
import { ScqTransfer, type TransferItem, type TransferKey } from '../../../../src/index'

const selected = ref<TransferKey[]>(['ada'])
const status = ref('')
const people: TransferItem[] = [
  { key: 'ada', label: 'Ada · 产品设计' }, { key: 'lin', label: '林一 · 前端开发' },
  { key: 'grace', label: 'Grace · 服务端开发' }, { key: 'alan', label: 'Alan · 数据分析' },
  { key: 'margaret', label: 'Margaret · 质量保障' }, { key: 'guest', label: '访客 · 无权限', disabled: true },
]
const change = (_value: TransferKey[], direction: 'left' | 'right', moved: TransferKey[]) => { status.value = `${direction === 'right' ? '已加入' : '已移除'} ${moved.length} 位成员` }
</script>

<template><ScqTransfer v-model="selected" :data="people" :titles="['团队成员', '项目成员']" filterable @change="change" /><p class="transfer-example__status" role="status">{{ status || `已选择 ${selected.length} 位成员` }}</p></template>

<style scoped>
.transfer-example__status { margin: 16px 0 0; color: var(--scq-muted); font-size: 13px; }
</style>