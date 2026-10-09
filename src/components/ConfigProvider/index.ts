import ConfigProvider from './ConfigProvider.vue'
import { withInstall } from '../../utils/install'

export type { ComponentConfig, ComponentLocale, ComponentSize, ThemeTokens } from './context'
export default withInstall(ConfigProvider)