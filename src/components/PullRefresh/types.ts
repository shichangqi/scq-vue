export type PullRefreshResult = 'success' | 'error'
export type PullRefreshStatus = 'normal' | 'pulling' | 'loosing' | 'loading' | PullRefreshResult

export interface PullRefreshChange {
  status: PullRefreshStatus
  distance: number
}

export interface PullRefreshProps {
  modelValue?: boolean
  disabled?: boolean
  headHeight?: number
  pullDistance?: number
  pullingText?: string
  loosingText?: string
  loadingText?: string
  result?: PullRefreshResult
  resultDuration?: number
  successText?: string
  errorText?: string
  retryText?: string
}
