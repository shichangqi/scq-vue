<script setup lang="ts">
import { ref } from 'vue'
import ScqMenu from '../../../../src/components/Menu'
import ScqRadio from '../../../../src/components/Radio'
import ScqRadioGroup from '../../../../src/components/RadioGroup'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'
import type { MenuItemOption, MenuKey, RadioValue } from '../../../../src/index'

const mode = ref<'vertical' | 'horizontal'>('vertical')
const setMode = (value: RadioValue) => {
  if (value !== 'vertical' && value !== 'horizontal') throw new RangeError('Unknown menu direction.')
  mode.value = value
}
const active = ref<MenuKey | null>('overview')
const openKeys = ref<MenuKey[]>(['projects'])
const disabled = ref(false)
const event = ref('展开状态由 v-model:openKeys 控制')
const items: MenuItemOption[] = [{ key: 'overview', label: '概览', icon: 'home', description: '工作区摘要', shortcut: 'Alt+1' }, { key: 'projects', label: '项目', icon: 'folder', children: [{ key: 'web', label: 'Web 工作台' }, { key: 'mobile', label: '移动应用' }, { key: 'archive', label: '历史项目', disabled: true }] }, { key: 'members', label: '成员', icon: 'user' }, { key: 'settings', label: '设置', icon: 'settings' }]
</script>

<template>
  <fieldset class="menu-example__mode"><legend>导航排列</legend><ScqRadioGroup :model-value="mode" aria-label="导航排列" @update:model-value="setMode"><ScqRadio value="vertical">纵向</ScqRadio><ScqRadio value="horizontal">横向</ScqRadio></ScqRadioGroup></fieldset>
  <ExampleSection title="受控展开与导航事件">
    <template #controls><ScqCheckbox v-model="disabled">禁用菜单</ScqCheckbox></template>
    <ScqMenu v-model="active" v-model:open-keys="openKeys" :items="items" :mode="mode" :disabled="disabled" unique-opened :style="{ width: mode === 'vertical' ? '260px' : '100%', maxWidth: '100%' }" aria-label="项目导航" @select="key => event = `select: ${key}`" @open="key => event = `open: ${key}`" @close="key => event = `close: ${key}`" />
    <ScqButton @click="openKeys = openKeys.length ? [] : ['projects']">切换项目分组</ScqButton>
    <output role="status">当前：{{ active }} · 展开：{{ openKeys.join(', ') }} · {{ event }}</output>
  </ExampleSection>
</template>

<style scoped>
.menu-example__mode { display: flex; gap: 18px; padding: 0; margin: 0 0 18px; border: 0; font-size: 13px; color: var(--scq-muted); }
.menu-example__mode legend { margin-bottom: 10px; }
.menu-example__current { display: block; margin-top: 18px; color: var(--scq-muted); font-size: 13px; }
</style>