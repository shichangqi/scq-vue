import Toast from './Toast.vue'
import { withInstall } from '../../utils/install'
import { toast } from './toast-method'

export type { ToastPosition, ToastType } from './Toast.vue'
export type { ToastApiOptions, ToastInstance } from './toast-method'
export default Object.assign(withInstall(Toast), toast)