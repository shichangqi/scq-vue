<template><nav class="scq-breadcrumb" :aria-label="ariaLabel || text('breadcrumb')"><ol><li v-for="entry in visible" :key="entry.index"><span v-if="entry.index !== 0" class="scq-breadcrumb__separator" aria-hidden="true"><slot name="separator">{{ separator }}</slot></span><button v-if="!entry.item" type="button" class="scq-breadcrumb__expand" :aria-label="text('expand')" @click="expanded = true"><Icon name="chevronDown" :size="16" /></button><span v-else-if="entry.index === items.length - 1" aria-current="page"><slot :item="entry.item" :index="entry.index">{{ entry.item.label }}</slot></span><Link v-else :href="entry.item.href" :disabled="entry.item.disabled" :underline="false" @click="emit('select', entry.item!, entry.index)"><slot :item="entry.item" :index="entry.index">{{ entry.item.label }}</slot></Link></li></ol></nav></template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Link from '../Link/Link.vue'
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'

export interface BreadcrumbItem { label: string; href?: string; disabled?: boolean }
defineOptions({ name: 'Breadcrumb' })
const props = withDefaults(defineProps<{ items?: BreadcrumbItem[]; separator?: string; maxItems?: number; ariaLabel?: string }>(), { items: () => [], separator: '/', maxItems: 0, ariaLabel: '' })
const emit = defineEmits<{ (event: 'select', item: BreadcrumbItem, index: number): void }>()
const text = useLocale()
const expanded = ref(false)
const visible = computed(() => {
  const entries: { item?: BreadcrumbItem; index: number }[] = props.items.map((item, index) => ({ item, index }))
  return !expanded.value && props.maxItems >= 3 && entries.length > props.maxItems ? [entries[0], { index: -1 }, ...entries.slice(-(props.maxItems - 2))] : entries
})
</script>