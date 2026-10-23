<template>
  <label v-bind="field.rootAttrs.value" class="scq-switch" :class="[`scq-switch--${resolvedSize}`, { 'is-checked': checked, 'is-disabled': isDisabled || busy }]">
    <input
      ref="inputRef"
      class="scq-switch__input"
      type="checkbox"
      role="switch"
      :name="name"
      :checked="checked"
      :aria-checked="checked"
      :aria-label="ariaLabel || undefined"
      :aria-busy="busy || undefined"
      :disabled="isDisabled || busy"
      v-bind="field.attrs.value"
      @change="handleChange"
      @blur="field.touch"
    />
    <span class="scq-switch__track" aria-hidden="true">
      <span class="scq-switch__thumb" :class="{ 'is-loading': busy }"></span>
    </span>
    <span v-if="$slots.default || activeText || inactiveText" class="scq-switch__label">
      <slot>{{ checked ? activeText : inactiveText }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useConfig } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'

defineOptions({ name: 'Switch', inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: boolean
  beforeChange?: AsyncGuard<boolean>
  disabled?: boolean
  loading?: boolean
  size?: 'small' | 'default' | 'large'
  activeText?: string
  inactiveText?: string
  name?: string
  ariaLabel?: string
}>(), {
  modelValue: false,
  disabled: undefined,
  loading: false,
  activeText: '',
  inactiveText: '',
  name: '',
  ariaLabel: '',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'change', value: boolean): void
  (event: 'error', error: unknown, value: boolean): void
}>()

const inputRef = ref<HTMLInputElement>()
const config = useConfig()
const guard = useAsyncGuard(() => props.beforeChange, (error, value) => emit('error', error, value))
const busy = computed(() => props.loading || guard.pending.value)
const field = useFormControl({ element: () => inputRef.value, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, busy: () => busy.value })
const isDisabled = field.disabled
const resolvedSize = computed(() => props.size ?? config.value.size)
const checked = computed(() => props.modelValue)

const handleChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const restoreFocus = input.ownerDocument.activeElement === input
  input.checked = checked.value
  if (isDisabled.value || busy.value) return
  const value = !checked.value
  void guard.run(value, () => {
    emit('update:modelValue', value)
    emit('change', value)
  }).finally(async () => {
    await nextTick()
    if (restoreFocus && input.isConnected && !input.disabled && input.ownerDocument.activeElement === input.ownerDocument.body) input.focus({ preventScroll: true })
  })
}
watch(() => props.modelValue, guard.cancel, { flush: 'sync' })
watch([isDisabled, () => props.loading], ([disabled, loading]) => { if (disabled || loading) guard.cancel() }, { flush: 'sync' })

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  cancelPending: guard.cancel,
  pending: guard.pending,
})
</script>