import type { App, Plugin } from 'vue'
import Radio from './Radio.vue'
import RadioGroup from './RadioGroup.vue'
import type { RadioDirection, RadioSize, RadioValue } from './context'

type SFCWithInstall<T> = T & Plugin

type RadioWithGroup = SFCWithInstall<typeof Radio> & {
  Group: typeof RadioGroup
}

const _Radio = Radio as RadioWithGroup

const getPrefixedName = (name: string): string => {
  return `scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

_Radio.Group = RadioGroup

_Radio.install = (app: App): void => {
  const radioName = _Radio.name || 'Radio'
  const groupName = RadioGroup.name || 'RadioGroup'
  app.component(getPrefixedName(radioName), _Radio)
  app.component(getPrefixedName(groupName), RadioGroup)
}

export { RadioGroup }
export type { RadioDirection, RadioSize, RadioValue }
export default _Radio
