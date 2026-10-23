<template>
  <component :is="virtual ? 'div' : 'li'" role="treeitem" :data-tree-index="index" :aria-level="entry.level + 1" :aria-setsize="entry.size" :aria-posinset="entry.position" :aria-expanded="branch ? expanded : undefined" :aria-selected="selected" :aria-disabled="disabled" :aria-checked="showCheckbox ? (halfChecked ? 'mixed' : checked) : undefined" :tabindex="!disabled && active ? 0 : -1" :class="{ 'is-selected': selected, 'is-disabled': disabled }" :style="{ paddingLeft: `${entry.level * indent + TREE_DEFAULTS.inset}px`, height: virtual ? '100%' : undefined }" @click="emit('select')" @focusin="emit('focus')" @keydown="emit('keydown', $event)">
    <button v-if="branch" type="button" class="scq-tree__toggle" tabindex="-1" :disabled="disabled || loading" :aria-label="`${text(expanded ? 'collapse' : 'expand')} ${entry.node.label}`" @click.stop="emit('toggle')"><Loading v-if="loading" :size="TREE_DEFAULTS.loadingSize" /><Icon v-else :name="expanded ? 'chevronDown' : 'chevronRight'" :size="TREE_DEFAULTS.toggleSize" /></button><span v-else class="scq-tree__toggle" />
    <input v-if="showCheckbox" type="checkbox" tabindex="-1" :aria-label="entry.node.label" :checked="checked" :indeterminate="halfChecked" :disabled="disabled" @click.stop @change="change" />
    <span class="scq-tree__label"><slot :node="entry.node" :index="index" :level="entry.level" :expanded="expanded" :checked="checked" :half-checked="halfChecked" :disabled="disabled">{{ entry.node.label }}</slot></span>
  </component>
</template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import { useLocale } from '../ConfigProvider/context'
import { TREE_DEFAULTS } from './constants'
import type { TreeEntry, TreeSlots } from './types'

const props = defineProps<{ entry: TreeEntry; index: number; indent: number; virtual: boolean; branch: boolean; expanded: boolean; loading: boolean; selected: boolean; disabled: boolean; active: boolean; showCheckbox: boolean; checked: boolean; halfChecked: boolean }>()
defineSlots<TreeSlots>()
const emit = defineEmits<{
  (event: 'select' | 'toggle' | 'focus'): void
  (event: 'check', checked: boolean): void
  (event: 'keydown', value: KeyboardEvent): void
}>()
const text = useLocale()
const change = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement
  const value = input.checked
  input.checked = props.checked
  input.indeterminate = props.halfChecked
  if (!props.disabled) emit('check', value)
}
</script>
