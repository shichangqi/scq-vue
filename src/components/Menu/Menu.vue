<template><nav class="scq-menu" :class="`scq-menu--${mode}`" :aria-label="ariaLabel || text('navigation')" @keydown="keydown"><ul class="scq-menu__list scq-menu__root" :role="mode === 'horizontal' ? 'menubar' : 'menu'" :aria-label="ariaLabel || text('navigation')" :aria-orientation="mode"><MenuNode v-for="item in items" :key="item.key" :item="item" /></ul><div v-if="!items.length" class="scq-menu__empty">{{ text('empty') }}</div></nav></template>

<script setup lang="ts">
import { computed, nextTick, provide, ref, useSlots, watch } from 'vue'
import MenuNode from './MenuNode.vue'
import { menuKey, type MenuKey, type MenuItemOption } from './context'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { EDITABLE_TARGET_SELECTOR } from '../../utils/focus'

defineOptions({ name: 'Menu' })
const props = withDefaults(defineProps<{ modelValue?: MenuKey | null; items?: readonly MenuItemOption[]; mode?: 'horizontal' | 'vertical'; openKeys?: readonly MenuKey[]; defaultOpenKeys?: readonly MenuKey[]; uniqueOpened?: boolean; disabled?: boolean; ariaLabel?: string }>(), { items: () => [], mode: 'vertical', defaultOpenKeys: () => [], uniqueOpened: false, disabled: undefined, ariaLabel: '' })
const emit = defineEmits<{
  (event: 'update:modelValue', key: MenuKey): void
  (event: 'update:openKeys', keys: MenuKey[]): void
  (event: 'select', item: MenuItemOption, path: MenuKey[]): void
  (event: 'open' | 'close', key: MenuKey): void
}>()
const config = useConfig()
const text = useLocale()
const active = ref<MenuKey | null>(null)
const opened = ref<MenuKey[]>([...props.defaultOpenKeys])
const focusKey = ref<MenuKey>()
const disabled = computed(() => props.disabled ?? config.value.disabled)
const state = computed(() => ({ active: props.modelValue !== undefined ? props.modelValue : active.value, opened: new Set(props.openKeys ?? opened.value), disabled: disabled.value, mode: props.mode, focusKey: focusKey.value }))
const consumeFocus = (key: MenuKey) => { if (focusKey.value === key) focusKey.value = undefined }
watch([() => props.items, () => props.mode, disabled], () => { focusKey.value = undefined }, { deep: true, flush: 'sync' })
const token = (key: MenuKey) => `${typeof key}:${key}`
const entries = computed(() => {
  const map = new Map<string, { item: MenuItemOption; path: MenuKey[] }>()
  const walk = (items: readonly MenuItemOption[], path: MenuKey[]) => items.forEach((item) => { map.set(token(item.key), { item, path }); if (item.children) walk(item.children, [...path, item.key]) })
  walk(props.items, [])
  return map
})
const toggle = (key: MenuKey, path: MenuKey[], value = !state.value.opened.has(key)) => {
  if (state.value.disabled) return
  if (!value) focusKey.value = undefined
  if (value === state.value.opened.has(key)) return
  const next = new Set(props.uniqueOpened && value ? path : state.value.opened)
  if (value) next.add(key)
  else for (const entry of entries.value.values()) if (entry.item.key === key || entry.path.includes(key)) next.delete(entry.item.key)
  opened.value = [...next]
  emit('update:openKeys', [...next])
  emit(value ? 'open' : 'close', key)
}
const select = (item: MenuItemOption, path: MenuKey[]) => {
  if (state.value.disabled || item.disabled) return
  active.value = item.key
  emit('update:modelValue', item.key)
  emit('select', item, path)
  if (props.mode === 'horizontal') { opened.value = []; emit('update:openKeys', []) }
}
const keydown = async (event: KeyboardEvent) => {
  if (state.value.disabled || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey
    || !(event.target instanceof Element) || event.target.closest(EDITABLE_TARGET_SELECTOR)) return
  const target = event.target.closest<HTMLElement>('[role="menuitem"]')
  const list = event.target.closest('ul')
  if (!list || list.closest('.scq-menu') !== event.currentTarget) return
  if (event.key === 'Escape' || (event.key === 'ArrowLeft' && list.getAttribute('role') !== 'menubar')) {
    const parent = list.closest('li.scq-menu__item')?.querySelector<HTMLElement>('[role="menuitem"]')
    if (parent?.closest('.scq-menu') !== event.currentTarget) return
    const parentEntry = entries.value.get(parent?.dataset.menuKey || '')
    if (parentEntry) { event.preventDefault(); event.stopPropagation(); toggle(parentEntry.item.key, parentEntry.path, false); await nextTick(); parent?.focus() }
    return
  }
  if (!target || target.getAttribute('aria-disabled') === 'true') return
  const siblings = Array.from(list.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter((element) => element.closest('ul') === list && element.getAttribute('aria-disabled') !== 'true')
  const index = siblings.indexOf(target)
  const horizontal = list.getAttribute('role') === 'menubar'
  const entry = entries.value.get(target.dataset.menuKey || '')
  if (!entry) return
  let next = -1
  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = siblings.length - 1
  else if (event.key === (horizontal ? 'ArrowRight' : 'ArrowDown')) next = (index + 1) % siblings.length
  else if (event.key === (horizontal ? 'ArrowLeft' : 'ArrowUp')) next = (index - 1 + siblings.length) % siblings.length
  else if (event.key === (horizontal ? 'ArrowDown' : 'ArrowRight') && entry.item.children?.length) {
    event.preventDefault()
    event.stopPropagation()
    const wasOpen = state.value.opened.has(entry.item.key)
    focusKey.value = entry.item.key
    toggle(entry.item.key, entry.path, true)
    await nextTick()
    if (!state.value.opened.has(entry.item.key)) { consumeFocus(entry.item.key); return }
    if (props.mode === 'horizontal' && !wasOpen) return
    const submenu = target.closest('li')?.querySelector('ul')
    const first = submenu?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') || submenu
    first?.focus()
    if (first?.ownerDocument.activeElement === first) consumeFocus(entry.item.key)
    return
  }
  if (next >= 0) { event.preventDefault(); event.stopPropagation(); siblings[next]?.focus() }
}
provide(menuKey, { state, select, toggle, token, consumeFocus, slots: useSlots() })
</script>