<template>
  <div ref="rootRef" class="scq-transfer" :class="{ 'is-disabled': isDisabled, 'scq-transfer--virtual': virtual }" role="group" tabindex="-1" :aria-label="ariaLabel || (field.hasField ? undefined : `${panelTitle('left')} / ${panelTitle('right')}`)" :aria-disabled="isDisabled || undefined" v-bind="{ ...field.rootAttrs.value, ...field.attrs.value }" @focusout="field.touch($event)">
    <template v-for="{ items: panel, side } in panels" :key="side">
      <section class="scq-transfer__panel" :data-transfer-panel="side" :aria-label="panelTitle(side)">
        <header><label><input type="checkbox" :checked="allChecked(panel)" :indeterminate="someChecked(panel) && !allChecked(panel)" :disabled="isDisabled || !panel.some(item => !item.disabled)" @change="toggleAll(side, $event)" /><span>{{ panelTitle(side) }}</span></label><span class="scq-transfer__count">{{ panelCheckedKeys(panel).length }} / {{ panel.length }}</span></header>
        <input v-if="filterable" v-model="queries[side]" type="search" class="scq-transfer__search" :placeholder="filterPlaceholder || text('search')" :aria-label="`${text('search')} ${panelTitle(side)}`" :disabled="isDisabled" />
        <VirtualList v-if="virtual" :ref="(instance) => setVirtualRef(side, instance)" :items="panel" item-key="key" :height="height" :item-height="itemHeight" :overscan="overscan" :active-index="focusIndices[side]" preserve-scroll-position item-role="presentation" :aria-label="panelTitle(side)" :tabindex="-1">
          <template #default="{ item, index }">
            <TransferRow v-bind="rowBindings(item, index, side, panel.length)" @check="toggle(item.key, $event)" @focus="activeKeys[side] = item.key" @keydown="keydown($event, side, index)"><template #default="slotProps"><slot v-bind="slotProps">{{ slotProps.item.label }}</slot></template></TransferRow>
          </template>
          <template #empty><slot name="empty" :side="side">{{ text('empty') }}</slot></template>
        </VirtualList>
        <ul v-else>
          <TransferRow v-for="(item, index) in panel" :key="item.key" v-bind="rowBindings(item, index, side, panel.length)" @check="toggle(item.key, $event)" @focus="activeKeys[side] = item.key" @keydown="keydown($event, side, index)"><template #default="slotProps"><slot v-bind="slotProps">{{ slotProps.item.label }}</slot></template></TransferRow>
          <li v-if="!panel.length" class="scq-transfer__empty"><slot name="empty" :side="side">{{ text('empty') }}</slot></li>
        </ul>
        <footer v-if="side === 'right' ? $slots['right-footer'] : $slots['left-footer']"><slot :name="side === 'right' ? 'right-footer' : 'left-footer'" :items="panel" :checked-keys="panelCheckedKeys(panel)" /></footer>
      </section>
      <div v-if="side === 'left'" class="scq-transfer__actions"><button type="button" :disabled="isDisabled || !movable('right').length" :aria-label="text('moveRight')" :title="text('moveRight')" @click="move('right')"><Icon name="arrowRight" :size="TRANSFER_DEFAULTS.actionSize" /></button><button type="button" :disabled="isDisabled || !movable('left').length" :aria-label="text('moveLeft')" :title="text('moveLeft')" @click="move('left')"><Icon name="arrowLeft" :size="TRANSFER_DEFAULTS.actionSize" /></button></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'
import { focusFirstControl, useFormControl } from '../Form/useFormControl'
import VirtualList from '../VirtualList/VirtualList.vue'
import { VIRTUAL_LIST_DEFAULTS } from '../VirtualList/constants'
import { getVirtualKeyIndex } from '../VirtualList/keys'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import type { VirtualListExpose, VirtualListScrollOptions } from '../VirtualList/types'
import TransferRow from './TransferRow.vue'
import { TRANSFER_DEFAULTS, TRANSFER_NAVIGATION_KEYS, TRANSFER_SIDES, TRANSFER_SIDE_INDEX } from './constants'
import type { TransferExpose, TransferKey, TransferItem, TransferSide, TransferSlots } from './types'

export type { TransferKey, TransferItem } from './types'
defineOptions({ name: 'Transfer', inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue?: readonly TransferKey[]; data?: readonly TransferItem[]; disabled?: boolean; filterable?: boolean; filterPlaceholder?: string; filterMethod?: (query: string, item: TransferItem) => boolean; titles?: readonly [string, string]; id?: string; ariaLabel?: string; virtual?: boolean; height?: number | string; itemHeight?: number; overscan?: number }>(), { data: () => [], disabled: undefined, filterable: false, filterPlaceholder: '', id: '', ariaLabel: '', virtual: false, ...VIRTUAL_LIST_DEFAULTS })
defineSlots<TransferSlots>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: TransferKey[]): void
  (event: 'change', value: TransferKey[], direction: 'left' | 'right', moved: TransferKey[]): void
  (event: 'check-change', value: TransferKey[]): void
}>()
const text = useLocale()
const rootRef = ref<HTMLElement>()
const field = useFormControl({ element: () => rootRef.value, disabled: () => props.disabled, id: () => props.id, ariaLabel: () => props.ariaLabel, composite: true, focus: (options) => focusFirstControl(rootRef.value, options) })
const isDisabled = field.disabled
const internal = ref<TransferKey[]>([])
const value = computed(() => [...new Set(props.modelValue ?? internal.value)])
const valueKeys = computed(() => new Set(value.value))
const queries = ref<Record<TransferSide, string>>({ left: '', right: '' })
const checked = ref<TransferKey[]>([])
const checkedKeys = computed(() => new Set(checked.value))
const itemByKey = computed(() => {
  getVirtualKeyIndex(props.data, (item) => item.key, 'Transfer')
  return new Map(props.data.map((item) => [item.key, item]))
})
const activeKeys = ref<Record<TransferSide, TransferKey | undefined>>({ left: undefined, right: undefined })
const panels = computed(() => TRANSFER_SIDES.map((side) => {
  const query = queries.value[side]
  const normalized = query.toLocaleLowerCase()
  return { side, items: [...itemByKey.value.values()].filter((item) => valueKeys.value.has(item.key) === (side === 'right') && (props.filterMethod ? props.filterMethod(query, item) : item.label.toLocaleLowerCase().includes(normalized))) }
}))
const paneItems = (side: TransferSide) => panels.value[TRANSFER_SIDE_INDEX[side]].items
const panelTitle = (side: TransferSide) => props.titles?.[TRANSFER_SIDE_INDEX[side]] || text(side === 'right' ? 'selected' : 'available')
const panelCheckedKeys = (items: TransferItem[]) => items.filter((item) => checkedKeys.value.has(item.key)).map((item) => item.key)
const allChecked = (items: TransferItem[]) => items.some((item) => !item.disabled) && items.every((item) => item.disabled || checkedKeys.value.has(item.key))
const someChecked = (items: TransferItem[]) => items.some((item) => !item.disabled && checkedKeys.value.has(item.key))
const focusIndices = computed(() => Object.fromEntries(panels.value.map(({ side, items }) => {
  const index = items.findIndex((item) => item.key === activeKeys.value[side] && !item.disabled)
  return [side, index >= 0 ? index : items.findIndex((item) => !item.disabled)]
})) as Record<TransferSide, number>)
const rowBindings = (item: TransferItem, index: number, side: TransferSide, size: number) => ({
  item, index, side, size, checked: checkedKeys.value.has(item.key), disabled: isDisabled.value || Boolean(item.disabled),
  virtual: props.virtual, active: focusIndices.value[side] === index,
})
const toggle = (key: TransferKey, selected: boolean) => {
  if (isDisabled.value || !itemByKey.value.has(key) || itemByKey.value.get(key)?.disabled) return
  checked.value = selected ? [...new Set([...checked.value, key])] : checked.value.filter((entry) => entry !== key)
  emit('check-change', [...checked.value])
}
const toggleAll = (side: TransferSide, event: Event) => {
  const input = event.target as HTMLInputElement
  const items = paneItems(side)
  if (!isDisabled.value) {
    const keys = new Set(items.filter((item) => !item.disabled).map((item) => item.key))
    checked.value = input.checked ? [...new Set([...checked.value, ...keys])] : checked.value.filter((key) => !keys.has(key))
    emit('check-change', [...checked.value])
  }
  input.checked = allChecked(items)
  input.indeterminate = someChecked(items) && !allChecked(items)
}
const movable = (direction: TransferSide) => props.data.filter((item) => !item.disabled && checkedKeys.value.has(item.key) && valueKeys.value.has(item.key) === (direction === 'left')).map((item) => item.key)
const move = (direction: 'left' | 'right') => {
  if (isDisabled.value) return
  const keys = movable(direction)
  if (!keys.length) return
  const moved = new Set(keys)
  const next = direction === 'right' ? [...new Set([...value.value, ...keys])] : value.value.filter((key) => !moved.has(key))
  internal.value = next
  checked.value = checked.value.filter((key) => !moved.has(key))
  emit('update:modelValue', next)
  emit('change', next, direction, keys)
  emit('check-change', [...checked.value])
}
const virtualLists: Partial<Record<TransferSide, VirtualListExpose>> = {}
const setVirtualRef = (side: TransferSide, instance: Element | ComponentPublicInstance | null) => {
  if (instance) virtualLists[side] = instance as unknown as VirtualListExpose
  else delete virtualLists[side]
}
let disposed = false
let focusSequence = 0
const paneElement = (side: TransferSide) => rootRef.value?.querySelector<HTMLElement>(`[data-transfer-panel="${side}"]`)
const rowInput = (side: TransferSide, index: number) => paneElement(side)?.querySelector<HTMLInputElement>(`[data-transfer-index="${index}"] input`)
const scrollToKey = (key: TransferKey, side: TransferSide, options?: VirtualListScrollOptions) => {
  if (props.virtual) virtualLists[side]?.scrollToKey(key, options)
  else {
    const index = paneItems(side).findIndex((item) => item.key === key)
    if (index >= 0) rowInput(side, index)?.scrollIntoView?.({ block: 'nearest', behavior: options?.behavior })
  }
}
const focusKey = async (key: TransferKey, side: TransferSide, options?: FocusOptions) => {
  if (isDisabled.value || disposed || !paneItems(side).some((item) => item.key === key && !item.disabled)) return false
  const sequence = ++focusSequence
  activeKeys.value[side] = key
  await nextTick()
  if (isDisabled.value || disposed || sequence !== focusSequence || activeKeys.value[side] !== key) return false
  scrollToKey(key, side)
  await nextTick()
  const index = paneItems(side).findIndex((item) => item.key === key && !item.disabled)
  const input = index >= 0 ? rowInput(side, index) : undefined
  if (!input || isDisabled.value || disposed || sequence !== focusSequence || activeKeys.value[side] !== key) return false
  input.focus({ preventScroll: props.virtual, ...options })
  return input === input.ownerDocument.activeElement
}
const keydown = (event: KeyboardEvent, side: TransferSide, index: number) => {
  if (isDisabled.value || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey || !TRANSFER_NAVIGATION_KEYS.has(event.key)) return
  event.preventDefault()
  const items = paneItems(side)
  const forward = event.key === 'ArrowDown' || event.key === 'Home'
  let target = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index + (forward ? 1 : -1)
  while (target >= 0 && target < items.length && items[target].disabled) target += forward ? 1 : -1
  if (items[target]) void focusKey(items[target].key, side)
}
watch([panels, () => props.data.map((item) => item.disabled)] as const, async ([next], [previous]) => {
  for (const { side, items } of next) {
    const activeElement = rootRef.value?.ownerDocument.activeElement
    const hadFocus = activeElement instanceof HTMLElement && Boolean(paneElement(side)?.contains(activeElement) && activeElement.closest('[data-transfer-index]'))
    const retained = items.some((item) => item.key === activeKeys.value[side] && !item.disabled)
    if (!retained) {
      const oldIndex = previous[TRANSFER_SIDE_INDEX[side]].items.findIndex((item) => item.key === activeKeys.value[side])
      const nearby = items.slice(Math.max(0, oldIndex)).find((item) => !item.disabled) ?? items.find((item) => !item.disabled)
      activeKeys.value[side] = nearby?.key
    }
    if (!hadFocus || isDisabled.value) continue
    const key = activeKeys.value[side]
    if (!retained && key !== undefined) await focusKey(key, side)
    else {
      await nextTick()
      if (!disposed && !isDisabled.value) (rowInput(side, focusIndices.value[side]) ?? rootRef.value)?.focus({ preventScroll: true })
    }
  }
})
watch(() => props.data.map((item) => [item.key, item.disabled]), () => {
  checked.value = checked.value.filter((key) => itemByKey.value.has(key) && !itemByKey.value.get(key)?.disabled)
})
onBeforeUnmount(() => { disposed = true })
defineExpose<TransferExpose>({ clearQuery: (side) => { queries.value[side] = '' }, focus: field.focus, focusKey, scrollToKey })
</script>