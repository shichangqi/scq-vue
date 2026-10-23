<template>
  <article ref="rootRef" class="scq-card" :class="[`scq-card--${shadow}`, `scq-card--${resolvedSize}`, { 'is-bordered': bordered, 'is-interactive': interactive, 'is-selected': isSelected, 'is-disabled': interactive && isDisabled, 'is-focused': focused }]" :aria-busy="loading" :aria-label="ariaLabel || undefined" @click="click">
    <button v-if="interactive" class="scq-card__control" type="button" :disabled="isDisabled || loading" :aria-pressed="selectable ? isSelected : undefined" :aria-label="ariaLabel || (!header && !$slots.header ? text(selectable ? 'selectCard' : 'openCard') : undefined)" :aria-labelledby="!ariaLabel && (header || $slots.header) ? titleId : undefined" @click.stop="activate" @focus="focused = true" @blur="focused = false"></button>
    <div v-if="$slots.media" class="scq-card__media" :class="{ 'has-ratio': mediaRatio !== undefined }" :style="{ aspectRatio: mediaRatio }"><slot name="media" /></div>
    <header v-if="header || $slots.header" class="scq-card__header"><div :id="titleId" class="scq-card__title"><slot name="header">{{ header }}</slot></div><div v-if="$slots.extra" class="scq-card__extra"><slot name="extra" /></div></header>
    <div class="scq-card__body" :style="{ padding: bodyPadding, ...bodyStyle }"><Skeleton v-if="loading" :rows="CARD_DEFAULTS.skeletonRows" /><div v-show="!loading"><slot /></div></div>
    <footer v-if="$slots.footer" class="scq-card__footer"><slot name="footer" /></footer>
    <div v-if="$slots.actions" class="scq-card__actions" data-card-interactive><slot name="actions" /></div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Skeleton from '../Skeleton/Skeleton.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useFormDisabled } from '../Form/useFormControl'
import { useComponentId } from '../../utils/id'
import { useContentFocus } from '../../utils/focus'
import { toCssLength } from '../../utils/layout'
import { CARD_DEFAULTS, CARD_INTERACTIVE_SELECTOR } from './constants'
import type { CardProps } from './types'
defineOptions({ name: 'Card' })
const props = withDefaults(defineProps<CardProps>(), { header: '', shadow: 'never', bordered: true, loading: false, clickable: false, selectable: false, selected: undefined, disabled: undefined, ariaLabel: '' })
const emit = defineEmits<{
  (event: 'click', value: MouseEvent): void
  (event: 'update:selected', value: boolean): void
  (event: 'select', value: boolean, originalEvent: MouseEvent): void
}>()
const config = useConfig()
const text = useLocale()
const titleId = useComponentId('scq-card-title')
const rootRef = ref<HTMLElement>()
useContentFocus(() => rootRef.value, () => props.loading)
const focused = ref(false)
const localSelected = ref(false)
const isSelected = computed(() => props.selected ?? localSelected.value)
const isDisabled = useFormDisabled(() => props.disabled)
const interactive = computed(() => props.clickable || props.selectable)
const resolvedSize = computed(() => props.size ?? config.value.size)
const bodyPadding = computed(() => {
  const value = props.padding ?? CARD_DEFAULTS.padding[resolvedSize.value]
  return toCssLength(value)
})
const activate = (event: MouseEvent) => {
  if (!interactive.value || isDisabled.value || props.loading) return
  emit('click', event)
  if (!props.selectable || event.defaultPrevented) return
  const next = !isSelected.value
  if (props.selected === undefined) localSelected.value = next
  emit('update:selected', next)
  emit('select', next, event)
}
const click = (event: MouseEvent) => {
  if (!interactive.value) { if (!props.disabled) emit('click', event); return }
  const nested = event.target instanceof Element ? event.target.closest(CARD_INTERACTIVE_SELECTOR) : null
  if (nested && nested !== event.currentTarget && event.currentTarget instanceof Element && event.currentTarget.contains(nested)) return
  activate(event)
}
watch(() => props.selected, (value) => { if (value !== undefined) localSelected.value = value }, { immediate: true })
watch(() => props.mediaRatio, (value) => {
  if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) throw new RangeError('[scq-vue] Card mediaRatio must be positive.')
}, { immediate: true })
</script>