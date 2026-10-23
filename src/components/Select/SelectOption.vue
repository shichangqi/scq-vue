<template>
  <div :id="id" class="scq-select__option" :class="{ 'is-selected': selected, 'is-active': active, 'is-disabled': option.disabled }" role="option" :aria-selected="selected" :aria-disabled="option.disabled || undefined" :aria-posinset="index + 1" :aria-setsize="total" @mousedown.prevent @mouseenter="!option.disabled && emit('activate', index)" @click="emit('select', option)">
    <span><slot :option="option" :index="index">{{ option.label }}</slot></span>
    <span v-if="selected" class="scq-select__check" aria-hidden="true">✓</span>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from './types'
defineProps<{ option: SelectOption; index: number; total: number; id?: string; selected: boolean; active: boolean }>()
const emit = defineEmits<{ (event: 'activate', index: number): void; (event: 'select', option: SelectOption): void }>()
</script>
