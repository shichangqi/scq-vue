<template>
  <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="teleport === false || !mounted">
    <Transition name="scq-drawer" appear @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div v-if="modelValue || (rendered && !destroyOnClose)" v-show="modelValue" class="scq-drawer-layer" :class="`scq-drawer-layer--${position}`" :style="layerStyle" @click.self="closeOnClickOverlay && requestClose('overlay')">
        <section ref="panel" class="scq-drawer" role="dialog" aria-modal="true" :aria-labelledby="title || $slots.header ? titleId : undefined" :aria-label="!title && !$slots.header ? ariaLabel || 'Panel' : undefined" tabindex="-1" :style="drawerStyle">
          <header v-if="title || $slots.header || showClose" class="scq-drawer__header"><div :id="titleId" class="scq-drawer__title"><slot name="header">{{ title }}</slot></div><button v-if="showClose" type="button" class="scq-drawer__close" :aria-label="text('close')" @click="requestClose('close-icon')"><Icon name="close" :size="20" /></button></header>
          <div class="scq-drawer__body"><slot /></div>
          <footer v-if="$slots.footer" class="scq-drawer__footer"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type CSSProperties } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale, useThemeStyle } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'
import { useModal } from '../../utils/modal'

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'
export type DrawerCloseReason = 'overlay' | 'esc' | 'close-icon' | 'api'
defineOptions({ name: 'Drawer' })
const props = withDefaults(defineProps<{
  modelValue?: boolean
  title?: string
  position?: DrawerPosition
  size?: number | string
  showClose?: boolean
  closeOnClickOverlay?: boolean
  closeOnPressEscape?: boolean
  lockScroll?: boolean
  destroyOnClose?: boolean
  teleport?: boolean | string
  zIndex?: number
  ariaLabel?: string
}>(), { modelValue: false, title: '', position: 'right', size: 360, showClose: true, closeOnClickOverlay: true, closeOnPressEscape: true, lockScroll: true, destroyOnClose: false, teleport: true, ariaLabel: '' })
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'open' | 'opened' | 'closed'): void
  (event: 'close', reason: DrawerCloseReason): void
}>()
const text = useLocale()
const themeStyle = useThemeStyle()
const panel = ref<HTMLElement>()
const mounted = ref(false)
const rendered = ref(props.modelValue)
const titleId = useComponentId('scq-drawer-title')
const requestClose = (reason: DrawerCloseReason) => {
  if (!props.modelValue) return
  emit('update:modelValue', false)
  emit('close', reason)
}
const { zIndex } = useModal(() => props.modelValue, panel, { closeOnPressEscape: () => props.closeOnPressEscape, lockScroll: () => props.lockScroll, onEscape: () => requestClose('esc'), zIndex: () => props.zIndex })
const layerStyle = computed(() => ({ ...themeStyle.value, zIndex: props.zIndex ?? zIndex.value }))
const drawerStyle = computed(() => ({ '--scq-drawer-size': typeof props.size === 'number' ? `${props.size}px` : props.size }) as CSSProperties)
watch(() => props.modelValue, (visible) => { if (visible) { rendered.value = true; emit('open') } })
onMounted(() => { mounted.value = true; if (props.modelValue) emit('open') })
defineExpose({ close: () => requestClose('api') })
</script>