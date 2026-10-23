<template>
  <div ref="rootRef" v-bind="field.rootAttrs.value" class="scq-tree-select" @focusout="field.touch($event)">
    <Popover v-model="opened" :disabled="isDisabled || readonly" :teleport="teleport" :width="width" :initial-focus="keyboardOpening ? initialFocus : undefined" placement="bottom-start" :aria-label="ariaLabel || text('choose')">
      <template #reference><span class="scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]"><button ref="triggerRef" type="button" class="scq-field__trigger" :disabled="isDisabled || readonly" aria-haspopup="tree" :aria-expanded="opened" :aria-controls="opened ? treeId : undefined" :aria-label="ariaLabel || (field.hasField ? undefined : placeholder || text('choose'))" v-bind="field.attrs.value" @keydown="triggerKeydown"><span class="scq-field__value" :class="{ 'scq-field__placeholder': !labels.length }">{{ labels.join(', ') || placeholder || text('choose') }}</span><Icon name="chevronDown" :size="TREE_SELECT_DEFAULTS.toggleSize" /></button><button v-if="clearable && keys.length && !isDisabled && !readonly" type="button" class="scq-field__clear" :aria-label="text('clear')" @click.stop="clear"><Icon name="close" :size="TREE_SELECT_DEFAULTS.clearSize" /></button></span></template>
      <div ref="panelRef" tabindex="-1" @focusout="field.touch($event)">
        <input v-if="filterable" ref="filterRef" v-model="query" class="scq-tree-select__filter" type="search" :placeholder="text('search')" :aria-label="text('search')" :aria-controls="treeId" :disabled="isDisabled || readonly" @keydown="filterKeydown" />
        <div class="scq-tree-select__options" :class="{ 'scq-tree-select__options--virtual': virtual }"><Tree :id="treeId" ref="treeRef" :data="data" :model-value="multiple ? undefined : (keys[0] ?? null)" :checked-keys="multiple ? keys : []" :show-checkbox="multiple" :check-strictly="checkStrictly" :default-expand-all="defaultExpandAll" :expanded-keys="expandedKeys" :default-expanded-keys="defaultExpandedKeys" :filter="filterable ? query : ''" :filter-node-method="filterNodeMethod" :load="load" :disabled="isDisabled || readonly" :virtual="virtual" :height="height" :item-height="itemHeight" :overscan="overscan" :aria-label="ariaLabel || text('choose')" @node-click="select" @update:checked-keys="check" @update:expanded-keys="emit('update:expandedKeys', $event)" @check="(state, node) => emit('check', state, node)" @expand="(node, expanded) => emit('expand', node, expanded)" @load="loaded" @error="loadError"><template #default="slotProps"><slot v-bind="slotProps">{{ slotProps.node.label }}</slot></template><template #empty><slot name="empty">{{ text('empty') }}</slot></template></Tree></div>
      </div>
    </Popover>
    <template v-if="name"><input v-for="key in keys" :key="key" type="hidden" :name="multiple ? `${name}[]` : name" :value="key" :disabled="isDisabled" /></template>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Tree from '../Tree/Tree.vue'
import type { TreeKey, TreeNode, TreeCheck, TreeExpose } from '../Tree/types'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import { useComponentId } from '../../utils/id'
import { VIRTUAL_LIST_DEFAULTS } from '../VirtualList/constants'
import { getVirtualKeyIndex } from '../VirtualList/keys'
import { TREE_SELECT_DEFAULTS } from './constants'
import type { TreeSelectExpose, TreeSelectSlots, TreeSelectValue } from './types'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { isTreeBranch } from '../Tree/branch'

export type { TreeSelectValue } from './types'
defineOptions({ name: 'TreeSelect', inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue?: TreeSelectValue | readonly TreeKey[]; data?: TreeNode[]; multiple?: boolean; checkStrictly?: boolean; leafOnly?: boolean; filterable?: boolean; defaultExpandAll?: boolean; expandedKeys?: TreeKey[]; defaultExpandedKeys?: TreeKey[]; filterNodeMethod?: (query: string, node: TreeNode) => boolean; load?: (node: TreeNode, signal: AbortSignal) => Promise<TreeNode[]>; disabled?: boolean; readonly?: boolean; clearable?: boolean; placeholder?: string; size?: ComponentSize; ariaLabel?: string; id?: string; name?: string; width?: string | number; teleport?: boolean | string; virtual?: boolean; height?: number | string; itemHeight?: number; overscan?: number }>(), { data: () => [], multiple: false, checkStrictly: false, leafOnly: false, filterable: false, defaultExpandAll: false, disabled: undefined, readonly: false, clearable: true, placeholder: '', ariaLabel: '', id: '', name: '', width: TREE_SELECT_DEFAULTS.width, teleport: true, virtual: false, ...VIRTUAL_LIST_DEFAULTS })
defineSlots<TreeSelectSlots>()
const emit = defineEmits<{
  (event: 'update:modelValue' | 'change', value: TreeSelectValue): void
  (event: 'clear'): void
  (event: 'update:expandedKeys', value: TreeKey[]): void
  (event: 'check', state: TreeCheck, node: TreeNode): void
  (event: 'expand', node: TreeNode, expanded: boolean): void
  (event: 'load', node: TreeNode, children: TreeNode[]): void
  (event: 'error', error: unknown, node: TreeNode): void
}>()
const config = useConfig()
const text = useLocale()
const instance = getCurrentInstance()
const rootRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const triggerRef = ref<HTMLButtonElement>()
const filterRef = ref<HTMLInputElement>()
const treeRef = ref<TreeExpose>()
const treeId = useComponentId('scq-tree-select-tree')
const field = useFormControl({ element: () => triggerRef.value, id: () => props.id, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, composite: true, contains: (target) => Boolean(rootRef.value?.contains(target) || panelRef.value?.contains(target)) })
const isDisabled = field.disabled
const internal = ref<TreeSelectValue>(props.multiple ? [] : null)
const value = computed(() => props.modelValue !== undefined ? props.modelValue : internal.value)
const boundKeys = computed(() => {
  const current = value.value
  return [...new Set(typeof current === 'object' && current !== null ? current : current === null ? [] : [current])]
})
const keys = computed(() => props.multiple ? boundKeys.value : boundKeys.value.slice(0, 1))
const loadedNodes = ref(new Map<TreeKey, TreeNode>())
const nodes = computed(() => {
  const result = new Map(loadedNodes.value)
  const flattened: TreeNode[] = []
  const walk = (entries: TreeNode[]) => entries.forEach((entry) => { flattened.push(entry); result.set(entry.key, entry); if (entry.children) walk(entry.children) })
  walk(props.data)
  getVirtualKeyIndex(flattened, (node) => node.key, 'TreeSelect')
  return result
})
const selectedLabels = ref(new Map<TreeKey, string>())
watch([boundKeys, nodes], ([selectedKeys, entries]) => {
  const labels = new Map<TreeKey, string>()
  for (const key of selectedKeys) {
    const label = entries.get(key)?.label ?? selectedLabels.value.get(key)
    if (label !== undefined) labels.set(key, label)
  }
  selectedLabels.value = labels
}, { immediate: true })
const labels = computed(() => keys.value.map((key) => nodes.value.get(key)?.label ?? selectedLabels.value.get(key) ?? String(key)))
const opened = ref(false)
const query = ref('')
const keyboardOpening = ref(false)
let disposed = false
const focusTree = async () => {
  if (disposed || isDisabled.value || props.readonly || !opened.value) return
  const tree = treeRef.value
  const selectedKey = keys.value[0]
  const focused = selectedKey !== undefined && await tree?.focusKey(selectedKey)
  if (disposed || !opened.value || isDisabled.value || props.readonly || treeRef.value !== tree) return
  if (!focused) tree?.focus()
  if (panelRef.value?.contains(panelRef.value.ownerDocument.activeElement)) keyboardOpening.value = false
}
const initialFocus = () => {
  keyboardOpening.value = false
  void nextTick(focusTree)
  return panelRef.value ?? null
}
const openTree = async () => {
  if (disposed || isDisabled.value || props.readonly) return
  const wasOpen = opened.value
  keyboardOpening.value = true
  opened.value = true
  await nextTick()
  if (wasOpen) await focusTree()
}
const ownsKey = (event: KeyboardEvent) => !disposed && !isDisabled.value && !props.readonly && !event.defaultPrevented
  && !event.isComposing && event.keyCode !== COMPOSITION_KEY_CODE && !event.ctrlKey && !event.metaKey && !event.altKey
const triggerKeydown = (event: KeyboardEvent) => {
  if (!ownsKey(event) || !['ArrowDown', 'Enter', ' '].includes(event.key)) return
  event.preventDefault()
  if (opened.value && event.key !== 'ArrowDown') opened.value = false
  else void openTree()
}
const filterKeydown = (event: KeyboardEvent) => {
  if (!ownsKey(event)) return
  if (event.key === 'Enter') event.preventDefault()
  else if (event.key === 'ArrowDown' && !event.shiftKey) { event.preventDefault(); void focusTree() }
}
const update = (next: TreeSelectValue) => {
  if (disposed || isDisabled.value || props.readonly) return
  internal.value = next
  emit('update:modelValue', next)
  if (disposed) return
  emit('change', next)
}
const select = (node: TreeNode) => {
  if (disposed || !opened.value || isDisabled.value || props.readonly || node.disabled) return
  const resolved = loadedNodes.value.get(node.key) ?? node
  if (props.multiple || (props.leafOnly && isTreeBranch(resolved, Boolean(props.load)))) return
  update(node.key)
  opened.value = false
  triggerRef.value?.focus()
}
const check = (checked: TreeKey[]) => { if (opened.value && props.multiple) update(checked) }
const clear = () => { if (disposed || isDisabled.value || props.readonly) return; update(props.multiple ? [] : null); if (disposed) return; emit('clear'); field.focus() }
const loaded = (node: TreeNode, children: TreeNode[]) => {
  if (disposed) return
  loadedNodes.value.set(node.key, { ...node, children })
  const walk = (entries: TreeNode[]) => entries.forEach((entry) => { loadedNodes.value.set(entry.key, entry); if (entry.children) walk(entry.children) })
  walk(children)
  emit('load', node, children)
}
const loadError = (error: unknown, node: TreeNode) => {
  if (disposed) return
  emit('error', error, node)
  if (!instance?.vnode.props?.onError) console.error('[scq-vue] TreeSelect node loading failed', error)
}
watch(() => props.data, () => loadedNodes.value.clear())
watch(opened, (value) => { query.value = ''; if (!value) keyboardOpening.value = false })
watch(() => props.filterable, async () => {
  const previous = filterRef.value
  const focused = previous?.ownerDocument.activeElement === previous
  query.value = ''
  await nextTick()
  if (focused && previous && previous.ownerDocument.activeElement === previous.ownerDocument.body) await focusTree()
})
watch([isDisabled, () => props.readonly], () => { opened.value = false })
onBeforeUnmount(() => { disposed = true })
defineExpose<TreeSelectExpose>({ focus: field.focus, clear, scrollToKey: (key, options) => treeRef.value?.scrollToKey(key, options) })
</script>