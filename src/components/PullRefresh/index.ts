import PullRefresh from './PullRefresh.vue'
import { withInstall } from '../../utils/install'
export type { PullRefreshStatus, PullRefreshResult, PullRefreshChange, PullRefreshProps } from './types'
export default withInstall(PullRefresh)