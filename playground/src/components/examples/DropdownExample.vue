<script setup lang="ts">
import { ref } from 'vue'
import { ScqDropdown, ScqTag, type DropdownItem, type MenuKey } from '../../../../src/index'

const archived = ref(false)
const result = ref('')
const items: DropdownItem[] = [{ key: 'copy', label: '复制项目链接', icon: 'copy' }, { key: 'download', label: '导出数据', icon: 'download', disabled: true }, { key: 'archive', label: '切换归档状态', icon: 'folder', divided: true }]
const command = async (key: MenuKey) => {
  if (key === 'archive') { archived.value = !archived.value; result.value = archived.value ? '项目已归档' : '项目已恢复'; return }
  if (key === 'copy') {
    try { await navigator.clipboard.writeText('https://example.com/projects/scq'); result.value = '项目链接已复制' }
    catch { result.value = '浏览器未允许访问剪贴板' }
  }
}
</script>

<template><div class="dropdown-example"><strong>团队工作台</strong><ScqTag :type="archived ? 'info' : 'success'">{{ archived ? '已归档' : '进行中' }}</ScqTag><ScqDropdown label="项目操作" :items="items" @command="command" /></div><p class="dropdown-example__result" role="status">{{ result }}</p></template>

<style scoped>
.dropdown-example { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; color: var(--scq-text); }
.dropdown-example > strong { font-size: 15px; }
.dropdown-example__result { min-height: 20px; margin: 16px 0 0; color: var(--scq-muted); font-size: 13px; }
</style>