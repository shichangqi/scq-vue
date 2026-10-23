import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export const LAYOUT_BREAKPOINTS = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } as const
export const LAYOUT_BREAKPOINT_ORDER = ['xs', 'sm', 'md', 'lg', 'xl'] as const
export const SPACING_TOKENS = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export type LayoutBreakpoint = keyof typeof LAYOUT_BREAKPOINTS
export type LayoutBreakpoints = Partial<Record<Exclude<LayoutBreakpoint, 'xs'>, number>>
export type ResponsiveValue<T> = T | Partial<Record<LayoutBreakpoint, T>>
export type SpacingToken = keyof typeof SPACING_TOKENS
export type SpacingValue = number | string | readonly [number | string, number | string]

export const isResponsiveValue = <T>(value: ResponsiveValue<T>): value is Partial<Record<LayoutBreakpoint, T>> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const resolveResponsiveValue = <T>(value: ResponsiveValue<T>, breakpoint: LayoutBreakpoint, fallback: T): T => {
  if (!isResponsiveValue(value)) return value
  let result = fallback
  for (const key of LAYOUT_BREAKPOINT_ORDER) {
    if (value[key] !== undefined) result = value[key]
    if (key === breakpoint) break
  }
  return result
}

export const toCssLength = (value: number | string) => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new RangeError('[scq-vue] Layout lengths must be finite numbers or CSS lengths.')
    return `${Math.max(0, value)}px`
  }
  return value
}
const spacingLength = (value: number | string) => {
  if (typeof value === 'string' && Object.hasOwn(SPACING_TOKENS, value)) {
    const token = value as SpacingToken
    return `var(--scq-space-${token}, ${SPACING_TOKENS[token]}px)`
  }
  return toCssLength(value)
}
export const toCssGap = (value: SpacingValue): string => typeof value === 'number' || typeof value === 'string'
  ? spacingLength(value) : value.map(spacingLength).join(' ')

export const useViewportWidth = (enabled: () => boolean = () => true) => {
  const width = ref(0)
  let mounted = false
  let listening = false
  const update = () => { width.value = window.innerWidth }
  const sync = () => {
    if (!mounted) return
    if (enabled()) {
      update()
      if (!listening) window.addEventListener('resize', update, { passive: true })
      listening = true
    } else {
      window.removeEventListener('resize', update)
      listening = false
    }
  }
  watch(enabled, sync)
  onMounted(() => { mounted = true; sync() })
  onBeforeUnmount(() => { mounted = false; if (listening) window.removeEventListener('resize', update) })
  return width
}

export const useLayoutBreakpoint = (settings: () => LayoutBreakpoints | undefined, enabled: () => boolean) => {
  const width = useViewportWidth(enabled)
  return computed<LayoutBreakpoint>(() => {
    const breakpoints = { ...LAYOUT_BREAKPOINTS, ...settings() }
    if (breakpoints.xs !== LAYOUT_BREAKPOINTS.xs) throw new RangeError('[scq-vue] The xs layout breakpoint must remain zero.')
    let previous = -1
    let active: LayoutBreakpoint = 'xs'
    for (const key of LAYOUT_BREAKPOINT_ORDER) {
      const minimum = breakpoints[key]
      if (!Number.isFinite(minimum) || minimum < 0 || minimum <= previous) {
        throw new RangeError('[scq-vue] Layout breakpoints must be finite, non-negative and strictly increasing from xs=0.')
      }
      previous = minimum
      if (width.value >= minimum) active = key
    }
    return active
  })
}
