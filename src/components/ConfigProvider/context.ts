import { computed, getCurrentInstance, inject, markRaw, type AppContext, type ComputedRef, type CSSProperties, type InjectionKey } from 'vue'

export const componentSizes = ['small', 'default', 'large'] as const
export type ComponentSize = typeof componentSizes[number]
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
// Full and per-component bundles share the key, never the provided state.
export const configKey: InjectionKey<ComputedRef<ComponentConfig>> = Symbol.for('scq-vue.config')
export const useConfig = () => inject(configKey, computed(() => defaultConfig))

const focusRing = '0 0 0 var(--scq-control-border-width, 1px) var(--scq-primary, #2563eb) inset'
const themeStyles: Record<'light' | 'dark', CSSProperties> = {
  light: {
    colorScheme: 'light',
    '--scq-text': '#303133', '--scq-text-secondary': '#475569', '--scq-muted': '#73767a',
    '--scq-border': '#dcdfe6', '--scq-border-hover': '#cbd5e1',
    '--scq-surface': '#ffffff', '--scq-fill': '#f5f7fa', '--scq-fill-hover': '#f1f5f9',
    '--scq-shadow-xs': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    '--scq-shadow-sm': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
    '--scq-shadow-md': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.08)',
    '--scq-shadow-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.08)',
    '--scq-shadow-xl': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
    '--scq-shadow-popover': '0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)',
    '--scq-shadow-modal': '0 24px 64px rgba(15, 23, 42, 0.18), 0 8px 24px rgba(15, 23, 42, 0.08)',
    '--scq-focus-ring': focusRing,
  },
  dark: {
    colorScheme: 'dark',
    '--scq-text': '#e5eaf3', '--scq-text-secondary': '#a3a6ad', '--scq-muted': '#a3a6ad',
    '--scq-border': '#4c4d4f', '--scq-border-hover': '#6366f1',
    '--scq-surface': '#1d1e1f', '--scq-fill': '#262727', '--scq-fill-hover': '#303133',
    '--scq-shadow-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    '--scq-shadow-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
    '--scq-shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    '--scq-shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
    '--scq-shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
    '--scq-shadow-popover': '0 12px 32px rgba(0, 0, 0, 0.65)',
    '--scq-shadow-modal': '0 24px 64px rgba(0, 0, 0, 0.8)',
    '--scq-focus-ring': focusRing,
  },
}
const semanticTokens = ['primary', 'success', 'warning', 'danger'] as const
const semanticTokenMixes = {
  hover: 'white 15%',
  'hover-start': 'white 30%',
  active: 'black 15%',
  'active-border': 'black 25%',
  'soft-bg': 'transparent 90%',
  'soft-border': 'transparent 65%',
  'focus-ring': 'transparent 74%',
  shadow: 'transparent 75%',
  'shadow-hover': 'transparent 62%',
  'shadow-active': 'transparent 80%',
} as const

export const getThemeStyle = (config: ComponentConfig): CSSProperties => {
  const style: CSSProperties = { ...(config.theme ? themeStyles[config.theme] : {}) }
  for (const [key, value] of Object.entries(config.tokens ?? {})) style[`--scq-${key}`] = value
  for (const key of semanticTokens) {
    const value = config.tokens?.[key]
    if (value === undefined) continue
    style[`--scq-color-${key}`] = value
    for (const [suffix, mix] of Object.entries(semanticTokenMixes)) {
      const color = `color-mix(in srgb, ${value}, ${mix})`
      style[`--scq-color-${key}-${suffix}`] = color
      if (key === 'primary' && (suffix === 'hover' || suffix === 'active')) style[`--scq-primary-${suffix}`] = color
    }
  }
  if (config.tokens?.radius !== undefined) {
    style['--scq-radius-md'] = config.tokens.radius
    style['--scq-control-radius'] = config.tokens.radius
  }
  return style
}

export const useThemeStyle = () => {
  const config = useConfig()
  return computed(() => getThemeStyle(config.value))
}

export const useConfigContext = (name: string): AppContext => {
  const instance = getCurrentInstance()
  if (!instance) throw new Error(`${name} must be called during component setup.`)
  return markRaw({
    ...instance.appContext,
    provides: { ...instance.appContext.provides, [configKey]: useConfig() },
  })
}

export const resolveMethodContext = (bound?: AppContext, supplied?: AppContext): AppContext | undefined => {
  if (bound && supplied && bound !== supplied) {
    throw new Error('Scoped feedback is bound to its setup context. Use a global method to supply another appContext.')
  }
  return bound ?? supplied
}

export const getConfigFromContext = (context?: AppContext): ComponentConfig => {
  const config: ComputedRef<ComponentConfig> | undefined = context?.provides[configKey]
  return config?.value ?? defaultConfig
}

const messages = {
  'zh-CN': {
    externalLink: '\u5916\u90e8\u94fe\u63a5', opensInNewWindow: '\u5728\u65b0\u7a97\u53e3\u6253\u5f00',
    selectCard: '\u9009\u62e9\u5361\u7247', openCard: '\u6253\u5f00\u5361\u7247',
    sidebar: '\u4fa7\u680f', openSidebar: '\u6253\u5f00\u4fa7\u680f', collapseSidebar: '\u6536\u8d77\u4fa7\u680f', expandSidebar: '\u5c55\u5f00\u4fa7\u680f', resizeSidebar: '\u8c03\u6574\u4fa7\u680f\u5bbd\u5ea6',
    queued: '\u6392\u961f\u4e2d', cancelAll: '\u5168\u90e8\u53d6\u6d88', retryAll: '\u91cd\u8bd5\u5931\u8d25\u9879',
    uploadConcurrencyError: '\u4e0a\u4f20\u5e76\u53d1\u6570\u5fc5\u987b\u4e3a\u6b63\u6574\u6570\u6216 Infinity',
    loadError: '\u52a0\u8f7d\u5931\u8d25', retryAction: '\u91cd\u8bd5', pending: '\u5904\u7406\u4e2d',
    filter: '\u7b5b\u9009', reset: '\u91cd\u7f6e', apply: '\u5e94\u7528', columns: '\u5217\u8bbe\u7f6e',
    resizeColumn: '\u8c03\u6574\u5217\u5bbd', sortAscending: '\u5347\u5e8f', sortDescending: '\u964d\u5e8f', sortNone: '\u53d6\u6d88\u6392\u5e8f',
    formErrors: '\u8bf7\u68c0\u67e5\u4ee5\u4e0b\u5b57\u6bb5', validationFailed: '\u6821\u9a8c\u5931\u8d25',
    refreshSuccess: '\u5237\u65b0\u6210\u529f', refreshFailed: '\u5237\u65b0\u5931\u8d25',
    clearInput: '\u6e05\u7a7a\u8f93\u5165', showPassword: '\u663e\u793a\u5bc6\u7801', hidePassword: '\u9690\u85cf\u5bc6\u7801',
    noMatch: '\u65e0\u5339\u914d\u6570\u636e', selectLoading: '\u52a0\u8f7d\u4e2d...',
    dialog: '\u5bf9\u8bdd\u6846', modal: '\u5f39\u6846', panel: '\u9762\u677f',
    closeDialog: '\u5173\u95ed\u5bf9\u8bdd\u6846', closeModal: '\u5173\u95ed\u5f39\u6846', closePopup: '\u5173\u95ed\u5f39\u51fa\u5c42',
    noticeTitle: '\u63d0\u793a', successTitle: '\u6210\u529f', warningTitle: '\u8b66\u544a', errorTitle: '\u9519\u8bef', confirmTitle: '\u786e\u8ba4',
    jumpToPage: '\u8df3\u8f6c\u5230\u9875',
    confirmationFailed: '\u64cd\u4f5c\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
    resultSuccess: '\u64cd\u4f5c\u6210\u529f', resultWarning: '\u9700\u8981\u68c0\u67e5', resultError: '\u64cd\u4f5c\u5931\u8d25', resultInfo: '\u7b49\u5f85\u5904\u7406',
    result403: '\u65e0\u8bbf\u95ee\u6743\u9650', result404: '\u5185\u5bb9\u4e0d\u5b58\u5728', result500: '\u670d\u52a1\u6682\u4e0d\u53ef\u7528',
    resultSaved: '\u8bf7\u6c42\u5df2\u5b8c\u6210\u3002', resultReview: '\u8bf7\u68c0\u67e5\u4fe1\u606f\u540e\u7ee7\u7eed\u3002', resultRetry: '\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002',
    resultPending: '\u8bf7\u6c42\u6b63\u5728\u5904\u7406\u4e2d\u3002', resultContact: '\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u786e\u8ba4\u6743\u9650\u3002', resultUnavailable: '\u5185\u5bb9\u53ef\u80fd\u5df2\u79fb\u52a8\u6216\u5220\u9664\u3002',
    emptySearch: '\u6ca1\u6709\u5339\u914d\u7684\u7ed3\u679c', emptyUnconfigured: '\u5c1a\u672a\u914d\u7f6e',
    loading: '\u52a0\u8f7d\u4e2d', empty: '\u6682\u65e0\u6570\u636e', close: '\u5173\u95ed', cancel: '\u53d6\u6d88',
    increase: '\u589e\u52a0', decrease: '\u51cf\u5c11', previous: '\u4e0a\u4e00\u9875', next: '\u4e0b\u4e00\u9875',
    pagination: '\u5206\u9875', page: '\u9875\u7801', total: '\u603b\u6761\u6570', pageSize: '\u6bcf\u9875\u6761\u6570',
    back: '\u8fd4\u56de', navigation: '\u5bfc\u822a', selectAll: '\u5168\u9009', selectRow: '\u9009\u62e9\u884c',
    progress: '\u8fdb\u5ea6', search: '\u641c\u7d22', clear: '\u6e05\u9664',
    finished: '\u6ca1\u6709\u66f4\u591a\u4e86', retry: '\u52a0\u8f7d\u5931\u8d25\uff0c\u70b9\u51fb\u91cd\u8bd5', loadMore: '\u52a0\u8f7d\u66f4\u591a',
    confirm: '\u786e\u5b9a', choose: '\u8bf7\u9009\u62e9', refresh: '\u5237\u65b0', pullDown: '\u4e0b\u62c9\u5237\u65b0', release: '\u91ca\u653e\u5237\u65b0', refreshing: '\u5237\u65b0\u4e2d',
    chooseDate: '\u9009\u62e9\u65e5\u671f', previousMonth: '\u4e0a\u4e2a\u6708', nextMonth: '\u4e0b\u4e2a\u6708', today: '\u4eca\u5929', carousel: '\u8f6e\u64ad', actions: '\u64cd\u4f5c',
    chooseMonth: '\u9009\u62e9\u5e74\u6708', chooseTime: '\u9009\u62e9\u65f6\u95f4', slider: '\u6ed1\u5757', rating: '\u8bc4\u5206',
    chooseYear: '\u9009\u62e9\u5e74\u4efd', previousYear: '\u4e0a\u4e00\u5e74', nextYear: '\u4e0b\u4e00\u5e74',
    previousYears: '\u4e0a\u4e00\u7ec4\u5e74\u4efd', nextYears: '\u4e0b\u4e00\u7ec4\u5e74\u4efd', backToDates: '\u8fd4\u56de\u65e5\u671f\u9009\u62e9',
    hour: '\u65f6', minute: '\u5206', second: '\u79d2', now: '\u6b64\u65f6', startTime: '\u5f00\u59cb\u65f6\u95f4', endTime: '\u7ed3\u675f\u65f6\u95f4',
    chooseDateTime: '\u9009\u62e9\u65e5\u671f\u65f6\u95f4', chooseDateTimeRange: '\u9009\u62e9\u65e5\u671f\u65f6\u95f4\u8303\u56f4',
    startDateTime: '\u5f00\u59cb\u65e5\u671f\u65f6\u95f4', endDateTime: '\u7ed3\u675f\u65e5\u671f\u65f6\u95f4', shortcuts: '\u5feb\u6377\u9009\u9879',
    selectDateFirst: '\u8bf7\u5148\u9009\u62e9\u65e5\u671f', dateTimeIncomplete: '\u8bf7\u5b8c\u6210\u65e5\u671f\u548c\u65f6\u95f4\u9009\u62e9',
    dateTimeFormatError: '\u65e5\u671f\u65f6\u95f4\u683c\u5f0f\u65e0\u6548',
    dateTimeBoundsError: '\u65e5\u671f\u65f6\u95f4\u8d85\u51fa\u53ef\u9009\u8303\u56f4',
    dateTimeDateError: '\u9009\u62e9\u4e2d\u5305\u542b\u4e0d\u53ef\u7528\u7684\u65e5\u671f',
    dateTimeTimeError: '\u8be5\u65f6\u95f4\u4e0d\u53ef\u9009\u7528',
    dateTimeOrderError: '\u7ed3\u675f\u65f6\u95f4\u4e0d\u80fd\u65e9\u4e8e\u5f00\u59cb\u65f6\u95f4',
    dateTimeRangeError: '\u9009\u62e9\u8303\u56f4\u8d85\u8fc7\u6700\u5927\u5929\u6570',
    dateTimeStepError: '\u65f6\u95f4\u4e0d\u7b26\u5408\u8bbe\u5b9a\u7684\u6b65\u957f',
    dateTimeConfigError: '\u8bf7\u68c0\u67e5\u65e5\u671f\u65f6\u95f4\u9009\u62e9\u5668\u7684\u8fb9\u754c\u3001\u6b65\u957f\u6216\u9ed8\u8ba4\u65f6\u95f4\u914d\u7f6e',
    suggestions: '\u5efa\u8bae', available: '\u53ef\u9009\u9879', selected: '\u5df2\u9009\u9879', moveRight: '\u6dfb\u52a0\u9009\u4e2d\u9879', moveLeft: '\u79fb\u9664\u9009\u4e2d\u9879',
    upload: '\u4e0a\u4f20', selectFiles: '\u9009\u62e9\u6587\u4ef6', dropFiles: '\u62d6\u653e\u6587\u4ef6\u6216\u70b9\u51fb\u9009\u62e9', uploadFailed: '\u4e0a\u4f20\u5931\u8d25', remove: '\u79fb\u9664',
    tree: '\u6811\u5f62\u5217\u8868', expand: '\u5c55\u5f00', collapse: '\u6536\u8d77',
    list: '\u5217\u8868',
    copy: '\u590d\u5236', copied: '\u5df2\u590d\u5236',
    preview: '\u9884\u89c8', imageError: '\u56fe\u7247\u52a0\u8f7d\u5931\u8d25', zoomIn: '\u653e\u5927', zoomOut: '\u7f29\u5c0f', rotate: '\u65cb\u8f6c',
    breadcrumb: '\u9762\u5305\u5c51', steps: '\u6b65\u9aa4',
  },
  'en-US': {
    externalLink: 'External link', opensInNewWindow: 'Opens in a new window',
    selectCard: 'Select card', openCard: 'Open card',
    sidebar: 'Sidebar', openSidebar: 'Open sidebar', collapseSidebar: 'Collapse sidebar', expandSidebar: 'Expand sidebar', resizeSidebar: 'Resize sidebar',
    queued: 'Queued', cancelAll: 'Cancel all', retryAll: 'Retry failed uploads',
    uploadConcurrencyError: 'Upload concurrency must be a positive integer or Infinity',
    loadError: 'Loading failed', retryAction: 'Retry', pending: 'Pending',
    filter: 'Filter', reset: 'Reset', apply: 'Apply', columns: 'Columns',
    resizeColumn: 'Resize column', sortAscending: 'Sort ascending', sortDescending: 'Sort descending', sortNone: 'Clear sorting',
    formErrors: 'Review the following fields', validationFailed: 'Validation failed',
    refreshSuccess: 'Refreshed', refreshFailed: 'Refresh failed',
    clearInput: 'Clear input', showPassword: 'Show password', hidePassword: 'Hide password',
    noMatch: 'No matching data', selectLoading: 'Loading...',
    dialog: 'Dialog', modal: 'Modal', panel: 'Panel',
    closeDialog: 'Close dialog', closeModal: 'Close modal', closePopup: 'Close popup',
    noticeTitle: 'Notice', successTitle: 'Success', warningTitle: 'Warning', errorTitle: 'Error', confirmTitle: 'Confirm',
    jumpToPage: 'Jump to page',
    confirmationFailed: 'Operation failed. Please retry.',
    resultSuccess: 'Success', resultWarning: 'Review required', resultError: 'Operation failed', resultInfo: 'Pending',
    result403: 'Access denied', result404: 'Not found', result500: 'Service unavailable',
    resultSaved: 'The request is complete.', resultReview: 'Review the information before continuing.', resultRetry: 'Please try again later.',
    resultPending: 'The request is being processed.', resultContact: 'Contact an administrator to check access.', resultUnavailable: 'The content may have moved or been deleted.',
    emptySearch: 'No matching results', emptyUnconfigured: 'Not configured',
    loading: 'Loading', empty: 'No data', close: 'Close', cancel: 'Cancel', increase: 'Increase', decrease: 'Decrease',
    previous: 'Previous page', next: 'Next page', pagination: 'Pagination', page: 'Page', total: 'Total', pageSize: 'Page size',
    back: 'Back', navigation: 'Navigation', selectAll: 'Select all', selectRow: 'Select row',
    progress: 'Progress', search: 'Search', clear: 'Clear',
    finished: 'No more items', retry: 'Loading failed. Retry', loadMore: 'Load more',
    confirm: 'Confirm', choose: 'Choose', refresh: 'Refresh', pullDown: 'Pull to refresh', release: 'Release to refresh', refreshing: 'Refreshing',
    chooseDate: 'Choose date', previousMonth: 'Previous month', nextMonth: 'Next month', today: 'Today', carousel: 'Carousel', actions: 'Actions',
    chooseMonth: 'Choose month', chooseTime: 'Choose time', slider: 'Slider', rating: 'Rating',
    chooseYear: 'Choose year', previousYear: 'Previous year', nextYear: 'Next year',
    previousYears: 'Previous years', nextYears: 'Next years', backToDates: 'Back to dates',
    hour: 'Hour', minute: 'Minute', second: 'Second', now: 'Now', startTime: 'Start', endTime: 'End',
    chooseDateTime: 'Choose date and time', chooseDateTimeRange: 'Choose date and time range',
    startDateTime: 'Start date and time', endDateTime: 'End date and time', shortcuts: 'Shortcuts',
    selectDateFirst: 'Choose a date first', dateTimeIncomplete: 'Complete the date and time selection',
    dateTimeFormatError: 'Invalid date and time format',
    dateTimeBoundsError: 'Date and time are outside the allowed bounds',
    dateTimeDateError: 'The selection includes an unavailable date',
    dateTimeTimeError: 'This time is unavailable',
    dateTimeOrderError: 'End must not be earlier than start',
    dateTimeRangeError: 'The selection exceeds the maximum number of days',
    dateTimeStepError: 'Time does not match the configured step',
    dateTimeConfigError: 'Check the date/time bounds, steps or default time configuration',
    suggestions: 'Suggestions', available: 'Available', selected: 'Selected', moveRight: 'Add selected items', moveLeft: 'Remove selected items',
    upload: 'Upload', selectFiles: 'Select files', dropFiles: 'Drop files or select', uploadFailed: 'Upload failed', remove: 'Remove',
    tree: 'Tree', expand: 'Expand', collapse: 'Collapse',
    list: 'List',
    copy: 'Copy', copied: 'Copied',
    preview: 'Preview', imageError: 'Image failed to load', zoomIn: 'Zoom in', zoomOut: 'Zoom out', rotate: 'Rotate',
    breadcrumb: 'Breadcrumb', steps: 'Steps',
  },
} as const

export type LocaleKey = keyof typeof messages['en-US']
export const getLocaleMessage = (config: ComponentConfig, key: LocaleKey): string => messages[config.locale][key]

export const useLocale = () => {
  const config = useConfig()
  return (key: LocaleKey) => getLocaleMessage(config.value, key)
}