<template>
  <div class="scq-collapse-item" :class="{ 'is-expanded': expanded, 'is-disabled': isDisabled }">
    <button :id="headerId" type="button" class="scq-collapse-item__header" :disabled="isDisabled" :aria-expanded="expanded" :aria-controls="panelId" @click="toggle">
      <span class="scq-collapse-item__title"><slot name="title" :expanded="expanded">{{ title }}</slot></span>
      <span class="scq-collapse-item__extra"><slot name="extra" :expanded="expanded" /></span>
      <Icon name="chevronDown" :size="18" class="scq-collapse-item__arrow" />
    </button>
    <div v-show="expanded" :id="panelId" class="scq-collapse-item__panel" role="region" :aria-labelledby="headerId"><div v-if="!lazy || rendered" class="scq-collapse-item__content"><slot /></div></div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'
import { collapseKey, type CollapseName } from './context'

defineOptions({ name: 'CollapseItem' })
const props = withDefaults(defineProps<{ name?: CollapseName; title?: string; disabled?: boolean; lazy?: boolean }>(), { title: '', disabled: false, lazy: false })
const parent = inject(collapseKey, null)
const config = useConfig()
const id = useComponentId('scq-collapse')
const headerId = `${id}-header`
const panelId = `${id}-panel`
const name = computed(() => props.name ?? id)
const localExpanded = ref(false)
const expanded = computed(() => parent ? parent.isExpanded(name.value) : localExpanded.value)
const isDisabled = computed(() => props.disabled || (parent?.disabled.value ?? config.value.disabled))
const rendered = ref(false)
watch(expanded, (value) => { if (value) rendered.value = true }, { immediate: true })
const toggle = () => {
  if (isDisabled.value) return
  if (parent) parent.toggle(name.value)
  else localExpanded.value = !localExpanded.value
}
</script>