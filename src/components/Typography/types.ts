export type TypographyTag = 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export type TypographyType = 'default' | 'secondary' | 'primary' | 'success' | 'warning' | 'danger'

export interface TypographyProps {
  as?: TypographyTag
  content?: string
  type?: TypographyType
  size?: number | string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  mark?: boolean
  ellipsis?: boolean
  lines?: number
  copyable?: boolean
  copyText?: string
  expandable?: boolean
  expanded?: boolean
  defaultExpanded?: boolean
}
