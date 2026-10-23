import { onBeforeUnmount, onMounted, onUpdated, ref, watch, type Ref } from 'vue'

export const useElementHeight = (element: Ref<HTMLElement | undefined>, fallback?: number) => {
  const height = ref(fallback)
  let observer: ResizeObserver | undefined
  let mounted = false
  const measure = () => {
    if (!mounted) return
    const value = element.value?.getBoundingClientRect().height
    if (value !== undefined && Number.isFinite(value) && value > 0) height.value = value
  }
  const observe = () => {
    if (!mounted) return
    observer?.disconnect()
    if (element.value) observer?.observe(element.value)
    measure()
  }
  watch(element, observe, { flush: 'post' })
  onMounted(() => {
    mounted = true
    if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(measure)
    window.addEventListener('resize', measure)
    observe()
  })
  onUpdated(measure)
  onBeforeUnmount(() => { mounted = false; observer?.disconnect(); window.removeEventListener('resize', measure) })
  return height
}
