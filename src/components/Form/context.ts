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
}

export interface FormContext {
  model: ComputedRef<FormModel>
  rules: ComputedRef<FormRules>
  addField: (field: FormField) => void
  removeField: (field: FormField) => void
}

export interface FormInstance {
  validate: () => Promise<boolean>
  validateField: (props?: string | string[]) => Promise<boolean>
  resetFields: (props?: string | string[]) => Promise<void>
  clearValidate: (props?: string | string[]) => void
}

export const formKey: InjectionKey<FormContext> = Symbol('scq-form')

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