import Collapse from './Collapse.vue'
import CollapseItem from '../CollapseItem'
import { withInstall } from '../../utils/install'

export { CollapseItem }
export type { CollapseName, CollapseValue } from './context'
export default withInstall(Collapse, { CollapseItem })