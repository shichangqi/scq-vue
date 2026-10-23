<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqPagination from '../../../../src/components/Pagination'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { total: 388, firstPage: 1, initialPage: 8, pageSize: 10, pageSizes: [10, 20, 50], pagerCount: 5 }
const page = ref(CONFIG.initialPage)
const pageSize = ref(CONFIG.pageSize)
const unknownPage = ref(CONFIG.firstPage)
const disabled = ref(false)
const loading = ref(false)
const hasNext = ref(true)
const hideSingle = ref(true)
const event = ref('尚未翻页')
</script>

<template>
  <ExampleSection title="跳转、事件与自定义区域" description="按总数、每页条数、页码、跳转排列。前往输入框显示当前页，按 Enter 或失焦提交，越界自动修正，清空恢复当前页；点击省略号可大步翻页，调整页容量后回到第一页。">
    <template #controls>
      <ScqCheckbox v-model="disabled">禁用</ScqCheckbox>
      <ScqCheckbox v-model="loading">加载中</ScqCheckbox>
    </template>
    <ScqPagination v-model="page" v-model:page-size="pageSize" :total="CONFIG.total" :page-sizes="CONFIG.pageSizes" :pager-count="CONFIG.pagerCount" :disabled="disabled" :loading="loading" show-jumper show-total @change="event = `change: ${$event}`" @size-change="event = `size-change: ${$event}`">
      <template #total="{ total }"><span>共 {{ total }} 条记录</span></template>
      <template #suffix="{ page: current }"><span>当前第 {{ current }} 页 / 共 {{ Math.ceil(CONFIG.total / pageSize) }} 页</span></template>
    </ScqPagination>
    <output role="status">{{ event }}</output>
  </ExampleSection>
  <ExampleSection title="未知总数与单页隐藏" description="未知总数由 hasNext 决定是否可以继续翻页，不显示总页数和跳转框。这里只演示本地状态，没有网络请求。">
    <template #controls>
      <ScqCheckbox v-model="hasNext">还有下一页</ScqCheckbox>
      <ScqCheckbox v-model="hideSingle">单页时隐藏</ScqCheckbox>
    </template>
    <ScqPagination v-model="unknownPage" unknown-total :has-next="hasNext" :loading="loading" :disabled="disabled" />
    <ScqSpace>
      <span>单页列表：</span>
      <ScqPagination :total="CONFIG.pageSize" :page-size="CONFIG.pageSize" :hide-on-single-page="hideSingle" />
      <ScqButton size="small" @click="unknownPage = CONFIG.firstPage">重置未知总数页码</ScqButton>
    </ScqSpace>
  </ExampleSection>
</template>
