<script setup lang="ts">
import { ref } from 'vue'
import { ScqContainer, ScqDescriptions, ScqMenu, type MenuKey } from '../../../../src/index'

const active = ref<MenuKey | null>('overview')
const items = [{ key: 'overview', label: '概览', icon: 'home' as const }, { key: 'projects', label: '项目', icon: 'folder' as const }, { key: 'settings', label: '设置', icon: 'settings' as const }]
</script>

<template><ScqContainer class="container-example" :padding="0" :gap="16" :aside-width="150"><template #header><div class="container-example__header"><strong>团队工作台</strong><span>SCQ / Workspace</span></div></template><template #aside><ScqMenu v-model="active" :items="items" aria-label="工作台导航" /></template><ScqDescriptions :title="items.find(item => item.key === active)?.label" :columns="1" :items="[{ label: '负责人', value: '林一' }, { label: '进行中项目', value: 12 }, { label: '本周交付', value: 4 }]" /><template #footer><div class="container-example__footer">最近同步 · 10:24</div></template></ScqContainer></template>

<style scoped>
.container-example__header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; background: var(--scq-fill); color: var(--scq-text); }
.container-example__header strong { font-size: 15px; }
.container-example__header span, .container-example__footer { font-size: 12px; color: var(--scq-muted); }
.container-example__footer { border-top: 1px solid var(--scq-border); padding: 12px 16px; }
</style>