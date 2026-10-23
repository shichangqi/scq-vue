import type { AppContext } from 'vue'
import type { SwipeCellGroup, SwipeCellGroupConflict, SwipeCellPosition } from './types'

type OpenPosition = Exclude<SwipeCellPosition, ''>

export interface SwipeCellMember {
  id: string
  position: () => SwipeCellPosition
  close: (signal: AbortSignal) => Promise<boolean>
  open: (position: OpenPosition, signal: AbortSignal) => Promise<boolean>
  conflict: (context: SwipeCellGroupConflict) => boolean
}

interface GroupRequest {
  member: SwipeCellMember
  position: OpenPosition
  controller: AbortController
  opening: boolean
  promise: Promise<boolean>
}

interface GroupState {
  members: Set<SwipeCellMember>
  conflictKey: string
  request?: GroupRequest
}

const appGroups = new WeakMap<AppContext, Map<SwipeCellGroup, GroupState>>()

export const registerSwipeCell = (app: AppContext, group: SwipeCellGroup, member: SwipeCellMember) => {
  let groups = appGroups.get(app)
  if (!groups) {
    groups = new Map()
    appGroups.set(app, groups)
  }
  let state = groups.get(group)
  if (!state) {
    state = { members: new Set(), conflictKey: '' }
    groups.set(group, state)
  }
  const current = state
  const reportConflict = () => {
    const opened = [...current.members].filter((entry) => entry.position() !== '')
    const key = opened.length > 1 ? JSON.stringify(opened.map((entry) => [entry.id, entry.position()])) : ''
    if (key === current.conflictKey) return
    current.conflictKey = key
    if (!key) return
    const context: SwipeCellGroupConflict = {
      group,
      cells: opened.map((entry) => ({ id: entry.id, position: entry.position() as OpenPosition })),
    }
    const handled = opened.map((entry) => entry.conflict(context)).some(Boolean)
    if (!handled) console.warn('[scq-vue/SwipeCell] Conflicting controlled group values are preserved. Handle group-conflict to reconcile them.', context)
  }
  const cancel = () => {
    if (current.request?.member === member) current.request.controller.abort()
  }
  const changed = (previous: SwipeCellPosition) => {
    const request = current.request
    const position = member.position()
    if (request && position && position !== previous && !(request.member === member && request.opening && request.position === position)) {
      request.controller.abort()
    }
    reportConflict()
  }
  current.members.add(member)
  changed('')

  return {
    cancel,
    changed,
    open(position: OpenPosition): Promise<boolean> {
      if (current.request && !current.request.controller.signal.aborted) {
        return current.request.member === member && current.request.position === position ? current.request.promise : Promise.resolve(false)
      }
      const request: GroupRequest = {
        member,
        position,
        controller: new AbortController(),
        opening: false,
        promise: Promise.resolve(false),
      }
      current.request = request
      const { signal } = request.controller
      request.promise = Promise.resolve().then(async () => {
        for (const peer of [...current.members]) {
          if (signal.aborted || !current.members.has(member)) return false
          if (peer === member || !current.members.has(peer) || !peer.position()) continue
          await peer.close(signal)
          if (signal.aborted) return false
          // A guard approval is only a proposal in controlled mode; the prop must actually close.
          if (current.members.has(peer) && peer.position()) return false
        }
        if (signal.aborted || !current.members.has(member) || [...current.members].some((peer) => peer !== member && peer.position())) return false
        request.opening = true
        return member.open(position, signal)
      }).finally(() => {
        if (current.request === request) current.request = undefined
      })
      return request.promise
    },
    unregister() {
      cancel()
      current.members.delete(member)
      reportConflict()
      if (!current.members.size) groups.delete(group)
    },
  }
}

export type SwipeCellRegistration = ReturnType<typeof registerSwipeCell>

export const untilCancelled = (promise: Promise<boolean>, signal: AbortSignal): Promise<boolean> => {
  if (signal.aborted) return Promise.resolve(false)
  return new Promise((resolve, reject) => {
    const cancel = () => { cleanup(); resolve(false) }
    const cleanup = () => signal.removeEventListener('abort', cancel)
    signal.addEventListener('abort', cancel, { once: true })
    promise.then((value) => { cleanup(); resolve(value) }, (error: unknown) => { cleanup(); reject(error) })
  })
}
