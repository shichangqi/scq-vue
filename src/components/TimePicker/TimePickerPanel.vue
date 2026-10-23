<template>
  <div class="scq-time-picker__columns">
    <div v-for="column in columns" :key="column.part" class="scq-time-picker__column-wrap">
      <div class="scq-time-picker__column-header">{{ text(column.part) }}</div>
      <div
        :ref="(element) => setColumnRef(column.part, element)"
        class="scq-time-picker__column"
        role="group"
        :aria-label="text(column.part)"
        :data-part="column.part"
      >
        <button
          v-for="option in column.options"
          :key="option.value"
          type="button"
          class="scq-time-picker__cell"
          :class="{ 'is-selected': option.selected, 'is-disabled': option.disabled }"
          :disabled="option.disabled"
          :aria-pressed="option.selected"
          :tabindex="option.value === column.tabValue ? 0 : -1"
          :data-value="option.value"
          @click="emit('select', column.part, option.value)"
          @keydown="keydown($event, column.part, option.value)"
        >
          {{ padTimePart(option.value) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { padTimePart, parseTime, TIME_HOURS, TIME_MINUTES, TIME_PARTS, TIME_SECONDS, type TimePart } from '../../utils/time'

const props = withDefaults(defineProps<{
  modelValue?: string
  seconds?: boolean
  minutes?: readonly number[]
  secondValues?: readonly number[]
  disabled?: boolean
  disabledPart?: (part: TimePart, value: number) => boolean
}>(), { seconds: false, minutes: () => TIME_MINUTES, secondValues: () => TIME_SECONDS, disabled: false })
const emit = defineEmits<{ (event: 'select', part: TimePart, value: number): void }>()
const text = useLocale()
const columnRefs: Partial<Record<TimePart, HTMLElement>> = {}
const columns = computed(() => {
  const selected = parseTime(props.modelValue)
  const values = { hour: TIME_HOURS, minute: props.minutes, second: props.secondValues }
  return TIME_PARTS.filter((part) => props.seconds || part !== 'second').map((part) => {
    const options = values[part].map((value) => ({
      value,
      selected: selected?.[part] === value,
      disabled: props.disabled || Boolean(props.disabledPart?.(part, value)),
    }))
    return { part, options, tabValue: (options.find((option) => option.selected && !option.disabled) || options.find((option) => !option.disabled))?.value }
  })
})

const setColumnRef = (part: TimePart, element: unknown) => {
  if (element instanceof HTMLElement) columnRefs[part] = element
  else delete columnRefs[part]
}
const scrollToSelection = async () => {
  await nextTick()
  for (const column of Object.values(columnRefs)) {
    const selected = column.querySelector<HTMLButtonElement>('.is-selected')
    if (selected) {
      column.scrollTop = Math.max(0, column.scrollTop + selected.getBoundingClientRect().top - column.getBoundingClientRect().top - (column.clientHeight - selected.offsetHeight) / 2)
    }
  }
}
const keydown = async (event: KeyboardEvent, part: TimePart, value: number) => {
  const options = columns.value.find((column) => column.part === part)?.options.filter((option) => !option.disabled) || []
  if (!options.length) return
  let index = options.findIndex((option) => option.value === value)
  if (event.key === 'ArrowDown') index = (index + 1) % options.length
  else if (event.key === 'ArrowUp') index = (index - 1 + options.length) % options.length
  else if (event.key === 'Home') index = 0
  else if (event.key === 'End') index = options.length - 1
  else return
  event.preventDefault()
  const next = options[index].value
  emit('select', part, next)
  await nextTick()
  columnRefs[part]?.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus()
}

onMounted(scrollToSelection)
watch(() => props.modelValue, scrollToSelection)
</script>
