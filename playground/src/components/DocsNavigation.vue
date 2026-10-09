<template>
  <nav class="docs-navigation" :aria-label="label('文档导航', 'Documentation navigation')">
    <div class="docs-search"><Icon name="search" /><input :value="query" type="search" :placeholder="label('搜索组件', 'Search components')" :aria-label="label('搜索组件', 'Search components')" @input="emit('update:query', ($event.target as HTMLInputElement).value)" /></div>
    <div class="docs-platforms" role="group" :aria-label="label('组件分类', 'Component category')"><button v-for="option in platforms" :key="option.value" type="button" :class="{ 'is-active': platform === option.value }" :aria-pressed="platform === option.value" @click="emit('update:platform', option.value)">{{ option.label }}</button></div>
    <template v-if="!query"><div class="menu-group">{{ label('开发指南', 'Guide') }}</div><RouterLink class="menu-item" to="/guide" @click="emit('navigate')">{{ label('快速开始', 'Quick start') }}</RouterLink></template>
    <div v-for="group in filteredGroups" :key="group.key" class="docs-menu-section"><div class="menu-group">{{ locale === 'zh-CN' ? group.zh : group.en }}<span class="docs-menu-count">{{ group.items.length }}</span></div><RouterLink v-for="entry in group.items" :key="entry.slug" class="menu-item" :to="`/components/${entry.slug}`" @click="emit('navigate')"><span>{{ entry.name }}<span v-if="locale === 'zh-CN'" class="menu-item__translation">{{ entry.title }}</span></span><span v-if="entry.platform === 'mobile'" class="menu-item__platform">M</span></RouterLink></div>
    <p v-if="!filteredGroups.length" class="docs-search-empty" role="status">{{ label('没有匹配的组件', 'No matching components') }}</p>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '../../../src/components/Icon/Icon.vue'
import { componentDocs, docGroups } from '../docs/catalog'
import { locale } from '../i18n'

const props = defineProps<{ query: string; platform: 'all' | 'pc' | 'mobile' }>()
const emit = defineEmits<{ (event: 'update:query', value: string): void; (event: 'update:platform', value: 'all' | 'pc' | 'mobile'): void; (event: 'navigate'): void }>()
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const platforms = computed(() => [{ value: 'all' as const, label: label('全部', 'All') }, { value: 'pc' as const, label: label('通用', 'General') }, { value: 'mobile' as const, label: label('移动端', 'Mobile') }])
const filteredGroups = computed(() => docGroups.map((group) => ({ ...group, items: componentDocs.filter((entry) => entry.group === group.key && (props.platform === 'all' || (props.platform === 'mobile' ? entry.platform === 'mobile' : entry.platform !== 'mobile')) && `${entry.name} ${entry.title} ${entry.slug}`.toLowerCase().includes(props.query.trim().toLowerCase())) })).filter((group) => group.items.length))
</script>