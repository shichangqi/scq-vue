import type { ComputedRef, InjectionKey, Slots } from 'vue'
import type { IconName } from '../Icon/icons'

export type MenuKey = string | number
export interface MenuItemOption { key: MenuKey; label: string; icon?: IconName; href?: string; disabled?: boolean; divided?: boolean; children?: readonly MenuItemOption[]; description?: string; shortcut?: string }
export interface MenuContext { state: ComputedRef<{ active: MenuKey | null; opened: Set<MenuKey>; disabled: boolean; mode: 'horizontal' | 'vertical'; focusKey?: MenuKey }>; slots: Slots; select: (item: MenuItemOption, path: MenuKey[]) => void; toggle: (key: MenuKey, path: MenuKey[], value?: boolean) => void; token: (key: MenuKey) => string; consumeFocus: (key: MenuKey) => void }
export const menuKey: InjectionKey<MenuContext> = Symbol('scq-menu')