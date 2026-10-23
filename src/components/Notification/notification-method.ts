import { createVNode, onScopeDispose, render, type AppContext } from 'vue'
import Notification, { type NotificationPosition, type NotificationType } from './Notification.vue'
import type { IconName } from '../Icon/icons'
import { resolveMethodContext, useConfigContext } from '../ConfigProvider/context'
import { FEEDBACK_CLEANUP_DELAY, NOTIFICATION_DEFAULTS, resolveFeedbackTarget, validateFeedbackOptions } from '../../utils/feedback'

export interface NotificationOptions { id?: string; title?: string; message?: string; type?: NotificationType; position?: NotificationPosition; duration?: number; offset?: number; showClose?: boolean; closeOnClick?: boolean; icon?: IconName; teleport?: string; zIndex?: number; onClose?: () => void; onClosed?: () => void; onClick?: (event: MouseEvent) => void }
export interface NotificationInstance { id: string; close: () => void; update: (options: Partial<Omit<NotificationOptions, 'id' | 'teleport'>>) => void }
interface NotificationRecord { id: string; appContext?: AppContext; position: NotificationPosition; offset: number; baseOffset: number; height: number; render: () => void; dispose: () => void; isClosing: () => boolean; instance: NotificationInstance }
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
      offsets.set(record.position, offset + record.height + NOTIFICATION_DEFAULTS.gap)
    }
  })
}
export const showNotification = (input: string | NotificationOptions = {}, appContext?: AppContext): NotificationInstance => {
  let options: NotificationOptions = typeof input === 'string' ? { message: input } : { ...input }
  const id = options.id ?? `scq-notification-${++sequence}`
  const empty: NotificationInstance = { id, close: () => {}, update: () => {} }
  if (typeof document === 'undefined') return empty
  validateFeedbackOptions(options, 'Notification')
  const target = resolveFeedbackTarget(options.teleport, 'Notification')
  const existing = targets.get(target)?.find((record) => record.id === id && record.appContext === appContext && !record.isClosing())
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
    cleanupTimer = setTimeout(dispose, FEEDBACK_CLEANUP_DELAY)
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
      const candidate = { ...options, ...next }
      validateFeedbackOptions(candidate, 'Notification')
      options = candidate
      record.position = options.position ?? 'top-right'
      record.baseOffset = Math.max(0, options.offset ?? NOTIFICATION_DEFAULTS.offset)
      renderInstance()
      scheduleLayout(target)
    },
  }
  const record: NotificationRecord = { id, appContext, position: options.position ?? 'top-right', offset: Math.max(0, options.offset ?? NOTIFICATION_DEFAULTS.offset), baseOffset: Math.max(0, options.offset ?? NOTIFICATION_DEFAULTS.offset), height: NOTIFICATION_DEFAULTS.estimatedHeight, render: renderInstance, dispose, isClosing: () => closing, instance }
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
const closeAll = (selector?: string, appContext?: AppContext) => {
  for (const [target, records] of [...targets]) {
    if (!selector || target.matches(selector)) {
      for (const record of [...records]) {
        if (!appContext || record.appContext === appContext) record.dispose()
      }
    }
  }
}
const createNotification = (appContext?: AppContext) => {
  const show = (input: string | NotificationOptions = {}, context = appContext) => showNotification(input, resolveMethodContext(appContext, context))
  const typed = (type: NotificationType) => (input: string | NotificationOptions = {}, context = appContext) =>
    show(typeof input === 'string' ? { message: input, type } : { ...input, type }, context)
  const clearScope = (selector?: string) => closeAll(selector, appContext)
  return { show, success: typed('success'), info: typed('info'), warning: typed('warning'), error: typed('error'), closeAll: clearScope, clear: clearScope, destroyAll: clearScope }
}
export const notification = createNotification()
export const useNotification = () => {
  const api = createNotification(useConfigContext('useNotification'))
  onScopeDispose(api.destroyAll)
  return api
}