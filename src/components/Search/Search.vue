<template>
  <div class="scq-search" :class="[`scq-search--${shape}`, { 'is-disabled': isDisabled }]">
    <form class="scq-search__form" role="search" :aria-label="ariaLabel || label || text('search')" @submit.prevent="submit">
      <label v-if="label" class="scq-search__label" :for="inputId">{{ label }}</label>
      <div class="scq-search__field">
        <Icon name="search" :size="18" class="scq-search__icon" />
        <input
          ref="inputRef"
          :id="inputId"
          class="scq-search__input"
          type="search"
          enterkeyhint="search"
          :value="modelValue"
          :placeholder="placeholder || text('search')"
          :aria-label="ariaLabel || label || text('search')"
          :disabled="isDisabled"
          :readonly="readonly"
          :maxlength="maxlength"
          :name="name || undefined"
          @input="handleInput"
          @compositionstart="composing = true"
          @compositionend="handleCompositionEnd"
          @focus="emit('focus', $event)"
          @blur="emit('blur', $event)"
        />
        <button v-if="clearable && modelValue && !isDisabled && !readonly" type="button" class="scq-search__clear" :aria-label="text('clear')" @mousedown.prevent @click="clear"><Icon name="close" :size="15" /></button>
      </div>
    </form>
    <div v-if="showAction || $slots.action" class="scq-search__action"><slot name="action" :cancel="cancel"><button type="button" :disabled="isDisabled" @click="cancel">{{ actionText || text('cancel') }}</button></slot></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'

defineOptions({ name: 'Search' })
const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  label?: string
  ariaLabel?: string
  id?: string
  name?: string
  shape?: 'square' | 'round'
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  showAction?: boolean
  actionText?: string
  maxlength?: number
}>(), { modelValue: '', placeholder: '', label: '', ariaLabel: '', id: '', name: '', shape: 'round', disabled: undefined, readonly: false, clearable: true, showAction: false, actionText: '' })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'input' | 'search', value: string): void
  (event: 'clear' | 'cancel'): void
  (event: 'focus' | 'blur', value: FocusEvent): void
}>()
const config = useConfig()
const text = useLocale()
const generatedId = useComponentId('scq-search')
const inputId = computed(() => props.id || generatedId)
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const composing = ref(false)
const inputRef = ref<HTMLInputElement>()
let lastValue = props.modelValue
watch(() => props.modelValue, (value) => { lastValue = value })

const update = (value: string) => {
  if (isDisabled.value || props.readonly || value === lastValue) return
  lastValue = value
  emit('update:modelValue', value)
  emit('input', value)
}
const handleInput = (event: Event) => {
  if (!composing.value && !(event as InputEvent).isComposing) update((event.target as HTMLInputElement).value)
}
const handleCompositionEnd = (event: CompositionEvent) => {
  composing.value = false
  update((event.target as HTMLInputElement).value)
}
const submit = () => {
  if (!isDisabled.value && !composing.value) emit('search', props.modelValue)
}
const clear = () => {
  if (isDisabled.value || props.readonly) return
  composing.value = false
  update('')
  emit('clear')
  inputRef.value?.focus()
}
const cancel = () => {
  if (isDisabled.value) return
  composing.value = false
  update('')
  inputRef.value?.blur()
  emit('cancel')
}
defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), clear })
</script>