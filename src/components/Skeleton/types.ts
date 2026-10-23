export type SkeletonPreset = 'article' | 'card' | 'list-item'
export type SkeletonRowWidth = number | string

export interface SkeletonProps {
  loading?: boolean
  rows?: number
  animated?: boolean
  avatar?: boolean
  preset?: SkeletonPreset
  rowWidths?: readonly SkeletonRowWidth[]
  title?: boolean
  image?: boolean
  button?: boolean
}
