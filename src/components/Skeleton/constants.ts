import type { SkeletonPreset, SkeletonProps } from './types'

export const SKELETON_DEFAULT_ROWS = 3
export const SKELETON_MAX_ROWS = 50

export const SKELETON_PRESETS: Record<SkeletonPreset, Partial<SkeletonProps>> = {
  article: {
    rows: SKELETON_DEFAULT_ROWS,
    title: true,
    rowWidths: ['100%', '100%', '65%'],
  },
  card: {
    rows: 2,
    title: true,
    image: true,
    button: true,
    rowWidths: ['100%', '65%'],
  },
  'list-item': {
    rows: 2,
    avatar: true,
    title: true,
    rowWidths: ['80%', '60%'],
  },
}
