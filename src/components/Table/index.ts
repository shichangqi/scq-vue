import Table from './Table.vue'
import { withInstall } from '../../utils/install'
export type {
  TableColumn, TableColumnResize, TableColumnWidths, TableFilterOption, TableFilters,
  TableFilterValue, TablePaginationOptions, TableProps, TableQuery, TableQueryAction,
  TableRow, TableRowKey, TableSort,
} from './types'
export default withInstall(Table)