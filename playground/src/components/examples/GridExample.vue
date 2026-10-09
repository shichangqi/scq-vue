<script setup lang="ts">
import { ref } from 'vue'
import { ScqGrid, ScqIcon, ScqInputNumber, ScqTag } from '../../../../src/index'

const gap = ref<number | undefined>(16)
const projects = [{ name: '团队空间', status: '进行中' }, { name: '设计系统', status: '已完成' }, { name: '客户门户', status: '进行中' }, { name: '数据报告', status: '已完成' }, { name: '开发工具', status: '进行中' }, { name: '移动应用', status: '进行中' }]
</script>

<template><label class="grid-example__control">间距<ScqInputNumber v-model="gap" :min="0" :max="40" :step="4" aria-label="网格间距" /></label><ScqGrid :columns="{ xs: 1, sm: 2, lg: 3 }" :gap="gap ?? 0" as="ul"><li v-for="project in projects" :key="project.name" class="grid-example__item"><ScqIcon name="folder" :size="22" /><strong>{{ project.name }}</strong><ScqTag :type="project.status === '已完成' ? 'success' : 'primary'">{{ project.status }}</ScqTag></li></ScqGrid></template>

<style scoped>
.grid-example__control { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; color: var(--scq-muted); font-size: 13px; }
.grid-example__item { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; min-height: 88px; padding: 14px; border: 1px solid var(--scq-border); border-radius: 4px; color: var(--scq-text); box-sizing: border-box; }
.grid-example__item > .scq-icon { color: var(--scq-primary); }
.grid-example__item strong { flex: 1; font-size: 14px; overflow-wrap: anywhere; }
</style>