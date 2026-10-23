<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ScqActionSheet from '../../../../src/components/ActionSheet'
import type { ActionSheetItem } from '../../../../src/components/ActionSheet'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqIcon from '../../../../src/components/Icon'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqTabbar from '../../../../src/components/Tabbar'
import type { TabbarItem } from '../../../../src/components/Tabbar'
import ExampleSection from '../ExampleSection.vue'
import PhonePreview from '../PhonePreview.vue'

const CONFIG = { delay: 600, columns: 2, iconSize: 20, screenId: 'mobile-guard-preview' }
const ITEMS: TabbarItem[] = [{ name: 'home', label: '首页', icon: 'home' }, { name: 'settings', label: '设置', icon: 'settings', activeIcon: 'check' }, { name: 'more', label: '操作', icon: 'plus', action: true }]
const ACTIONS: ActionSheetItem[] = [{ name: '保存草稿', value: 'save', icon: 'check', group: '文档' }, { name: '复制内容', value: 'copy', icon: 'copy', group: '文档' }, { name: '删除草稿', value: 'delete', icon: 'close', danger: true, group: '管理' }, { name: '不可用操作', value: 'disabled', disabled: true, group: '管理' }]
const nav = ref<InstanceType<typeof ScqNavBar>>()
const tabbar = ref<InstanceType<typeof ScqTabbar>>()
const sheet = ref<InstanceType<typeof ScqActionSheet>>()
const active = ref<string | number>('home')
const opened = ref(false)
const previewReady = ref(false)
onMounted(() => { previewReady.value = true })
const block = ref(false)
const fail = ref(false)
const disabled = ref(false)
const labels = ref(true)
const status = ref('页面：home')
const approve = (_value: unknown, signal: AbortSignal) => new Promise<boolean>((resolve, reject) => {
  status.value = '等待确认…'
  const abort = () => { clearTimeout(timer); resolve(false) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    if (fail.value) reject(new Error('操作失败，可取消或重试'))
    else { if (block.value) status.value = '操作被拒绝'; resolve(!block.value) }
  }, CONFIG.delay)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
const beforeSelect = (action: ActionSheetItem, _index: number, signal: AbortSignal) => approve(action, signal)
const onError = (error: unknown) => { status.value = error instanceof Error ? error.message : String(error) }
const cancel = () => { nav.value?.cancelPending(); tabbar.value?.cancelPending(); sheet.value?.cancelPending(); status.value = '已取消等待' }
</script>

<template>
  <ExampleSection title="返回、导航与动作拦截" description="普通导航项经过 beforeChange；action 项只触发 action，不改变当前页。动作面板展示分组、网格、禁用项和失败后重试。">
    <template #controls>
      <ScqCheckbox v-model="block">阻止操作</ScqCheckbox>
      <ScqCheckbox v-model="fail">模拟失败</ScqCheckbox>
      <ScqCheckbox v-model="disabled">禁用导航</ScqCheckbox>
      <ScqCheckbox v-model="labels">显示标签</ScqCheckbox>
    </template>
    <ScqButton @click="cancel">取消等待</ScqButton>
    <PhonePreview :screen-id="CONFIG.screenId">
      <ScqNavBar ref="nav" left-arrow left-text="返回" :disabled="disabled" :before-back="approve" @click-left="status = '已返回（本地演示）'" @click-right="opened = true" @error="onError">
        <template #title>编辑草稿</template>
        <template #right="{ click, disabled: unavailable }"><ScqButton size="small" :disabled="unavailable" @click="click">操作</ScqButton></template>
      </ScqNavBar>
      <p role="status">{{ status }}</p>
      <ScqTabbar ref="tabbar" v-model="active" :items="ITEMS" :before-change="approve" :disabled="disabled" :show-labels="labels" aria-label="草稿导航" @change="status = `页面：${$event}`" @action="opened = true" @error="onError">
        <template #icon="{ item, active: selected, pending }"><ScqIcon v-if="item.icon" :name="pending ? 'refresh' : selected ? 'check' : item.icon" :size="CONFIG.iconSize" /></template>
        <template #label="{ item }">{{ item.label }}</template>
      </ScqTabbar>
      <ScqActionSheet v-if="previewReady" ref="sheet" v-model="opened" :actions="ACTIONS" :columns="CONFIG.columns" :before-select="beforeSelect" :teleport="`#${CONFIG.screenId}`" title="文档操作" description="操作成功后自动关闭；取消会终止等待。" @select="action => status = `已选择：${action.name}`" @cancel="status = '已取消面板'" @error="onError">
        <template #action="{ action, pending }">{{ pending ? '处理中…' : action.name }}</template>
        <template #error><p>{{ status }}</p><ScqCheckbox v-model="fail">模拟失败</ScqCheckbox></template>
        <ScqButton @click="cancel">取消本次等待</ScqButton>
      </ScqActionSheet>
    </PhonePreview>
  </ExampleSection>
</template>
