<template>
  <span class="scq-dropdown" :class="{ 'is-split': split }">
    <button v-if="split" class="scq-dropdown__primary" type="button" :disabled="isDisabled" @click="primaryClick"><slot name="primary">{{ label || text('actions') }}</slot></button>
    <Popover v-model="opened" :trigger="trigger" :disabled="isDisabled" :placement="placement" :width="width" :teleport="teleport" :initial-focus="keyboardEdge ? keyboardFocus : undefined" :aria-label="ariaLabel || text('actions')" @show="emit('visible-change', true)" @hide="emit('visible-change', false)">
      <template #reference><span ref="triggerRef" class="scq-dropdown__trigger" @keydown="keydown"><slot><button type="button" :disabled="isDisabled" :aria-expanded="opened" :aria-label="split ? (ariaLabel || text('actions')) : undefined" aria-haspopup="menu"><template v-if="!split">{{ label || text('actions') }}</template><Icon name="chevronDown" :size="14" /></button></slot></span></template>
      <div ref="panelRef" tabindex="-1"><Menu :items="items" :disabled="isDisabled" :aria-label="ariaLabel || text('actions')" @select="select"><template v-if="$slots.item" #item="scope"><slot name="item" v-bind="scope" /></template></Menu></div>
    </Popover>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import Popover from '../Popover/Popover.vue'
import Menu from '../Menu/Menu.vue'
import Icon from '../Icon/Icon.vue'
import type { MenuKey, MenuItemOption } from '../Menu/context'
import type { FloatingPlacement } from '../../utils/floating'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import { EDITABLE_TARGET_SELECTOR } from '../../utils/focus'

export type DropdownItem = MenuItemOption
export interface DropdownProps { modelValue?: boolean; items?: readonly DropdownItem[]; label?: string; trigger?: 'click' | 'hover'; hideOnClick?: boolean; disabled?: boolean; placement?: FloatingPlacement; width?: string | number; teleport?: boolean | string; ariaLabel?: string; split?: boolean }
defineOptions({ name: 'Dropdown' })
const props = withDefaults(defineProps<DropdownProps>(), { modelValue: undefined, items: () => [], label: '', trigger: 'click', hideOnClick: true, disabled: undefined, placement: 'bottom-start', width: 220, teleport: true, ariaLabel: '', split: false })
const emit = defineEmits<{ (event: 'update:modelValue' | 'visible-change', value: boolean): void; (event: 'command', command: MenuKey, item: DropdownItem): void; (event: 'primary-click', value: MouseEvent): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const primaryClick = (event: MouseEvent) => { if (!isDisabled.value) emit('primary-click', event) }
const internal = ref(false)
const opened = computed({ get: () => props.modelValue ?? internal.value, set: (value) => { internal.value = value; emit('update:modelValue', value) } })
const triggerRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const keyboardEdge = ref<'first' | 'last'>()
const keyboardTarget = () => {
  const options = panelRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
  return options?.length ? options[keyboardEdge.value === 'last' ? options.length - 1 : 0] : panelRef.value
}
const keyboardFocus = () => {
  const target = keyboardTarget()
  keyboardEdge.value = undefined
  return target ?? null
}
watch([opened, isDisabled], ([visible, disabled]) => { if (!visible || disabled) keyboardEdge.value = undefined })
const select = (item: DropdownItem) => { emit('command', item.key, item); if (props.hideOnClick) { opened.value = false; triggerRef.value?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus() } }
const keydown = async (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey
    || (event.target instanceof Element && event.target.closest(EDITABLE_TARGET_SELECTOR))) return
  if (isDisabled.value || !['ArrowDown', 'ArrowUp'].includes(event.key)) return
  event.preventDefault()
  const wasOpen = opened.value
  keyboardEdge.value = event.key === 'ArrowDown' ? 'first' : 'last'
  opened.value = true
  await nextTick()
  if (!opened.value || isDisabled.value) keyboardEdge.value = undefined
  else if (wasOpen) {
    const target = keyboardTarget()
    target?.focus()
    if (target && target.ownerDocument.activeElement === target) keyboardEdge.value = undefined
  }
}
defineExpose({ show: () => { if (!isDisabled.value) opened.value = true }, hide: () => { opened.value = false } })
</script>