<template>
  <div class="scq-transfer" :class="{ 'is-disabled': isDisabled }">
    <template v-for="(panel, side) in panels" :key="side">
      <section class="scq-transfer__panel" :aria-label="titles?.[side] || text(side ? 'selected' : 'available')">
        <header><label><input type="checkbox" :checked="allChecked(panel)" :indeterminate="someChecked(panel) && !allChecked(panel)" :disabled="isDisabled || !panel.some(item => !item.disabled)" @change="toggleAll(panel, ($event.target as HTMLInputElement).checked)" /><span>{{ titles?.[side] || text(side ? 'selected' : 'available') }}</span></label><span class="scq-transfer__count">{{ panel.filter(item => checked.includes(item.key)).length }} / {{ panel.length }}</span></header>
        <input v-if="filterable" v-model="queries[side]" type="search" class="scq-transfer__search" :placeholder="filterPlaceholder || text('search')" :aria-label="`${text('search')} ${titles?.[side] || text(side ? 'selected' : 'available')}`" :disabled="isDisabled" />
        <ul><li v-for="item in panel" :key="item.key"><label :class="{ 'is-disabled': item.disabled || isDisabled }"><input type="checkbox" :checked="checked.includes(item.key)" :disabled="isDisabled || item.disabled" @change="toggle(item.key, ($event.target as HTMLInputElement).checked)" /><slot :item="item">{{ item.label }}</slot></label></li><li v-if="!panel.length" class="scq-transfer__empty">{{ text('empty') }}</li></ul>
        <footer v-if="side ? $slots['right-footer'] : $slots['left-footer']"><slot :name="side ? 'right-footer' : 'left-footer'" /></footer>
      </section>
      <div v-if="!side" class="scq-transfer__actions"><button type="button" :disabled="isDisabled || !movable('right').length" :aria-label="text('moveRight')" :title="text('moveRight')" @click="move('right')"><Icon name="arrowRight" :size="18" /></button><button type="button" :disabled="isDisabled || !movable('left').length" :aria-label="text('moveLeft')" :title="text('moveLeft')" @click="move('left')"><Icon name="arrowLeft" :size="18" /></button></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'

export type TransferKey = string | number
export interface TransferItem { key: TransferKey; label: string; disabled?: boolean; [key: string]: unknown }
defineOptions({ name: 'Transfer' })
const props = withDefaults(defineProps<{ modelValue?: TransferKey[]; data?: TransferItem[]; disabled?: boolean; filterable?: boolean; filterPlaceholder?: string; filterMethod?: (query: string, item: TransferItem) => boolean; titles?: [string, string] }>(), { data: () => [], disabled: undefined, filterable: false, filterPlaceholder: '' })
const emit = defineEmits<{
  (event: 'update:modelValue', value: TransferKey[]): void
  (event: 'change', value: TransferKey[], direction: 'left' | 'right', moved: TransferKey[]): void
  (event: 'check-change', value: TransferKey[]): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref<TransferKey[]>([])
const value = computed(() => props.modelValue ?? internal.value)
const queries = ref(['', ''])
const checked = ref<TransferKey[]>([])
const panels = computed(() => [0, 1].map((side) => props.data.filter((item) => value.value.includes(item.key) === Boolean(side)).filter((item) => props.filterMethod ? props.filterMethod(queries.value[side], item) : item.label.toLocaleLowerCase().includes(queries.value[side].toLocaleLowerCase()))))
const allChecked = (items: TransferItem[]) => items.some((item) => !item.disabled) && items.filter((item) => !item.disabled).every((item) => checked.value.includes(item.key))
const someChecked = (items: TransferItem[]) => items.some((item) => !item.disabled && checked.value.includes(item.key))
const toggle = (key: TransferKey, selected: boolean) => {
  if (isDisabled.value || props.data.find((item) => item.key === key)?.disabled) return
  checked.value = selected ? [...new Set([...checked.value, key])] : checked.value.filter((entry) => entry !== key)
  emit('check-change', [...checked.value])
}
const toggleAll = (items: TransferItem[], selected: boolean) => {
  if (isDisabled.value) return
  const keys = items.filter((item) => !item.disabled).map((item) => item.key)
  checked.value = selected ? [...new Set([...checked.value, ...keys])] : checked.value.filter((key) => !keys.includes(key))
  emit('check-change', [...checked.value])
}
const movable = (direction: 'left' | 'right') => props.data.filter((item) => !item.disabled && checked.value.includes(item.key) && value.value.includes(item.key) === (direction === 'left')).map((item) => item.key)
const move = (direction: 'left' | 'right') => {
  if (isDisabled.value) return
  const keys = movable(direction)
  if (!keys.length) return
  const next = direction === 'right' ? [...new Set([...value.value, ...keys])] : value.value.filter((key) => !keys.includes(key))
  internal.value = next
  checked.value = checked.value.filter((key) => !keys.includes(key))
  emit('update:modelValue', next)
  emit('change', next, direction, keys)
  emit('check-change', [...checked.value])
}
watch(() => props.data, () => { checked.value = checked.value.filter((key) => props.data.some((item) => item.key === key && !item.disabled)) })
defineExpose({ clearQuery: (side: 'left' | 'right') => { queries.value[side === 'left' ? 0 : 1] = '' } })
</script>