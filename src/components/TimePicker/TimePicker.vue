<template>
  <div v-bind="field.rootAttrs.value" class="scq-time-picker" :class="{ 'is-range': isRange }">
    <Popover
      v-model="opened"
      :disabled="isDisabled || readonly"
      :teleport="teleport"
      placement="bottom-start"
      :width="panelWidth"
      :aria-label="ariaLabel || text('chooseTime')"
      :initial-focus="keyboardOpening ? initialFocus : false"
    >
      <template #reference>
        <div
          class="scq-field scq-time-picker__field"
          :class="[
            `scq-field--${size || config.size}`,
            {
              'is-disabled': isDisabled,
              'is-readonly': readonly,
              'is-open': opened,
              'is-invalid': invalid,
            }
          ]"
        >
          <Icon name="clock" :size="16" class="scq-time-picker__icon" />
          <template v-for="(_, index) in (isRange ? 2 : 1)" :key="index">
            <span v-if="index" class="scq-time-picker__separator">~</span>
            <input
              :id="index ? undefined : id || undefined"
              :ref="(el) => setInputRef(index, el)"
              type="text"
              class="scq-time-picker__input"
              :value="values[index] || ''"
              :name="name ? (isRange ? `${name}[${index}]` : name) : undefined"
              :placeholder="getPlaceholder(index)"
              :disabled="isDisabled"
              :readonly="readonly"
              :aria-label="`${ariaLabel || text('chooseTime')}${isRange ? ` ${index + 1}` : ''}`"
              :aria-invalid="invalid || undefined"
              aria-haspopup="dialog"
              :aria-expanded="opened"
              autocomplete="off"
              spellcheck="false"
              v-bind="index ? endFieldAttrs : field.attrs.value"
              @click.stop="handleInputClick(index)"
              @change="change($event, index)"
              @keydown="handleKeydown($event, index)"
              @focus="handleFocus($event, index)"
              @blur="handleBlur($event, index)"
            />
          </template>
          <button
            v-if="clearable && values.some(Boolean) && !isDisabled && !readonly"
            class="scq-field__clear"
            type="button"
            :aria-label="text('clear')"
            @click.stop="clear"
          >
            <Icon name="close" :size="14" />
          </button>
        </div>
      </template>

      <div ref="panelRef" class="scq-time-picker__panel" :class="{ 'is-range': isRange }" @click.stop @focusout="field.touch">
        <template v-if="!isRange">
          <TimePickerPanel
            :model-value="values[0]"
            :seconds="seconds"
            :minutes="minutes"
            :second-values="secondsList"
            :disabled="isDisabled || readonly"
            :disabled-part="(part, value) => isTimePartDisabled(0, part, value)"
            @select="(part, value) => selectTimePart(0, part, value)"
          />
          <div class="scq-time-picker__footer">
            <button type="button" class="scq-time-picker__btn scq-time-picker__btn--now" @click="selectNow">
              {{ text('now') }}
            </button>
            <button type="button" class="scq-time-picker__btn scq-time-picker__btn--confirm" @click="confirm">
              {{ text('confirm') }}
            </button>
          </div>
        </template>

        <template v-else>
          <div class="scq-time-picker__range-panels">
            <div class="scq-time-picker__range-section">
              <div class="scq-time-picker__range-title">
                <span>{{ textStartTime }}</span>
                <span class="scq-time-picker__range-time">{{ values[0] || '--:--' }}</span>
              </div>
              <TimePickerPanel
                :model-value="values[0]"
                :seconds="seconds"
                :minutes="minutes"
                :second-values="secondsList"
                :disabled="isDisabled || readonly"
                :disabled-part="(part, value) => isTimePartDisabled(0, part, value)"
                @select="(part, value) => selectTimePart(0, part, value)"
              />
            </div>

            <div class="scq-time-picker__range-divider"></div>

            <div class="scq-time-picker__range-section">
              <div class="scq-time-picker__range-title">
                <span>{{ textEndTime }}</span>
                <span class="scq-time-picker__range-time">{{ values[1] || '--:--' }}</span>
              </div>
              <TimePickerPanel
                :model-value="values[1]"
                :seconds="seconds"
                :minutes="minutes"
                :second-values="secondsList"
                :disabled="isDisabled || readonly"
                :disabled-part="(part, value) => isTimePartDisabled(1, part, value)"
                @select="(part, value) => selectTimePart(1, part, value)"
              />
            </div>
          </div>
          <div class="scq-time-picker__footer scq-time-picker__footer--range">
            <button type="button" class="scq-time-picker__btn scq-time-picker__btn--confirm" @click="confirm">
              {{ text('confirm') }}
            </button>
          </div>
        </template>
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFormControl } from '../Form/useFormControl'
import Icon from '../Icon/Icon.vue'
import Popover from '../Popover/Popover.vue'
import TimePickerPanel from './TimePickerPanel.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { createTimeResolver, DEFAULT_TIME_PARTS, DEFAULT_TIME_STEP, formatTime as formatTimeParts, parseTime, TIME_HOURS, TIME_LIMITS, TIME_PARTS, timeOptions, timeValue, type TimePart } from '../../utils/time'

export type TimePickerValue = string | string[]

defineOptions({ name: 'TimePicker', inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: TimePickerValue
  isRange?: boolean
  seconds?: boolean
  step?: number
  min?: string
  max?: string
  allowOvernight?: boolean
  disabledTime?: (value: string) => boolean
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  placeholder?: string | string[]
  size?: ComponentSize
  ariaLabel?: string
  id?: string
  name?: string
  teleport?: boolean | string
  format?: string
}>(), {
  isRange: false,
  seconds: false,
  min: '',
  max: '',
  allowOvernight: false,
  disabled: undefined,
  readonly: false,
  clearable: true,
  placeholder: '',
  ariaLabel: '',
  id: '',
  name: '',
  teleport: true,
  format: '',
})

const emit = defineEmits<{
  (event: 'update:modelValue' | 'change', value: TimePickerValue): void
  (event: 'clear'): void
  (event: 'invalid', value: string): void
  (event: 'focus' | 'blur', value: FocusEvent): void
  (event: 'visible-change', opened: boolean): void
}>()

const config = useConfig()
const text = useLocale()
const internal = ref<TimePickerValue>(props.isRange ? ['', ''] : '')
const value = computed(() => props.modelValue ?? internal.value)
const values = computed<string[]>(() => {
  if (Array.isArray(value.value)) {
    return props.isRange ? [value.value[0] || '', value.value[1] || ''] : [value.value[0] || '']
  }
  return props.isRange ? [value.value || '', ''] : [value.value || '']
})

const inputs = ref<HTMLInputElement[]>([])
const panelRef = ref<HTMLElement>()
const field = useFormControl({
  element: () => inputs.value[0], id: () => props.id, disabled: () => props.disabled,
  ariaLabel: () => props.ariaLabel ? `${props.ariaLabel}${props.isRange ? ' 1' : ''}` : undefined,
  invalid: () => invalid.value,
  composite: true, contains: (target) => inputs.value.some((input) => input.contains(target)) || Boolean(panelRef.value?.contains(target)),
})
const isDisabled = field.disabled
const endFieldAttrs = computed(() => Object.fromEntries(Object.entries(field.attrs.value).filter(([key]) => !['id', 'aria-label', 'aria-labelledby'].includes(key))))
const opened = ref(false)
const invalid = ref(false)
const activeIndex = ref(0)
const keyboardOpening = ref(false)
const initialFocus = () => {
  const section = props.isRange ? panelRef.value?.querySelectorAll('.scq-time-picker__range-section')[activeIndex.value] : panelRef.value
  return section?.querySelector<HTMLElement>('[data-part="hour"] [tabindex="0"]:not(:disabled)')
    ?? panelRef.value?.closest<HTMLElement>('[role="dialog"]') ?? null
}
const textStartTime = computed(() => text('startTime'))
const textEndTime = computed(() => text('endTime'))

const panelWidth = computed(() => {
  if (props.isRange) {
    return props.seconds ? 420 : 300
  }
  return props.seconds ? 210 : 150
})

const getPlaceholder = (index: number) => {
  if (Array.isArray(props.placeholder)) return props.placeholder[index] || ''
  if (props.placeholder) return props.placeholder
  if (props.isRange) {
    return index === 0 ? textStartTime.value : textEndTime.value
  }
  return text('chooseTime')
}

const formatTime = (hour: number, minute: number, second: number) => formatTimeParts({ hour, minute, second }, props.seconds)

const minuteStep = computed(() => {
  if (!props.step) return DEFAULT_TIME_STEP
  if (!props.seconds) {
    return props.step >= TIME_LIMITS.minute ? Math.max(DEFAULT_TIME_STEP, Math.floor(props.step / TIME_LIMITS.minute)) : Math.max(DEFAULT_TIME_STEP, props.step)
  }
  return DEFAULT_TIME_STEP
})

const secondStep = computed(() => {
  if (!props.seconds) return DEFAULT_TIME_STEP
  return props.step && props.step < TIME_LIMITS.second ? Math.max(DEFAULT_TIME_STEP, props.step) : DEFAULT_TIME_STEP
})

const minutes = computed(() => timeOptions(TIME_LIMITS.minute, minuteStep.value))
const secondsList = computed(() => timeOptions(TIME_LIMITS.second, secondStep.value))
const allowed = (entry: string, index: number) => {
  const parsed = parseTime(entry)
  const min = parseTime(props.min)
  const max = parseTime(props.max)
  if (!parsed || props.min && !min || props.max && !max) return false
  const current = timeValue(parsed)
  if (min && current < timeValue(min) || max && current > timeValue(max)) return false
  const other = props.isRange && !props.allowOvernight ? parseTime(values.value[index ? 0 : 1]) : null
  if (other && (index ? current < timeValue(other) : current > timeValue(other))) return false
  return !props.disabledTime?.(entry)
}
const timeChoices = computed(() => values.value.map((value, index) => {
  const preferred = parseTime(value) || DEFAULT_TIME_PARTS
  const choices: Record<TimePart, Map<number, string>> = { hour: new Map(), minute: new Map(), second: new Map() }
  let min = parseTime(props.min) || undefined
  let max = parseTime(props.max) || undefined
  const other = props.isRange && !props.allowOvernight ? parseTime(values.value[index ? 0 : 1]) : null
  if (other && index && (!min || timeValue(other) > timeValue(min))) min = other
  if (other && !index && (!max || timeValue(other) < timeValue(max))) max = other
  const resolve = createTimeResolver({
    values: { hour: TIME_HOURS, minute: minutes.value, second: props.seconds ? secondsList.value : [0] },
    min, max, disabled: (parts) => !allowed(formatTimeParts(parts, props.seconds), index),
  })
  const options = { hour: TIME_HOURS, minute: minutes.value, second: props.seconds ? secondsList.value : [] }
  for (const part of TIME_PARTS) {
    for (const option of options[part]) {
      const fixed = part === 'hour' ? { hour: option } : part === 'minute' ? { hour: preferred.hour, minute: option } : { ...preferred, second: option }
      const candidate = resolve(preferred, fixed)
      if (candidate) choices[part].set(option, formatTimeParts(candidate, props.seconds))
    }
  }
  return choices
}))
const isTimePartDisabled = (index: number, part: TimePart, value: number) => !timeChoices.value[index][part].has(value)
const reject = (value: string) => { invalid.value = true; emit('invalid', value); return false }

const update = (next: TimePickerValue) => {
  internal.value = next
  emit('update:modelValue', next)
  emit('change', next)
}

const commit = (entry: string, index: number) => {
  if (!allowed(entry, index)) return reject(entry)
  const next = [...values.value]
  next[index] = entry
  invalid.value = false
  update(props.isRange ? next : entry)
  return true
}

const selectTimePart = (index: number, part: TimePart, val: number) => {
  if (isDisabled.value || props.readonly) return
  const candidate = timeChoices.value[index][part].get(val)
  if (!candidate) { reject(String(val)); return }
  commit(candidate, index)
}

const selectNow = () => {
  if (isDisabled.value || props.readonly) return
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const roundedM = Math.floor(m / minuteStep.value) * minuteStep.value
  const roundedS = Math.floor(s / secondStep.value) * secondStep.value
  const formatted = formatTime(h, roundedM, roundedS)
  if (commit(formatted, activeIndex.value) && !props.isRange) {
    opened.value = false
    inputs.value[activeIndex.value]?.focus()
  }
}

const confirm = () => {
  if (isDisabled.value || props.readonly) return
  if (!props.isRange && !values.value[0]) {
    selectNow()
    return
  }
  for (const [index, entry] of values.value.entries()) {
    if (!allowed(entry, index)) { reject(entry); return }
  }
  invalid.value = false
  opened.value = false
  inputs.value[activeIndex.value]?.focus()
}

const change = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  if (isDisabled.value || props.readonly) {
    input.value = values.value[index] || ''
    return false
  }
  const rawValue = input.value.trim()
  if (!rawValue) {
    if (props.clearable) {
      clear()
    } else {
      input.value = values.value[index] || ''
    }
    return props.clearable
  }

  const parsed = parseTime(rawValue)
  const formatted = parsed ? formatTime(parsed.hour, parsed.minute, parsed.second) : ''
  if (!parsed || !allowed(formatted, index)) {
    reject(rawValue)
    input.value = values.value[index] || ''
    return false
  }

  input.value = formatted
  return commit(formatted, index)
}

const setInputRef = (index: number, el: unknown) => {
  if (el instanceof HTMLInputElement) inputs.value[index] = el
  else delete inputs.value[index]
}

const handleInputClick = (index: number) => {
  if (isDisabled.value || props.readonly) return
  activeIndex.value = index
  keyboardOpening.value = false
  if (!opened.value) {
    opened.value = true
  }
}

const handleKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!isDisabled.value && !props.readonly) {
      activeIndex.value = index
      keyboardOpening.value = true
      if (opened.value) initialFocus()?.focus()
      else opened.value = true
    }
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (change(event, index)) opened.value = false
  } else if (event.key === 'Escape') {
    opened.value = false
  }
}

const handleFocus = (event: FocusEvent, index: number) => {
  activeIndex.value = index
  emit('focus', event)
}

const handleBlur = (event: FocusEvent, _index: number) => {
  field.touch(event)
  emit('blur', event)
}

const clear = () => {
  if (!isDisabled.value && !props.readonly) {
    invalid.value = false
    update(props.isRange ? ['', ''] : '')
    emit('clear')
    opened.value = false
    inputs.value[activeIndex.value]?.focus()
  }
}

watch(opened, (val: boolean) => {
  emit('visible-change', val)
})

watch(() => props.modelValue, () => {
  invalid.value = false
})
watch([isDisabled, () => props.readonly], () => { opened.value = false })
watch(() => props.isRange, () => { activeIndex.value = 0; opened.value = false })

defineExpose({
  focus: (index = 0) => inputs.value[index]?.focus(),
  blur: () => inputs.value.forEach((input: HTMLInputElement | undefined) => input?.blur()),
  clear,
  show: () => { if (!isDisabled.value && !props.readonly) opened.value = true },
  hide: () => { opened.value = false },
})
</script>