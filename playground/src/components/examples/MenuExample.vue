<script setup lang="ts">
import { ref } from 'vue'
import { ScqMenu, type MenuItemOption, type MenuKey } from '../../../../src/index'

const mode = ref<'vertical' | 'horizontal'>('vertical')
const active = ref<MenuKey | null>('overview')
const items: MenuItemOption[] = [{ key: 'overview', label: '概览', icon: 'home' }, { key: 'projects', label: '项目', icon: 'folder', children: [{ key: 'web', label: 'Web 工作台' }, { key: 'mobile', label: '移动应用' }, { key: 'archive', label: '历史项目', disabled: true }] }, { key: 'members', label: '成员', icon: 'user' }, { key: 'settings', label: '设置', icon: 'settings' }]
</script>

<template><fieldset class="menu-example__mode"><legend>导航排列</legend><label><input v-model="mode" type="radio" value="vertical" />纵向</label><label><input v-model="mode" type="radio" value="horizontal" />横向</label></fieldset><ScqMenu v-model="active" :items="items" :mode="mode" :default-open-keys="['projects']" unique-opened :style="{ width: mode === 'vertical' ? '260px' : '100%', maxWidth: '100%' }" aria-label="项目导航" /><output class="menu-example__current">当前：{{ active }}</output></template>

<style scoped>
.menu-example__mode { display: flex; gap: 18px; padding: 0; margin: 0 0 18px; border: 0; font-size: 13px; color: var(--scq-muted); }
.menu-example__mode legend { margin-bottom: 10px; }
.menu-example__mode label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.menu-example__mode input { accent-color: var(--scq-primary); }
.menu-example__current { display: block; margin-top: 18px; color: var(--scq-muted); font-size: 13px; }
</style>