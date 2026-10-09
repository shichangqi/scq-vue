<template><FloatingPanel v-bind="props" variant="tooltip" @update:model-value="emit('update:modelValue', $event)" @show="emit('show')" @hide="emit('hide')"><template #reference><slot /></template><slot name="content">{{ content }}</slot></FloatingPanel></template>

<script setup lang="ts">
import FloatingPanel from '../../utils/FloatingPanel.vue'
import type { FloatingProps } from '../../utils/floating'
defineOptions({ name: 'Tooltip' })
const props = withDefaults(defineProps<FloatingProps>(), { modelValue: undefined, disabled: false, teleport: true, trigger: 'hover' })
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'show' | 'hide'): void }>()
</script>