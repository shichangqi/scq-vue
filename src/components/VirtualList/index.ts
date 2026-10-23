import VirtualList from './VirtualList.vue'
import { withInstall } from '../../utils/install'
export { VIRTUAL_LIST_DEFAULTS } from './constants'
export type { VirtualListExpose, VirtualListKey, VirtualListProps, VirtualListScrollOptions, VirtualListSlots } from './types'
export default withInstall(VirtualList)