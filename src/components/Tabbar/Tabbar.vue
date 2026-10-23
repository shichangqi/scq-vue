<template>
  <div class="scq-tabbar-wrapper" :class="{ 'is-fixed': fixed, 'has-safe-area': safeAreaInsetBottom }">
    <nav ref="navRef" class="scq-tabbar" :class="{ 'is-fixed': fixed }" :aria-label="ariaLabel || text('navigation')" :aria-busy="pending || undefined" :style="{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }">
      <button v-for="item in items" :key="item.name" type="button" class="scq-tabbar__item" :class="{ 'is-active': isActive(item) }" :aria-label="showLabels ? undefined : item.label" :aria-current="isActive(item) ? 'page' : undefined" :aria-busy="pending && pendingName === item.name || undefined" :disabled="isDisabled || item.disabled || pending" @click="select(item)"><Badge :value="item.badge" :is-dot="item.dot"><slot name="icon" :item="item" :active="isActive(item)" :pending="pending && pendingName === item.name"><Loading v-if="pending && pendingName === item.name" :size="ICON_SIZE" /><Icon v-else-if="item.icon" :name="isActive(item) ? item.activeIcon || item.icon : item.icon" :size="ICON_SIZE" /></slot></Badge><span v-if="showLabels" class="scq-tabbar__label"><slot name="label" :item="item">{{ item.label }}</slot></span></button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Badge from '../Badge/Badge.vue'
import Loading from '../Loading/Loading.vue'
import type { IconName } from '../Icon/icons'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'
import { useContentFocus } from '../../utils/focus'
export interface TabbarItem { name: string | number; label: string; icon?: IconName; activeIcon?: IconName; badge?: string | number; dot?: boolean; disabled?: boolean; action?: boolean }
export interface TabbarProps { modelValue?: string | number; items: readonly TabbarItem[]; fixed?: boolean; safeAreaInsetBottom?: boolean; ariaLabel?: string; disabled?: boolean; beforeChange?: AsyncGuard<TabbarItem>; showLabels?: boolean }
const ICON_SIZE = 22
defineOptions({ name: 'Tabbar' })
const props = withDefaults(defineProps<TabbarProps>(), { fixed: false, safeAreaInsetBottom: true, ariaLabel: '', disabled: undefined, showLabels: true })
const emit = defineEmits<{ (event: 'update:modelValue' | 'change', name: string | number): void; (event: 'action', item: TabbarItem): void; (event: 'error', error: unknown, item: TabbarItem): void }>()
const text = useLocale()
const config = useConfig()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const guard = useAsyncGuard(() => props.beforeChange, (error, item) => emit('error', error, item))
const pending = guard.pending
const navRef = ref<HTMLElement>()
useContentFocus(() => navRef.value, () => pending.value || isDisabled.value)
const pendingName = ref<string | number>()
watch([() => props.modelValue, () => props.items, () => props.beforeChange, isDisabled], guard.cancel, { deep: true, flush: 'sync' })
const localName = ref<string | number>()
const activeName = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue
  const options = props.items.filter(item => !item.disabled && !item.action)
  return options.find(item => item.name === localName.value)?.name ?? options[0]?.name
})
watch(activeName, name => { if (props.modelValue === undefined) localName.value = name }, { immediate: true })
const isActive = (item: TabbarItem) => !item.action && item.name === activeName.value
const select = (item: TabbarItem) => {
  if (isDisabled.value || item.disabled || pending.value) return
  if (item.action) { emit('action', item); return }
  if (item.name === activeName.value) return
  pendingName.value = item.name
  void guard.run(item, () => {
    localName.value = item.name
    emit('update:modelValue', item.name)
    emit('change', item.name)
  })
}
defineExpose({ pending, cancelPending: guard.cancel })
</script>