import type { VNode } from 'vue'

export interface ImageProps {
  src?: string
  srcset?: string
  sizes?: string
  fallbackSrc?: string | string[]
  alt?: string
  width?: string | number
  height?: string | number
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  position?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'sync' | 'async' | 'auto'
  fetchpriority?: 'high' | 'low' | 'auto'
  crossorigin?: '' | 'anonymous' | 'use-credentials'
  referrerpolicy?: ReferrerPolicy
  preview?: boolean
  previewVisible?: boolean
  previewSrcList?: string[]
  previewIndex?: number
  initialIndex?: number
  previewWheelZoom?: boolean
  previewPinchZoom?: boolean
  previewDoubleClickReset?: boolean
  disabled?: boolean
  teleport?: boolean | string
  zIndex?: number
  closeOnClickOverlay?: boolean
}
export interface ImageToolbar {
  index: number
  src: string
  scale: number
  rotation: number
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  close: () => void
}
export interface ImageSlots {
  placeholder?: () => VNode[]
  error?: () => VNode[]
  toolbar?: (props: ImageToolbar) => VNode[]
}
export interface ImageExpose {
  showPreview: (index?: number) => void
  closePreview: () => void
  retry: () => void
  retryPreview: () => void
  resetPreview: () => void
}
