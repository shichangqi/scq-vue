<script setup lang="ts">
import { reactive, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqForm from '../../../../src/components/Form'
import ScqFormItem from '../../../../src/components/FormItem'
import ScqTransfer from '../../../../src/components/Transfer'
import { VIRTUAL_LIST_DEFAULTS } from '../../../../src/components/VirtualList'
import type { TransferExpose, TransferItem, TransferKey, TransferSide } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const SETTINGS = { perPane: 10_000, height: 440, itemHeight: VIRTUAL_LIST_DEFAULTS.itemHeight, overscan: VIRTUAL_LIST_DEFAULTS.overscan, disabledEvery: 97 }
const COPY = {
  title: '双侧虚拟穿梭框', available: '候选成员', selected: '已选成员', member: '成员',
  disable: '禁用整个表单', jumpLeft: '聚焦左侧末项', jumpRight: '聚焦右侧末项', clearLeft: '仅清空左侧搜索',
  visible: '筛选后条目', checked: '已勾选', total: '目标集合', moved: '本次移动', none: '尚未移动',
  hint: '初始每侧各一万条；搜索只影响当前面板的可见集合。勾选跨过滤保留，移动时包含已勾选的隐藏可用项，禁用项不会被移动。',
}
const data: TransferItem[] = Array.from({ length: SETTINGS.perPane * 2 }, (_, index) => ({
  key: `member-${index}`, label: `${COPY.member} ${index}`, disabled: index % SETTINGS.disabledEvery === 0,
}))
const titles: [string, string] = [COPY.available, COPY.selected]
const form = reactive<{ members: TransferKey[] }>({ members: data.slice(SETTINGS.perPane).map((item) => item.key) })
const blocked = ref(false)
const transfer = ref<TransferExpose>()
const lastMove = ref(COPY.none)
const recordMove = (_value: TransferKey[], direction: TransferSide, keys: TransferKey[]) => {
  lastMove.value = `${direction === 'right' ? COPY.selected : COPY.available}: ${keys.length}`
}
</script>

<template>
  <ExampleSection class="transfer-virtual-example" :title="COPY.title" subtitle="Virtual transfer">
    <template #controls><ScqCheckbox v-model="blocked">{{ COPY.disable }}</ScqCheckbox></template>
    <div class="transfer-virtual-example__tools">
      <ScqButton :disabled="blocked" @click="transfer?.focusKey(data[SETTINGS.perPane - 1].key, 'left')">{{ COPY.jumpLeft }}</ScqButton>
      <ScqButton :disabled="blocked" @click="transfer?.focusKey(data[data.length - 1].key, 'right')">{{ COPY.jumpRight }}</ScqButton>
      <ScqButton :disabled="blocked" @click="transfer?.clearQuery('left')">{{ COPY.clearLeft }}</ScqButton>
    </div>
    <ScqForm :model="form" :disabled="blocked" label-position="top">
      <ScqFormItem prop="members" :label="COPY.title" :help="COPY.hint">
        <ScqTransfer
          ref="transfer"
          v-model="form.members"
          :data="data"
          :titles="titles"
          :height="SETTINGS.height"
          :item-height="SETTINGS.itemHeight"
          :overscan="SETTINGS.overscan"
          virtual
          filterable
          @change="recordMove"
        >
          <template #default="{ item }"><span class="transfer-virtual-example__label" :title="item.label">{{ item.label }}</span></template>
          <template #empty="{ side }">{{ side === 'left' ? '候选' : '已选' }}面板没有匹配成员。</template>
          <template #left-footer="{ items, checkedKeys }">{{ COPY.visible }}: {{ items.length }} · {{ COPY.checked }}: {{ checkedKeys.length }}</template>
          <template #right-footer="{ items, checkedKeys }">{{ COPY.visible }}: {{ items.length }} · {{ COPY.checked }}: {{ checkedKeys.length }}</template>
        </ScqTransfer>
      </ScqFormItem>
    </ScqForm>
    <output>{{ COPY.total }}: {{ form.members.length }} · {{ COPY.moved }}: {{ lastMove }}</output>
  </ExampleSection>
</template>

<style scoped>
.transfer-virtual-example__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--example-space-md); }
.transfer-virtual-example__label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.transfer-virtual-example :deep(.scq-transfer) { width: 100%; }
.transfer-virtual-example output { color: var(--scq-muted); font-size: 13px; }
</style>
