<template><FloatingPanel v-bind="props" variant="popover" @update:model-value="emit('update:modelValue', $event)" @show="emit('show')" @hide="emit('hide')"><template #reference><slot name="reference" /></template><div v-if="title" class="scq-popover__title">{{ title }}</div><slot>{{ content }}</slot></FloatingPanel></template>

<script setup lang="ts">
import FloatingPanel from '../../utils/FloatingPanel.vue'
import type { FloatingProps } from '../../utils/floating'
defineOptions({ name: 'Popover' })
const props = withDefaults(defineProps<FloatingProps & { title?: string }>(), { modelValue: undefined, disabled: false, teleport: true, trigger: 'click', placement: 'bottom', width: 240, title: '' })
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'show' | 'hide'): void }>()
</script>