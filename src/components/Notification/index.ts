import Notification from './Notification.vue'
import { notification } from './notification-method'
import { withInstall } from '../../utils/install'
export type { NotificationType, NotificationPosition } from './Notification.vue'
export type { NotificationOptions, NotificationInstance } from './notification-method'
export default Object.assign(withInstall(Notification), notification)