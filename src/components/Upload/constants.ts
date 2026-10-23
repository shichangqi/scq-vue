import type { UploadStatus } from './types'

export const UPLOAD_MIN_CONCURRENCY = 1
export const UPLOAD_UNLIMITED_CONCURRENCY = Infinity
export const UPLOAD_COMPLETE_PERCENTAGE = 100
export const UPLOAD_SIZE_UNIT = 1024
export const UPLOAD_SIZE_PRECISION = 1
export const UPLOAD_HTTP_SUCCESS_MIN = 200
export const UPLOAD_HTTP_SUCCESS_END = 300
export const UPLOAD_STARTABLE_STATUSES: ReadonlySet<UploadStatus> = new Set(['ready', 'error', 'cancelled'])
export const UPLOAD_PENDING_STATUSES: ReadonlySet<UploadStatus> = new Set(['queued', 'uploading'])
export const UPLOAD_CONFIGURATION_ERROR_NAME = 'UploadConfigurationError'
export const UPLOAD_CONFIGURATION_ERROR_PREFIX = '[scq-vue] Upload configuration error'
export const UPLOAD_CONFIGURATION_ERROR_MESSAGES = {
  concurrency: 'Upload concurrency must be a positive integer or Infinity; omit it for unlimited uploads. Queue admission is paused until this is corrected.',
  duplicateUid: 'Upload fileList must contain unique uid values. This duplicate entry was rejected; the first entry was retained.',
} as const
