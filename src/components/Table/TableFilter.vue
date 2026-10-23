<template>
  <Popover :model-value="open" :width="TABLE_DEFAULTS.filterPanelWidth" :aria-label="label" @update:model-value="setOpen">
    <template #reference>
      <button ref="trigger" type="button" class="scq-table__filter" :class="{ 'is-active': modelValue.length }" :aria-label="label" :aria-expanded="open" :aria-pressed="Boolean(modelValue.length)">
        {{ text('filter') }}<Icon name="chevronDown" />
      </button>
    </template>
    <div class="scq-table__filter-panel">
      <Select :model-value="column.filterMultiple === false ? draft[0] ?? null : draft" :options="column.filters" :multiple="column.filterMultiple !== false" :teleported="false" :aria-label="label" @update:model-value="updateDraft" />
      <div class="scq-table__filter-actions">
        <button type="button" @click="commit([])">{{ text('reset') }}</button>
        <button type="button" @click="close">{{ text('cancel') }}</button>
        <button type="button" @click="commit(draft)">{{ text('apply') }}</button>
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Popover from '../Popover/Popover.vue'
import Select from '../Select/Select.vue'
import { useLocale } from '../ConfigProvider/context'
import { TABLE_DEFAULTS } from './constants'
import type { TableColumn, TableFilterValue } from './types'

const props = defineProps<{ column: TableColumn; modelValue: TableFilterValue[] }>()
const emit = defineEmits<{ (event: 'apply', values: TableFilterValue[]): void }>()
const text = useLocale()
const label = computed(() => `${text('filter')} ${props.column.label}`)
const open = ref(false)
const draft = ref<TableFilterValue[]>([])
const trigger = ref<HTMLButtonElement>()

const setOpen = (value: boolean) => {
  if (value) draft.value = [...props.modelValue]
  open.value = value
}
const updateDraft = (value: TableFilterValue | TableFilterValue[] | null) => {
  draft.value = value === null ? [] : Array.isArray(value) ? [...value] : [value]
}
const close = () => {
  open.value = false
  void nextTick(() => trigger.value?.focus())
}
const commit = (values: TableFilterValue[]) => {
  emit('apply', props.column.filterMultiple === false ? values.slice(0, 1) : [...values])
  close()
}
watch(() => [...props.modelValue], (value, previous) => {
  if (open.value && (value.length !== previous.length || value.some((entry, index) => entry !== previous[index]))) draft.value = value
})
</script>
