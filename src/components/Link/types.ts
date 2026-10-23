import type { IconName } from '../Icon/icons'
import type { NavigationAdapter } from '../../utils/navigation'

export interface LinkProps {
  href?: string
  to?: string
  adapter?: NavigationAdapter
  replace?: boolean
  exact?: boolean
  active?: boolean
  loading?: boolean
  target?: '_self' | '_blank' | '_parent' | '_top'
  rel?: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  underline?: boolean
  icon?: IconName
  suffixIcon?: IconName
  external?: boolean
}
export interface LinkExpose {
  readonly pending: boolean
  cancelPending: () => void
}
