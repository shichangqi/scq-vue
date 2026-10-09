<template>
  <ul ref="rootRef" class="scq-tree" role="tree" :aria-label="ariaLabel || text('tree')" :aria-multiselectable="showCheckbox || undefined">
    <li v-for="(entry, index) in visible" :key="entry.node.key" role="treeitem" :data-tree-index="index" :aria-level="entry.level + 1" :aria-setsize="entry.size" :aria-posinset="entry.position" :aria-expanded="isBranch(entry.node) ? isExpanded(entry.node.key) : undefined" :aria-selected="selected === entry.node.key" :aria-disabled="entry.disabled" :aria-checked="showCheckbox ? (checkedState.half.has(entry.node.key) ? 'mixed' : checkedState.checked.has(entry.node.key)) : undefined" :tabindex="!isDisabled && !entry.disabled && focusIndex === index ? 0 : -1" :class="{ 'is-selected': selected === entry.node.key, 'is-disabled': entry.disabled }" :style="{ paddingLeft: `${entry.level * indent + 4}px` }" @click="select(entry)" @focus="focused = entry.node.key" @keydown="keydown($event, entry, index)">
      <button v-if="isBranch(entry.node)" type="button" class="scq-tree__toggle" tabindex="-1" :disabled="isDisabled || entry.disabled || loading.has(entry.node.key)" :aria-label="`${text(isExpanded(entry.node.key) ? 'collapse' : 'expand')} ${entry.node.label}`" @click.stop="toggle(entry.node)"><Loading v-if="loading.has(entry.node.key)" :size="14" /><Icon v-else :name="isExpanded(entry.node.key) ? 'chevronDown' : 'chevronRight'" :size="16" /></button><span v-else class="scq-tree__toggle" />
      <input v-if="showCheckbox" type="checkbox" tabindex="-1" :aria-label="entry.node.label" :checked="checkedState.checked.has(entry.node.key)" :indeterminate="checkedState.half.has(entry.node.key)" :disabled="isDisabled || entry.disabled" @click.stop @change="check(entry, ($event.target as HTMLInputElement).checked)" />
      <span class="scq-tree__label"><slot :node="entry.node" :expanded="isExpanded(entry.node.key)" :checked="checkedState.checked.has(entry.node.key)">{{ entry.node.label }}</slot></span>
    </li>
    <li v-if="!visible.length" class="scq-tree__empty" role="presentation"><slot name="empty">{{ emptyText || text('empty') }}</slot></li>
  </ul>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import type { TreeKey, TreeNode, TreeCheck } from './types'

export interface TreeEntry { node: TreeNode; level: number; parent?: TreeKey; ancestors: TreeKey[]; disabled: boolean; size: number; position: number }
defineOptions({ name: 'Tree' })
const props = withDefaults(defineProps<{ data?: TreeNode[]; modelValue?: TreeKey | null; checkedKeys?: TreeKey[]; expandedKeys?: TreeKey[]; defaultExpandedKeys?: TreeKey[]; defaultExpandAll?: boolean; showCheckbox?: boolean; checkStrictly?: boolean; disabled?: boolean; filter?: string; filterNodeMethod?: (query: string, node: TreeNode) => boolean; load?: (node: TreeNode, signal: AbortSignal) => Promise<TreeNode[]>; indent?: number; expandOnClickNode?: boolean; ariaLabel?: string; emptyText?: string }>(), { data: () => [], defaultExpandedKeys: () => [], defaultExpandAll: false, showCheckbox: false, checkStrictly: false, disabled: undefined, filter: '', indent: 20, expandOnClickNode: false, ariaLabel: '', emptyText: '' })
const emit = defineEmits<{
  (event: 'update:modelValue', value: TreeKey): void
  (event: 'update:checkedKeys' | 'update:expandedKeys', value: TreeKey[]): void
  (event: 'node-click', node: TreeNode): void
  (event: 'check', value: TreeCheck, node: TreeNode): void
  (event: 'expand', node: TreeNode, expanded: boolean): void
  (event: 'load', node: TreeNode, children: TreeNode[]): void
  (event: 'error', error: unknown, node: TreeNode): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const rootRef = ref<HTMLElement>()
const internalSelected = ref<TreeKey | null>(null)
const selected = computed(() => props.modelValue !== undefined ? props.modelValue : internalSelected.value)
const internalChecked = ref<TreeKey[]>([])
const internalExpanded = ref<TreeKey[]>([...props.defaultExpandedKeys])
const expanded = computed(() => new Set(props.expandedKeys ?? internalExpanded.value))
const cache = ref(new Map<TreeKey, TreeNode[]>())
const loading = ref(new Set<TreeKey>())
const focused = ref<TreeKey>()
const controllers = new Map<TreeKey, AbortController>()
const children = (node: TreeNode) => cache.value.get(node.key) ?? node.children ?? []
const isBranch = (node: TreeNode) => children(node).length > 0 || Boolean(props.load && !node.isLeaf && !cache.value.has(node.key) && !node.children)
const all = computed(() => {
  const result: TreeEntry[] = []
  const walk = (nodes: TreeNode[], level: number, ancestors: TreeKey[], disabled: boolean) => {
    for (const [index, node] of nodes.entries()) {
      const entry: TreeEntry = { node, level, ancestors, parent: ancestors[ancestors.length - 1], disabled: disabled || Boolean(node.disabled), size: nodes.length, position: index + 1 }
      result.push(entry)
      walk(children(node), level + 1, [...ancestors, node.key], entry.disabled)
    }
  }
  walk(props.data, 0, [], false)
  return result
})
if (props.defaultExpandAll) internalExpanded.value = all.value.filter((entry) => isBranch(entry.node)).map((entry) => entry.node.key)
const matched = computed(() => {
  if (!props.filter) return undefined
  const keys = new Set<TreeKey>()
  for (const entry of all.value) if (props.filterNodeMethod ? props.filterNodeMethod(props.filter, entry.node) : entry.node.label.toLocaleLowerCase().includes(props.filter.toLocaleLowerCase())) {
    keys.add(entry.node.key)
    entry.ancestors.forEach((key) => keys.add(key))
  }
  return keys
})
const isExpanded = (key: TreeKey) => Boolean(matched.value?.has(key)) || expanded.value.has(key)
const visible = computed(() => all.value.filter((entry) => (!matched.value || matched.value.has(entry.node.key)) && entry.ancestors.every(isExpanded)))
const focusIndex = computed(() => {
  const index = visible.value.findIndex((entry) => entry.node.key === focused.value && !entry.disabled)
  return index >= 0 ? index : visible.value.findIndex((entry) => !entry.disabled)
})
const calculate = (keys: TreeKey[]) => {
  const checked = new Set(keys)
  const half = new Set<TreeKey>()
  if (props.checkStrictly) return { checked, half }
  const walk = (node: TreeNode, inherited = false, disabled = false) => {
    const blocked = disabled || Boolean(node.disabled)
    if (inherited && !blocked) checked.add(node.key)
    for (const child of children(node)) walk(child, checked.has(node.key) && !blocked, blocked)
    if (blocked) return
    const eligible = children(node).filter((child) => !child.disabled)
    if (eligible.length) {
      if (eligible.every((child) => checked.has(child.key))) checked.add(node.key)
      else { checked.delete(node.key); if (eligible.some((child) => checked.has(child.key) || half.has(child.key))) half.add(node.key) }
    }
  }
  props.data.forEach((node) => walk(node))
  return { checked, half }
}
const checkedState = computed(() => calculate(props.checkedKeys ?? internalChecked.value))
const getChecked = (): TreeCheck => ({ checkedKeys: [...checkedState.value.checked], halfCheckedKeys: [...checkedState.value.half], checkedNodes: all.value.filter((entry) => checkedState.value.checked.has(entry.node.key)).map((entry) => entry.node) })
const check = (entry: TreeEntry, value: boolean) => {
  if (isDisabled.value || entry.disabled) return
  const keys = new Set(checkedState.value.checked)
  const candidates = props.checkStrictly ? [entry] : all.value.filter((item) => item.node.key === entry.node.key || item.ancestors.includes(entry.node.key))
  for (const item of candidates) if (!item.disabled) { if (value) keys.add(item.node.key); else keys.delete(item.node.key) }
  if (!props.checkStrictly && !value) entry.ancestors.forEach((key) => keys.delete(key))
  const result = calculate([...keys])
  const checkedKeys = [...result.checked]
  internalChecked.value = checkedKeys
  emit('update:checkedKeys', checkedKeys)
  emit('check', { checkedKeys, halfCheckedKeys: [...result.half], checkedNodes: all.value.filter((item) => result.checked.has(item.node.key)).map((item) => item.node) }, entry.node)
}
const toggle = async (node: TreeNode) => {
  if (isDisabled.value || node.disabled || !isBranch(node) || loading.value.has(node.key)) return
  const opened = expanded.value.has(node.key)
  if (!opened && props.load && !node.children && !cache.value.has(node.key)) {
    const controller = new AbortController()
    controllers.set(node.key, controller)
    loading.value.add(node.key)
    try {
      const result = await props.load(node, controller.signal)
      if (controller.signal.aborted) return
      cache.value.set(node.key, result)
      emit('load', node, result)
    } catch (error) { if (!controller.signal.aborted) emit('error', error, node); return }
    finally { if (controllers.get(node.key) === controller) { controllers.delete(node.key); loading.value.delete(node.key) } }
  }
  const next = new Set(expanded.value)
  if (opened) next.delete(node.key)
  else next.add(node.key)
  internalExpanded.value = [...next]
  emit('update:expandedKeys', [...next])
  emit('expand', node, !opened)
}
const select = (entry: TreeEntry) => {
  if (isDisabled.value || entry.disabled) return
  internalSelected.value = entry.node.key
  focused.value = entry.node.key
  emit('update:modelValue', entry.node.key)
  emit('node-click', entry.node)
  if (props.expandOnClickNode) void toggle(entry.node)
}
const keydown = async (event: KeyboardEvent, entry: TreeEntry, index: number) => {
  if (isDisabled.value || entry.disabled) return
  let target = index
  if (event.key === 'ArrowDown') target = visible.value.findIndex((item, position) => position > index && !item.disabled)
  else if (event.key === 'ArrowUp') { target = index - 1; while (target >= 0 && visible.value[target].disabled) target -= 1 }
  else if (event.key === 'Home') target = visible.value.findIndex((item) => !item.disabled)
  else if (event.key === 'End') { target = visible.value.length - 1; while (target >= 0 && visible.value[target].disabled) target -= 1 }
  else if (event.key === 'ArrowRight') { if (!isExpanded(entry.node.key)) await toggle(entry.node); else target = visible.value.findIndex((item) => item.parent === entry.node.key && !item.disabled) }
  else if (event.key === 'ArrowLeft') { if (isExpanded(entry.node.key)) await toggle(entry.node); else target = visible.value.findIndex((item) => item.node.key === entry.parent) }
  else if (event.key === ' ') { if (props.showCheckbox) check(entry, !checkedState.value.checked.has(entry.node.key)); else select(entry) }
  else if (event.key === 'Enter') select(entry)
  else return
  event.preventDefault()
  if (target >= 0 && visible.value[target]) {
    focused.value = visible.value[target].node.key
    await nextTick()
    rootRef.value?.querySelector<HTMLElement>(`[data-tree-index="${target}"]`)?.focus()
  }
}
watch(() => props.data, () => { controllers.forEach((controller) => controller.abort()); controllers.clear(); loading.value.clear(); cache.value.clear() })
onBeforeUnmount(() => { controllers.forEach((controller) => controller.abort()); controllers.clear() })
defineExpose({ getChecked, getNode: (key: TreeKey) => all.value.find((entry) => entry.node.key === key)?.node, setCheckedKeys: (keys: TreeKey[]) => { const result = [...calculate(keys).checked]; internalChecked.value = result; emit('update:checkedKeys', result) } })
</script>