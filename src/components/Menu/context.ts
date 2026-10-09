import type { ComputedRef, InjectionKey } from 'vue'
import type { IconName } from '../Icon/icons'

export type MenuKey = string | number
export interface MenuItemOption { key: MenuKey; label: string; icon?: IconName; href?: string; disabled?: boolean; divided?: boolean; children?: MenuItemOption[] }
export interface MenuContext { state: ComputedRef<{ active: MenuKey | null; opened: Set<MenuKey>; disabled: boolean; mode: 'horizontal' | 'vertical' }>; select: (item: MenuItemOption, path: MenuKey[]) => void; toggle: (key: MenuKey, path: MenuKey[], value?: boolean) => void; token: (key: MenuKey) => string }
export const menuKey: InjectionKey<MenuContext> = Symbol('scq-menu')