<template>
  <section v-bind="$attrs" class="scq-cell-group" :class="{ 'is-inset': inset }" :aria-label="($attrs['aria-label'] as string | undefined) || title || undefined" :aria-labelledby="($attrs['aria-labelledby'] as string | undefined) || (!$attrs['aria-label'] && hasContentSlot('title') ? titleId : undefined)" :aria-describedby="[$attrs['aria-describedby'], description || hasContentSlot('description') ? descriptionId : undefined, footer || hasContentSlot('footer') ? footerId : undefined].filter(Boolean).join(' ') || undefined">
    <h3 v-if="title || hasContentSlot('title')" :id="titleId" class="scq-cell-group__title"><slot v-if="hasContentSlot('title')" name="title" /><template v-else>{{ title }}</template></h3>
    <p v-if="description || hasContentSlot('description')" :id="descriptionId" class="scq-cell-group__description"><slot v-if="hasContentSlot('description')" name="description" /><template v-else>{{ description }}</template></p>
    <div class="scq-cell-group__body"><slot /></div>
    <footer v-if="footer || hasContentSlot('footer')" :id="footerId" class="scq-cell-group__footer"><slot v-if="hasContentSlot('footer')" name="footer" /><template v-else>{{ footer }}</template></footer>
  </section>
</template>

<script setup lang="ts">
import { useComponentId } from '../../utils/id'
import { useSlots } from 'vue'
import { hasSlotContent } from '../../utils/slots'
export interface CellGroupProps { title?: string; inset?: boolean; description?: string; footer?: string }
defineOptions({ name: 'CellGroup', inheritAttrs: false })
withDefaults(defineProps<CellGroupProps>(), { title: '', inset: false, description: '', footer: '' })
const slots = useSlots()
const hasContentSlot = (name: 'title' | 'description' | 'footer') => hasSlotContent(slots[name]?.() ?? [])
const groupId = useComponentId('scq-cell-group')
const titleId = `${groupId}-title`
const descriptionId = `${groupId}-description`
const footerId = `${groupId}-footer`
</script>