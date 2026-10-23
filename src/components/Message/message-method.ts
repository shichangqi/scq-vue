import { TransitionGroup, createVNode, defineComponent, h, onScopeDispose, render, shallowReactive, type AppContext } from 'vue'
import type { MessagePlacement, MessageType } from './Message.vue'
import { getConfigFromContext, getLocaleMessage, getThemeStyle, resolveMethodContext, useConfigContext } from '../ConfigProvider/context'
import { MESSAGE_DEFAULTS, validateFeedbackOptions } from '../../utils/feedback'

export interface MessageApiOptions {
  type?: MessageType
  message?: string
  content?: string
  description?: string
  duration?: number
  showIcon?: boolean
  closable?: boolean
  placement?: MessagePlacement
  offset?: number
  zIndex?: number
  onClose?: () => void
}

export interface MessageInstance {
  close: () => void
}

type MessageRecord = Required<Pick<MessageApiOptions, 'type' | 'duration' | 'showIcon' | 'closable' | 'placement' | 'offset' | 'zIndex'>> & {
  id: number
  message: string
  description: string
  timer: ReturnType<typeof window.setTimeout> | null
  onClose?: () => void
  appContext?: AppContext
}

let messageSeed = 0
let messageZIndexSeed: number = MESSAGE_DEFAULTS.zIndex
let container: HTMLDivElement | null = null

const state = {
  items: shallowReactive<MessageRecord[]>([]),
}

const placements: MessagePlacement[] = ['top', 'top-left', 'top-right', 'bottom', 'bottom-left', 'bottom-right']

const iconMap: Record<MessageType, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '×',
  loading: '…',
}

const ensureContainer = () => {
  if (typeof document === 'undefined') {
    return null
  }

  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
    render(createVNode(MessageHost), container)
  }

  return container
}

const closeMessage = (id: number) => {
  const index = state.items.findIndex((item) => item.id === id)
  if (index === -1) {
    return
  }

  const item = state.items[index]
  if (item.timer) {
    window.clearTimeout(item.timer)
  }
  state.items.splice(index, 1)
  item.onClose?.()
}

const MessageHost = defineComponent({
  name: 'MessageHost',
  setup() {
    return () => h('div', { class: 'scq-message-host' }, placements.map((placement) => {
      const items = state.items.filter((item) => item.placement === placement)
      if (!items.length) {
        return null
      }

      const transitionName = placement.startsWith('bottom') ? 'scq-message-slide-bottom' : 'scq-message-slide-top'

      return h(
        TransitionGroup,
        {
          key: placement,
          tag: 'div',
          name: transitionName,
          class: ['scq-message-stack', `is-${placement}`],
          style: { '--scq-message-offset': `${items[0]?.offset ?? MESSAGE_DEFAULTS.offset}px` },
        },
        () => items.map((item) => h(
          'div',
          {
            key: item.id,
            class: ['scq-message', `is-${item.type}`, { 'is-closable': item.closable }],
            style: { ...getThemeStyle(getConfigFromContext(item.appContext)), zIndex: item.zIndex },
            role: 'status',
          },
          [
            item.showIcon ? h('span', { class: 'scq-message__icon', 'aria-hidden': 'true' }, iconMap[item.type]) : null,
            h('span', { class: 'scq-message__content' }, [
              h('span', { class: 'scq-message__message' }, item.message),
              item.description ? h('span', { class: 'scq-message__description' }, item.description) : null,
            ]),
            item.closable ? h('button', { type: 'button', class: 'scq-message__close', 'aria-label': getLocaleMessage(getConfigFromContext(item.appContext), 'close'), onClick: () => closeMessage(item.id) }, '×') : null,
          ],
        )),
      )
    }))
  },
})

export const openMessage = (options: MessageApiOptions | string, appContext?: AppContext): MessageInstance => {
  if (typeof document === 'undefined') {
    return { close: () => undefined }
  }

  const normalizedOptions: MessageApiOptions = typeof options === 'string' ? { message: options } : options
  validateFeedbackOptions(normalizedOptions, 'Message')
  ensureContainer()
  const id = ++messageSeed
  const duration = normalizedOptions.duration ?? MESSAGE_DEFAULTS.duration
  const item: MessageRecord = {
    id,
    type: normalizedOptions.type ?? 'info',
    message: normalizedOptions.message ?? normalizedOptions.content ?? '',
    description: normalizedOptions.description ?? '',
    duration,
    showIcon: normalizedOptions.showIcon ?? true,
    closable: normalizedOptions.closable ?? false,
    placement: normalizedOptions.placement ?? 'top',
    offset: normalizedOptions.offset ?? MESSAGE_DEFAULTS.offset,
    zIndex: normalizedOptions.zIndex ?? ++messageZIndexSeed,
    timer: null,
    onClose: normalizedOptions.onClose,
    appContext,
  }

  state.items.push(item)

  if (duration > 0) {
    item.timer = window.setTimeout(() => closeMessage(id), duration)
  }

  return {
    close: () => closeMessage(id),
  }
}

const createMessage = (appContext?: AppContext) => {
  const open = (options: MessageApiOptions | string, context = appContext) => openMessage(options, resolveMethodContext(appContext, context))
  const typed = (type: MessageType) => (options: MessageApiOptions | string, context = appContext) =>
    open(typeof options === 'string' ? { type, message: options } : { ...options, type }, context)
  return {
    open,
    info: typed('info'),
    success: typed('success'),
    warning: typed('warning'),
    error: typed('error'),
    loading: typed('loading'),
    destroyAll: () => {
      for (const item of [...state.items]) {
        if (!appContext || item.appContext === appContext) closeMessage(item.id)
      }
    },
    setGlobalZIndex: (value: number) => {
      if (Number.isFinite(value)) messageZIndexSeed = Math.max(0, Math.floor(value))
    },
  }
}

export const message = createMessage()
export const useMessage = () => {
  const api = createMessage(useConfigContext('useMessage'))
  onScopeDispose(api.destroyAll)
  return api
}