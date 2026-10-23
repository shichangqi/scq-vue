import Space from './Space.vue'
import { withInstall } from '../../utils/install'

export type { SpaceProps, SpaceSlots } from './Space.vue'
export type { LayoutBreakpoint, LayoutBreakpoints, ResponsiveValue, SpacingToken, SpacingValue } from '../../utils/layout'
export { LAYOUT_BREAKPOINTS, SPACING_TOKENS } from '../../utils/layout'
export default withInstall(Space)