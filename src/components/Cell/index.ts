import Cell from './Cell.vue'
import CellGroup from '../CellGroup'
import { withInstall } from '../../utils/install'
export { CellGroup }
export default withInstall(Cell, { CellGroup })