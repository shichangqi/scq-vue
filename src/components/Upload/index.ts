import Upload from './Upload.vue'
import { withInstall } from '../../utils/install'
export type { UploadStatus, UploadFile, UploadRequestOptions, UploadProps, UploadExpose, UploadConfigurationError } from './types'
export default withInstall(Upload)