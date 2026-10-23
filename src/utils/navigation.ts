import { computed, getCurrentInstance, inject, provide, toValue, type ComputedRef, type InjectionKey, type MaybeRefOrGetter } from 'vue'

export interface NavigationLocation {
  href: string
  active?: boolean
  exactActive?: boolean
}
export interface NavigationOptions { replace: boolean; signal: AbortSignal }
export interface NavigationAdapter {
  resolve: (to: string) => NavigationLocation
  navigate: (to: string, options: NavigationOptions) => boolean | void | Promise<boolean | void>
}
const navigationKey: InjectionKey<ComputedRef<NavigationAdapter | undefined>> = Symbol.for('scq-vue.navigation')

export const provideNavigationAdapter = (adapter: MaybeRefOrGetter<NavigationAdapter | undefined>) => {
  if (!getCurrentInstance()) throw new Error('[scq-vue] provideNavigationAdapter must be called during setup.')
  provide(navigationKey, computed(() => toValue(adapter)))
}
export const useNavigationAdapter = (explicit: () => NavigationAdapter | undefined) => {
  const inherited = inject(navigationKey, undefined)
  return computed(() => explicit() ?? inherited?.value)
}
