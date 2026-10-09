import Form from './Form.vue'
import FormItem from '../FormItem'
import { withInstall } from '../../utils/install'

export { FormItem }
export type { FormInstance, FormLabelPosition, FormModel, FormRule, FormRules, FormTrigger } from './context'
export default withInstall(Form, { FormItem })