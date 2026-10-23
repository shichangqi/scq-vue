<template>
  <div
    ref="groupRef"
    class="scq-checkbox-group"
    :class="[`is-${direction}`]"
    role="group"
    :aria-disabled="disabled ? 'true' : 'false'"
    v-bind="field.attrs.value"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { checkboxGroupKey, type CheckboxDirection, type CheckboxSize, type CheckboxValue } from './context'
import { useConfig } from '../ConfigProvider/context'
import { formItemKey } from '../Form/context'
import { focusFirstControl, useFormControl } from '../Form/useFormControl'

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
    disabled: undefined,
    direction: 'horizontal',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: CheckboxValue[]): void
  (e: 'change', value: CheckboxValue[]): void
}>()

const config = useConfig()
const groupRef = ref<HTMLElement>()
const field = useFormControl({ element: () => groupRef.value, disabled: () => props.disabled, focus: (options) => focusFirstControl(groupRef.value, options) })
provide(formItemKey, null)
const disabled = field.disabled
const size = computed(() => props.size ?? config.value.size)
const changeEvent = (value: CheckboxValue, checked: boolean) => {
  if (disabled.value) {
    return
  }

  const selected = new Set(props.modelValue)
  if (selected.has(value) === checked) return
  if (checked) selected.add(value)
  else selected.delete(value)
  const nextList = [...selected]
  emit('update:modelValue', nextList)
  emit('change', nextList)
}

provide(checkboxGroupKey, {
  modelValue: computed(() => props.modelValue),
  name: computed(() => props.name),
  disabled,
  size,
  changeEvent,
})
</script>
