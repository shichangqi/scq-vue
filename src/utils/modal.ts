import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { createFocusTrap, type FocusTrap } from 'focus-trap'

const stacks = new WeakMap<Document, symbol[]>()
const scrollLocks = new WeakMap<Document, { count: number; overflow: string; paddingRight: string }>()
let layerSequence = 0

const lockBody = (document: Document) => {
  let state = scrollLocks.get(document)
  if (!state) {
    state = { count: 0, overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight }
    scrollLocks.set(document, state)
    const width = document.documentElement.clientWidth
    const scrollbar = width ? Math.max(0, (document.defaultView?.innerWidth || width) - width) : 0
    if (scrollbar) document.body.style.paddingRight = `${(parseFloat(document.defaultView?.getComputedStyle(document.body).paddingRight || '0') || 0) + scrollbar}px`
    document.body.style.overflow = 'hidden'
  }
  state.count += 1
  return () => {
    if (!state) return
    state.count -= 1
    if (state.count === 0) {
      document.body.style.overflow = state.overflow
      document.body.style.paddingRight = state.paddingRight
      scrollLocks.delete(document)
    }
  }
}

export const useModal = (
  visible: () => boolean,
  panel: Ref<HTMLElement | undefined>,
  options: { closeOnPressEscape: () => boolean; lockScroll: () => boolean; onEscape: () => void; zIndex: () => number | undefined },
) => {
  const zIndex = ref(2400)
  const token = Symbol('scq-layer')
  let trap: FocusTrap | undefined
  let releaseScroll: (() => void) | undefined
  let stop: (() => void) | undefined
  let owner: Document | undefined
  let disposed = false

  const handleKeydown = (event: KeyboardEvent) => {
    const stack = owner && stacks.get(owner)
    if (event.key !== 'Escape' || stack?.at(-1) !== token || !options.closeOnPressEscape()) return
    event.preventDefault()
    event.stopImmediatePropagation()
    options.onEscape()
  }
  const deactivate = () => {
    trap?.deactivate()
    trap = undefined
    releaseScroll?.()
    releaseScroll = undefined
    if (owner) {
      owner.removeEventListener('keydown', handleKeydown, true)
      const stack = stacks.get(owner)
      const index = stack?.indexOf(token) ?? -1
      if (index >= 0) stack?.splice(index, 1)
    }
  }
  const activate = async () => {
    await nextTick()
    if (disposed || !visible() || !panel.value || trap) return
    owner = panel.value.ownerDocument
    const stack = stacks.get(owner) || []
    stack.push(token)
    stacks.set(owner, stack)
    layerSequence += 1
    zIndex.value = options.zIndex() ?? 2400 + layerSequence
    if (options.lockScroll()) releaseScroll = lockBody(owner)
    owner.addEventListener('keydown', handleKeydown, true)
    trap = createFocusTrap(panel.value, {
      fallbackFocus: panel.value,
      escapeDeactivates: false,
      allowOutsideClick: true,
      returnFocusOnDeactivate: true,
      delayInitialFocus: false,
      preventScroll: true,
    })
    trap.activate()
  }
  onMounted(() => {
    stop = watch(visible, (value) => { if (value) void activate(); else deactivate() }, { immediate: true, flush: 'post' })
  })
  onBeforeUnmount(() => { disposed = true; stop?.(); deactivate() })
  return { zIndex }
}