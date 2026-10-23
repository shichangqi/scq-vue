import TreeSelect from './TreeSelect.vue'
import { withInstall } from '../../utils/install'
export type { TreeSelectValue, TreeSelectExpose, TreeSelectSlots } from './types'
export type { TreeKey, TreeNode, TreeCheck } from '../Tree/types'
export default withInstall(TreeSelect)