import { computed, onBeforeUnmount, readonly, ref, watch } from 'vue'

type CompositionElement = (HTMLInputElement | HTMLTextAreaElement) & { composing?: boolean }
export const COMPOSITION_KEY_CODE = 229

export const useCompositionModel = (read: () => string, write: (value: string) => void) => {
  const composing = ref(false)
  let trailingValue: string | undefined
  let disposed = false
  let cancelled = false
  const model = computed({
    get: read,
    set: (value: string | number) => {
      if (disposed) return
      const next = String(value)
      composing.value = false
      if (trailingValue === next) { trailingValue = undefined; return }
      trailingValue = undefined
      write(next)
    },
  })
  const start = () => { composing.value = true; trailingValue = undefined; cancelled = false }
  const end = (event: CompositionEvent) => {
    composing.value = false
    const element = event.target as CompositionElement | null
    if (cancelled) {
      cancelled = false
      trailingValue = read()
      if (element) { element.composing = false; element.value = trailingValue }
    } else {
      trailingValue = element?.value
    }
  }
  const cancel = (element?: CompositionElement, value = read()) => {
    cancelled = true
    composing.value = false
    trailingValue = undefined
    if (element) { element.composing = false; element.value = value }
  }
  watch(read, (value) => { if (trailingValue !== undefined && value !== trailingValue) trailingValue = undefined })
  onBeforeUnmount(() => { disposed = true; composing.value = false })
  return { model, composing: readonly(composing), start, end, cancel }
}
