<script setup lang="ts">
import { ref } from 'vue'
import { ScqButton, ScqIcon, ScqPopconfirm } from '../../../../src/index'

const exists = ref(true)
const confirm = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, 500)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
</script>

<template><div class="popconfirm-example"><template v-if="exists"><ScqIcon name="file" :size="24" /><div><strong>项目评审记录.pdf</strong><span>128 KB · 今天 10:24</span></div><ScqPopconfirm title="删除这份文件？" message="确认后将从当前列表移除。" :before-confirm="confirm" @confirm="exists = false"><ScqButton type="danger">删除</ScqButton></ScqPopconfirm></template><template v-else><span role="status">文件已删除</span><ScqButton @click="exists = true">恢复文件</ScqButton></template></div></template>

<style scoped>
.popconfirm-example { display: flex; align-items: center; gap: 14px; min-height: 64px; color: var(--scq-text); }
.popconfirm-example > .scq-icon { color: var(--scq-primary); flex-shrink: 0; }
.popconfirm-example > div { display: grid; flex: 1; min-width: 0; gap: 6px; }
.popconfirm-example strong { font-size: 14px; overflow-wrap: anywhere; }
.popconfirm-example div > span { font-size: 12px; color: var(--scq-muted); }
.popconfirm-example > span[role="status"] { flex: 1; font-size: 14px; }
</style>