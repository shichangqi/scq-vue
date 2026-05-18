import type { ComputedRef, InjectionKey } from 'vue'

export type CheckboxValue = string | number | boolean
export type CheckboxSize = 'small' | 'default' | 'large'
export type CheckboxDirection = 'horizontal' | 'vertical'

export interface CheckboxGroupContext {
  modelValue: ComputedRef<CheckboxValue[]>
  name: ComputedRef<string>
  disabled: ComputedRef<boolean>
  size: ComputedRef<CheckboxSize>
  changeEvent: (value: CheckboxValue, checked: boolean) => void
}

export const checkboxGroupKey: InjectionKey<CheckboxGroupContext> = Symbol('scq-checkbox-group')
