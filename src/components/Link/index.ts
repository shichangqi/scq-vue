import Link from './Link.vue'
import { withInstall } from '../../utils/install'
export type { LinkProps, LinkExpose } from './types'
export type { NavigationAdapter, NavigationLocation, NavigationOptions } from '../../utils/navigation'
export { provideNavigationAdapter } from '../../utils/navigation'
export default withInstall(Link)