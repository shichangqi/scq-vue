<template>
  <form
    class="scq-chat-choice"
    :class="[`is-${mode}`, { 'is-disabled': isInteractionDisabled, 'is-submitted': submitted }]"
    :aria-busy="loading ? 'true' : 'false'"
    @submit.prevent="handleSubmit"
  >
    <RadioGroup
      v-if="mode === 'single'"
      :model-value="singleControlValue"
      :name="name"
      :disabled="isInteractionDisabled"
      direction="vertical"
      @update:model-value="handleSingleChange"
    >
      <Radio
        v-for="(option, index) in options"
        :key="getOptionKey(index)"
        :value="getOptionKey(index)"
        :disabled="option.disabled"
      >
        <slot
          name="option"
          :option="option"
          :index="index"
          :selected="isOptionSelected(option)"
          :disabled="Boolean(option.disabled || isInteractionDisabled)"
        >
          {{ option.label }}
        </slot>
      </Radio>

      <div
        v-if="allowOther"
        class="scq-chat-choice__other-option"
        :class="{ 'is-selected': otherSelected, 'is-disabled': isOtherOptionDisabled }"
      >
        <Radio :value="otherControlValue" :disabled="isOtherOptionDisabled">
          <slot name="other-label" :selected="otherSelected">
            {{ otherLabel }}
          </slot>
        </Radio>
        <div class="scq-chat-choice__other-input">
          <Input
            :model-value="otherText"
            :placeholder="otherPlaceholder"
            :maxlength="otherMaxlength"
            :disabled="isOtherOptionDisabled"
            clearable
            @focus="handleOtherFocus"
            @update:model-value="handleOtherTextChange"
          />
        </div>
      </div>
    </RadioGroup>

    <CheckboxGroup
      v-else
      :model-value="multipleControlValues"
      :name="name"
      :disabled="isInteractionDisabled"
      direction="vertical"
      @update:model-value="handleMultipleChange"
    >
      <Checkbox
        v-for="(option, index) in options"
        :key="getOptionKey(index)"
        :value="getOptionKey(index)"
        :disabled="isOptionDisabled(option)"
      >
        <slot
          name="option"
          :option="option"
          :index="index"
          :selected="isOptionSelected(option)"
          :disabled="isOptionDisabled(option)"
        >
          {{ option.label }}
        </slot>
      </Checkbox>

      <div
        v-if="allowOther"
        class="scq-chat-choice__other-option"
        :class="{ 'is-selected': otherSelected, 'is-disabled': isOtherOptionDisabled }"
      >
        <Checkbox :value="otherControlValue" :disabled="isOtherOptionDisabled">
          <slot name="other-label" :selected="otherSelected">
            {{ otherLabel }}
          </slot>
        </Checkbox>
        <div class="scq-chat-choice__other-input">
          <Input
            :model-value="otherText"
            :placeholder="otherPlaceholder"
            :maxlength="otherMaxlength"
            :disabled="isOtherOptionDisabled"
            clearable
            @focus="handleOtherFocus"
            @update:model-value="handleOtherTextChange"
          />
        </div>
      </div>
    </CheckboxGroup>

    <p v-if="validationMessage" class="scq-chat-choice__error" role="alert">
      {{ validationMessage }}
    </p>

    <div class="scq-chat-choice__footer">
      <slot
        name="footer"
        :submit="handleSubmit"
        :disabled="isSubmitDisabled"
        :validation-message="validationMessage"
      >
        <Button
          type="primary"
          size="small"
          native-type="submit"
          :loading="loading"
          :loading-text="loadingText"
          :disabled="isSubmitDisabled"
        >
          {{ submitted ? submittedText : submitText }}
        </Button>
      </slot>
    </div>
  </form>
</template>

<script lang="ts">
export type ChatChoiceMode = 'single' | 'multiple'
export type ChatChoiceValue = string | number
export type ChatChoiceValidationErrorType = 'required' | 'min' | 'max' | 'other-required'

export interface ChatChoiceOption {
  value: ChatChoiceValue
  label: string
  disabled?: boolean
  description?: string
  icon?: string
}

export interface ChatChoiceAnswer {
  values: ChatChoiceValue[]
}

export interface ChatChoiceValidationError {
  type: ChatChoiceValidationErrorType
  message: string
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from '../Button/Button.vue'
import Checkbox from '../Checkbox/Checkbox.vue'
import CheckboxGroup from '../Checkbox/CheckboxGroup.vue'
import type { CheckboxValue } from '../Checkbox/context'
import Input from '../Input/Input.vue'
import Radio from '../Radio/Radio.vue'
import RadioGroup from '../Radio/RadioGroup.vue'
import type { RadioValue } from '../Radio/context'

defineOptions({
  name: 'ChatChoice',
})

const props = withDefaults(
  defineProps<{
    modelValue?: ChatChoiceAnswer
    mode?: ChatChoiceMode
    options?: ChatChoiceOption[]
    name?: string
    allowOther?: boolean
    otherLabel?: string
    otherPlaceholder?: string
    otherMaxlength?: number
    otherRequired?: boolean
    required?: boolean
    min?: number
    max?: number
    disabled?: boolean
    loading?: boolean
    submitted?: boolean
    submitText?: string
    loadingText?: string
    submittedText?: string
    requiredMessage?: string
    otherRequiredMessage?: string
  }>(),
  {
    modelValue: () => ({ values: [] }),
    mode: 'single',
    options: () => [],
    name: '',
    allowOther: false,
    otherLabel: '其他',
    otherPlaceholder: '请输入其他内容',
    otherRequired: true,
    required: true,
    disabled: false,
    loading: false,
    submitted: false,
    submitText: '确认',
    loadingText: '提交中',
    submittedText: '已提交',
    requiredMessage: '请至少选择一项',
    otherRequiredMessage: '请填写其他内容',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: ChatChoiceAnswer): void
  (event: 'change', value: ChatChoiceAnswer): void
  (event: 'submit', value: ChatChoiceAnswer): void
  (event: 'validation-error', value: ChatChoiceValidationError): void
}>()

const otherControlValue = '__scq_chat_choice_other__'
const validationMessage = ref('')
const selectedValues = ref<ChatChoiceValue[]>([])
const otherSelected = ref(false)
const otherText = ref('')
const pendingValues = ref<ChatChoiceValue[] | null>(null)

const normalizeValues = (values: ChatChoiceValue[] | undefined): ChatChoiceValue[] => {
  return Array.isArray(values) ? [...values] : []
}

const isKnownOptionValue = (value: ChatChoiceValue): boolean => {
  return props.options.some((option) => option.value === value)
}

const valuesEqual = (left: ChatChoiceValue[], right: ChatChoiceValue[]): boolean => {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

const syncFromModel = (values: ChatChoiceValue[]) => {
  const optionValues = values.filter(isKnownOptionValue)
  const customValues = props.allowOther ? values.filter((value) => !isKnownOptionValue(value)) : []
  const customValue = customValues.length ? customValues[customValues.length - 1] : undefined

  if (props.mode === 'single' && customValue !== undefined) {
    selectedValues.value = []
  } else {
    selectedValues.value = props.mode === 'single' ? optionValues.slice(0, 1) : optionValues
  }
  otherSelected.value = customValue !== undefined
  otherText.value = customValue === undefined ? '' : String(customValue)
}

syncFromModel(normalizeValues(props.modelValue.values))

watch(
  [() => props.modelValue.values, () => props.options, () => props.mode, () => props.allowOther],
  ([values]) => {
    const nextValues = normalizeValues(values as ChatChoiceValue[] | undefined)
    if (pendingValues.value && valuesEqual(nextValues, pendingValues.value)) {
      pendingValues.value = null
      return
    }
    syncFromModel(nextValues)
  },
  { deep: true },
)

const createAnswer = (trimOther = false): ChatChoiceAnswer => {
  const values = [...selectedValues.value]
  const inputValue = trimOther ? otherText.value.trim() : otherText.value
  if (otherSelected.value && inputValue) {
    values.push(inputValue)
  }
  return { values }
}

const isInteractionDisabled = computed(() => props.disabled || props.loading || props.submitted)
const isSubmitDisabled = computed(() => isInteractionDisabled.value)
const selectedCount = computed(() => selectedValues.value.length + (otherSelected.value ? 1 : 0))
const hasReachedMax = computed(() => {
  return props.mode === 'multiple' && typeof props.max === 'number' && selectedCount.value >= props.max
})

const getOptionKey = (index: number): string => `option-${index}`

const isOptionSelected = (option: ChatChoiceOption): boolean => {
  return selectedValues.value.some((value) => value === option.value)
}

const isOptionDisabled = (option: ChatChoiceOption): boolean => {
  return Boolean(
    option.disabled ||
    isInteractionDisabled.value ||
    (hasReachedMax.value && !isOptionSelected(option)),
  )
}

const isOtherOptionDisabled = computed(() => {
  return isInteractionDisabled.value || (hasReachedMax.value && !otherSelected.value)
})

const singleControlValue = computed<RadioValue | null>(() => {
  const selectedIndex = props.options.findIndex((option) => isOptionSelected(option))
  if (selectedIndex >= 0) {
    return getOptionKey(selectedIndex)
  }
  return otherSelected.value ? otherControlValue : null
})

const multipleControlValues = computed<CheckboxValue[]>(() => {
  const values: CheckboxValue[] = props.options
    .map((option, index) => (isOptionSelected(option) ? getOptionKey(index) : null))
    .filter((value): value is string => value !== null)

  if (otherSelected.value) {
    values.push(otherControlValue)
  }
  return values
})

const emitAnswer = () => {
  validationMessage.value = ''
  const nextAnswer = createAnswer()
  pendingValues.value = [...nextAnswer.values]
  emit('update:modelValue', nextAnswer)
  emit('change', nextAnswer)
}

const handleSingleChange = (controlValue: RadioValue) => {
  if (isInteractionDisabled.value) {
    return
  }

  if (controlValue === otherControlValue) {
    selectedValues.value = []
    otherSelected.value = true
    emitAnswer()
    return
  }

  const index = Number(String(controlValue).replace('option-', ''))
  const option = props.options[index]
  if (option && !option.disabled) {
    selectedValues.value = [option.value]
    otherSelected.value = false
    emitAnswer()
  }
}

const handleMultipleChange = (controlValues: CheckboxValue[]) => {
  if (isInteractionDisabled.value) {
    return
  }

  const keys = new Set(controlValues.map(String))
  const values = props.options
    .filter((option, index) => keys.has(getOptionKey(index)))
    .map((option) => option.value)
  selectedValues.value = values
  otherSelected.value = props.allowOther && keys.has(otherControlValue)
  emitAnswer()
}

const handleOtherFocus = () => {
  if (isOtherOptionDisabled.value || otherSelected.value) {
    return
  }

  if (props.mode === 'single') {
    selectedValues.value = []
  }
  otherSelected.value = true
  emitAnswer()
}

const handleOtherTextChange = (value: string | number) => {
  if (!isOtherOptionDisabled.value) {
    if (props.mode === 'single') {
      selectedValues.value = []
    }
    otherSelected.value = true
    otherText.value = String(value)
    emitAnswer()
  }
}

const setValidationError = (type: ChatChoiceValidationErrorType, message: string): false => {
  validationMessage.value = message
  emit('validation-error', { type, message })
  return false
}

const validate = (): boolean => {
  const count = selectedCount.value
  if (props.required && count === 0) {
    return setValidationError('required', props.requiredMessage)
  }
  if (props.mode === 'multiple' && typeof props.min === 'number' && count < props.min) {
    return setValidationError('min', `请至少选择 ${props.min} 项`)
  }
  if (props.mode === 'multiple' && typeof props.max === 'number' && count > props.max) {
    return setValidationError('max', `最多选择 ${props.max} 项`)
  }
  if (otherSelected.value && props.otherRequired && !otherText.value.trim()) {
    return setValidationError('other-required', props.otherRequiredMessage)
  }

  validationMessage.value = ''
  return true
}

const handleSubmit = () => {
  if (isSubmitDisabled.value || !validate()) {
    return
  }

  emit('submit', createAnswer(true))
}

defineExpose({
  submit: handleSubmit,
  validate,
})
</script>