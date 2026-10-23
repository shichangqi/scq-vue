import type { CSSProperties } from 'vue'
import type { ComponentSize } from '../ConfigProvider/context'

export interface CardProps {
  header?: string
  shadow?: 'never' | 'hover' | 'always'
  bordered?: boolean
  padding?: number | string
  bodyStyle?: CSSProperties
  loading?: boolean
  size?: ComponentSize
  clickable?: boolean
  selectable?: boolean
  selected?: boolean
  disabled?: boolean
  ariaLabel?: string
  mediaRatio?: number | string
}
