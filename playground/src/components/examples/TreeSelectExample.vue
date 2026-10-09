<script setup lang="ts">
import { ref } from 'vue'
import { ScqTreeSelect, type TreeNode, type TreeSelectValue } from '../../../../src/index'

const owner = ref<TreeSelectValue>('frontend')
const participants = ref<TreeSelectValue>(['design'])
const data: TreeNode[] = [
  { key: 'engineering', label: '研发中心', children: [{ key: 'frontend', label: '前端开发' }, { key: 'backend', label: '服务端开发' }] },
  { key: 'creative', label: '创意中心', children: [{ key: 'design', label: '产品设计' }, { key: 'content', label: '内容编辑' }] },
  { key: 'archive', label: '归档团队', disabled: true },
]
</script>

<template>
  <div class="tree-select-example"><label>负责团队<ScqTreeSelect v-model="owner" :data="data" filterable leaf-only default-expand-all aria-label="负责团队" /></label><label>协作团队<ScqTreeSelect v-model="participants" :data="data" multiple filterable default-expand-all aria-label="协作团队" /></label></div><output class="tree-select-example__output">{{ JSON.stringify({ owner, participants }) }}</output>
</template>

<style scoped>
.tree-select-example { display: flex; flex-wrap: wrap; gap: 20px; }
.tree-select-example label { display: grid; gap: 8px; max-width: 100%; color: var(--scq-text); font-size: 13px; }
.tree-select-example__output { display: block; margin-top: 18px; color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
</style>