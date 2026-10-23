import { nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, watch } from 'vue'

export const EDITABLE_TARGET_SELECTOR = 'input, textarea, select, [contenteditable]'

export const useUpdateFocus = (
  content: () => HTMLElement | undefined,
  isRetained: (target: HTMLElement, root: HTMLElement) => boolean = (target, root) => root.contains(target),
  replacement: () => HTMLElement | undefined = content,
) => {
  let previous: HTMLElement | undefined
  onBeforeUpdate(() => {
    const root = content()
    const active = root?.ownerDocument.activeElement
    previous = active instanceof HTMLElement && active !== root && root?.contains(active) ? active : undefined
  })
  onUpdated(() => {
    const target = previous
    previous = undefined
    const root = content()
    if (!target || !root?.isConnected || isRetained(target, root)) return
    const active = root.ownerDocument.activeElement
    if (active === target || active === root.ownerDocument.body) replacement()?.focus({ preventScroll: true })
  })
}

export const useContentFocus = (content: () => HTMLElement | undefined, blocked: () => boolean, replacement?: () => HTMLElement | undefined) => {
  let mounted = false
  let focusTarget: HTMLElement | undefined
  const focus = (target?: HTMLElement) => {
    if (target?.isConnected && !target.closest('[inert], [hidden]')) target.focus({ preventScroll: true })
  }
  watch(blocked, async value => {
    if (value) {
      const root = content()
      const active = root?.ownerDocument.activeElement
      focusTarget = active instanceof HTMLElement && root?.contains(active) ? active : undefined
      return
    }
    const target = focusTarget
    focusTarget = undefined
    await nextTick()
    if (mounted && !blocked() && target && target.ownerDocument.activeElement === target.ownerDocument.body) {
      focus(target)
      if (target.ownerDocument.activeElement === target.ownerDocument.body) {
        const next = replacement?.()
        focus(next)
      }
    }
  })
  onMounted(() => { mounted = true })
  onBeforeUnmount(() => { mounted = false; focusTarget = undefined })
}
