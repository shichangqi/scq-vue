<template>
  <div
    class="scq-checkbox-group"
    :class="[`is-${direction}`]"
    role="group"
    :aria-disabled="disabled ? 'true' : 'false'"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { checkboxGroupKey, type CheckboxDirection, type CheckboxSize, type CheckboxValue } from './context'

defineOptions({
  name: 'CheckboxGroup',
})

const props = withDefaults(
  defineProps<{
    modelValue?: CheckboxValue[]
    name?: string
    disabled?: boolean
    size?: CheckboxSize
    direction?: CheckboxDirection
  }>(),
  {
    modelValue: () => [],
    name: '',
    disabled: false,
    size: 'default',
    direction: 'horizontal',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: CheckboxValue[]): void
  (e: 'change', value: CheckboxValue[]): void
}>()

const changeEvent = (value: CheckboxValue, checked: boolean) => {
  if (props.disabled) {
    return
  }

  const nextList = [...props.modelValue]
  const index = nextList.findIndex((item) => item === value)

  if (checked && index < 0) {
    nextList.push(value)
  }

  if (!checked && index > -1) {
    nextList.splice(index, 1)
  }

  emit('update:modelValue', nextList)
  emit('change', nextList)
}

provide(checkboxGroupKey, {
  modelValue: computed(() => props.modelValue),
  name: computed(() => props.name),
  disabled: computed(() => props.disabled),
  size: computed(() => props.size),
  changeEvent,
})
</script>
