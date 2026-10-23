<template>
  <div class="scq-container" :class="{ 'has-aside': $slots.aside && !mobile && !isCollapsed, 'is-aside-right': asidePosition === 'right', 'is-fluid': fluid, 'is-scrollable': scrollable }" :style="styles">
    <header v-if="$slots.header" class="scq-container__header"><slot name="header" /></header>
    <div v-if="$slots.aside && (collapsible || mobile)" ref="toolsRef" class="scq-container__tools">
      <slot name="aside-toggle" :collapsed="isCollapsed" :open="isOpen" :mobile="mobile" :toggle="toggleAside">
        <button type="button" class="scq-container__toggle" :aria-label="toggleLabel" :aria-expanded="mobile ? isOpen : !isCollapsed" :aria-controls="asideId" :disabled="isDisabled" @click="toggleAside"><Icon :name="mobile ? 'menu' : toggleIcon" :size="CONTAINER_DEFAULTS.iconSize" /><span>{{ toggleLabel }}</span></button>
      </slot>
    </div>
    <div class="scq-container__body" :style="{ gap: toCssLength(gap) }">
      <Teleport :to="drawerTarget || 'body'" :disabled="!mobile || !drawerTarget">
        <aside v-if="$slots.aside" v-show="mobile ? !!drawerTarget : !isCollapsed" :id="asideId" ref="asideRef" class="scq-container__aside" :class="{ 'is-scrollable': scrollable }" :aria-label="asideTitle || text('sidebar')"><slot name="aside" /></aside>
      </Teleport>
      <div ref="mainRef" class="scq-container__main" tabindex="-1"><slot /></div>
    </div>
    <footer v-if="$slots.footer" class="scq-container__footer"><slot name="footer" /></footer>
    <Drawer v-if="$slots.aside && asideMode === 'drawer'" :model-value="mobile && isOpen" :position="asidePosition" :size="asideWidth" :title="asideTitle || text('sidebar')" :destroy-on-close="false" @update:model-value="changeOpen">
      <div ref="drawerTarget" class="scq-container__drawer-content"></div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type CSSProperties } from 'vue'
import Drawer from '../Drawer/Drawer.vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { focusFirstControl } from '../Form/useFormControl'
import { useComponentId } from '../../utils/id'
import { toCssLength, useViewportWidth } from '../../utils/layout'
import { CONTAINER_DEFAULTS } from './constants'
import type { ContainerProps, ContainerSlots } from './types'

defineOptions({ name: 'Container' })
defineSlots<ContainerSlots>()
const props = withDefaults(defineProps<ContainerProps>(), {
  maxWidth: CONTAINER_DEFAULTS.maxWidth, padding: CONTAINER_DEFAULTS.padding, gap: CONTAINER_DEFAULTS.gap,
  asideWidth: CONTAINER_DEFAULTS.asideWidth, asideBreakpoint: CONTAINER_DEFAULTS.asideBreakpoint,
  fluid: false, asidePosition: 'left', collapsible: false, collapsed: undefined,
  asideMode: 'static', asideOpen: undefined, asideTitle: '', scrollable: false, disabled: undefined,
})
const emit = defineEmits<{
  (event: 'update:collapsed' | 'collapse-change', value: boolean): void
  (event: 'update:asideOpen' | 'aside-open-change', value: boolean): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const localCollapsed = ref(false)
const localOpen = ref(false)
const isCollapsed = computed(() => props.collapsed ?? localCollapsed.value)
const isOpen = computed(() => props.asideOpen ?? localOpen.value)
const width = useViewportWidth(() => props.asideMode === 'drawer')
const mobile = computed(() => props.asideMode === 'drawer' && width.value < props.asideBreakpoint)
const asideId = useComponentId('scq-container-aside')
const asideRef = ref<HTMLElement>()
const toolsRef = ref<HTMLElement>()
const mainRef = ref<HTMLElement>()
const drawerTarget = ref<HTMLElement>()
const toggleLabel = computed(() => text(mobile.value ? 'openSidebar' : isCollapsed.value ? 'expandSidebar' : 'collapseSidebar'))
const toggleIcon = computed(() => (props.asidePosition === 'left') === isCollapsed.value ? 'chevronRight' : 'chevronLeft')
const styles = computed<CSSProperties & Record<string, string | undefined>>(() => ({
  maxWidth: props.fluid ? undefined : toCssLength(props.maxWidth),
  padding: toCssLength(props.padding),
  height: props.height === undefined ? undefined : toCssLength(props.height),
  '--scq-container-aside': toCssLength(props.asideWidth),
  gap: toCssLength(props.gap),
}))
const changeCollapsed = (value: boolean) => {
  if (isDisabled.value || value === isCollapsed.value) return
  localCollapsed.value = value
  emit('update:collapsed', value)
  emit('collapse-change', value)
}
const changeOpen = (value: boolean) => {
  if ((value && isDisabled.value) || value === isOpen.value) return
  localOpen.value = value
  emit('update:asideOpen', value)
  emit('aside-open-change', value)
}
const toggleAside = () => {
  if (mobile.value) changeOpen(!isOpen.value)
  else changeCollapsed(!isCollapsed.value)
}
const restoreFocus = () => {
  if (!focusFirstControl(toolsRef.value) && !focusFirstControl(mainRef.value)) mainRef.value?.focus({ preventScroll: true })
}
watch([isCollapsed, mobile], async ([collapsed, narrow], [previousCollapsed, previousNarrow]) => {
  const active = asideRef.value?.ownerDocument.activeElement
  const wasInside = active instanceof HTMLElement && asideRef.value?.contains(active)
  if (!narrow && previousNarrow) changeOpen(false)
  await nextTick()
  await nextTick()
  if (!wasInside || !active.isConnected) return
  if ((!narrow && collapsed && !previousCollapsed) || (narrow && !isOpen.value)) restoreFocus()
  else if (!narrow && previousNarrow) active.focus({ preventScroll: true })
})
watch(() => props.asideBreakpoint, (value) => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError('[scq-vue] Container asideBreakpoint must be positive and finite.')
}, { immediate: true })
defineExpose({
  collapsed: isCollapsed, asideOpen: isOpen, mobile, toggleAside,
  openAside: () => changeOpen(true), closeAside: () => changeOpen(false),
  collapseAside: () => changeCollapsed(true), expandAside: () => changeCollapsed(false),
})
</script>