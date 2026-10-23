import type { VNode } from 'vue'

export interface ContainerProps {
  maxWidth?: number | string
  padding?: number | string
  gap?: number | string
  fluid?: boolean
  asideWidth?: number | string
  asidePosition?: 'left' | 'right'
  collapsible?: boolean
  collapsed?: boolean
  asideMode?: 'static' | 'drawer'
  asideOpen?: boolean
  asideBreakpoint?: number
  asideTitle?: string
  height?: number | string
  scrollable?: boolean
  disabled?: boolean
}
export interface ContainerSlots {
  default?: () => VNode[]
  header?: () => VNode[]
  aside?: () => VNode[]
  footer?: () => VNode[]
  'aside-toggle'?: (props: { collapsed: boolean; open: boolean; mobile: boolean; toggle: () => void }) => VNode[]
}
export interface ContainerExpose {
  readonly collapsed: boolean
  readonly asideOpen: boolean
  readonly mobile: boolean
  toggleAside: () => void
  openAside: () => void
  closeAside: () => void
  collapseAside: () => void
  expandAside: () => void
}
