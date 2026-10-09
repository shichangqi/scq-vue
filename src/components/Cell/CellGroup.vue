<template><section class="scq-cell-group" :class="{ 'is-inset': inset }" :aria-label="title || undefined"><h3 v-if="title || $slots.title" class="scq-cell-group__title"><slot name="title">{{ title }}</slot></h3><div class="scq-cell-group__body"><slot /></div></section></template>

<script setup lang="ts">
defineOptions({ name: 'CellGroup' })
withDefaults(defineProps<{ title?: string; inset?: boolean }>(), { title: '', inset: false })
</script>