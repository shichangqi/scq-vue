<template>
  <div class="scq-tabbar-wrapper" :class="{ 'is-fixed': fixed, 'has-safe-area': safeAreaInsetBottom }">
    <nav class="scq-tabbar" :class="{ 'is-fixed': fixed }" :aria-label="ariaLabel || text('navigation')" :style="{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }">
      <button v-for="item in items" :key="item.name" type="button" class="scq-tabbar__item" :class="{ 'is-active': item.name === activeName }" :aria-current="item.name === activeName ? 'page' : undefined" :disabled="item.disabled" @click="select(item)"><Badge :value="item.badge" :is-dot="item.dot"><slot name="icon" :item="item" :active="item.name === activeName"><Icon v-if="item.icon" :name="item.name === activeName ? item.activeIcon || item.icon : item.icon" :size="22" /></slot></Badge><span class="scq-tabbar__label"><slot name="label" :item="item">{{ item.label }}</slot></span></button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import Badge from '../Badge/Badge.vue'
import type { IconName } from '../Icon/icons'
import { useLocale } from '../ConfigProvider/context'
export interface TabbarItem { name: string | number; label: string; icon?: IconName; activeIcon?: IconName; badge?: string | number; dot?: boolean; disabled?: boolean }
defineOptions({ name: 'Tabbar' })
const props = withDefaults(defineProps<{ modelValue?: string | number; items: TabbarItem[]; fixed?: boolean; safeAreaInsetBottom?: boolean; ariaLabel?: string }>(), { fixed: false, safeAreaInsetBottom: true, ariaLabel: '' })
const emit = defineEmits<{ (event: 'update:modelValue' | 'change', name: string | number): void }>()
const text = useLocale()
const localName = ref<string | number>()
const activeName = computed(() => props.modelValue ?? localName.value ?? props.items.find((item) => !item.disabled)?.name)
const select = (item: TabbarItem) => {
  if (item.disabled || item.name === activeName.value) return
  localName.value = item.name
  emit('update:modelValue', item.name)
  emit('change', item.name)
}
</script>