<template>
  <li role="none" class="scq-menu__item" :class="{ 'is-divided': item.divided }">
    <Popover v-if="branch && menu.state.value.mode === 'horizontal'" :model-value="opened" :disabled="disabled" :teleport="false" :placement="path.length ? 'right-start' : 'bottom-start'" :width="220" :aria-label="item.label" @update:model-value="menu.toggle(item.key, path, $event)">
      <template #reference><button type="button" role="menuitem" class="scq-menu__button" :data-menu-key="menu.token(item.key)" :disabled="disabled" :aria-disabled="disabled" aria-haspopup="menu" :aria-expanded="opened"><Icon v-if="item.icon" :name="item.icon" :size="18" /><span>{{ item.label }}</span><Icon :name="path.length ? 'chevronRight' : 'chevronDown'" :size="14" /></button></template>
      <ul class="scq-menu__list" role="menu" :aria-label="item.label"><MenuNode v-for="child in item.children" :key="child.key" :item="child" :path="[...path, item.key]" :parent-disabled="disabled" /></ul>
    </Popover>
    <template v-else>
      <component :is="item.href && !branch ? 'a' : 'button'" :type="item.href && !branch ? undefined : 'button'" role="menuitem" class="scq-menu__button" :class="{ 'is-active': menu.state.value.active === item.key }" :style="menu.state.value.mode === 'vertical' ? { paddingLeft: `${12 + path.length * 18}px` } : undefined" :data-menu-key="menu.token(item.key)" :href="!disabled && !branch ? safeHref(item.href) : undefined" :disabled="item.href ? undefined : disabled" :aria-disabled="disabled" :aria-current="menu.state.value.active === item.key ? 'page' : undefined" :aria-haspopup="branch ? 'menu' : undefined" :aria-expanded="branch ? opened : undefined" :tabindex="disabled ? -1 : undefined" @click="activate"><Icon v-if="item.icon" :name="item.icon" :size="18" /><span>{{ item.label }}</span><Icon v-if="branch" :name="opened ? 'chevronUp' : 'chevronDown'" :size="14" /></component>
      <ul v-if="branch && opened" class="scq-menu__list scq-menu__children" role="menu" :aria-label="item.label"><MenuNode v-for="child in item.children" :key="child.key" :item="child" :path="[...path, item.key]" :parent-disabled="disabled" /></ul>
    </template>
  </li>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import Icon from '../Icon/Icon.vue'
import Popover from '../Popover/Popover.vue'
import { safeHref } from '../../utils/link'
import { menuKey, type MenuItemOption, type MenuKey } from './context'

defineOptions({ name: 'ScqMenuNode' })
const props = withDefaults(defineProps<{ item: MenuItemOption; path?: MenuKey[]; parentDisabled?: boolean }>(), { path: () => [], parentDisabled: false })
const menu = inject(menuKey)!
const branch = computed(() => Boolean(props.item.children?.length))
const opened = computed(() => menu.state.value.opened.has(props.item.key))
const disabled = computed(() => menu.state.value.disabled || props.parentDisabled || Boolean(props.item.disabled))
const activate = (event: MouseEvent) => {
  if (disabled.value || (props.item.href && !safeHref(props.item.href))) { event.preventDefault(); return }
  if (branch.value) menu.toggle(props.item.key, props.path)
  else menu.select(props.item, [...props.path, props.item.key])
}
</script>