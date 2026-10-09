<template>
  <div class="scq-tree-select">
    <Popover v-model="opened" :disabled="isDisabled || readonly" :teleport="teleport" :width="width" placement="bottom-start" :aria-label="ariaLabel || text('choose')">
      <template #reference><span class="scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]"><button :id="id || undefined" ref="triggerRef" type="button" class="scq-field__trigger" :disabled="isDisabled || readonly" aria-haspopup="tree" :aria-expanded="opened" :aria-label="ariaLabel || placeholder || text('choose')" @keydown.down.prevent="opened = true"><span class="scq-field__value" :class="{ 'scq-field__placeholder': !labels.length }">{{ labels.join(', ') || placeholder || text('choose') }}</span><Icon name="chevronDown" :size="16" /></button><button v-if="clearable && keys.length && !isDisabled && !readonly" type="button" class="scq-field__clear" :aria-label="text('clear')" @click.stop="clear"><Icon name="close" :size="14" /></button></span></template>
      <input v-if="filterable" v-model="query" class="scq-tree-select__filter" type="search" :placeholder="text('search')" :aria-label="text('search')" />
      <div class="scq-tree-select__options"><Tree :data="data" :model-value="multiple ? undefined : (value as TreeKey | null)" :checked-keys="multiple ? keys : []" :show-checkbox="multiple" :check-strictly="checkStrictly" :default-expand-all="defaultExpandAll" :filter="query" :load="load" :aria-label="ariaLabel || text('choose')" @node-click="select" @update:checked-keys="check" @load="loaded" @error="(error, node) => emit('error', error, node)"><template #default="slotProps"><slot :node="slotProps.node">{{ slotProps.node.label }}</slot></template></Tree></div>
    </Popover>
    <template v-if="name"><input v-for="key in keys" :key="key" type="hidden" :name="multiple ? `${name}[]` : name" :value="key" :disabled="isDisabled" /></template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Tree from '../Tree/Tree.vue'
import type { TreeKey, TreeNode } from '../Tree/types'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'

export type TreeSelectValue = TreeKey | TreeKey[] | null
defineOptions({ name: 'TreeSelect' })
const props = withDefaults(defineProps<{ modelValue?: TreeSelectValue; data?: TreeNode[]; multiple?: boolean; checkStrictly?: boolean; leafOnly?: boolean; filterable?: boolean; defaultExpandAll?: boolean; load?: (node: TreeNode, signal: AbortSignal) => Promise<TreeNode[]>; disabled?: boolean; readonly?: boolean; clearable?: boolean; placeholder?: string; size?: ComponentSize; ariaLabel?: string; id?: string; name?: string; width?: string | number; teleport?: boolean | string }>(), { data: () => [], multiple: false, checkStrictly: false, leafOnly: false, filterable: false, defaultExpandAll: false, disabled: undefined, readonly: false, clearable: true, placeholder: '', ariaLabel: '', id: '', name: '', width: 'min(320px, calc(100vw - 24px))', teleport: true })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change', value: TreeSelectValue): void
  (event: 'clear'): void
  (event: 'error', error: unknown, node: TreeNode): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref<TreeSelectValue>(props.multiple ? [] : null)
const value = computed(() => props.modelValue !== undefined ? props.modelValue : internal.value)
const keys = computed(() => Array.isArray(value.value) ? value.value : value.value === null ? [] : [value.value])
const loadedNodes = ref(new Map<TreeKey, TreeNode>())
const nodes = computed(() => {
  const result = new Map(loadedNodes.value)
  const walk = (entries: TreeNode[]) => entries.forEach((entry) => { result.set(entry.key, entry); if (entry.children) walk(entry.children) })
  walk(props.data)
  return result
})
const labels = computed(() => keys.value.map((key) => nodes.value.get(key)?.label ?? String(key)))
const opened = ref(false)
const query = ref('')
const triggerRef = ref<HTMLButtonElement>()
const update = (next: TreeSelectValue) => {
  if (isDisabled.value || props.readonly) return
  internal.value = next
  emit('update:modelValue', next)
  emit('change', next)
}
const select = (node: TreeNode) => {
  const resolved = loadedNodes.value.get(node.key) ?? node
  if (props.multiple || (props.leafOnly && (resolved.children?.length || (props.load && !resolved.isLeaf && !loadedNodes.value.has(node.key))))) return
  update(node.key)
  opened.value = false
  triggerRef.value?.focus()
}
const check = (checked: TreeKey[]) => { if (props.multiple) update(checked) }
const clear = () => { update(props.multiple ? [] : null); emit('clear') }
const loaded = (node: TreeNode, children: TreeNode[]) => {
  loadedNodes.value.set(node.key, { ...node, children })
  const walk = (entries: TreeNode[]) => entries.forEach((entry) => { loadedNodes.value.set(entry.key, entry); if (entry.children) walk(entry.children) })
  walk(children)
}
watch(() => props.data, () => loadedNodes.value.clear())
watch(opened, (value) => { if (!value) query.value = '' })
watch([isDisabled, () => props.readonly], () => { opened.value = false })
defineExpose({ focus: () => triggerRef.value?.focus(), clear })
</script>