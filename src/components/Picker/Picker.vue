<template>
  <section class="scq-picker" :aria-busy="loading" :aria-label="title || text('choose')">
    <header v-if="showToolbar" class="scq-picker__toolbar">
      <button type="button" @click="emit('cancel')">{{ cancelText || text('cancel') }}</button>
      <strong>{{ title }}</strong>
      <button type="button" class="scq-picker__confirm" :disabled="isDisabled || loading || !complete" @click="confirm">{{ confirmText || text('confirm') }}</button>
    </header>
    <div v-if="loading" class="scq-picker__loading" role="status">{{ text('loading') }}</div>
    <div v-else class="scq-picker__columns">
      <div v-for="(column, columnIndex) in state.columns" :key="columnIndex" class="scq-picker__column" role="listbox" :tabindex="isDisabled ? -1 : 0" :aria-label="`${title || text('choose')} ${columnIndex + 1}`" :aria-disabled="isDisabled" :aria-activedescendant="state.selected[columnIndex] ? `${pickerId}-${columnIndex}-${column.indexOf(state.selected[columnIndex]!)}` : undefined" @keydown="keydown($event, columnIndex)">
        <button v-for="(option, optionIndex) in column" :id="`${pickerId}-${columnIndex}-${optionIndex}`" :key="option.value" type="button" role="option" tabindex="-1" :aria-selected="option.value === state.selected[columnIndex]?.value" :disabled="isDisabled || option.disabled" @click="choose(columnIndex, option)"><slot name="option" :option="option" :column-index="columnIndex">{{ option.label }}</slot></button>
        <span v-if="!column.length" class="scq-picker__empty">{{ text('empty') }}</span>
      </div>
      <span v-if="!state.columns.length" class="scq-picker__empty">{{ text('empty') }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'

export type PickerValue = string | number
export interface PickerOption { label: string; value: PickerValue; disabled?: boolean; children?: PickerOption[] }
export interface PickerSelection { values: PickerValue[]; options: PickerOption[] }
defineOptions({ name: 'Picker' })
const props = withDefaults(defineProps<{
  modelValue?: PickerValue[]
  columns?: PickerOption[] | PickerOption[][]
  title?: string
  showToolbar?: boolean
  disabled?: boolean
  loading?: boolean
  confirmText?: string
  cancelText?: string
}>(), { columns: () => [], title: '', showToolbar: true, disabled: undefined, loading: false })
const emit = defineEmits<{
  (event: 'update:modelValue', value: PickerValue[]): void
  (event: 'change' | 'confirm', value: PickerSelection): void
  (event: 'cancel'): void
}>()
const config = useConfig()
const text = useLocale()
const pickerId = useComponentId('scq-picker')
const internal = ref<PickerValue[]>([])
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const normalize = (values: PickerValue[]) => {
  const columns: PickerOption[][] = []
  const selected: (PickerOption | undefined)[] = []
  if (Array.isArray(props.columns[0])) {
    for (const [index, column] of (props.columns as PickerOption[][]).entries()) {
      columns.push(column)
      selected.push(column.find((option) => option.value === values[index] && !option.disabled) || column.find((option) => !option.disabled))
    }
  } else if (props.columns.length) {
    let column = props.columns as PickerOption[]
    while (column) {
      const option = column.find((item) => item.value === values[columns.length] && !item.disabled) || column.find((item) => !item.disabled)
      columns.push(column)
      selected.push(option)
      if (!option?.children) break
      column = option.children
    }
  }
  return { columns, selected }
}
const state = computed(() => normalize(props.modelValue ?? internal.value))
const complete = computed(() => state.value.selected.length > 0 && state.value.selected.every(Boolean))
const selection = (selected = state.value.selected): PickerSelection => {
  const options = selected.filter((option): option is PickerOption => Boolean(option))
  return { values: options.map((option) => option.value), options }
}
const choose = (columnIndex: number, option: PickerOption) => {
  if (isDisabled.value || props.loading || option.disabled) return
  const values = selection().values
  values[columnIndex] = option.value
  const result = selection(normalize(values).selected)
  internal.value = result.values
  emit('update:modelValue', result.values)
  emit('change', result)
}
const keydown = (event: KeyboardEvent, columnIndex: number) => {
  const options = state.value.columns[columnIndex].filter((option) => !option.disabled)
  const index = options.findIndex((option) => option.value === state.value.selected[columnIndex]?.value)
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowDown' ? Math.min(index + 1, options.length - 1) : event.key === 'ArrowUp' ? Math.max(index - 1, 0) : -1
  if (target >= 0 && options[target]) {
    event.preventDefault()
    choose(columnIndex, options[target])
  } else if (event.key === 'Enter') { event.preventDefault(); confirm() }
}
const confirm = () => {
  if (isDisabled.value || props.loading || !complete.value) return
  const result = selection()
  internal.value = result.values
  emit('update:modelValue', result.values)
  emit('confirm', result)
}
defineExpose({ confirm, getSelected: () => selection() })
</script>