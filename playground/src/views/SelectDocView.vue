<template>
  <section class="doc-block">
    <h1>Select 下拉框</h1>
    <p class="lead">支持单选/多选、搜索过滤、本地或远程数据加载，以及可配置分页。</p>

    <h2>单选（含动效样式）</h2>
    <DocExample :code="singleCode" lang="vue">
      <div class="select-demo-grid">
        <scq-select v-model="singleValue" :options="cityOptions" placeholder="请选择城市" />
        <div class="select-demo-result">当前值：{{ singleValue }}</div>
      </div>
    </DocExample>

    <h2>多选</h2>
    <DocExample :code="multipleCode" lang="vue">
      <div class="select-demo-grid">
        <scq-select
          v-model="multipleValue"
          multiple
          :options="techOptions"
          placeholder="请选择技术栈"
        />
        <div class="select-demo-result">当前值：{{ multipleValue.join(', ') || '空' }}</div>
      </div>
    </DocExample>

    <h2>本地搜索过滤</h2>
    <DocExample :code="localSearchCode" lang="vue">
      <div class="select-demo-grid">
        <scq-select
          v-model="localSearchValue"
          filterable
          :options="cityOptions"
          placeholder="输入关键词过滤城市"
        />
        <div class="select-demo-result">当前值：{{ localSearchValue }}</div>
      </div>
    </DocExample>

    <h2>远程接口搜索</h2>
    <DocExample :code="remoteSearchCode" lang="vue">
      <div class="select-demo-grid">
        <scq-select
          v-model="remoteValue"
          filterable
          remote
          :remote-method="mockRemoteSearch"
          placeholder="输入关键字触发远程搜索"
        />
        <div class="select-demo-result">当前值：{{ remoteValue }}</div>
      </div>
    </DocExample>

    <h2>列表分页（可配置 pageSize）</h2>
    <DocExample :code="paginationCode" lang="vue">
      <div class="select-demo-grid">
        <scq-select
          v-model="paginationValue"
          filterable
          pagination
          :page-size="6"
          :options="bigOptions"
          placeholder="分页浏览选项"
        />
        <div class="select-demo-result">当前值：{{ paginationValue }}</div>
      </div>
    </DocExample>

    <h2>大小配置（large/default/small）</h2>
    <DocExample :code="sizeCode" lang="vue">
      <div class="select-demo-grid">
        <scq-select v-model="sizeLarge" size="large" :options="cityOptions" placeholder="Large" />
        <scq-select v-model="sizeDefault" :options="cityOptions" placeholder="Default" />
        <scq-select v-model="sizeSmall" size="small" :options="cityOptions" placeholder="Small" />
      </div>
    </DocExample>

    <h2>事件示例（change / clear / search / visible-change）</h2>
    <DocExample :code="eventCode" lang="vue">
      <div class="select-demo-inline">
        <scq-select
          v-model="eventValue"
          filterable
          clearable
          :options="cityOptions"
          placeholder="试试选择、清空、搜索"
          @change="handleChange"
          @clear="handleClear"
          @search="handleSearch"
          @visible-change="handleVisibleChange"
        />
        <div class="select-demo-log">{{ eventLog }}</div>
      </div>
    </DocExample>

    <h2>方法示例（ref 调用）</h2>
    <DocExample :code="methodCode" lang="vue">
      <div class="select-demo-grid">
        <scq-select
          ref="selectRef"
          v-model="methodValue"
          filterable
          remote
          :remote-method="mockRemoteSearch"
          placeholder="可通过按钮调用 open/close/clear/refreshRemote"
        />
        <div class="select-demo-actions">
          <button class="demo-btn" type="button" @click="openByRef">open</button>
          <button class="demo-btn" type="button" @click="closeByRef">close</button>
          <button class="demo-btn" type="button" @click="clearByRef">clear</button>
          <button class="demo-btn" type="button" @click="refreshByRef">refreshRemote</button>
        </div>
      </div>
    </DocExample>

    <h2>Props</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
          <th>类型</th>
          <th>默认值</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>modelValue</td><td>绑定值</td><td>string | number | Array&lt;string | number&gt; | null</td><td>null</td></tr>
        <tr><td>options</td><td>选项列表</td><td>Array&lt;{ label, value, disabled? }&gt;</td><td>[]</td></tr>
        <tr><td>multiple</td><td>是否多选</td><td>boolean</td><td>false</td></tr>
        <tr><td>filterable</td><td>是否支持搜索</td><td>boolean</td><td>false</td></tr>
        <tr><td>remote</td><td>是否启用远程搜索</td><td>boolean</td><td>false</td></tr>
        <tr><td>remoteMethod</td><td>远程搜索函数</td><td>(query, page, pageSize) =&gt; Promise</td><td>-</td></tr>
        <tr><td>pagination</td><td>是否启用分页</td><td>boolean</td><td>false</td></tr>
        <tr><td>pageSize</td><td>每页条数</td><td>number</td><td>8</td></tr>
        <tr><td>debounce</td><td>远程搜索防抖时间（毫秒）</td><td>number</td><td>300</td></tr>
        <tr><td>size</td><td>尺寸</td><td>large | default | small</td><td>default</td></tr>
      </tbody>
    </table>

    <h2>Events</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>事件名</th>
          <th>说明</th>
          <th>回调参数</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>change</td><td>选中值变化时触发</td><td>(value)</td></tr>
        <tr><td>clear</td><td>点击清空图标后触发</td><td>()</td></tr>
        <tr><td>search</td><td>搜索关键字变化时触发</td><td>(keyword)</td></tr>
        <tr><td>visible-change</td><td>下拉面板展开/收起时触发</td><td>(visible: boolean)</td></tr>
      </tbody>
    </table>

    <h2>Methods</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>方法名</th>
          <th>说明</th>
          <th>参数</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>open</td><td>打开下拉面板</td><td>-</td></tr>
        <tr><td>close</td><td>关闭下拉面板</td><td>-</td></tr>
        <tr><td>clear</td><td>清空当前值</td><td>-</td></tr>
        <tr><td>refreshRemote</td><td>远程模式下强制刷新当前搜索结果</td><td>-</td></tr>
        <tr><td>focus</td><td>让内部输入框获得焦点（filterable 时）</td><td>-</td></tr>
        <tr><td>blur</td><td>让内部输入框失焦（filterable 时）</td><td>-</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'

const cityOptions = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' },
  { label: '成都', value: 'chengdu' },
  { label: '武汉', value: 'wuhan' },
]

const techOptions = [
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'Node.js', value: 'node' },
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
]

const bigOptions = Array.from({ length: 36 }).map((_, idx) => ({
  label: `选项 ${idx + 1}`,
  value: `option-${idx + 1}`,
}))

const remotePool = [
  '前端开发工程师',
  '后端开发工程师',
  '测试开发工程师',
  'SRE 工程师',
  '产品经理',
  '交互设计师',
  '数据分析师',
  '算法工程师',
  '云平台工程师',
  '安全工程师',
  '运维工程师',
  '架构师',
  '项目经理',
  '技术支持工程师',
  'DevOps 工程师',
]

const singleValue = ref<string | number | null>(null)
const multipleValue = ref<Array<string | number>>([])
const localSearchValue = ref<string | number | null>(null)
const remoteValue = ref<string | number | null>(null)
const paginationValue = ref<string | number | null>(null)
const sizeLarge = ref<string | number | null>(null)
const sizeDefault = ref<string | number | null>(null)
const sizeSmall = ref<string | number | null>(null)
const eventValue = ref<string | number | null>(null)
const eventLog = ref('等待操作...')
const methodValue = ref<string | number | null>(null)

type SelectInstance = {
  open: () => void
  close: () => void
  clear: () => void
  refreshRemote: () => Promise<void>
}

const selectRef = ref<SelectInstance | null>(null)

const handleChange = (value: string | number | Array<string | number> | null) => {
  eventLog.value = `change: ${JSON.stringify(value)}`
}

const handleClear = () => {
  eventLog.value = 'clear: 已清空'
}

const handleSearch = (keyword: string) => {
  eventLog.value = `search: ${keyword}`
}

const handleVisibleChange = (visible: boolean) => {
  eventLog.value = `visible-change: ${visible}`
}

const openByRef = () => {
  selectRef.value?.open()
}

const closeByRef = () => {
  selectRef.value?.close()
}

const clearByRef = () => {
  selectRef.value?.clear()
}

const refreshByRef = async () => {
  await selectRef.value?.refreshRemote()
}

const mockRemoteSearch = async (query: string, page: number, pageSize: number) => {
  await new Promise((resolve) => window.setTimeout(resolve, 320))
  const keyword = query.trim().toLowerCase()
  const filtered = keyword
    ? remotePool.filter((item) => item.toLowerCase().includes(keyword))
    : remotePool
  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize).map((item) => ({
    label: item,
    value: item,
  }))
  return {
    list,
    total,
  }
}

const singleCode = `<template>
  <div class="select-demo-grid">
    <scq-select v-model="singleValue" :options="cityOptions" placeholder="请选择城市" />
    <div class="select-demo-result">当前值：{{ singleValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cityOptions = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '深圳', value: 'shenzhen' },
]

const singleValue = ref<string | number | null>(null)
<\/script>

<style scoped>
.select-demo-grid {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

.select-demo-result {
  color: #5a6b81;
  font-size: 13px;
}
</style>`

const multipleCode = `<template>
  <div class="select-demo-grid">
    <scq-select v-model="multipleValue" multiple :options="techOptions" placeholder="请选择技术栈" />
    <div class="select-demo-result">当前值：{{ multipleValue.join(', ') || '空' }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const techOptions = [
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'TypeScript', value: 'ts' },
]

const multipleValue = ref<Array<string | number>>([])
<\/script>

<style scoped>
.select-demo-grid {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

.select-demo-result {
  color: #5a6b81;
  font-size: 13px;
}
</style>`

const localSearchCode = `<template>
  <div class="select-demo-grid">
    <scq-select
      v-model="localSearchValue"
      filterable
      :options="cityOptions"
      placeholder="输入关键词过滤城市"
    />
    <div class="select-demo-result">当前值：{{ localSearchValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cityOptions = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' },
]

const localSearchValue = ref<string | number | null>(null)
<\/script>

<style scoped>
.select-demo-grid {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

.select-demo-result {
  color: #5a6b81;
  font-size: 13px;
}
</style>`

const remoteSearchCode = `<template>
  <div class="select-demo-grid">
    <scq-select
      v-model="remoteValue"
      filterable
      remote
      :remote-method="mockRemoteSearch"
      placeholder="输入关键字触发远程搜索"
    />
    <div class="select-demo-result">当前值：{{ remoteValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const remoteValue = ref<string | number | null>(null)

const remotePool = ['前端开发工程师', '后端开发工程师', '测试开发工程师', 'SRE 工程师']

const mockRemoteSearch = async (query: string, page: number, pageSize: number) => {
  await new Promise((resolve) => window.setTimeout(resolve, 320))
  const keyword = query.trim().toLowerCase()
  const filtered = keyword ? remotePool.filter((item) => item.toLowerCase().includes(keyword)) : remotePool
  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize).map((item) => ({
    label: item,
    value: item,
  }))
  return { list, total }
}
<\/script>

<style scoped>
.select-demo-grid {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

.select-demo-result {
  color: #5a6b81;
  font-size: 13px;
}
</style>`

const paginationCode = `<template>
  <div class="select-demo-grid">
    <scq-select
      v-model="paginationValue"
      filterable
      pagination
      :page-size="6"
      :options="bigOptions"
      placeholder="分页浏览选项"
    />
    <div class="select-demo-result">当前值：{{ paginationValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const paginationValue = ref<string | number | null>(null)

const bigOptions = Array.from({ length: 36 }).map((_, idx) => ({
  label: '选项 ' + (idx + 1),
  value: 'option-' + (idx + 1),
}))
<\/script>

<style scoped>
.select-demo-grid {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

.select-demo-result {
  color: #5a6b81;
  font-size: 13px;
}
</style>`

const sizeCode = `<template>
  <div class="select-demo-grid">
    <scq-select v-model="sizeLarge" size="large" :options="cityOptions" placeholder="Large" />
    <scq-select v-model="sizeDefault" :options="cityOptions" placeholder="Default" />
    <scq-select v-model="sizeSmall" size="small" :options="cityOptions" placeholder="Small" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cityOptions = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '深圳', value: 'shenzhen' },
]

const sizeLarge = ref<string | number | null>(null)
const sizeDefault = ref<string | number | null>(null)
const sizeSmall = ref<string | number | null>(null)
<\/script>

<style scoped>
.select-demo-grid {
  display: grid;
  gap: 10px;
  max-width: 520px;
}
</style>`

const eventCode = `<template>
  <div class="select-demo-inline">
    <scq-select
      v-model="value"
      filterable
      clearable
      :options="options"
      @change="handleChange"
      @clear="handleClear"
      @search="handleSearch"
      @visible-change="handleVisibleChange"
    />
    <p>{{ log }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const value = ref<string | number | null>(null)
const log = ref('等待操作...')

const options = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
]

const handleChange = (nextValue) => {
  log.value = 'change: ' + JSON.stringify(nextValue)
}

const handleClear = () => {
  log.value = 'clear: 已清空'
}

const handleSearch = (keyword) => {
  log.value = 'search: ' + keyword
}

const handleVisibleChange = (visible) => {
  log.value = 'visible-change: ' + visible
}
<\/script>

<style scoped>
p {
  margin: 0;
  color: #5a6b81;
  font-size: 13px;
}

.select-demo-inline {
  display: grid;
  grid-template-columns: 240px minmax(180px, 1fr);
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .select-demo-inline {
    grid-template-columns: 1fr;
    align-items: start;
  }
}

p {
  margin: 0;
}
</style>`

const methodCode = `<template>
  <scq-select
    ref="selectRef"
    v-model="value"
    filterable
    remote
    :remote-method="mockRemoteSearch"
  />
  <div class="actions">
    <button type="button" @click="selectRef?.open()">open</button>
    <button type="button" @click="selectRef?.close()">close</button>
    <button type="button" @click="selectRef?.clear()">clear</button>
    <button type="button" @click="selectRef?.refreshRemote()">refreshRemote</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const value = ref<string | number | null>(null)
const selectRef = ref<any>(null)

const mockRemoteSearch = async () => {
  return {
    list: [
      { label: '前端开发工程师', value: 'fe' },
      { label: '后端开发工程师', value: 'be' },
    ],
    total: 2,
  }
}
<\/script>

<style scoped>
.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

button {
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
}
</style>`
</script>

<style scoped>
.select-demo-grid {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

.select-demo-result {
  color: #5a6b81;
  font-size: 13px;
}

.select-demo-log {
  color: #5a6b81;
  font-size: 13px;
  min-height: 20px;
}

.select-demo-inline {
  display: grid;
  grid-template-columns: 240px minmax(180px, 1fr);
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .select-demo-inline {
    grid-template-columns: 1fr;
    align-items: start;
  }
}

.select-demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-btn {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  padding: 4px 10px;
  cursor: pointer;
}

.demo-btn:hover {
  border-color: #409eff;
  color: #409eff;
}
</style>