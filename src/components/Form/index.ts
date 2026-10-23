import Form from './Form.vue'
import FormItem from '../FormItem'
import { withInstall } from '../../utils/install'

export { FormItem }
export type { FormInstance, FormLabelPosition, FormModel, FormRule, FormRules, FormTrigger, FormFieldState, FormState, FormControl } from './context'
export { useFormControl } from './useFormControl'
export type { FormControlOptions } from './useFormControl'
export default withInstall(Form, { FormItem })