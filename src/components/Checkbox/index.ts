import type { App, Plugin } from 'vue'
import Checkbox from './Checkbox.vue'
import CheckboxGroup from './CheckboxGroup.vue'
import type { CheckboxDirection, CheckboxSize, CheckboxValue } from './context'

type SFCWithInstall<T> = T & Plugin

type CheckboxWithGroup = SFCWithInstall<typeof Checkbox> & {
  Group: typeof CheckboxGroup
}

const _Checkbox = Checkbox as CheckboxWithGroup

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Checkbox.Group = CheckboxGroup

_Checkbox.install = (app: App): void => {
  const checkboxName = _Checkbox.name || 'Checkbox'
  const groupName = CheckboxGroup.name || 'CheckboxGroup'
  app.component(getPrefixedName(checkboxName), _Checkbox)
  app.component(getPrefixedName(groupName), CheckboxGroup)
}

export { CheckboxGroup }
export type { CheckboxDirection, CheckboxSize, CheckboxValue }
export default _Checkbox
