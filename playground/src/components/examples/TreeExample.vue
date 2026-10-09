<script setup lang="ts">
import { ref } from 'vue'
import { ScqInput, ScqTree, type TreeKey, type TreeNode } from '../../../../src/index'

const query = ref('')
const active = ref<TreeKey | null>('guide')
const checked = ref<TreeKey[]>(['guide'])
const data: TreeNode[] = [
  { key: 'workspace', label: '项目文档', children: [{ key: 'guide', label: '开发指南', isLeaf: true }, { key: 'design', label: '设计规范', isLeaf: true }, { key: 'private', label: '受限文件', disabled: true, isLeaf: true }] },
  { key: 'archive', label: '历史归档' },
]
const load = (node: TreeNode, signal: AbortSignal) => new Promise<TreeNode[]>((resolve, reject) => {
  const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve([2024, 2025, 2026].map((year) => ({ key: `${node.key}-${year}`, label: `${year} 年度报告`, isLeaf: true }))) }, 450)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
</script>

<template><div class="tree-example"><ScqInput v-model="query" placeholder="搜索文档" aria-label="搜索文档树" /><ScqTree v-model="active" v-model:checked-keys="checked" :data="data" :filter="query" :load="load" :default-expanded-keys="['workspace']" show-checkbox aria-label="项目文档" /><output>已勾选 {{ checked.length }} 项 · 当前 {{ active }}</output></div></template>

<style scoped>
.tree-example { display: grid; gap: 16px; max-width: 480px; }
.tree-example output { font-size: 12px; color: var(--scq-muted); overflow-wrap: anywhere; }
</style>