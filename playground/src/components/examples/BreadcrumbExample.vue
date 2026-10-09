<script setup lang="ts">
import { ref } from 'vue'
import { ScqBreadcrumb, ScqLink, type BreadcrumbItem } from '../../../../src/index'

const initial: BreadcrumbItem[] = ['工作台', '团队空间', '设计项目', '交付文件', '评审记录'].map((label) => ({ label }))
const items = ref([...initial])
const select = (_item: BreadcrumbItem, index: number) => { items.value = items.value.slice(0, index + 1) }
</script>

<template><ScqBreadcrumb :items="items" :max-items="3" @select="select" /><div class="breadcrumb-example__location"><span>{{ items.at(-1)?.label }}</span><ScqLink type="primary" @click="items = [...initial]">重置路径</ScqLink></div></template>

<style scoped>
.breadcrumb-example__location { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--scq-border); color: var(--scq-muted); font-size: 14px; }
</style>