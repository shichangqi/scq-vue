<template>
  <div
    class="scq-radio-group"
    :class="[`is-${direction}`]"
    role="radiogroup"
    :aria-disabled="disabled ? 'true' : 'false'"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { radioGroupKey, type RadioDirection, type RadioSize, type RadioValue } from './context'

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
    disabled: false,
    size: 'default',
    direction: 'horizontal',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: RadioValue): void
  (e: 'change', value: RadioValue): void
}>()

const changeEvent = (value: RadioValue) => {
  if (props.disabled || props.modelValue === value) {
    return
  }

  emit('update:modelValue', value)
  emit('change', value)
}

provide(radioGroupKey, {
  modelValue: computed(() => props.modelValue),
  name: computed(() => props.name),
  disabled: computed(() => props.disabled),
  size: computed(() => props.size),
  changeEvent,
})
</script>
