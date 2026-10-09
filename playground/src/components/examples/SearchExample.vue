<template>
  <PhonePreview :screen-id="previewId">
    <div class="search-example">
      <ScqNavBar title="我的文档" />
      <ScqSearch v-model="keyword" placeholder="搜索文档名称" show-action @search="search" @cancel="status = ''" />
      <p class="search-example__count" role="status">{{ status || `${filteredFiles.length} 份文档` }}</p>
      <ScqCellGroup v-if="filteredFiles.length">
        <ScqCell v-for="file in filteredFiles" :key="file.name" :title="file.name" :label="file.modified" :value="file.type" icon="file" is-link @click="openFile(file.name)" />
      </ScqCellGroup>
      <ScqEmpty v-else description="没有匹配的文档" />
    </div>
  </PhonePreview>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ScqCell, ScqCellGroup, ScqEmpty, ScqNavBar, ScqSearch, Toast } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const previewId = 'search-documents-preview'
const keyword = ref('')
const status = ref('')
const files = [
  { name: '季度运营报告', type: 'PDF', modified: '今天 10:24' },
  { name: '移动端设计规范', type: 'DOCX', modified: '昨天 16:30' },
  { name: '项目迭代计划', type: 'XLSX', modified: '10月08日 09:15' },
  { name: '年度财务报告', type: 'PDF', modified: '10月06日 14:20' },
]
const filteredFiles = computed(() => files.filter((file) => file.name.toLowerCase().includes(keyword.value.trim().toLowerCase())))
const search = () => { status.value = `找到 ${filteredFiles.value.length} 项结果` }
const openFile = (name: string) => Toast.show({ message: name, teleport: `#${previewId}` })
onBeforeUnmount(() => Toast.clear(`#${previewId}`))
</script>

<style scoped>
.search-example { min-height: 100%; background: #f6f8fb; }
.search-example__count { padding: 4px 16px; color: #73767a; font-size: 12px; }
</style>