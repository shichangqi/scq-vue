export interface WatermarkProps {
  content?: string | readonly string[]
  color?: string
  gap?: number | readonly [number, number]
  size?: number
  rotate?: number
  zIndex?: number
  fullscreen?: boolean
  image?: string
  imageSize?: readonly [number, number]
  imageOpacity?: number
  offset?: readonly [number, number]
  fontFamily?: string
  fontWeight?: string | number
  lineHeight?: number
  container?: string | HTMLElement
  print?: boolean
}
export interface WatermarkRenderEvent {
  container: HTMLElement
  fullscreen: boolean
  imageLoaded: boolean
}
