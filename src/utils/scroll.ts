export const getScrollParent = (element: HTMLElement): HTMLElement | Window => {
  const view = element.ownerDocument.defaultView || window
  let parent = element.parentElement
  while (parent && !/(auto|scroll)/.test(view.getComputedStyle(parent).overflowY)) parent = parent.parentElement
  return parent || view
}

export const isScrollWindow = (target: HTMLElement | Window): target is Window => 'window' in target && target.window === target
