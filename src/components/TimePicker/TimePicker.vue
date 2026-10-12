<template>
  <div class="scq-time-picker" :class="{ 'is-range': isRange }">
    <Popover
      v-model="opened"
      :disabled="isDisabled || readonly"
      :teleport="teleport"
      placement="bottom-start"
      :width="panelWidth"
      :aria-label="ariaLabel || text('chooseTime')"
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
              autocomplete="off"
              spellcheck="false"
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

      <div class="scq-time-picker__panel" :class="{ 'is-range': isRange }" @click.stop>
        <template v-if="!isRange">
          <div class="scq-time-picker__columns">
            <div class="scq-time-picker__column-wrap">
              <div class="scq-time-picker__column-header">{{ textHour }}</div>
              <div :ref="(el) => setColumnRef(0, 'hour', el)" class="scq-time-picker__column">
                <button
                  v-for="h in hours"
                  :key="h"
                  type="button"
                  class="scq-time-picker__cell"
                  :class="{ 'is-selected': isHourSelected(0, h), 'is-disabled': isHourDisabled(0, h) }"
                  :disabled="isHourDisabled(0, h)"
                  @click="selectTimePart(0, 'hour', h)"
                >
                  {{ pad(h) }}
                </button>
              </div>
            </div>
            <div class="scq-time-picker__column-wrap">
              <div class="scq-time-picker__column-header">{{ textMinute }}</div>
              <div :ref="(el) => setColumnRef(0, 'minute', el)" class="scq-time-picker__column">
                <button
                  v-for="m in minutes"
                  :key="m"
                  type="button"
                  class="scq-time-picker__cell"
                  :class="{ 'is-selected': isMinuteSelected(0, m), 'is-disabled': isMinuteDisabled(0, m) }"
                  :disabled="isMinuteDisabled(0, m)"
                  @click="selectTimePart(0, 'minute', m)"
                >
                  {{ pad(m) }}
                </button>
              </div>
            </div>
            <div v-if="seconds" class="scq-time-picker__column-wrap">
              <div class="scq-time-picker__column-header">{{ textSecond }}</div>
              <div :ref="(el) => setColumnRef(0, 'second', el)" class="scq-time-picker__column">
                <button
                  v-for="s in secondsList"
                  :key="s"
                  type="button"
                  class="scq-time-picker__cell"
                  :class="{ 'is-selected': isSecondSelected(0, s), 'is-disabled': isSecondDisabled(0, s) }"
                  :disabled="isSecondDisabled(0, s)"
                  @click="selectTimePart(0, 'second', s)"
                >
                  {{ pad(s) }}
                </button>
              </div>
            </div>
          </div>
          <div class="scq-time-picker__footer">
            <button type="button" class="scq-time-picker__btn scq-time-picker__btn--now" @click="selectNow">
              {{ textNow }}
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
              <div class="scq-time-picker__columns">
                <div class="scq-time-picker__column-wrap">
                  <div class="scq-time-picker__column-header">{{ textHour }}</div>
                  <div :ref="(el) => setColumnRef(0, 'hour', el)" class="scq-time-picker__column">
                    <button
                      v-for="h in hours"
                      :key="h"
                      type="button"
                      class="scq-time-picker__cell"
                      :class="{ 'is-selected': isHourSelected(0, h), 'is-disabled': isHourDisabled(0, h) }"
                      :disabled="isHourDisabled(0, h)"
                      @click="selectTimePart(0, 'hour', h)"
                    >
                      {{ pad(h) }}
                    </button>
                  </div>
                </div>
                <div class="scq-time-picker__column-wrap">
                  <div class="scq-time-picker__column-header">{{ textMinute }}</div>
                  <div :ref="(el) => setColumnRef(0, 'minute', el)" class="scq-time-picker__column">
                    <button
                      v-for="m in minutes"
                      :key="m"
                      type="button"
                      class="scq-time-picker__cell"
                      :class="{ 'is-selected': isMinuteSelected(0, m), 'is-disabled': isMinuteDisabled(0, m) }"
                      :disabled="isMinuteDisabled(0, m)"
                      @click="selectTimePart(0, 'minute', m)"
                    >
                      {{ pad(m) }}
                    </button>
                  </div>
                </div>
                <div v-if="seconds" class="scq-time-picker__column-wrap">
                  <div class="scq-time-picker__column-header">{{ textSecond }}</div>
                  <div :ref="(el) => setColumnRef(0, 'second', el)" class="scq-time-picker__column">
                    <button
                      v-for="s in secondsList"
                      :key="s"
                      type="button"
                      class="scq-time-picker__cell"
                      :class="{ 'is-selected': isSecondSelected(0, s), 'is-disabled': isSecondDisabled(0, s) }"
                      :disabled="isSecondDisabled(0, s)"
                      @click="selectTimePart(0, 'second', s)"
                    >
                      {{ pad(s) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="scq-time-picker__range-divider"></div>

            <div class="scq-time-picker__range-section">
              <div class="scq-time-picker__range-title">
                <span>{{ textEndTime }}</span>
                <span class="scq-time-picker__range-time">{{ values[1] || '--:--' }}</span>
              </div>
              <div class="scq-time-picker__columns">
                <div class="scq-time-picker__column-wrap">
                  <div class="scq-time-picker__column-header">{{ textHour }}</div>
                  <div :ref="(el) => setColumnRef(1, 'hour', el)" class="scq-time-picker__column">
                    <button
                      v-for="h in hours"
                      :key="h"
                      type="button"
                      class="scq-time-picker__cell"
                      :class="{ 'is-selected': isHourSelected(1, h), 'is-disabled': isHourDisabled(1, h) }"
                      :disabled="isHourDisabled(1, h)"
                      @click="selectTimePart(1, 'hour', h)"
                    >
                      {{ pad(h) }}
                    </button>
                  </div>
                </div>
                <div class="scq-time-picker__column-wrap">
                  <div class="scq-time-picker__column-header">{{ textMinute }}</div>
                  <div :ref="(el) => setColumnRef(1, 'minute', el)" class="scq-time-picker__column">
                    <button
                      v-for="m in minutes"
                      :key="m"
                      type="button"
                      class="scq-time-picker__cell"
                      :class="{ 'is-selected': isMinuteSelected(1, m), 'is-disabled': isMinuteDisabled(1, m) }"
                      :disabled="isMinuteDisabled(1, m)"
                      @click="selectTimePart(1, 'minute', m)"
                    >
                      {{ pad(m) }}
                    </button>
                  </div>
                </div>
                <div v-if="seconds" class="scq-time-picker__column-wrap">
                  <div class="scq-time-picker__column-header">{{ textSecond }}</div>
                  <div :ref="(el) => setColumnRef(1, 'second', el)" class="scq-time-picker__column">
                    <button
                      v-for="s in secondsList"
                      :key="s"
                      type="button"
                      class="scq-time-picker__cell"
                      :class="{ 'is-selected': isSecondSelected(1, s), 'is-disabled': isSecondDisabled(1, s) }"
                      :disabled="isSecondDisabled(1, s)"
                      @click="selectTimePart(1, 'second', s)"
                    >
                      {{ pad(s) }}
                    </button>
                  </div>
                </div>
              </div>
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
import { computed, nextTick, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Popover from '../Popover/Popover.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'

export type TimePickerValue = string | string[]

defineOptions({ name: 'TimePicker' })

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
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref<TimePickerValue>(props.isRange ? ['', ''] : '')
const value = computed(() => props.modelValue ?? internal.value)
const values = computed<string[]>(() => {
  if (Array.isArray(value.value)) {
    return props.isRange ? [value.value[0] || '', value.value[1] || ''] : [value.value[0] || '']
  }
  return props.isRange ? [value.value || '', ''] : [value.value || '']
})

const inputs = ref<HTMLInputElement[]>([])
const opened = ref(false)
const invalid = ref(false)
const activeIndex = ref(0)
const colRefs = ref<Record<string, HTMLElement>>({})

const pad = (n: number) => String(n).padStart(2, '0')

const textHour = computed(() => (config.value.locale === 'zh-CN' ? '时' : 'H'))
const textMinute = computed(() => (config.value.locale === 'zh-CN' ? '分' : 'M'))
const textSecond = computed(() => (config.value.locale === 'zh-CN' ? '秒' : 'S'))
const textNow = computed(() => (config.value.locale === 'zh-CN' ? '此时' : 'Now'))
const textStartTime = computed(() => (config.value.locale === 'zh-CN' ? '开始时间' : 'Start'))
const textEndTime = computed(() => (config.value.locale === 'zh-CN' ? '结束时间' : 'End'))

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

const parseTime = (timeStr: string | undefined | null) => {
  if (!timeStr || typeof timeStr !== 'string') return null
  const trimmed = timeStr.trim()
  const match = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(trimmed)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  const second = match[3] !== undefined ? Number(match[3]) : 0
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null
  return { hour, minute, second }
}

const formatTime = (hour: number, minute: number, second: number) => {
  if (props.seconds) {
    return `${pad(hour)}:${pad(minute)}:${pad(second)}`
  }
  return `${pad(hour)}:${pad(minute)}`
}

const hours = Array.from({ length: 24 }, (_, i) => i)

const minuteStep = computed(() => {
  if (!props.step) return 1
  if (!props.seconds) {
    return props.step >= 60 ? Math.max(1, Math.floor(props.step / 60)) : Math.max(1, props.step)
  }
  return 1
})

const secondStep = computed(() => {
  if (!props.seconds) return 1
  return props.step && props.step < 60 ? Math.max(1, props.step) : 1
})

const minutes = computed(() => {
  const step = minuteStep.value
  const list: number[] = []
  for (let i = 0; i < 60; i += step) list.push(i)
  return list
})

const secondsList = computed(() => {
  const step = secondStep.value
  const list: number[] = []
  for (let i = 0; i < 60; i += step) list.push(i)
  return list
})

const getBoundsForSlot = (index: number) => {
  let slotMin = props.min || ''
  let slotMax = props.max || ''
  if (props.isRange && !props.allowOvernight) {
    if (index === 1 && values.value[0]) {
      if (!slotMin || values.value[0] > slotMin) {
        slotMin = values.value[0]
      }
    } else if (index === 0 && values.value[1]) {
      if (!slotMax || values.value[1] < slotMax) {
        slotMax = values.value[1]
      }
    }
  }
  return { min: slotMin, max: slotMax }
}

const isHourSelected = (index: number, h: number) => {
  const parsed = parseTime(values.value[index])
  return parsed !== null && parsed.hour === h
}

const isMinuteSelected = (index: number, m: number) => {
  const parsed = parseTime(values.value[index])
  return parsed !== null && parsed.minute === m
}

const isSecondSelected = (index: number, s: number) => {
  const parsed = parseTime(values.value[index])
  return parsed !== null && parsed.second === s
}

const isHourDisabled = (index: number, h: number) => {
  const { min: slotMin, max: slotMax } = getBoundsForSlot(index)
  const formattedHEnd = `${pad(h)}:59${props.seconds ? ':59' : ''}`
  const formattedHStart = `${pad(h)}:00${props.seconds ? ':00' : ''}`
  if (slotMin && formattedHEnd < slotMin) return true
  if (slotMax && formattedHStart > slotMax) return true

  if (props.disabledTime) {
    const stepVal = minuteStep.value
    let anyEnabled = false
    for (let m = 0; m < 60; m += stepVal) {
      if (!props.disabledTime(formatTime(h, m, 0))) {
        anyEnabled = true
        break
      }
    }
    if (!anyEnabled) return true
  }
  return false
}

const isMinuteDisabled = (index: number, m: number) => {
  const { min: slotMin, max: slotMax } = getBoundsForSlot(index)
  const parsed = parseTime(values.value[index]) || { hour: 0, minute: 0, second: 0 }
  const h = parsed.hour
  const formattedEnd = `${pad(h)}:${pad(m)}${props.seconds ? ':59' : ''}`
  const formattedStart = `${pad(h)}:${pad(m)}${props.seconds ? ':00' : ''}`
  if (slotMin && formattedEnd < slotMin) return true
  if (slotMax && formattedStart > slotMax) return true

  if (props.disabledTime?.(formatTime(h, m, parsed.second))) return true
  return false
}

const isSecondDisabled = (index: number, s: number) => {
  const { min: slotMin, max: slotMax } = getBoundsForSlot(index)
  const parsed = parseTime(values.value[index]) || { hour: 0, minute: 0, second: 0 }
  const h = parsed.hour
  const m = parsed.minute
  const formatted = `${pad(h)}:${pad(m)}:${pad(s)}`
  if (slotMin && formatted < slotMin) return true
  if (slotMax && formatted > slotMax) return true

  if (props.disabledTime?.(formatted)) return true
  return false
}

const update = (next: TimePickerValue) => {
  internal.value = next
  emit('update:modelValue', next)
  emit('change', next)
}

const selectTimePart = (index: number, part: 'hour' | 'minute' | 'second', val: number) => {
  if (isDisabled.value || props.readonly) return
  const current = parseTime(values.value[index]) || { hour: 0, minute: 0, second: 0 }
  const nextTime = {
    hour: part === 'hour' ? val : current.hour,
    minute: part === 'minute' ? val : current.minute,
    second: part === 'second' ? val : current.second,
  }
  const formatted = formatTime(nextTime.hour, nextTime.minute, nextTime.second)
  const next = props.isRange ? [values.value[0] || '', values.value[1] || ''] : [...values.value]
  next[index] = formatted

  if (props.isRange && !props.allowOvernight && next[0] && next[1] && next[0] > next[1]) {
    if (index === 0) {
      next[1] = next[0]
    } else {
      next[0] = next[1]
    }
  }

  invalid.value = false
  update(props.isRange ? next : next[0])
}

const selectNow = () => {
  if (isDisabled.value || props.readonly) return
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const roundedM = minuteStep.value > 1 ? Math.min(59, Math.round(m / minuteStep.value) * minuteStep.value) : m
  const roundedS = secondStep.value > 1 ? Math.min(59, Math.round(s / secondStep.value) * secondStep.value) : s
  const formatted = formatTime(h, roundedM, roundedS)
  invalid.value = false
  if (props.isRange) {
    const next = [values.value[0] || '', values.value[1] || '']
    next[activeIndex.value] = formatted
    update(next)
  } else {
    update(formatted)
    opened.value = false
  }
}

const confirm = () => {
  if (!props.isRange && !values.value[0]) {
    const now = new Date()
    const formatted = formatTime(now.getHours(), now.getMinutes(), now.getSeconds())
    update(formatted)
  }
  opened.value = false
  inputs.value[activeIndex.value]?.focus()
}

const change = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  if (isDisabled.value || props.readonly) {
    input.value = values.value[index] || ''
    return
  }
  const rawValue = input.value.trim()
  if (!rawValue) {
    if (props.clearable) {
      clear()
    } else {
      input.value = values.value[index] || ''
    }
    return
  }

  const next = props.isRange ? [values.value[0] || '', values.value[1] || ''] : [...values.value]
  next[index] = rawValue

  const parsed = parseTime(rawValue)
  const formatted = parsed ? formatTime(parsed.hour, parsed.minute, parsed.second) : ''

  const isFormatInvalid = !parsed
  const isOutOfBounds = Boolean(
    formatted && (
      (props.min && formatted < props.min) ||
      (props.max && formatted > props.max)
    )
  )
  const isOvernightInvalid = Boolean(
    props.isRange && !props.allowOvernight && next[0] && next[1] && next[0] > next[1]
  )
  const isCustomDisabled = Boolean(formatted && props.disabledTime?.(formatted))

  invalid.value = isFormatInvalid || isOutOfBounds || isOvernightInvalid || isCustomDisabled
  if (invalid.value) {
    emit('invalid', rawValue)
    input.value = values.value[index] || ''
    return
  }

  next[index] = formatted
  input.value = formatted
  update(props.isRange ? next : next[0])
}

const setInputRef = (index: number, el: unknown) => {
  if (el) {
    inputs.value[index] = el as HTMLInputElement
  }
}

const setColumnRef = (slotIdx: number, part: 'hour' | 'minute' | 'second', el: unknown) => {
  if (el) {
    colRefs.value[`${slotIdx}-${part}`] = el as HTMLElement
  }
}

const scrollToSelection = () => {
  nextTick(() => {
    for (let index = 0; index < (props.isRange ? 2 : 1); index++) {
      const parsed = parseTime(values.value[index])
      if (parsed) {
        const hourEl = colRefs.value[`${index}-hour`]
        if (hourEl) {
          const targetTop = parsed.hour * 30 - (hourEl.clientHeight - 30) / 2
          hourEl.scrollTop = Math.max(0, targetTop)
        }
        const minEl = colRefs.value[`${index}-minute`]
        if (minEl) {
          const minIdx = minutes.value.indexOf(parsed.minute)
          if (minIdx >= 0) {
            const targetTop = minIdx * 30 - (minEl.clientHeight - 30) / 2
            minEl.scrollTop = Math.max(0, targetTop)
          }
        }
        if (props.seconds) {
          const secEl = colRefs.value[`${index}-second`]
          if (secEl) {
            const secIdx = secondsList.value.indexOf(parsed.second)
            if (secIdx >= 0) {
              const targetTop = secIdx * 30 - (secEl.clientHeight - 30) / 2
              secEl.scrollTop = Math.max(0, targetTop)
            }
          }
        }
      }
    }
  })
}

const handleInputClick = (index: number) => {
  if (isDisabled.value || props.readonly) return
  activeIndex.value = index
  if (!opened.value) {
    opened.value = true
  }
}

const handleKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!isDisabled.value && !props.readonly) {
      opened.value = true
    }
  } else if (event.key === 'Enter') {
    event.preventDefault()
    change(event, index)
    opened.value = false
  } else if (event.key === 'Escape') {
    opened.value = false
  }
}

const handleFocus = (event: FocusEvent, index: number) => {
  activeIndex.value = index
  emit('focus', event)
}

const handleBlur = (event: FocusEvent, _index: number) => {
  emit('blur', event)
}

const clear = () => {
  if (!isDisabled.value && !props.readonly) {
    invalid.value = false
    update(props.isRange ? ['', ''] : '')
    emit('clear')
  }
}

watch(opened, (val: boolean) => {
  emit('visible-change', val)
  if (val) {
    scrollToSelection()
  }
})

watch(() => props.modelValue, () => {
  invalid.value = false
})

defineExpose({
  focus: (index = 0) => inputs.value[index]?.focus(),
  blur: () => inputs.value.forEach((input: HTMLInputElement | undefined) => input?.blur()),
  clear,
  show: () => { if (!isDisabled.value && !props.readonly) opened.value = true },
  hide: () => { opened.value = false },
})
</script>