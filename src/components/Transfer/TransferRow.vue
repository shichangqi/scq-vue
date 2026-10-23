<template>
  <component :is="virtual ? 'div' : 'li'" class="scq-transfer__item" role="listitem" :data-transfer-index="index" :aria-setsize="size" :aria-posinset="index + 1">
    <label :class="{ 'is-disabled': disabled }"><input type="checkbox" :checked="checked" :disabled="disabled" :tabindex="virtual ? (active && !disabled ? 0 : -1) : undefined"     @change="check" @focus="emit('focus')" @keydown="emit('keydown', $event)" /><slot :item="item" :index="index" :side="side" :checked="checked" :disabled="disabled">{{ item.label }}</slot></label>
  </component>
</template>

<script setup lang="ts">
import type { TransferItem, TransferSide, TransferSlots } from './types'

const props = defineProps<{ item: TransferItem; index: number; side: TransferSide; size: number; checked: boolean; disabled: boolean; virtual: boolean; active: boolean }>()
defineSlots<Pick<TransferSlots, 'default'>>()
const emit = defineEmits<{
  (event: 'focus'): void
  (event: 'check', checked: boolean): void
  (event: 'keydown', value: KeyboardEvent): void
}>()
const check = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!props.disabled) emit('check', input.checked)
  input.checked = props.checked
}
</script>
