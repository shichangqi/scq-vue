<template>
  <span class="scq-tag" :aria-label="!selectable ? ariaLabel || undefined : undefined" :class="[`scq-tag--${type}`, `scq-tag--${size || config.size}`, `scq-tag--${effect}`, { 'is-selected': selectable && selected, 'is-disabled': isDisabled, 'is-round': round }]">
    <component :is="selectable ? 'button' : 'span'" :id="textId" class="scq-tag__text" :class="{ 'scq-tag__select': selectable }" :type="selectable ? 'button' : undefined" :disabled="selectable ? isDisabled : undefined" :aria-label="selectable ? ariaLabel || undefined : undefined" :aria-pressed="selectable ? selected : undefined" @click="toggle"><slot name="icon"><Icon v-if="icon" :name="icon" :size="ICON_SIZE" /></slot><slot /></component>
    <button v-if="closable" type="button" class="scq-tag__close" :disabled="isDisabled" :aria-label="closeLabel || text('close')" :aria-describedby="textId" @click.stop="close"><Icon name="close" :size="ICON_SIZE" /></button>
  </span>
</template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { useFormDisabled } from '../Form/useFormControl'
import { useComponentId } from '../../utils/id'
export interface TagProps { type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'; size?: ComponentSize; effect?: 'light' | 'dark' | 'plain'; closable?: boolean; selectable?: boolean; selected?: boolean; disabled?: boolean; icon?: IconName; round?: boolean; ariaLabel?: string; closeLabel?: string }
const ICON_SIZE = 12
defineOptions({ name: 'Tag' })
const props = withDefaults(defineProps<TagProps>(), { type: 'primary', effect: 'light', closable: false, selectable: false, selected: false, disabled: undefined, round: false, ariaLabel: '', closeLabel: '' })
const emit = defineEmits<{ (event: 'close', value: MouseEvent): void; (event: 'update:selected' | 'change', value: boolean): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = useFormDisabled(() => props.disabled)
const textId = useComponentId('scq-tag-text')
const toggle = () => { if (props.selectable && !isDisabled.value) { emit('update:selected', !props.selected); emit('change', !props.selected) } }
const close = (event: MouseEvent) => { if (!isDisabled.value) emit('close', event) }
</script>