export type UploadStatus = 'ready' | 'queued' | 'uploading' | 'success' | 'error' | 'cancelled'

export interface UploadFile {
  /** Stable file identity. Duplicate IDs keep the first entry and report every rejected entry. */
  uid: string
  name: string
  size: number
  status: UploadStatus
  percentage: number
  raw?: File
  url?: string
  response?: unknown
  error?: unknown
}

export interface UploadRequestOptions {
  file: Blob
  filename: string
  action: string
  name: string
  method: 'POST' | 'PUT' | 'PATCH'
  data: Record<string, string | Blob>
  headers: Record<string, string>
  withCredentials: boolean
  signal: AbortSignal
  onProgress: (percentage: number) => void
}

/** Emitted by configuration-error; reported to console.error when no listener handles the event. */
export type UploadConfigurationError = Error & (
  { code: 'invalid-concurrency'; value: unknown }
  | {
    code: 'duplicate-uid'
    uid: string
    /** Zero-based index of the rejected entry in the supplied fileList. */
    index: number
    file: UploadFile
    firstIndex: number
    firstFile: UploadFile
  }
)

export interface UploadProps {
  /** Duplicate UIDs emit configuration-error with both the rejected entry and the retained first entry. */
  fileList?: UploadFile[]
  action?: string
  method?: UploadRequestOptions['method']
  name?: string
  headers?: Record<string, string>
  data?: Record<string, string | Blob>
  withCredentials?: boolean
  multiple?: boolean
  accept?: string
  limit?: number
  maxSize?: number
  autoUpload?: boolean
  /** A disabled Form remains disabled even when this prop is explicitly false. */
  disabled?: boolean
  drag?: boolean
  showFileList?: boolean
  listType?: 'text' | 'picture'
  /**
   * Maximum admitted uploads, including beforeUpload. Omitted or Infinity means unlimited.
   * Other values must be positive integers. Invalid values emit configuration-error and pause admission.
   * Already admitted work continues; queued files resume FIFO when the configuration becomes valid.
   * Lowering the limit does not interrupt admitted uploads.
   */
  concurrency?: number
  beforeUpload?: (file: File) => boolean | void | Blob | Promise<boolean | void | Blob>
  beforeRemove?: (file: UploadFile) => boolean | void | Promise<boolean | void>
  /**
   * Stop the underlying request on signal.abort and settle its promise after it stops.
   * An aborted request retains its concurrency slot until this promise settles.
   * Progress and results from cancelled, removed or replaced attempts are ignored.
   */
  httpRequest?: (options: UploadRequestOptions) => Promise<unknown>
}

export interface UploadExpose {
  /**
   * Enqueue ready, failed and cancelled files in list order.
   * Invalid concurrency leaves these attempts queued until it is corrected or they are cancelled.
   * Cancelled queued/preflight attempts finish immediately; sent attempts wait for request settlement.
   */
  submit: () => Promise<void[]>
  /** Cancel one pending attempt, or all queued/admitted attempts when uid is omitted. */
  abort: (uid?: string) => void
  cancelAll: () => void
  /** Enqueue a failed or cancelled file at the end of the queue. */
  retry: (uid: string) => Promise<void>
  /** Enqueue failed files only, in list order. Cancelled files are not included. */
  retryAll: () => Promise<void[]>
  remove: (uid: string) => Promise<void>
  addFiles: (files: File[]) => void
  clearFiles: () => Promise<void>
  /** Snapshot of current concurrency/duplicate-UID errors; corrected inputs clear their errors. */
  getConfigurationErrors: () => readonly UploadConfigurationError[]
}
