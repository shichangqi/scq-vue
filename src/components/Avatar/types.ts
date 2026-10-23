import type { ComponentSize } from '../ConfigProvider/context'
import type { IconName } from '../Icon/icons'

export type AvatarFallback = 'image' | 'slot' | 'text' | 'icon'
export interface AvatarProps {
  src?: string
  srcset?: string
  sizes?: string
  fallbackSrc?: string | string[]
  alt?: string
  text?: string
  size?: number | ComponentSize
  shape?: 'circle' | 'square'
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  icon?: IconName
  loading?: 'eager' | 'lazy'
  fallbackOrder?: readonly AvatarFallback[]
  autoSize?: boolean
  gap?: number
}
