<script setup lang="ts">
import { reactive, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqInput from '../../../../src/components/Input'
import ScqForm from '../../../../src/components/Form'
import ScqFormItem from '../../../../src/components/FormItem'
import ScqTree from '../../../../src/components/Tree'
import ScqTreeSelect from '../../../../src/components/TreeSelect'
import { VIRTUAL_LIST_DEFAULTS } from '../../../../src/components/VirtualList'
import type { TreeExpose, TreeKey, TreeNode } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const SETTINGS = { count: 10_000, groupSize: 100, height: 440, itemHeight: VIRTUAL_LIST_DEFAULTS.itemHeight, overscan: VIRTUAL_LIST_DEFAULTS.overscan, targetIndex: 5_001 }
const COPY = {
  tree: '一万个树节点', picker: '同源树形选择', filter: '过滤树节点', disable: '禁用整个表单',
  jump: '聚焦中间节点', group: '分组', member: '成员', selected: '当前节点', checked: '已勾选', none: '未选择',
  hint: '虚拟化只减少 DOM，勾选联动仍基于完整树。按方向键、Home / End 导航；滚动不会卸载键盘活动节点。',
  pickerHint: 'TreeSelect 复用同一棵虚拟树，过滤不会丢失已选标签。默认不启用虚拟化。',
}
const data: TreeNode[] = Array.from({ length: SETTINGS.count / SETTINGS.groupSize }, (_, group) => ({
  key: `group-${group}`,
  label: `${COPY.group} ${group}`,
  children: Array.from({ length: SETTINGS.groupSize - 1 }, (_, child) => {
    const index = group * SETTINGS.groupSize + child + 1
    return { key: `node-${index}`, label: `${COPY.member} ${index}`, isLeaf: true }
  }),
}))
const targetKey = `node-${SETTINGS.targetIndex}`
const form = reactive<{ selected: TreeKey | null; checked: TreeKey[]; picked: TreeKey | null }>({ selected: null, checked: [], picked: targetKey })
const query = ref('')
const blocked = ref(false)
const tree = ref<TreeExpose>()
</script>

<template>
  <ExampleSection class="tree-virtual-example" :title="COPY.tree" subtitle="Virtual tree &amp; tree select">
    <template #controls><ScqCheckbox v-model="blocked">{{ COPY.disable }}</ScqCheckbox></template>
    <div class="tree-virtual-example__tools">
      <ScqInput v-model="query" type="search" :aria-label="COPY.filter" :placeholder="COPY.filter" clearable />
      <ScqButton :disabled="blocked" @click="tree?.focusKey(targetKey)">{{ COPY.jump }}</ScqButton>
    </div>
    <ScqForm :model="form" :disabled="blocked" label-position="top">
      <ScqFormItem prop="selected" :label="COPY.tree" :help="COPY.hint">
        <ScqTree
          ref="tree"
          v-model="form.selected"
          v-model:checked-keys="form.checked"
          :data="data"
          :filter="query"
          :height="SETTINGS.height"
          :item-height="SETTINGS.itemHeight"
          :overscan="SETTINGS.overscan"
          virtual
          show-checkbox
          default-expand-all
        >
          <template #default="{ node }"><span :title="node.label">{{ node.label }}</span></template>
        </ScqTree>
      </ScqFormItem>
      <ScqFormItem prop="picked" :label="COPY.picker" :help="COPY.pickerHint">
        <ScqTreeSelect
          v-model="form.picked"
          :data="data"
          :height="SETTINGS.height"
          :item-height="SETTINGS.itemHeight"
          :overscan="SETTINGS.overscan"
          virtual
          filterable
          default-expand-all
        />
      </ScqFormItem>
    </ScqForm>
    <output>{{ COPY.checked }}: {{ form.checked.length }} · {{ COPY.selected }}: {{ form.selected ?? COPY.none }}</output>
  </ExampleSection>
</template>

<style scoped>
.tree-virtual-example__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--example-space-md); }
.tree-virtual-example__tools > .scq-input { flex: 1; }
.tree-virtual-example :deep(.scq-tree) { width: 100%; }
.tree-virtual-example output { color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
</style>
