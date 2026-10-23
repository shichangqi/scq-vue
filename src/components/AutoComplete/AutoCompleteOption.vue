<template>
  <div :id="id" class="scq-auto-complete__option" role="option" :aria-selected="active" :aria-disabled="option.disabled || undefined" :aria-label="group ? `${group}: ${label}` : undefined" :aria-posinset="index + 1" :aria-setsize="total" @mousedown.prevent @mouseenter="!option.disabled && emit('activate')" @click="emit('select', option)">
    <slot :option="option" :index="index">
      <template v-for="(segment, segmentIndex) in segments" :key="segmentIndex"><mark v-if="segment.match" class="scq-auto-complete__match">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AutoCompleteOption } from './types'

const props = defineProps<{ option: AutoCompleteOption; index: number; total: number; id: string; active: boolean; query: string; highlight: boolean; group?: string }>()
const emit = defineEmits<{ (event: 'activate'): void; (event: 'select', option: AutoCompleteOption): void }>()
const label = computed(() => props.option.label || props.option.value)
const segments = computed(() => {
  if (!props.highlight || !props.query) return [{ text: label.value, match: false }]
  const pattern = new RegExp(props.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu')
  const result: { text: string; match: boolean }[] = []
  let start = 0
  for (const match of label.value.matchAll(pattern)) {
    const index = match.index!
    if (index > start) result.push({ text: label.value.slice(start, index), match: false })
    result.push({ text: match[0], match: true })
    start = index + match[0].length
  }
  if (start < label.value.length) result.push({ text: label.value.slice(start), match: false })
  return result
})
</script>
