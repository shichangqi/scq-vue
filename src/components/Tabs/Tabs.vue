<template>
  <div class="scq-tabs" :class="{ 'is-vertical': direction === 'vertical' }">
    <div ref="navRef" class="scq-tabs__nav" role="tablist" :aria-label="ariaLabel || undefined" :aria-orientation="direction" @keydown="handleKeydown">
      <button v-for="(tab, index) in items" :id="`${tabsId}-tab-${index}`" :key="tab.name" type="button" role="tab" class="scq-tabs__tab" :class="{ 'is-active': tab.name === activeName }" :aria-selected="tab.name === activeName" :aria-controls="`${tabsId}-panel-${index}`" :tabindex="tab.name === activeName ? 0 : -1" :disabled="tab.disabled" @click="select(tab.name)"><slot name="label" :tab="tab">{{ tab.label }}</slot></button>
    </div>
    <div class="scq-tabs__content">
      <template v-for="(tab, index) in items" :key="tab.name">
        <div v-if="!lazy || visited.has(tab.name)" v-show="tab.name === activeName" :id="`${tabsId}-panel-${index}`" class="scq-tabs__panel" role="tabpanel" :aria-labelledby="`${tabsId}-tab-${index}`" tabindex="0"><slot :name="String(tab.name)" :tab="tab"><slot :tab="tab" /></slot></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComponentId } from '../../utils/id'

export interface TabItem { name: string | number; label: string; disabled?: boolean }
defineOptions({ name: 'Tabs' })
const props = withDefaults(defineProps<{ modelValue?: string | number; items: TabItem[]; direction?: 'horizontal' | 'vertical'; lazy?: boolean; ariaLabel?: string; id?: string }>(), { direction: 'horizontal', lazy: false, ariaLabel: '', id: '' })
const emit = defineEmits<{ (event: 'update:modelValue' | 'change', name: string | number): void }>()
const generatedId = useComponentId('scq-tabs')
const tabsId = computed(() => props.id || generatedId)
const localName = ref<string | number>()
const activeName = computed(() => {
  const name = props.modelValue ?? localName.value
  return props.items.find((item) => item.name === name && !item.disabled)?.name ?? props.items.find((item) => !item.disabled)?.name
})
const visited = ref(new Set<string | number>())
watch(activeName, (name) => { if (name !== undefined) visited.value.add(name) }, { immediate: true })
const navRef = ref<HTMLElement>()
const select = (name: string | number) => {
  if (name === activeName.value || !props.items.some((item) => item.name === name && !item.disabled)) return
  localName.value = name
  emit('update:modelValue', name)
  emit('change', name)
}
const handleKeydown = (event: KeyboardEvent) => {
  const previous = props.direction === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
  const next = props.direction === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  if (![previous, next, 'Home', 'End'].includes(event.key)) return
  const buttons = Array.from(navRef.value?.querySelectorAll<HTMLButtonElement>('button[role="tab"]:not(:disabled)') || [])
  if (!buttons.length) return
  const index = buttons.indexOf(event.target as HTMLButtonElement)
  if (index < 0) return
  event.preventDefault()
  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === next ? 1 : -1) + buttons.length) % buttons.length
  buttons[nextIndex].click()
  buttons[nextIndex].focus()
  buttons[nextIndex].scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}
</script>