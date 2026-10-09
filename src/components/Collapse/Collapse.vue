<template><div ref="groupRef" class="scq-collapse" @keydown="handleKeydown"><slot /></div></template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useConfig } from '../ConfigProvider/context'
import { collapseKey, type CollapseName, type CollapseValue } from './context'

defineOptions({ name: 'Collapse' })
const props = withDefaults(defineProps<{ modelValue?: CollapseValue; accordion?: boolean; disabled?: boolean }>(), { accordion: false, disabled: undefined })
const emit = defineEmits<{ (event: 'update:modelValue' | 'change', value: CollapseValue): void }>()
const config = useConfig()
const groupRef = ref<HTMLElement>()
const localValue = ref<CollapseValue>([])
const disabled = computed(() => props.disabled ?? config.value.disabled)
const activeNames = computed(() => {
  const value = props.modelValue ?? localValue.value
  const names = Array.isArray(value) ? value : value === '' ? [] : [value]
  return props.accordion ? names.slice(0, 1) : names
})
const toggle = (name: CollapseName) => {
  if (disabled.value) return
  const expanded = activeNames.value.includes(name)
  const value: CollapseValue = props.accordion ? expanded ? '' : name : expanded ? activeNames.value.filter((entry) => entry !== name) : [...activeNames.value, name]
  localValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
}
provide(collapseKey, { disabled, isExpanded: (name) => activeNames.value.includes(name), toggle })

const handleKeydown = (event: KeyboardEvent) => {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  const buttons = Array.from(groupRef.value?.querySelectorAll<HTMLButtonElement>('.scq-collapse-item__header:not(:disabled)') || [])
    .filter((button) => button.closest('.scq-collapse') === groupRef.value)
  const index = buttons.indexOf(event.target as HTMLButtonElement)
  if (index < 0 || !buttons.length) return
  event.preventDefault()
  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
  buttons[nextIndex].focus()
}
</script>