import { toRaw, type ComputedRef, type InjectionKey } from 'vue'
import type { RuleItem } from 'async-validator'

export type FormTrigger = 'blur' | 'change'
export type FormRule = RuleItem & { trigger?: FormTrigger | FormTrigger[] }
export type FormRules = Record<string, FormRule | FormRule[]>
export type FormModel = Record<string, unknown>
export type FormLabelPosition = 'left' | 'right' | 'top'

export interface FormField {
  readonly prop: string
  validate: (trigger?: FormTrigger) => Promise<boolean>
  clearValidate: () => void
  resetField: () => Promise<void>
  getState: () => FormFieldState
  focus: (options?: FocusOptions) => boolean
  scrollIntoView: (options?: ScrollIntoViewOptions) => void
  touch: () => void
}

export interface FormFieldState {
  prop: string
  label: string
  id: string
  dirty: boolean
  touched: boolean
  pending: boolean
  error: string
}
export interface FormState {
  dirty: boolean
  touched: boolean
  pending: boolean
  errors: FormFieldState[]
}
export interface FormContext {
  model: ComputedRef<FormModel>
  rules: ComputedRef<FormRules>
  addField: (field: FormField) => void
  removeField: (field: FormField) => void
  disabled: ComputedRef<boolean>
}

export interface FormInstance {
  validate: () => Promise<boolean>
  validateField: (props?: string | string[]) => Promise<boolean>
  resetFields: (props?: string | string[]) => Promise<void>
  clearValidate: (props?: string | string[]) => void
  getFieldState: (prop: string) => FormFieldState | undefined
  getFieldStates: () => FormFieldState[]
  focusField: (prop: string, options?: FocusOptions) => boolean
  focusFirstError: (options?: FocusOptions) => boolean
  scrollToField: (prop: string, options?: ScrollIntoViewOptions) => boolean
  readonly state: FormState
}

export const formKey: InjectionKey<FormContext> = Symbol.for('scq-vue.form')

export interface FormControl {
  id: () => string | undefined
  element: () => HTMLElement | undefined
  focus: (options?: FocusOptions) => boolean
  contains?: (target: Node) => boolean
}
export interface FormItemContext {
  labelId: ComputedRef<string | undefined>
  descriptionId: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  pending: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  createControlId: () => ComputedRef<string>
  addControl: (control: FormControl) => void
  removeControl: (control: FormControl) => void
  touch: (event?: FocusEvent) => void
}
export const formItemKey: InjectionKey<FormItemContext | null> = Symbol.for('scq-vue.form-item')

export const getFieldValue = (model: FormModel, path: string): unknown => {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[key]
  }, model)
}

export const setFieldValue = (model: FormModel, path: string, value: unknown): void => {
  const keys = path.split('.')
  if (keys.some((key) => ['__proto__', 'prototype', 'constructor'].includes(key))) return
  const lastKey = keys.pop()
  const parent = keys.length ? getFieldValue(model, keys.join('.')) : model
  if (lastKey && parent && typeof parent === 'object') {
    (parent as Record<string, unknown>)[lastKey] = value
  }
}

export const cloneFieldValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(cloneFieldValue)
  if (value instanceof Date) return new Date(value)
  if (value && Object.prototype.toString.call(value) === '[object Object]') {
    return Object.fromEntries(Object.entries(toRaw(value)).map(([key, entry]) => [key, cloneFieldValue(entry)]))
  }
  return value
}

export const equalFieldValue = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true
  if (left instanceof Date && right instanceof Date) return Object.is(left.getTime(), right.getTime())
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => equalFieldValue(value, right[index]))
  }
  if (!left || !right || Object.prototype.toString.call(left) !== '[object Object]' || Object.prototype.toString.call(right) !== '[object Object]') return false
  const first = left as Record<string, unknown>
  const second = right as Record<string, unknown>
  const keys = Object.keys(first)
  return keys.length === Object.keys(second).length && keys.every((key) => Object.prototype.hasOwnProperty.call(second, key) && equalFieldValue(first[key], second[key]))
}