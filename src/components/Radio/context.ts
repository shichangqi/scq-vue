import type { ComputedRef, InjectionKey, Ref } from 'vue'

export type RadioValue = string | number | boolean
export type RadioSize = 'small' | 'default' | 'large'
export type RadioDirection = 'horizontal' | 'vertical'

export interface RadioGroupContext {
  modelValue: ComputedRef<RadioValue | null | undefined>
  name: ComputedRef<string>
  disabled: ComputedRef<boolean>
  size: ComputedRef<RadioSize>
  changeEvent: (value: RadioValue) => void
}

export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol('scq-radio-group')
