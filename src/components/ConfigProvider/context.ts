import { computed, inject, type ComputedRef, type CSSProperties, type InjectionKey } from 'vue'

export type ComponentSize = 'small' | 'default' | 'large'
export type ComponentLocale = 'zh-CN' | 'en-US'
export type ThemeTokens = Partial<Record<'primary' | 'success' | 'warning' | 'danger' | 'text' | 'muted' | 'border' | 'surface' | 'fill' | 'radius', string>>

export interface ComponentConfig {
  size: ComponentSize
  locale: ComponentLocale
  disabled: boolean
  theme?: 'light' | 'dark'
  tokens?: ThemeTokens
}

export const defaultConfig: ComponentConfig = { size: 'default', locale: 'zh-CN', disabled: false }
export const configKey: InjectionKey<ComputedRef<ComponentConfig>> = Symbol('scq-config')
export const useConfig = () => inject(configKey, computed(() => defaultConfig))

export const getThemeStyle = (config: ComponentConfig): CSSProperties => {
  const palette = config.theme === 'dark'
    ? { text: '#e5eaf3', muted: '#a3a6ad', border: '#4c4d4f', surface: '#1d1e1f', fill: '#262727' }
    : config.theme === 'light'
      ? { text: '#303133', muted: '#73767a', border: '#dcdfe6', surface: '#ffffff', fill: '#f5f7fa' }
      : {}
  const entries = Object.entries({ ...palette, ...config.tokens }).map(([key, value]) => [`--scq-${key}`, value])
  if (config.tokens?.primary) entries.push(['--scq-color-primary', config.tokens.primary])
  return Object.fromEntries(entries) as CSSProperties
}

export const useThemeStyle = () => {
  const config = useConfig()
  return computed(() => getThemeStyle(config.value))
}

const messages = {
  'zh-CN': {
    loading: '\u52a0\u8f7d\u4e2d', empty: '\u6682\u65e0\u6570\u636e', close: '\u5173\u95ed', cancel: '\u53d6\u6d88',
    increase: '\u589e\u52a0', decrease: '\u51cf\u5c11', previous: '\u4e0a\u4e00\u9875', next: '\u4e0b\u4e00\u9875',
    pagination: '\u5206\u9875', page: '\u9875\u7801', total: '\u603b\u6761\u6570', pageSize: '\u6bcf\u9875\u6761\u6570',
    back: '\u8fd4\u56de', navigation: '\u5bfc\u822a', selectAll: '\u5168\u9009', selectRow: '\u9009\u62e9\u884c',
    progress: '\u8fdb\u5ea6', search: '\u641c\u7d22', clear: '\u6e05\u9664',
    finished: '\u6ca1\u6709\u66f4\u591a\u4e86', retry: '\u52a0\u8f7d\u5931\u8d25\uff0c\u70b9\u51fb\u91cd\u8bd5', loadMore: '\u52a0\u8f7d\u66f4\u591a',
    confirm: '\u786e\u5b9a', choose: '\u8bf7\u9009\u62e9', refresh: '\u5237\u65b0', pullDown: '\u4e0b\u62c9\u5237\u65b0', release: '\u91ca\u653e\u5237\u65b0', refreshing: '\u5237\u65b0\u4e2d',
    chooseDate: '\u9009\u62e9\u65e5\u671f', previousMonth: '\u4e0a\u4e2a\u6708', nextMonth: '\u4e0b\u4e2a\u6708', today: '\u4eca\u5929', carousel: '\u8f6e\u64ad', actions: '\u64cd\u4f5c',
    chooseMonth: '\u9009\u62e9\u5e74\u6708', chooseTime: '\u9009\u62e9\u65f6\u95f4', slider: '\u6ed1\u5757', rating: '\u8bc4\u5206',
    suggestions: '\u5efa\u8bae', available: '\u53ef\u9009\u9879', selected: '\u5df2\u9009\u9879', moveRight: '\u6dfb\u52a0\u9009\u4e2d\u9879', moveLeft: '\u79fb\u9664\u9009\u4e2d\u9879',
    upload: '\u4e0a\u4f20', selectFiles: '\u9009\u62e9\u6587\u4ef6', dropFiles: '\u62d6\u653e\u6587\u4ef6\u6216\u70b9\u51fb\u9009\u62e9', uploadFailed: '\u4e0a\u4f20\u5931\u8d25', remove: '\u79fb\u9664',
    tree: '\u6811\u5f62\u5217\u8868', expand: '\u5c55\u5f00', collapse: '\u6536\u8d77',
    list: '\u5217\u8868',
    copy: '\u590d\u5236', copied: '\u5df2\u590d\u5236',
    preview: '\u9884\u89c8', imageError: '\u56fe\u7247\u52a0\u8f7d\u5931\u8d25', zoomIn: '\u653e\u5927', zoomOut: '\u7f29\u5c0f', rotate: '\u65cb\u8f6c',
    breadcrumb: '\u9762\u5305\u5c51', steps: '\u6b65\u9aa4',
  },
  'en-US': {
    loading: 'Loading', empty: 'No data', close: 'Close', cancel: 'Cancel', increase: 'Increase', decrease: 'Decrease',
    previous: 'Previous page', next: 'Next page', pagination: 'Pagination', page: 'Page', total: 'Total', pageSize: 'Page size',
    back: 'Back', navigation: 'Navigation', selectAll: 'Select all', selectRow: 'Select row',
    progress: 'Progress', search: 'Search', clear: 'Clear',
    finished: 'No more items', retry: 'Loading failed. Retry', loadMore: 'Load more',
    confirm: 'Confirm', choose: 'Choose', refresh: 'Refresh', pullDown: 'Pull to refresh', release: 'Release to refresh', refreshing: 'Refreshing',
    chooseDate: 'Choose date', previousMonth: 'Previous month', nextMonth: 'Next month', today: 'Today', carousel: 'Carousel', actions: 'Actions',
    chooseMonth: 'Choose month', chooseTime: 'Choose time', slider: 'Slider', rating: 'Rating',
    suggestions: 'Suggestions', available: 'Available', selected: 'Selected', moveRight: 'Add selected items', moveLeft: 'Remove selected items',
    upload: 'Upload', selectFiles: 'Select files', dropFiles: 'Drop files or select', uploadFailed: 'Upload failed', remove: 'Remove',
    tree: 'Tree', expand: 'Expand', collapse: 'Collapse',
    list: 'List',
    copy: 'Copy', copied: 'Copied',
    preview: 'Preview', imageError: 'Image failed to load', zoomIn: 'Zoom in', zoomOut: 'Zoom out', rotate: 'Rotate',
    breadcrumb: 'Breadcrumb', steps: 'Steps',
  },
} as const

export const useLocale = () => {
  const config = useConfig()
  return (key: keyof typeof messages['en-US']) => messages[config.value.locale][key]
}