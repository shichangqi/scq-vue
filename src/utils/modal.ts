import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { createFocusTrap, type FocusTrap } from 'focus-trap'
import { COMPOSITION_KEY_CODE } from './composition'

export const MODAL_DEFAULTS = { zIndex: 2400, legacyZIndex: 2100, methodZIndex: 3000, layerStep: 1, originRetention: 1800 } as const
export type InitialFocus = string | HTMLElement | (() => HTMLElement | null) | false
export type OriginPoint = { x: number; y: number }
export type OverlayOrigin = OriginPoint | MouseEvent | HTMLElement | null

export const resolveOrigin = (origin: OverlayOrigin | undefined): OriginPoint | null => {
  if (!origin) return null
  if ('getBoundingClientRect' in origin) {
    const rect = origin.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }
  if ('clientX' in origin) return { x: origin.clientX, y: origin.clientY }
  return typeof origin.x === 'number' && typeof origin.y === 'number' ? { x: origin.x, y: origin.y } : null
}

interface Layer {
  token: symbol
  panel: HTMLElement
  reference?: HTMLElement
  parent?: symbol
  zIndex: number
  automaticZIndex: boolean
  setZIndex: (value: number) => void
  order: number
  modal: boolean
  trap?: FocusTrap
  trigger: HTMLElement | null
  closeOnPressEscape: () => boolean
  onEscape: () => void
  visible: () => boolean
}
interface LayerState {
  layers: Layer[]
  traps: FocusTrap[]
  sequence: number
  nextZIndex: number
  rootFocus: HTMLElement | null
  lockCount: number
  overflow: string
  paddingRight: string
  keydown: (event: KeyboardEvent) => void
  pointerCount: number
  pointer?: OriginPoint & { time: number }
  pointerdown: (event: PointerEvent) => void
}
const stateKey = Symbol.for('scq-vue.overlay-state')
const shared = globalThis as typeof globalThis & { [stateKey]?: WeakMap<Document, LayerState> }
const states = shared[stateKey] ?? (shared[stateKey] = new WeakMap<Document, LayerState>())
const topLayer = (layers: Layer[], onlyVisible = true) => layers.reduce<Layer | undefined>((top, layer) => {
  if (onlyVisible && !layer.visible()) return top
  return !top || layer.zIndex > top.zIndex || (layer.zIndex === top.zIndex && layer.order > top.order) ? layer : top
}, undefined)

const getState = (owner: Document): LayerState => {
  let state = states.get(owner)
  if (!state) {
    state = {
      layers: [], traps: [], sequence: 0, nextZIndex: 0, rootFocus: null,
      lockCount: 0, overflow: '', paddingRight: '',
      pointerCount: 0,
      pointerdown: (event) => {
        const target = event.target as HTMLElement | null
        const point = target && typeof target.getBoundingClientRect === 'function' ? resolveOrigin(target) : null
        getState(owner).pointer = { ...(point ?? { x: event.clientX, y: event.clientY }), time: Date.now() }
      },
      keydown: (event) => {
        const top = topLayer(states.get(owner)?.layers ?? [])
        if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey || !top) return
        event.preventDefault()
        event.stopImmediatePropagation()
        if (top.closeOnPressEscape()) top.onEscape()
      },
    }
    states.set(owner, state)
  }
  return state
}

export const retainPointerOrigin = (owner: Document) => {
  const state = getState(owner)
  if (state.pointerCount++ === 0) owner.addEventListener('pointerdown', state.pointerdown, true)
  let released = false
  return () => {
    if (released) return
    released = true
    if (--state.pointerCount === 0) {
      owner.removeEventListener('pointerdown', state.pointerdown, true)
      state.pointer = undefined
    }
  }
}

export const getPointerOrigin = (owner?: Document): OriginPoint | null => {
  if (!owner) return null
  const pointer = getState(owner).pointer
  if (pointer && Date.now() - pointer.time <= MODAL_DEFAULTS.originRetention) return { x: pointer.x, y: pointer.y }
  const active = owner.activeElement
  return active && active !== owner.body && 'getBoundingClientRect' in active ? resolveOrigin(active as HTMLElement) : null
}

export const nextOverlayZIndex = (minimum: number, owner?: Document) => {
  if (!Number.isFinite(minimum) || !Number.isInteger(minimum)) throw new RangeError('[scq-vue] Overlay zIndex must be a finite integer.')
  if (!owner) return minimum
  const state = getState(owner)
  state.nextZIndex = Math.max(minimum, state.nextZIndex + MODAL_DEFAULTS.layerStep)
  return state.nextZIndex
}

const lockBody = (owner: Document) => {
  const state = getState(owner)
  if (state.lockCount === 0) {
    state.overflow = owner.body.style.overflow
    state.paddingRight = owner.body.style.paddingRight
    const width = owner.documentElement.clientWidth
    const scrollbar = width ? Math.max(0, (owner.defaultView?.innerWidth ?? width) - width) : 0
    if (scrollbar) owner.body.style.paddingRight = `${(parseFloat(owner.defaultView?.getComputedStyle(owner.body).paddingRight ?? '0') || 0) + scrollbar}px`
    owner.body.style.overflow = 'hidden'
  }
  state.lockCount += 1
  let released = false
  return () => {
    if (released) return
    released = true
    state.lockCount -= 1
    if (state.lockCount === 0) {
      owner.body.style.overflow = state.overflow
      owner.body.style.paddingRight = state.paddingRight
    }
  }
}

const modalParent = (state: LayerState, layer: Layer): Layer | undefined => {
  let current: Layer | undefined = layer
  while (current && !current.modal) current = state.layers.find((entry) => entry.token === current?.parent)
  return current
}

const linkLayers = (owner: Document, state: LayerState) => {
  for (const layer of state.layers) {
    let node: HTMLElement | null | undefined = layer.reference
    let parent: Layer | undefined
    while (node && !parent) {
      parent = state.layers.find((entry) => entry !== layer && entry.panel === node)
      node = node.parentElement
    }
    layer.parent = parent?.token
  }
  const raise = (layer: Layer, visited: Set<symbol>) => {
    if (visited.has(layer.token)) return
    visited.add(layer.token)
    const parent = state.layers.find((entry) => entry.token === layer.parent)
    if (!parent) return
    raise(parent, visited)
    if (layer.automaticZIndex && layer.zIndex <= parent.zIndex) {
      layer.setZIndex(nextOverlayZIndex(parent.zIndex + MODAL_DEFAULTS.layerStep, owner))
    }
  }
  state.layers.forEach((layer) => raise(layer, new Set()))
}

const synchronizeFocus = (state: LayerState) => {
  const top = topLayer(state.layers.filter((entry) => entry.modal))
  for (const layer of state.layers) {
    if (layer !== top && layer.trap?.active) layer.trap.pause()
  }
  if (!top?.trap) return
  const portals = state.layers.filter((entry) => !entry.modal && modalParent(state, entry) === top).map((entry) => entry.panel)
  top.trap.updateContainerElements([top.panel, ...portals])
  if (top.trap.active) top.trap.unpause()
  else top.trap.activate()
}

export interface LayerOptions {
  closeOnPressEscape: () => boolean
  lockScroll: () => boolean
  onEscape: () => void
  zIndex: () => number | undefined
  defaultZIndex?: number
  trapFocus?: boolean
  reference?: () => HTMLElement | undefined
  initialFocus?: () => InitialFocus | undefined
}

export const useLayer = (visible: () => boolean, panel: Ref<HTMLElement | undefined>, options: LayerOptions) => {
  const zIndex = ref(options.zIndex() ?? options.defaultZIndex ?? MODAL_DEFAULTS.zIndex)
  let layer: Layer | undefined
  let owner: Document | undefined
  let releaseScroll: (() => void) | undefined
  let stop: (() => void) | undefined
  let disposed = false
  let sequence = 0
  let activationTrigger: HTMLElement | null = null
  const captureTrigger = () => {
    const active = (panel.value?.ownerDocument ?? owner ?? (typeof document === 'undefined' ? undefined : document))?.activeElement
    activationTrigger = active && 'focus' in active ? active as HTMLElement : null
  }
  captureTrigger()
  watch(visible, (open) => { if (open) captureTrigger() }, { flush: 'sync' })
  const deactivate = () => {
    sequence += 1
    const closing = layer
    layer = undefined
    releaseScroll?.()
    releaseScroll = undefined
    if (!owner || !closing) return
    const state = getState(owner)
    const wasTop = topLayer(state.layers.filter((entry) => entry.modal), false) === closing
    const rootFocus = state.rootFocus
    closing.trap?.deactivate({ returnFocus: false })
    state.layers = state.layers.filter((entry) => entry !== closing)
    if (!state.layers.length) owner.removeEventListener('keydown', state.keydown)
    synchronizeFocus(state)
    if (!state.layers.some((entry) => entry.modal)) state.rootFocus = null
    if (closing.modal && wasTop) {
      const current = sequence
      void nextTick(() => {
        if (sequence !== current || layer) return
        const active = topLayer(state.layers.filter((entry) => entry.modal))
        const target = active ? closing.trigger : rootFocus
        const inside = !active || state.layers.some((entry) => (entry === active || modalParent(state, entry) === active) && target && entry.panel.contains(target))
        if (target?.isConnected && inside) target.focus({ preventScroll: true })
      })
    }
  }
  const activate = async () => {
    const current = ++sequence
    await nextTick()
    if (disposed || current !== sequence || !visible() || !panel.value || layer) return
    owner = panel.value.ownerDocument
    const state = getState(owner)
    const modal = options.trapFocus !== false
    const trigger = activationTrigger
    const reference = options.reference?.() ?? trigger ?? undefined
    const explicitZIndex = options.zIndex()
    if (explicitZIndex !== undefined && (!Number.isFinite(explicitZIndex) || !Number.isInteger(explicitZIndex))) throw new RangeError('[scq-vue] Overlay zIndex must be a finite integer.')
    zIndex.value = explicitZIndex ?? nextOverlayZIndex(options.defaultZIndex ?? MODAL_DEFAULTS.zIndex, owner)
    state.nextZIndex = Math.max(state.nextZIndex, zIndex.value)
    if (modal && !state.layers.some((entry) => entry.modal)) state.rootFocus = trigger
    const entry: Layer = {
      token: Symbol('scq-layer'), panel: panel.value, reference: panel.value.contains(reference ?? null) ? undefined : reference,
      zIndex: zIndex.value, order: ++state.sequence, modal, trigger,
      automaticZIndex: options.zIndex() === undefined,
      setZIndex: (value) => { entry.zIndex = zIndex.value = value },
      closeOnPressEscape: options.closeOnPressEscape, onEscape: options.onEscape,
      visible,
    }
    if (modal) {
      const initialFocus = options.initialFocus?.()
      entry.trap = createFocusTrap(entry.panel, {
        document: owner, trapStack: state.traps,
        fallbackFocus: entry.panel, initialFocus: typeof initialFocus === 'function' ? () => initialFocus() ?? entry.panel : initialFocus,
        escapeDeactivates: false, allowOutsideClick: true,
        returnFocusOnDeactivate: false, delayInitialFocus: false, preventScroll: true,
      })
    }
    if (!state.layers.length) owner.addEventListener('keydown', state.keydown)
    state.layers.push(entry)
    linkLayers(owner, state)
    layer = entry
    if (options.lockScroll()) releaseScroll = lockBody(owner)
    try { synchronizeFocus(state) } catch (error) { deactivate(); throw error }
  }
  onMounted(() => {
    stop = watch([visible, options.lockScroll, options.zIndex], ([open, locked, explicitZIndex]) => {
      if (!open) { deactivate(); return }
      if (!layer) { void activate(); return }
      if (locked && !releaseScroll && owner) releaseScroll = lockBody(owner)
      if (!locked) { releaseScroll?.(); releaseScroll = undefined }
      if (explicitZIndex !== undefined) {
        if (!Number.isFinite(explicitZIndex) || !Number.isInteger(explicitZIndex)) throw new RangeError('[scq-vue] Overlay zIndex must be a finite integer.')
        layer.automaticZIndex = false
        layer.zIndex = zIndex.value = explicitZIndex
      } else if (!layer.automaticZIndex && owner) {
        layer.automaticZIndex = true
        layer.setZIndex(nextOverlayZIndex(options.defaultZIndex ?? MODAL_DEFAULTS.zIndex, owner))
      }
      if (owner) { linkLayers(owner, getState(owner)); synchronizeFocus(getState(owner)) }
    }, { immediate: true, flush: 'post' })
  })
  onBeforeUnmount(() => { disposed = true; stop?.(); deactivate() })
  const contains = (target: Node | null) => {
    if (!target || !layer || !owner) return false
    const state = getState(owner)
    return state.layers.some((entry) => {
      if (!entry.panel.contains(target)) return false
      let current: Layer | undefined = entry
      while (current) {
        if (current === layer) return true
        current = state.layers.find((parent) => parent.token === current?.parent)
      }
      return false
    })
  }
  return { zIndex, contains }
}

export const useModal = (visible: () => boolean, panel: Ref<HTMLElement | undefined>, options: LayerOptions) =>
  useLayer(visible, panel, { ...options, trapFocus: true })
