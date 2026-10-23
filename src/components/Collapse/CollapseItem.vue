<template>
  <div ref="itemRef" class="scq-collapse-item" tabindex="-1" :class="{ 'is-expanded': expanded, 'is-disabled': isDisabled }">
    <button :id="headerId" ref="headerRef" type="button" class="scq-collapse-item__header" :disabled="isDisabled" :aria-expanded="expanded" :aria-controls="panelId" @click="toggle">
      <span class="scq-collapse-item__title"><slot name="title" :expanded="expanded">{{ title }}</slot></span>
      <span class="scq-collapse-item__extra"><slot name="extra" :expanded="expanded" /></span>
      <Icon name="chevronDown" :size="COLLAPSE_ICON_SIZE" class="scq-collapse-item__arrow" />
    </button>
    <Transition name="scq-collapse-item">
      <div v-show="expanded" :id="panelId" ref="panelRef" class="scq-collapse-item__panel" role="region" :aria-labelledby="headerId" :aria-hidden="!expanded || undefined" :inert="!expanded || undefined">
        <div class="scq-collapse-item__body"><div v-if="!lazy || rendered" class="scq-collapse-item__content"><slot /></div></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'
import { collapseKey, type CollapseName } from './context'

defineOptions({ name: 'CollapseItem' })
const props = withDefaults(defineProps<{ name?: CollapseName; title?: string; disabled?: boolean; lazy?: boolean }>(), { title: '', disabled: undefined, lazy: false })
const parent = inject(collapseKey, null)
const config = useConfig()
const id = useComponentId('scq-collapse')
const headerId = `${id}-header`
const panelId = `${id}-panel`
const name = computed(() => props.name ?? id)
const localExpanded = ref(false)
const expanded = computed(() => parent ? parent.isExpanded(name.value) : localExpanded.value)
const isDisabled = computed(() => Boolean(parent?.disabled.value || (props.disabled ?? parent?.disabled.value ?? config.value.disabled)))
const COLLAPSE_ICON_SIZE = 18
const itemRef = ref<HTMLElement>()
const headerRef = ref<HTMLButtonElement>()
const panelRef = ref<HTMLElement>()
const rendered = ref(false)
watch(expanded, (value) => {
  if (value) rendered.value = true
  else if (panelRef.value?.contains(panelRef.value.ownerDocument.activeElement)) {
    const target = isDisabled.value ? itemRef.value : headerRef.value
    target?.focus({ preventScroll: true })
  }
}, { immediate: true })
const toggle = () => {
  if (isDisabled.value) return
  if (parent) parent.toggle(name.value)
  else localExpanded.value = !localExpanded.value
}
</script>