import { computed, ref, watch } from 'vue'

export interface ImageSourceOptions {
  src: string
  srcset?: string
  sizes?: string
  fallbackSrc?: string | string[]
  crossorigin?: string
  referrerpolicy?: ReferrerPolicy
}
export const useImageSource = (
  options: () => ImageSourceOptions,
  element: () => HTMLImageElement | undefined,
  onLoad: (event: Event) => void,
  onError: (event: Event) => void,
) => {
  const index = ref(0)
  const key = ref(0)
  const failed = ref(false)
  const pending = ref(false)
  const candidates = computed(() => {
    const current = options()
    const fallback = Array.isArray(current.fallbackSrc) ? current.fallbackSrc : current.fallbackSrc ? [current.fallbackSrc] : []
    return [...new Set([...(current.src || current.srcset ? [current.src] : []), ...fallback.filter(Boolean)])]
  })
  const available = computed(() => !failed.value && index.value < candidates.value.length)
  const src = computed(() => candidates.value[index.value] ?? '')
  const srcset = computed(() => index.value === 0 ? options().srcset : undefined)
  const sizes = computed(() => index.value === 0 ? options().sizes : undefined)
  const reset = () => { index.value = 0; key.value += 1; failed.value = false; pending.value = candidates.value.length > 0 }
  const current = (event: Event) => {
    const image = element()
    return available.value && image && event.target === image && image.dataset.imageKey === String(key.value)
  }
  const loaded = (event: Event) => {
    if (!current(event)) return
    pending.value = false
    failed.value = false
    onLoad(event)
  }
  const error = (event: Event) => {
    if (!current(event)) return
    if (index.value + 1 < candidates.value.length) { index.value += 1; key.value += 1; pending.value = true }
    else { failed.value = true; pending.value = false }
    onError(event)
  }
  const checkCached = () => {
    const image = element()
    if (image?.complete && image.naturalWidth > 0 && image.dataset.imageKey === String(key.value)) pending.value = false
  }
  watch(options, reset, { immediate: true, deep: true, flush: 'sync' })
  watch(element, checkCached, { flush: 'post' })
  return { src, srcset, sizes, key, available, pending, failed, loaded, error, retry: reset }
}
