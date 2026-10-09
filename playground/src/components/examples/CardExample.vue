<script setup lang="ts">
import { ref } from 'vue'
import { ScqButton, ScqCard, ScqGrid, ScqImage, ScqTag } from '../../../../src/index'

const saved = ref<string[]>([])
const projects = [{ id: 'mountain', title: '山地路线', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&auto=format&fit=crop&q=85', detail: '周六出发 · 12 公里' }, { id: 'lake', title: '湖畔路线', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&auto=format&fit=crop&q=85', detail: '周日出发 · 6 公里' }]
const toggle = (id: string) => { saved.value = saved.value.includes(id) ? saved.value.filter((value) => value !== id) : [...saved.value, id] }
</script>

<template><ScqGrid :columns="{ xs: 1, sm: 2 }" :gap="20"><ScqCard v-for="project in projects" :key="project.id" :header="project.title" shadow="hover"><template #media><ScqImage :src="project.image" :alt="project.title" :height="160" /></template><template #extra><ScqTag type="success">开放报名</ScqTag></template><p class="card-example__detail">{{ project.detail }}</p><template #footer><ScqButton @click="toggle(project.id)">{{ saved.includes(project.id) ? '已收藏' : '收藏路线' }}</ScqButton></template></ScqCard></ScqGrid></template>

<style scoped>
.card-example__detail { margin: 0; color: var(--scq-muted); line-height: 1.7; }
</style>