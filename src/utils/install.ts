import type { App, Component, Plugin } from 'vue'

export const withInstall = <ComponentType extends Component, Children extends Record<string, Component> = Record<never, never>>(
  component: ComponentType,
  children?: Children,
): ComponentType & Plugin & Children => {
  return Object.assign(component, children, {
    install(app: App) {
      for (const entry of [component, ...Object.values(children || {})]) {
        const name = (entry as { name?: string }).name
        if (name) app.component(`scq-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`, entry)
      }
    },
  }) as ComponentType & Plugin & Children
}