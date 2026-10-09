<template><span class="scq-dropdown"><Popover v-model="opened" :trigger="trigger" :disabled="isDisabled" :placement="placement" :width="width" :teleport="teleport" :aria-label="ariaLabel || text('actions')" @show="emit('visible-change', true)" @hide="emit('visible-change', false)"><template #reference><span ref="triggerRef" class="scq-dropdown__trigger" @keydown="keydown"><slot><button type="button" :disabled="isDisabled" :aria-expanded="opened" aria-haspopup="menu">{{ label || text('actions') }}<Icon name="chevronDown" :size="14" /></button></slot></span></template><div ref="panelRef"><Menu :items="items" :disabled="isDisabled" :aria-label="ariaLabel || text('actions')" @select="select" /></div></Popover></span></template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import Popover from '../Popover/Popover.vue'
import Menu from '../Menu/Menu.vue'
import Icon from '../Icon/Icon.vue'
import type { MenuKey, MenuItemOption } from '../Menu/context'
import type { FloatingPlacement } from '../../utils/floating'
import { useConfig, useLocale } from '../ConfigProvider/context'

export type DropdownItem = MenuItemOption
defineOptions({ name: 'Dropdown' })
const props = withDefaults(defineProps<{ modelValue?: boolean; items?: DropdownItem[]; label?: string; trigger?: 'click' | 'hover'; hideOnClick?: boolean; disabled?: boolean; placement?: FloatingPlacement; width?: string | number; teleport?: boolean | string; ariaLabel?: string }>(), { modelValue: undefined, items: () => [], label: '', trigger: 'click', hideOnClick: true, disabled: undefined, placement: 'bottom-start', width: 220, teleport: true, ariaLabel: '' })
const emit = defineEmits<{ (event: 'update:modelValue' | 'visible-change', value: boolean): void; (event: 'command', command: MenuKey, item: DropdownItem): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref(false)
const opened = computed({ get: () => props.modelValue ?? internal.value, set: (value) => { internal.value = value; emit('update:modelValue', value) } })
const triggerRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const select = (item: DropdownItem) => { emit('command', item.key, item); if (props.hideOnClick) { opened.value = false; triggerRef.value?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus() } }
const keydown = async (event: KeyboardEvent) => {
  if (isDisabled.value || !['ArrowDown', 'ArrowUp'].includes(event.key)) return
  event.preventDefault()
  opened.value = true
  await nextTick()
  const options = panelRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
  if (options?.length) options[event.key === 'ArrowDown' ? 0 : options.length - 1].focus()
}
defineExpose({ show: () => { if (!isDisabled.value) opened.value = true }, hide: () => { opened.value = false } })
</script>