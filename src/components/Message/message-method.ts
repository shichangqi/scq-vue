import { TransitionGroup, createVNode, defineComponent, h, reactive, render } from 'vue'
import type { MessagePlacement, MessageType } from './Message.vue'

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
}

let messageSeed = 0
let messageZIndexSeed = 10000
let container: HTMLDivElement | null = null

const state = reactive({
  items: [] as MessageRecord[],
})

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
          style: { '--scq-message-offset': `${items[0]?.offset ?? 24}px` },
        },
        () => items.map((item) => h(
          'div',
          {
            key: item.id,
            class: ['scq-message', `is-${item.type}`, { 'is-closable': item.closable }],
            style: { zIndex: item.zIndex },
            role: 'status',
          },
          [
            item.showIcon ? h('span', { class: 'scq-message__icon', 'aria-hidden': 'true' }, iconMap[item.type]) : null,
            h('span', { class: 'scq-message__content' }, [
              h('span', { class: 'scq-message__message' }, item.message),
              item.description ? h('span', { class: 'scq-message__description' }, item.description) : null,
            ]),
            item.closable ? h('button', { type: 'button', class: 'scq-message__close', 'aria-label': '关闭', onClick: () => closeMessage(item.id) }, '×') : null,
          ],
        )),
      )
    }))
  },
})

export const openMessage = (options: MessageApiOptions | string): MessageInstance => {
  if (!ensureContainer()) {
    return { close: () => undefined }
  }

  const normalizedOptions: MessageApiOptions = typeof options === 'string' ? { message: options } : options
  const id = ++messageSeed
  const duration = normalizedOptions.duration ?? 3000
  const item: MessageRecord = {
    id,
    type: normalizedOptions.type ?? 'info',
    message: normalizedOptions.message ?? normalizedOptions.content ?? '',
    description: normalizedOptions.description ?? '',
    duration,
    showIcon: normalizedOptions.showIcon ?? true,
    closable: normalizedOptions.closable ?? false,
    placement: normalizedOptions.placement ?? 'top',
    offset: normalizedOptions.offset ?? 24,
    zIndex: normalizedOptions.zIndex ?? ++messageZIndexSeed,
    timer: null,
    onClose: normalizedOptions.onClose,
  }

  state.items.push(item)

  if (duration > 0) {
    item.timer = window.setTimeout(() => closeMessage(id), duration)
  }

  return {
    close: () => closeMessage(id),
  }
}

const createTypeMethod = (type: MessageType) => {
  return (options: MessageApiOptions | string) => openMessage(typeof options === 'string' ? { type, message: options } : { ...options, type })
}

export const message = {
  open: openMessage,
  info: createTypeMethod('info'),
  success: createTypeMethod('success'),
  warning: createTypeMethod('warning'),
  error: createTypeMethod('error'),
  loading: createTypeMethod('loading'),
  destroyAll: () => {
    state.items.forEach((item) => {
      if (item.timer) {
        window.clearTimeout(item.timer)
      }
      item.onClose?.()
    })
    state.items.splice(0)
  },
  setGlobalZIndex: (value: number) => {
    if (Number.isFinite(value)) {
      messageZIndexSeed = Math.max(0, Math.floor(value))
    }
  },
}