<template>
  <div v-bind="field.rootAttrs.value" class="scq-search" :class="[`scq-search--${shape}`, { 'is-disabled': isDisabled }]">
    <component :is="(nativeForm ?? !field.hasForm) ? 'form' : 'div'" class="scq-search__form" role="search" :aria-label="ariaLabel || label || text('search')" @submit.prevent.stop="submit">
      <label v-if="label" class="scq-search__label" :for="inputId">{{ label }}</label>
      <div class="scq-search__field">
        <Icon name="search" :size="18" class="scq-search__icon" />
        <input
          ref="inputRef"
          :id="inputId"
          class="scq-search__input"
          type="search"
          enterkeyhint="search"
          v-model="composition.model.value"
          :placeholder="placeholder || text('search')"
          :aria-label="ariaLabel || label || text('search')"
          :disabled="isDisabled"
          :readonly="readonly"
          :maxlength="maxlength"
          :name="name || undefined"
          v-bind="field.attrs.value"
          @compositionstart="composition.start"
          @compositionend="composition.end"
          @keydown.enter="searchKeydown"
          @focus="emit('focus', $event)"
          @blur="field.touch($event); emit('blur', $event)"
        />
        <button v-if="clearable && modelValue && !isDisabled && !readonly" type="button" class="scq-search__clear" :aria-label="text('clear')" @mousedown.prevent @click="clear"><Icon name="close" :size="15" /></button>
      </div>
    </component>
    <div v-if="showAction || $slots.action" class="scq-search__action"><slot name="action" :cancel="cancel"><button type="button" :disabled="isDisabled" @click="cancel">{{ actionText || text('cancel') }}</button></slot></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'
import { useFormControl } from '../Form/useFormControl'
import { COMPOSITION_KEY_CODE, useCompositionModel } from '../../utils/composition'

defineOptions({ name: 'Search', inheritAttrs: false })
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
  nativeForm?: boolean
}>(), { modelValue: '', placeholder: '', label: '', ariaLabel: '', id: '', name: '', shape: 'round', disabled: undefined, readonly: false, clearable: true, showAction: false, actionText: '', nativeForm: undefined })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'input' | 'search', value: string): void
  (event: 'clear' | 'cancel'): void
  (event: 'focus' | 'blur', value: FocusEvent): void
}>()
const text = useLocale()
const generatedId = useComponentId('scq-search')
const inputRef = ref<HTMLInputElement>()
const field = useFormControl({ element: () => inputRef.value, id: () => props.id, disabled: () => props.disabled, ariaLabel: () => props.ariaLabel, composite: true })
const inputId = computed(() => field.id.value || generatedId)
const isDisabled = field.disabled
let lastValue = props.modelValue
const update = (value: string) => {
  if (isDisabled.value || props.readonly) { composition.cancel(inputRef.value); return }
  if (value === lastValue) return
  lastValue = value
  emit('update:modelValue', value)
  emit('input', value)
}
const composition = useCompositionModel(() => props.modelValue, update)
watch(() => props.modelValue, (value) => {
  if (composition.composing.value || value !== lastValue) composition.cancel(inputRef.value, value)
  lastValue = value
}, { flush: 'sync' })
watch([isDisabled, () => props.readonly], ([disabled, readonly]) => {
  if (disabled || readonly) composition.cancel(inputRef.value)
}, { flush: 'sync' })
const submit = () => {
  if (!isDisabled.value && !composition.composing.value) emit('search', props.modelValue)
}
const searchKeydown = (event: KeyboardEvent) => {
  event.preventDefault()
  event.stopPropagation()
  if (!event.isComposing && event.keyCode !== COMPOSITION_KEY_CODE) submit()
}
const clear = () => {
  if (isDisabled.value || props.readonly) return
  composition.cancel(inputRef.value, '')
  update('')
  emit('clear')
  inputRef.value?.focus()
}
const cancel = () => {
  if (isDisabled.value) return
  composition.cancel(inputRef.value, props.readonly ? props.modelValue : '')
  update('')
  inputRef.value?.blur()
  emit('cancel')
}
defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), clear })
</script>