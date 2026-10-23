import DateTimePicker from './DateTimePicker.vue'
import { withInstall } from '../../utils/install'

export type { DateTimePickerType, DateTimePickerValue, DateTimePickerRole, DateTimePickerShortcut, DateTimePickerInvalidReason } from './shared'
export default withInstall(DateTimePicker)
