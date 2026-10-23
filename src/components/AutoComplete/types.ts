import type { VNode } from 'vue'
import type { ComponentSize } from '../ConfigProvider/context'

export interface AutoCompleteOption {
  value: string
  label?: string
  disabled?: boolean
  [key: string]: unknown
}
export interface AutoCompleteQueryContext { page: number; pageSize: number }
export interface AutoCompleteResult { list: AutoCompleteOption[]; total?: number }
export type AutoCompleteFetchSuggestions = (
  query: string, signal: AbortSignal, context: AutoCompleteQueryContext,
) => AutoCompleteOption[] | AutoCompleteResult | Promise<AutoCompleteOption[] | AutoCompleteResult>
export interface AutoCompleteProps {
  modelValue?: string
  options?: readonly AutoCompleteOption[]
  fetchSuggestions?: AutoCompleteFetchSuggestions
  debounce?: number
  showOnFocus?: boolean
  highlightFirstItem?: boolean
  highlightMatch?: boolean
  filterMethod?: (query: string, option: AutoCompleteOption) => boolean
  groupBy?: (option: AutoCompleteOption) => string | undefined
  minLength?: number
  cacheTtl?: number
  pagination?: boolean
  pageSize?: number
  virtual?: boolean
  height?: number
  itemHeight?: number
  overscan?: number
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  placeholder?: string
  ariaLabel?: string
  id?: string
  name?: string
  size?: ComponentSize
  width?: string | number
  teleport?: boolean | string
}
export interface AutoCompleteSlots {
  default?: (props: { option: AutoCompleteOption; index: number }) => VNode[]
  group?: (props: { group: string }) => VNode[]
  empty?: () => VNode[]
}
export interface AutoCompleteExpose {
  focus: () => void
  blur: () => void
  close: () => void
  refresh: () => Promise<boolean>
  retry: () => Promise<boolean>
  clearCache: () => void
}
