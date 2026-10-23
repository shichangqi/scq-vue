export type PickerValue = string | number
export type PickerMode = 'list' | 'wheel'

export interface PickerOption {
  label: string
  value: PickerValue
  disabled?: boolean
  children?: readonly PickerOption[]
}

export interface PickerSelection {
  values: PickerValue[]
  options: PickerOption[]
}

export interface PickerProps {
  modelValue?: readonly PickerValue[]
  columns?: readonly PickerOption[] | readonly (readonly PickerOption[])[]
  title?: string
  showToolbar?: boolean
  disabled?: boolean
  loading?: boolean
  confirmText?: string
  cancelText?: string
  mode?: PickerMode
  optionHeight?: number
  visibleOptionCount?: number
}
