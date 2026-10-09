import { createVNode, render, type AppContext } from 'vue'
import Notification, { type NotificationPosition, type NotificationType } from './Notification.vue'
import type { IconName } from '../Icon/icons'

export interface NotificationOptions { id?: string; title?: string; message?: string; type?: NotificationType; position?: NotificationPosition; duration?: number; offset?: number; showClose?: boolean; closeOnClick?: boolean; icon?: IconName; teleport?: string; zIndex?: number; onClose?: () => void; onClosed?: () => void; onClick?: (event: MouseEvent) => void }
export interface NotificationInstance { id: string; close: () => void; update: (options: Partial<Omit<NotificationOptions, 'id' | 'teleport'>>) => void }
interface NotificationRecord { id: string; position: NotificationPosition; offset: number; baseOffset: number; height: number; render: () => void; dispose: () => void; isClosing: () => boolean; instance: NotificationInstance }
const targets = new Map<Element, NotificationRecord[]>()
const scheduled = new Set<Element>()
let sequence = 0
const scheduleLayout = (target: Element) => {
  if (scheduled.has(target)) return
  scheduled.add(target)
  queueMicrotask(() => {
    scheduled.delete(target)
    const offsets = new Map<NotificationPosition, number>()
    for (const record of targets.get(target) || []) {
      const offset = Math.max(record.baseOffset, offsets.get(record.position) ?? 0)
      if (offset !== record.offset) { record.offset = offset; record.render() }
      offsets.set(record.position, offset + record.height + 12)
    }
  })
}
export const showNotification = (input: string | NotificationOptions = {}, appContext?: AppContext): NotificationInstance => {
  let options: NotificationOptions = typeof input === 'string' ? { message: input } : { ...input }
  const id = options.id ?? `scq-notification-${++sequence}`
  const empty: NotificationInstance = { id, close: () => {}, update: () => {} }
  if (typeof document === 'undefined') return empty
  const target = options.teleport ? document.querySelector(options.teleport) : document.body
  if (!target) return empty
  const existing = targets.get(target)?.find((record) => record.id === id && !record.isClosing())
  if (existing) { existing.instance.update(options); return existing.instance }
  const host = document.createElement('div')
  host.className = 'scq-notification-host'
  target.appendChild(host)
  let closing = false
  let disposed = false
  let cleanupTimer: ReturnType<typeof setTimeout> | undefined
  let observer: ResizeObserver | undefined
  const dispose = () => {
    if (disposed) return
    disposed = true
    if (cleanupTimer !== undefined) clearTimeout(cleanupTimer)
    observer?.disconnect()
    render(null, host)
    host.remove()
    const records = targets.get(target)?.filter((entry) => entry !== record) || []
    if (records.length) targets.set(target, records)
    else targets.delete(target)
    scheduleLayout(target)
    try { if (!closing) options.onClose?.() } finally { options.onClosed?.() }
  }
  const close = () => {
    if (closing || disposed) return
    closing = true
    cleanupTimer = setTimeout(dispose, 250)
    renderInstance()
    options.onClose?.()
  }
  const renderInstance = () => {
    if (disposed) return
    const { id: _id, ...componentOptions } = options
    const vnode = createVNode(Notification, { ...componentOptions, modelValue: !closing, teleport: false, offset: record.offset, 'onUpdate:modelValue': (value: boolean) => { if (!value) close() }, onClose: close, onClosed: dispose })
    if (appContext) vnode.appContext = appContext
    render(vnode, host)
  }
  const instance: NotificationInstance = {
    id, close,
    update: (next) => {
      if (disposed || closing) return
      options = { ...options, ...next }
      record.position = options.position ?? 'top-right'
      record.baseOffset = Math.max(0, options.offset ?? 16)
      renderInstance()
      scheduleLayout(target)
    },
  }
  const record: NotificationRecord = { id, position: options.position ?? 'top-right', offset: Math.max(0, options.offset ?? 16), baseOffset: Math.max(0, options.offset ?? 16), height: 96, render: renderInstance, dispose, isClosing: () => closing, instance }
  targets.set(target, [...targets.get(target) || [], record])
  renderInstance()
  queueMicrotask(() => {
    if (disposed) return
    const element = host.querySelector<HTMLElement>('.scq-notification')
    const measure = () => {
      const height = element?.getBoundingClientRect().height || record.height
      if (height !== record.height) { record.height = height; scheduleLayout(target) }
    }
    if (element && typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(measure); observer.observe(element) }
    measure()
    scheduleLayout(target)
  })
  return instance
}
const closeAll = (selector?: string) => {
  for (const [target, records] of [...targets]) if (!selector || target.matches(selector)) for (const record of [...records]) record.dispose()
}
const typed = (type: NotificationType) => (input: string | NotificationOptions = {}, appContext?: AppContext) => showNotification(typeof input === 'string' ? { message: input, type } : { ...input, type }, appContext)
export const notification = { show: showNotification, success: typed('success'), info: typed('info'), warning: typed('warning'), error: typed('error'), closeAll, clear: closeAll, destroyAll: closeAll }