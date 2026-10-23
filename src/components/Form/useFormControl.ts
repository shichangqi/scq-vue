import { computed, inject, onBeforeUnmount, provide, useAttrs } from 'vue'
import { useConfig } from '../ConfigProvider/context'
import { formItemKey, formKey, type FormControl } from './context'

const NATIVE_ATTRIBUTES = new Set(['id', 'role', 'tabindex', 'inputmode', 'enterkeyhint', 'autocapitalize', 'autofocus', 'spellcheck', 'pattern', 'required', 'form', 'min', 'max', 'step', 'rows', 'cols', 'wrap'])
const ROOT_ARIA_ATTRIBUTES = new Set(['aria-hidden', 'aria-live', 'aria-atomic', 'aria-relevant'])
const idText = (value: unknown) => typeof value === 'string' && value ? value : undefined
const mergeIds = (...values: (string | undefined)[]) => [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))].join(' ') || undefined
const FOCUSABLE_CONTROL = 'input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])'

export const focusFirstControl = (root?: HTMLElement, options?: FocusOptions, selector = FOCUSABLE_CONTROL) => {
  if (!root) return false
  const targets = new Set([
    ...root.querySelectorAll<HTMLElement>('input:checked:not(:disabled)'),
    ...root.querySelectorAll<HTMLElement>(selector),
  ])
  for (const target of targets) {
    if (typeof target.focus !== 'function') continue
    target.focus(options)
    if (target.ownerDocument.activeElement === target || target.contains(target.ownerDocument.activeElement)) return true
  }
  return false
}

export interface FormControlOptions {
  element: () => HTMLElement | undefined
  id?: () => string | undefined
  disabled?: () => boolean | undefined
  ariaLabel?: () => string | undefined
  describedBy?: () => string | undefined
  invalid?: () => boolean
  busy?: () => boolean
  focus?: (options?: FocusOptions) => boolean
  contains?: (target: Node) => boolean
  composite?: boolean
}

export const useFormDisabled = (disabled?: () => boolean | undefined) => {
  const form = inject(formKey, null)
  const field = inject(formItemKey, null)
  const config = useConfig()
  return computed(() => Boolean(form?.disabled.value || field?.disabled.value || (disabled?.() ?? config.value.disabled)))
}

export const useFormControl = (options: FormControlOptions) => {
  const field = inject(formItemKey, null)
  const form = inject(formKey, null)
  if (options.composite) provide(formItemKey, null)
  const inherited = useAttrs()
  const automaticId = field?.createControlId()
  const id = computed(() => options.id?.() || idText(inherited.id) || automaticId?.value)
  const disabled = useFormDisabled(options.disabled)
  const focus = (settings?: FocusOptions) => {
    if (disabled.value) return false
    if (options.focus) return options.focus(settings)
    const element = options.element()
    if (!element || disabled.value || element.matches(':disabled')) return false
    element.focus(settings)
    return element === element.ownerDocument.activeElement || element.contains(element.ownerDocument.activeElement)
  }
  const registration: FormControl = { id: () => id.value, element: options.element, focus, contains: options.contains }
  field?.addControl(registration)
  onBeforeUnmount(() => field?.removeControl(registration))
  const attrs = computed(() => Object.fromEntries(Object.entries({
    ...Object.fromEntries(Object.entries(inherited).filter(([key]) => key.startsWith('aria-') || NATIVE_ATTRIBUTES.has(key))),
    id: id.value,
    'aria-label': options.ariaLabel?.() || inherited['aria-label'],
    'aria-labelledby': inherited['aria-labelledby'] ?? (options.ariaLabel?.() || inherited['aria-label'] ? undefined : field?.labelId.value),
    'aria-describedby': mergeIds(idText(inherited['aria-describedby']), field?.descriptionId.value, options.describedBy?.()),
    'aria-invalid': options.invalid?.() || field?.invalid.value || inherited['aria-invalid'],
    'aria-required': field?.required.value || inherited['aria-required'],
    'aria-busy': options.busy?.() || field?.pending.value || inherited['aria-busy'],
  }).filter(([, value]) => value !== undefined && value !== null)))
  const rootAttrs = computed(() => Object.fromEntries(Object.entries(inherited).filter(([key]) =>
    (!key.startsWith('aria-') || ROOT_ARIA_ATTRIBUTES.has(key)) && !NATIVE_ATTRIBUTES.has(key))))
  return { attrs, rootAttrs, id, disabled, focus, hasField: Boolean(field), hasForm: Boolean(form), touch: (event?: FocusEvent) => field?.touch(event) }
}
