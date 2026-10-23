<template>
  <div
    ref="groupRef"
    class="scq-radio-group"
    :class="[`is-${direction}`]"
    role="radiogroup"
    :aria-disabled="disabled ? 'true' : 'false'"
    v-bind="field.attrs.value"
    @keydown="keydown"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, shallowReactive } from 'vue'
import { radioGroupKey, type RadioDirection, type RadioGroupControl, type RadioSize, type RadioValue } from './context'
import { useConfig } from '../ConfigProvider/context'
import { formItemKey } from '../Form/context'
import { focusFirstControl, useFormControl } from '../Form/useFormControl'

defineOptions({
  name: 'RadioGroup',
})

const props = withDefaults(
  defineProps<{
    modelValue?: RadioValue | null
    name?: string
    disabled?: boolean
    size?: RadioSize
    direction?: RadioDirection
  }>(),
  {
    modelValue: undefined,
    name: '',
    disabled: undefined,
    direction: 'horizontal',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: RadioValue): void
  (e: 'change', value: RadioValue): void
}>()

const config = useConfig()
const groupRef = ref<HTMLElement>()
const field = useFormControl({ element: () => groupRef.value, disabled: () => props.disabled, focus: (options) => focusFirstControl(groupRef.value, options) })
provide(formItemKey, null)
const disabled = field.disabled
const size = computed(() => props.size ?? config.value.size)
const controls = shallowReactive<RadioGroupControl[]>([])
const tabStop = computed(() => {
  const enabled = controls.filter(control => !control.disabled())
  return enabled.find(control => control.checked()) || enabled[0]
})
const register = (control: RadioGroupControl) => {
  controls.push(control)
  return () => {
    const index = controls.indexOf(control)
    if (index >= 0) controls.splice(index, 1)
  }
}
const RADIO_SELECTORS = { group: '[role="radiogroup"]', enabled: 'input.scq-radio__original:not(:disabled)' } as const
const keydown = (event: KeyboardEvent) => {
  const root = groupRef.value
  const target = event.target
  if (disabled.value || !root || !(target instanceof HTMLInputElement) || target.closest(RADIO_SELECTORS.group) !== root) return
  const options = Array.from(root.querySelectorAll<HTMLInputElement>(RADIO_SELECTORS.enabled)).filter(option => option.closest(RADIO_SELECTORS.group) === root)
  const current = options.indexOf(target)
  if (current < 0) return
  let next = current
  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = options.length - 1
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % options.length
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length
  else return
  event.preventDefault()
  event.stopPropagation()
  options[next].focus()
  options[next].click()
}
const changeEvent = (value: RadioValue) => {
  if (disabled.value || props.modelValue === value) {
    return
  }

  emit('update:modelValue', value)
  emit('change', value)
}

provide(radioGroupKey, {
  modelValue: computed(() => props.modelValue),
  name: computed(() => props.name),
  disabled,
  size,
  changeEvent,
  tabStop,
  register,
})
</script>
