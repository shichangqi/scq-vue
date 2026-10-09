<template>
  <div class="scq-cascader">
    <Popover v-model="opened" :disabled="isDisabled || readonly" :teleport="teleport" width="max-content" placement="bottom-start" :aria-label="ariaLabel || text('choose')">
      <template #reference><span class="scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]"><button :id="id || undefined" ref="triggerRef" class="scq-field__trigger" type="button" :disabled="isDisabled || readonly" aria-haspopup="listbox" :aria-expanded="opened" :aria-label="ariaLabel || placeholder || text('choose')" @keydown.down.prevent="opened = true"><span class="scq-field__value" :class="{ 'scq-field__placeholder': !selectedPath.length }">{{ selectedPath.map(option => option.label).join(separator) || placeholder || text('choose') }}</span><Icon name="chevronDown" :size="16" /></button><button v-if="clearable && selectedPath.length && !isDisabled && !readonly" class="scq-field__clear" type="button" :aria-label="text('clear')" @click.stop="clear"><Icon name="close" :size="14" /></button></span></template>
      <div class="scq-cascader__panel">
        <input v-if="filterable" v-model="query" type="search" class="scq-cascader__filter" :placeholder="text('search')" :aria-label="text('search')" />
        <ul v-if="query" class="scq-cascader__results" role="listbox" :aria-label="text('suggestions')"><li v-for="(path, index) in results" :key="index" role="option" :aria-selected="samePath(path, selectedPath)"><button type="button" @click="commit(path)">{{ path.map(option => option.label).join(separator) }}</button></li><li v-if="!results.length" role="presentation" class="scq-cascader__empty">{{ text('empty') }}</li></ul>
        <div v-else class="scq-cascader__columns"><ul v-for="(column, columnIndex) in columns" :key="columnIndex" role="listbox" :aria-label="`${ariaLabel || text('choose')} ${columnIndex + 1}`"><li v-for="option in column" :key="option.value" role="option" :aria-selected="expanded[columnIndex] === option.value" :aria-disabled="option.disabled"><button type="button" :disabled="option.disabled" @click="choose(columnIndex, option)" @keydown="keydown($event, columnIndex, option)"><slot :option="option">{{ option.label }}</slot><Icon v-if="option.children?.length" name="chevronRight" :size="14" /></button></li><li v-if="!column.length" role="presentation" class="scq-cascader__empty">{{ text('empty') }}</li></ul></div>
      </div>
    </Popover>
    <input v-if="name" type="hidden" :name="name" :value="Array.isArray(value) ? JSON.stringify(value) : value ?? ''" :disabled="isDisabled" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import type { PickerOption, PickerValue } from '../Picker/Picker.vue'

export type CascaderOption = PickerOption
export type CascaderValue = PickerValue | PickerValue[] | null
defineOptions({ name: 'Cascader' })
const props = withDefaults(defineProps<{ modelValue?: CascaderValue; options?: CascaderOption[]; emitPath?: boolean; changeOnSelect?: boolean; filterable?: boolean; separator?: string; disabled?: boolean; readonly?: boolean; clearable?: boolean; placeholder?: string; size?: ComponentSize; ariaLabel?: string; id?: string; name?: string; teleport?: boolean | string }>(), { options: () => [], emitPath: true, changeOnSelect: false, filterable: false, separator: ' / ', disabled: undefined, readonly: false, clearable: true, placeholder: '', ariaLabel: '', id: '', name: '', teleport: true })
const emit = defineEmits<{
  (event: 'update:modelValue', value: CascaderValue): void
  (event: 'change', value: CascaderValue, path: CascaderOption[]): void
  (event: 'clear'): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref<CascaderValue>(null)
const value = computed(() => props.modelValue !== undefined ? props.modelValue : internal.value)
const opened = ref(false)
const query = ref('')
const triggerRef = ref<HTMLButtonElement>()
const expanded = ref<PickerValue[]>([])
const paths = computed(() => {
  const result: CascaderOption[][] = []
  const walk = (options: CascaderOption[], path: CascaderOption[]) => options.forEach((option) => { const next = [...path, option]; result.push(next); if (option.children) walk(option.children, next) })
  walk(props.options, [])
  return result
})
const selectedPath = computed(() => paths.value.find((path) => Array.isArray(value.value) ? path.length === value.value.length && path.every((option, index) => option.value === (value.value as PickerValue[])[index]) : path[path.length - 1].value === value.value) || [])
const samePath = (left: CascaderOption[], right: CascaderOption[]) => left.length === right.length && left.every((option, index) => option.value === right[index]?.value)
const results = computed(() => paths.value.filter((path) => !path.some((option) => option.disabled) && (props.changeOnSelect || !path[path.length - 1].children?.length) && path.map((option) => option.label).join(props.separator).toLocaleLowerCase().includes(query.value.toLocaleLowerCase())))
const columns = computed(() => {
  const result = [props.options]
  for (const key of expanded.value) {
    const option = result[result.length - 1].find((entry) => entry.value === key)
    if (!option?.children?.length || option.disabled) break
    result.push(option.children)
  }
  return result
})
const commit = (path: CascaderOption[], close = true) => {
  if (isDisabled.value || props.readonly || path.some((option) => option.disabled)) return
  const next = props.emitPath ? path.map((option) => option.value) : path[path.length - 1]?.value ?? null
  internal.value = next
  emit('update:modelValue', next)
  emit('change', next, path)
  if (close) { opened.value = false; triggerRef.value?.focus() }
}
const choose = (columnIndex: number, option: CascaderOption) => {
  if (option.disabled || isDisabled.value || props.readonly) return
  expanded.value = [...expanded.value.slice(0, columnIndex), option.value]
  const path = paths.value.find((entry) => entry.length === expanded.value.length && entry.every((item, index) => item.value === expanded.value[index])) || []
  if (!option.children?.length || props.changeOnSelect) commit(path, !option.children?.length)
}
const clear = () => { if (isDisabled.value || props.readonly) return; commit([]); expanded.value = []; emit('clear') }
const keydown = async (event: KeyboardEvent, columnIndex: number, option: CascaderOption) => {
  const list = (event.currentTarget as HTMLElement).closest('ul')!
  const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
  const index = buttons.indexOf(event.currentTarget as HTMLButtonElement)
  const target = event.key === 'ArrowDown' ? (index + 1) % buttons.length : event.key === 'ArrowUp' ? (index - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : -1
  if (target >= 0) { event.preventDefault(); buttons[target]?.focus() }
  else if (event.key === 'ArrowRight' && option.children?.length) { event.preventDefault(); choose(columnIndex, option); await nextTick(); list.nextElementSibling?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus() }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); list.previousElementSibling?.querySelector<HTMLButtonElement>('[aria-selected="true"] button')?.focus() }
}
watch(opened, (value) => { query.value = ''; if (value) expanded.value = selectedPath.value.map((option) => option.value) })
watch([isDisabled, () => props.readonly], () => { opened.value = false })
defineExpose({ focus: () => triggerRef.value?.focus(), clear })
</script>