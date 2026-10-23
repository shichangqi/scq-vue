<template>
  <component :is="virtual ? 'div' : 'ul'" ref="rootRef" class="scq-tree" :class="{ 'scq-tree--virtual': virtual }" role="tree" :aria-label="ariaLabel || (field.hasField ? undefined : text('tree'))" :aria-multiselectable="showCheckbox || undefined" :aria-disabled="isDisabled || undefined" :aria-busy="loading.size > 0 || undefined" :tabindex="!isDisabled && focusIndex < 0 ? 0 : -1" v-bind="{ ...field.rootAttrs.value, ...field.attrs.value }" @focusout="field.touch($event)">
    <VirtualList v-if="virtual" ref="virtualRef" :items="visible" :item-key="entryKey" :height="height" :item-height="itemHeight" :overscan="overscan" :active-index="focusIndex" preserve-scroll-position role="presentation" item-role="presentation" :tabindex="-1">
      <template #default="{ item: entry, index }">
        <TreeRow v-bind="rowBindings(entry, index)" @select="select(entry)" @toggle="toggle(entry.node)" @check="check(entry, $event)" @focus="focused = entry.node.key" @keydown="keydown($event, entry, index)"><template #default="slotProps"><slot v-bind="slotProps">{{ slotProps.node.label }}</slot></template></TreeRow>
      </template>
      <template #empty><slot name="empty">{{ emptyText || text('empty') }}</slot></template>
    </VirtualList>
    <template v-else>
      <TreeRow v-for="(entry, index) in visible" :key="entry.node.key" v-bind="rowBindings(entry, index)" @select="select(entry)" @toggle="toggle(entry.node)" @check="check(entry, $event)" @focus="focused = entry.node.key" @keydown="keydown($event, entry, index)"><template #default="slotProps"><slot v-bind="slotProps">{{ slotProps.node.label }}</slot></template></TreeRow>
      <li v-if="!visible.length" class="scq-tree__empty" role="presentation"><slot name="empty">{{ emptyText || text('empty') }}</slot></li>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import VirtualList from '../VirtualList/VirtualList.vue'
import { VIRTUAL_LIST_DEFAULTS } from '../VirtualList/constants'
import { getVirtualKeyIndex } from '../VirtualList/keys'
import type { VirtualListExpose, VirtualListScrollOptions } from '../VirtualList/types'
import TreeRow from './TreeRow.vue'
import { TREE_DEFAULTS, TREE_NAVIGATION_KEYS } from './constants'
import { isTreeBranch } from './branch'
import type { TreeKey, TreeNode, TreeCheck, TreeEntry, TreeExpose, TreeSlots } from './types'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { EDITABLE_TARGET_SELECTOR } from '../../utils/focus'

export type { TreeEntry } from './types'
defineOptions({ name: 'Tree', inheritAttrs: false })
const props = withDefaults(defineProps<{ data?: TreeNode[]; modelValue?: TreeKey | null; checkedKeys?: TreeKey[]; expandedKeys?: TreeKey[]; defaultExpandedKeys?: TreeKey[]; defaultExpandAll?: boolean; showCheckbox?: boolean; checkStrictly?: boolean; disabled?: boolean; filter?: string; filterNodeMethod?: (query: string, node: TreeNode) => boolean; load?: (node: TreeNode, signal: AbortSignal) => Promise<TreeNode[]>; indent?: number; expandOnClickNode?: boolean; ariaLabel?: string; emptyText?: string; id?: string; virtual?: boolean; height?: number | string; itemHeight?: number; overscan?: number }>(), { data: () => [], defaultExpandedKeys: () => [], defaultExpandAll: false, showCheckbox: false, checkStrictly: false, disabled: undefined, filter: '', indent: TREE_DEFAULTS.indent, expandOnClickNode: false, ariaLabel: '', emptyText: '', id: '', virtual: false, ...VIRTUAL_LIST_DEFAULTS })
watch(() => props.indent, value => {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('[scq-vue] Tree indent must be finite and non-negative.')
}, { immediate: true, flush: 'sync' })
defineSlots<TreeSlots>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: TreeKey): void
  (event: 'update:checkedKeys' | 'update:expandedKeys', value: TreeKey[]): void
  (event: 'node-click', node: TreeNode): void
  (event: 'check', value: TreeCheck, node: TreeNode): void
  (event: 'expand', node: TreeNode, expanded: boolean): void
  (event: 'load', node: TreeNode, children: TreeNode[]): void
  (event: 'error', error: unknown, node: TreeNode): void
}>()
const text = useLocale()
const instance = getCurrentInstance()
const rootRef = ref<HTMLElement>()
const virtualRef = ref<VirtualListExpose>()
const field = useFormControl({ element: () => rootRef.value, id: () => props.id, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, composite: true, focus: (options) => focusTree(options) })
const isDisabled = field.disabled
const internalSelected = ref<TreeKey | null>(null)
const selected = computed(() => props.modelValue !== undefined ? props.modelValue : internalSelected.value)
const internalChecked = ref<TreeKey[]>([])
const internalExpanded = ref<TreeKey[]>([...props.defaultExpandedKeys])
const expanded = computed(() => new Set(props.expandedKeys ?? internalExpanded.value))
const cache = ref(new Map<TreeKey, TreeNode[]>())
const loading = ref(new Set<TreeKey>())
const focused = ref<TreeKey>()
const controllers = new Map<TreeKey, { controller: AbortController; node: TreeNode }>()
const cancelLoads = () => {
  const requests = [...controllers.values()]
  controllers.clear()
  loading.value.clear()
  requests.forEach(({ controller }) => controller.abort())
}
const children = (node: TreeNode) => cache.value.get(node.key) ?? node.children ?? []
const isBranch = (node: TreeNode) => isTreeBranch(node, Boolean(props.load), cache.value.get(node.key))
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
  getVirtualKeyIndex(result, (entry) => entry.node.key, 'Tree')
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
const visible = computed(() => {
  const entries = all.value.filter((entry) => (!matched.value || matched.value.has(entry.node.key)) && entry.ancestors.every(isExpanded))
  if (!matched.value) return entries
  const sizes = new Map<TreeKey | undefined, number>()
  const positions = new Map<TreeKey | undefined, number>()
  for (const entry of entries) sizes.set(entry.parent, (sizes.get(entry.parent) ?? 0) + 1)
  return entries.map((entry) => {
    const position = (positions.get(entry.parent) ?? 0) + 1
    positions.set(entry.parent, position)
    return { ...entry, size: sizes.get(entry.parent)!, position }
  })
})
const entryKey = (entry: TreeEntry) => entry.node.key
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
const rowBindings = (entry: TreeEntry, index: number) => ({
  entry, index, indent: props.indent, virtual: props.virtual, branch: isBranch(entry.node),
  expanded: isExpanded(entry.node.key), loading: loading.value.has(entry.node.key),
  selected: selected.value === entry.node.key, disabled: isDisabled.value || entry.disabled,
  active: focusIndex.value === index, showCheckbox: props.showCheckbox,
  checked: checkedState.value.checked.has(entry.node.key), halfChecked: checkedState.value.half.has(entry.node.key),
})
const getChecked = (): TreeCheck => ({ checkedKeys: [...checkedState.value.checked], halfCheckedKeys: [...checkedState.value.half], checkedNodes: all.value.filter((entry) => checkedState.value.checked.has(entry.node.key)).map((entry) => entry.node) })
const check = (entry: TreeEntry, value: boolean) => {
  const current = visible.value.find(item => item.node === entry.node)
  if (disposed || isDisabled.value || !current || current.disabled) return
  const keys = new Set(checkedState.value.checked)
  const candidates = props.checkStrictly ? [current] : all.value.filter((item) => item.node.key === current.node.key || item.ancestors.includes(current.node.key))
  for (const item of candidates) if (!item.disabled) { if (value) keys.add(item.node.key); else keys.delete(item.node.key) }
  if (!props.checkStrictly && !value) current.ancestors.forEach((key) => keys.delete(key))
  const result = calculate([...keys])
  const checkedKeys = [...result.checked]
  internalChecked.value = checkedKeys
  emit('update:checkedKeys', checkedKeys)
  if (disposed) return
  emit('check', { checkedKeys, halfCheckedKeys: [...result.half], checkedNodes: all.value.filter((item) => result.checked.has(item.node.key)).map((item) => item.node) }, current.node)
}
const toggle = async (node: TreeNode) => {
  const entry = visible.value.find(item => item.node === node)
  if (disposed || isDisabled.value || !entry || entry.disabled || !isBranch(node) || loading.value.has(node.key)) return
  const opened = expanded.value.has(node.key)
  if (!opened && props.load && !node.children && !cache.value.has(node.key)) {
    const controller = new AbortController()
    controllers.set(node.key, { controller, node })
    loading.value.add(node.key)
    try {
      const result = await props.load(node, controller.signal)
      const current = visible.value.find(item => item.node === node)
      if (controller.signal.aborted || disposed || !current || current.disabled) return
      if (!Array.isArray(result)) throw new TypeError('[scq-vue] Tree load must resolve to a node array.')
      // Validate before cache lookup can turn a duplicate ancestor key into a cycle.
      const received = [...result]
      const seen = new Set<TreeNode>()
      for (const item of received) {
        if (seen.has(item)) continue
        seen.add(item)
        for (const child of item.children ?? []) received.push(child)
      }
      const retained = all.value.filter(item => !item.ancestors.includes(node.key)).map(item => item.node)
      getVirtualKeyIndex([...retained, ...received], item => item.key, 'Tree')
      cache.value.set(node.key, result)
      try { void all.value } catch (error) { cache.value.delete(node.key); throw error }
      emit('load', node, result)
    } catch (error) {
      if (!controller.signal.aborted) {
        emit('error', error, node)
        if (!instance?.vnode.props?.onError) console.error('[scq-vue] Tree node loading failed', error)
      }
      return
    }
    finally { if (controllers.get(node.key)?.controller === controller) { controllers.delete(node.key); loading.value.delete(node.key) } }
  }
  const current = visible.value.find(item => item.node === node)
  if (disposed || isDisabled.value || !current || current.disabled) return
  const next = new Set(expanded.value)
  if (opened) next.delete(node.key)
  else next.add(node.key)
  internalExpanded.value = [...next]
  emit('update:expandedKeys', [...next])
  emit('expand', node, !opened)
}
const select = (entry: TreeEntry) => {
  const current = visible.value.find(item => item.node === entry.node)
  if (disposed || isDisabled.value || !current || current.disabled) return
  internalSelected.value = current.node.key
  focused.value = current.node.key
  emit('update:modelValue', current.node.key)
  if (disposed) return
  emit('node-click', current.node)
  if (props.expandOnClickNode) void toggle(current.node)
}
const keydown = async (event: KeyboardEvent, entry: TreeEntry, index: number) => {
  const current = visible.value[index]
  if (disposed || isDisabled.value || !current || current.node !== entry.node || current.disabled || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey) return
  const editable = event.target instanceof Element ? event.target.closest(EDITABLE_TARGET_SELECTOR) : null
  if (editable && !(props.showCheckbox && editable.matches('input[type="checkbox"]') && editable.parentElement === event.currentTarget)) return
  if (!TREE_NAVIGATION_KEYS.has(event.key)) return
  event.preventDefault()
  let target = index
  if (event.key === 'ArrowDown') target = visible.value.findIndex((item, position) => position > index && !item.disabled)
  else if (event.key === 'ArrowUp') { target = index - 1; while (target >= 0 && visible.value[target].disabled) target -= 1 }
  else if (event.key === 'Home') target = visible.value.findIndex((item) => !item.disabled)
  else if (event.key === 'End') { target = visible.value.length - 1; while (target >= 0 && visible.value[target].disabled) target -= 1 }
  else if (event.key === 'ArrowRight') { if (!isExpanded(current.node.key)) await toggle(current.node); else target = visible.value.findIndex((item) => item.parent === current.node.key && !item.disabled) }
  else if (event.key === 'ArrowLeft') { if (isExpanded(current.node.key)) await toggle(current.node); else target = visible.value.findIndex((item) => item.node.key === current.parent) }
  else if (event.key === ' ') { if (props.showCheckbox) check(current, !checkedState.value.checked.has(current.node.key)); else select(current) }
  else if (event.key === 'Enter') select(current)
  if (target >= 0 && visible.value[target]) await focusKey(visible.value[target].node.key)
}
let disposed = false
let focusSequence = 0
const rowElement = (index: number) => rootRef.value?.querySelector<HTMLElement>(`[data-tree-index="${index}"]`)
const scrollToKey = (key: TreeKey, options?: VirtualListScrollOptions) => {
  if (disposed) return
  if (props.virtual) virtualRef.value?.scrollToKey(key, options)
  else {
    const index = visible.value.findIndex((entry) => entry.node.key === key)
    if (index >= 0) rowElement(index)?.scrollIntoView?.({ block: 'nearest', behavior: options?.behavior })
  }
}
const focusKey = async (key: TreeKey, options?: FocusOptions) => {
  if (isDisabled.value || disposed) return false
  const entry = visible.value.find((entry) => entry.node.key === key)
  if (!entry || entry.disabled) return false
  const sequence = ++focusSequence
  focused.value = key
  await nextTick()
  if (isDisabled.value || disposed || sequence !== focusSequence || focused.value !== key) return false
  scrollToKey(key)
  await nextTick()
  const index = visible.value.findIndex((entry) => entry.node.key === key && !entry.disabled)
  const element = index >= 0 ? rowElement(index) : undefined
  if (!element || isDisabled.value || disposed || sequence !== focusSequence || focused.value !== key) return false
  element.focus({ preventScroll: props.virtual, ...options })
  return element === element.ownerDocument.activeElement
}
function focusTree(options?: FocusOptions) {
  if (disposed || isDisabled.value || !rootRef.value) return false
  const entry = visible.value[focusIndex.value]
  const element = rowElement(focusIndex.value)
  if (element) {
    element.focus(options)
    if (entry) scrollToKey(entry.node.key)
  } else {
    rootRef.value.focus(options)
    if (entry) void focusKey(entry.node.key, options)
  }
  return rootRef.value.contains(rootRef.value.ownerDocument.activeElement)
}
watch(visible, async (entries, previous) => {
  const hadFocus = rootRef.value?.contains(rootRef.value.ownerDocument.activeElement)
  const oldIndex = previous.findIndex((entry) => entry.node.key === focused.value)
  const retained = entries.find((entry) => entry.node.key === focused.value && !entry.disabled)
  if (!retained) {
    const ancestors = previous[oldIndex]?.ancestors ?? []
    const parent = [...ancestors].reverse().map((key) => entries.find((entry) => entry.node.key === key && !entry.disabled)).find(Boolean)
    const nearby = entries.slice(Math.max(0, oldIndex)).find((entry) => !entry.disabled) ?? entries.find((entry) => !entry.disabled)
    focused.value = (parent ?? nearby)?.node.key
  }
  if (!hadFocus || isDisabled.value) return
  if (!retained && focused.value !== undefined) await focusKey(focused.value)
  else {
    await nextTick()
    if (!disposed && !isDisabled.value) (rowElement(focusIndex.value) ?? rootRef.value)?.focus({ preventScroll: true })
  }
})
watch(all, entries => {
  const current = new Map(entries.map(entry => [entry.node.key, entry]))
  for (const [key, request] of controllers) {
    const entry = current.get(key)
    if (!entry || entry.node !== request.node || entry.disabled) {
      controllers.delete(key)
      loading.value.delete(key)
      request.controller.abort()
    }
  }
})
watch(() => props.data, () => { cancelLoads(); cache.value.clear() })
onBeforeUnmount(() => { disposed = true; cancelLoads() })
defineExpose<TreeExpose>({ getChecked, getNode: (key) => all.value.find((entry) => entry.node.key === key)?.node, setCheckedKeys: (keys) => { if (disposed) return; const result = [...calculate(keys).checked]; internalChecked.value = result; emit('update:checkedKeys', result) }, focus: field.focus, focusKey, scrollToKey })
</script>