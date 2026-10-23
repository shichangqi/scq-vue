<template>
  <nav ref="navRef" class="scq-breadcrumb" tabindex="-1" :aria-label="ariaLabel || text('breadcrumb')"><ol><li v-for="entry in visible" :key="entry.index">
    <span v-if="entry.index !== 0" class="scq-breadcrumb__separator" aria-hidden="true"><slot name="separator">{{ separator }}</slot></span>
    <template v-if="!entry.item">
      <Dropdown v-if="collapseMode === 'menu'" v-model="menuOpen" :items="hiddenItems" :teleport="false" :aria-label="text('expand')" @command="chooseHidden"><button type="button" class="scq-breadcrumb__expand" :aria-label="text('expand')" aria-haspopup="menu" :aria-expanded="menuOpen"><Icon name="chevronDown" :size="COLLAPSE_ICON_SIZE" /></button><template v-if="$slots.default" #item="{ item }"><slot :item="items[Number(item.key)]" :index="Number(item.key)">{{ item.label }}</slot></template></Dropdown>
      <button v-else type="button" class="scq-breadcrumb__expand" :aria-label="text('expand')" @click="expand"><Icon name="chevronDown" :size="COLLAPSE_ICON_SIZE" /></button>
    </template>
    <span v-else-if="entry.index === items.length - 1" aria-current="page"><slot :item="entry.item" :index="entry.index">{{ entry.item.label }}</slot></span>
    <Link v-else :href="entry.item.href" :disabled="entry.item.disabled" :underline="false" @click="emit('select', entry.item!, entry.index)"><slot :item="entry.item" :index="entry.index">{{ entry.item.label }}</slot></Link>
  </li></ol></nav>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import Link from '../Link/Link.vue'
import Icon from '../Icon/Icon.vue'
import Dropdown from '../Dropdown/Dropdown.vue'
import type { MenuKey } from '../Menu/context'
import { useLocale } from '../ConfigProvider/context'

export interface BreadcrumbItem { label: string; href?: string; disabled?: boolean }
export interface BreadcrumbProps { items?: readonly BreadcrumbItem[]; separator?: string; maxItems?: number; ariaLabel?: string; collapseMode?: 'expand' | 'menu' }
const COLLAPSE_ICON_SIZE = 16
defineOptions({ name: 'Breadcrumb' })
const props = withDefaults(defineProps<BreadcrumbProps>(), { items: () => [], separator: '/', maxItems: 0, ariaLabel: '', collapseMode: 'expand' })
const emit = defineEmits<{ (event: 'select', item: BreadcrumbItem, index: number): void }>()
const text = useLocale()
const expanded = ref(false)
const menuOpen = ref(false)
const navRef = ref<HTMLElement>()
const expand = async (event: MouseEvent) => {
  const trigger = event.currentTarget
  const nav = navRef.value
  const restore = nav?.ownerDocument.activeElement === trigger
  expanded.value = true
  await nextTick()
  if (!restore || !nav?.isConnected || nav.ownerDocument.activeElement !== nav.ownerDocument.body) return
  const target = nav.querySelector<HTMLElement>(':scope > ol > li:not(:first-child) > .scq-link:not(:disabled):not([aria-disabled="true"])') || nav
  target.focus()
}
const limit = computed(() => Number.isFinite(props.maxItems) ? Math.floor(props.maxItems) : 0)
const hiddenItems = computed(() => props.items.map((item, index) => ({ ...item, key: index })).slice(1, props.items.length - (limit.value - 2)))
watch([() => props.items, () => props.maxItems, () => props.collapseMode], () => { menuOpen.value = false }, { deep: true })
const chooseHidden = (key: MenuKey) => {
  const index = Number(key)
  const item = props.items[index]
  if (item && !item.disabled && index < props.items.length - 1) emit('select', item, index)
}
const visible = computed(() => {
  const entries: { item?: BreadcrumbItem; index: number }[] = props.items.map((item, index) => ({ item, index }))
  return !expanded.value && limit.value >= 3 && entries.length > limit.value ? [entries[0], { index: -1 }, ...entries.slice(-(limit.value - 2))] : entries
})
</script>