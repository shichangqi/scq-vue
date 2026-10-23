import { onBeforeUnmount, onMounted, type ComputedRef, type InjectionKey } from 'vue'

export type RadioValue = string | number | boolean
export type RadioSize = 'small' | 'default' | 'large'
export type RadioDirection = 'horizontal' | 'vertical'

export interface RadioGroupContext {
  modelValue: ComputedRef<RadioValue | null | undefined>
  name: ComputedRef<string>
  disabled: ComputedRef<boolean>
  size: ComputedRef<RadioSize>
  changeEvent: (value: RadioValue) => void
  tabStop?: ComputedRef<RadioGroupControl | undefined>
  register?: (control: RadioGroupControl) => () => void
}

export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol.for('scq-vue.radio-group')

interface NativeRadioControl {
  element: () => HTMLInputElement | undefined
  checked: () => boolean
}
export interface RadioGroupControl extends NativeRadioControl {
  disabled: () => boolean
}
const controlsKey = Symbol.for('scq-vue.native-radio-controls')
const shared = globalThis as typeof globalThis & { [controlsKey]?: WeakMap<Document, Set<NativeRadioControl>> }
const controls = shared[controlsKey] ?? (shared[controlsKey] = new WeakMap<Document, Set<NativeRadioControl>>())

export const useNativeRadioControl = (control: NativeRadioControl) => {
  let owner: Document | undefined
  onMounted(() => {
    owner = control.element()?.ownerDocument
    if (!owner) return
    let entries = controls.get(owner)
    if (!entries) { entries = new Set(); controls.set(owner, entries) }
    entries.add(control)
  })
  onBeforeUnmount(() => {
    if (!owner) return
    const entries = controls.get(owner)
    entries?.delete(control)
    if (!entries?.size) controls.delete(owner)
  })
  return () => {
    const input = control.element()
    if (!input) return
    input.checked = control.checked()
    if (!input.name) return
    for (const entry of controls.get(input.ownerDocument) ?? []) {
      const peer = entry.element()
      if (peer && peer !== input && peer.name === input.name && peer.form === input.form && peer.getRootNode() === input.getRootNode()) {
        peer.checked = entry.checked()
      }
    }
  }
}
