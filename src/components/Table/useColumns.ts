import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watch, type ComponentPublicInstance, type CSSProperties } from 'vue'
import { TABLE_DEFAULTS } from './constants'
import { COMPOSITION_KEY_CODE } from '../../utils/composition'
import type { TableColumn, TableColumnResize, TableColumnWidths, TableFilterValue, TableProps } from './types'

type ColumnProps = Pick<TableProps, 'columns' | 'selectable' | 'resizable' | 'columnWidths' | 'defaultColumnWidths' | 'visibleColumnKeys' | 'defaultVisibleColumnKeys'>
interface ColumnEvents {
  widths: (widths: TableColumnWidths) => void
  resize: (change: TableColumnResize) => void
  visibility: (keys: string[]) => void
}
interface ResizeSession {
  column: TableColumn
  pointerId: number
  startX: number
  startWidth: number
  originalOverride: number | undefined
  lastWidth: number | undefined
  target: HTMLElement
  document: Document
  min: number
  max: number
  columnWidth: TableColumn['width']
}

const positiveNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
const pixelWidth = (value: string | number | undefined): number | undefined => {
  if (positiveNumber(value)) return value
  if (typeof value !== 'string' || !/^\d*\.?\d+(px)?$/.test(value.trim())) return undefined
  const width = Number.parseFloat(value)
  return positiveNumber(width) ? width : undefined
}

export const useTableColumns = (props: ColumnProps, events: ColumnEvents) => {
  const localWidths = ref<TableColumnWidths>({ ...props.defaultColumnWidths })
  const widths = computed(() => props.columnWidths ?? localWidths.value)
  const localVisible = ref<string[] | undefined>(props.defaultVisibleColumnKeys ? [...props.defaultVisibleColumnKeys] : undefined)
  const visibleColumns = computed(() => {
    const keys = props.visibleColumnKeys ?? localVisible.value
    return keys === undefined ? props.columns : props.columns.filter((column) => keys.includes(column.key))
  })
  const visibleKeys = computed(() => visibleColumns.value.map((column) => column.key))
  const isResizable = (column: TableColumn) => column.resizable ?? props.resizable ?? false
  const layoutEnabled = computed(() => visibleColumns.value.some((column) => column.fixed || isResizable(column) || positiveNumber(widths.value[column.key])))
  const headers = new Map<string, HTMLElement>()
  const measuredWidths = ref(new Map<string, number>())
  const selectionHeader = ref<HTMLElement>()
  const measuredSelectionWidth = ref<number>()
  const isResizing = ref(false)
  let observer: ResizeObserver | undefined
  let mounted = false
  let session: ResizeSession | undefined

  const bounds = (column: TableColumn) => {
    const min = positiveNumber(column.minWidth) ? column.minWidth : TABLE_DEFAULTS.minColumnWidth
    const max = Math.max(min, positiveNumber(column.maxWidth) ? column.maxWidth : TABLE_DEFAULTS.maxColumnWidth)
    return { min, max }
  }
  const clampWidth = (column: TableColumn, width: number) => {
    const { min, max } = bounds(column)
    return Math.max(min, Math.min(max, width))
  }
  const configuredWidth = (column: TableColumn): number | string | undefined => {
    const override = widths.value[column.key]
    if (positiveNumber(override)) return clampWidth(column, override)
    const width = column.width ?? (layoutEnabled.value ? TABLE_DEFAULTS.columnWidth : undefined)
    const pixels = pixelWidth(width)
    return isResizable(column) && pixels !== undefined ? clampWidth(column, pixels) : width
  }
  const renderedWidth = (column: TableColumn) => measuredWidths.value.get(column.key) ?? pixelWidth(configuredWidth(column)) ?? TABLE_DEFAULTS.columnWidth
  const resizeWidth = (column: TableColumn) => clampWidth(column, renderedWidth(column))
  const selectionFixed = computed(() => Boolean(props.selectable && visibleColumns.value.some((column) => column.fixed === 'left')))
  const fixedOffsets = computed(() => {
    const offsets = new Map<string, { left?: number; right?: number }>()
    let left = selectionFixed.value ? measuredSelectionWidth.value ?? TABLE_DEFAULTS.selectionWidth : 0
    let right = 0
    for (const column of visibleColumns.value) {
      if (column.fixed !== 'left') continue
      offsets.set(column.key, { left })
      left += renderedWidth(column)
    }
    for (const column of [...visibleColumns.value].reverse()) {
      if (column.fixed !== 'right') continue
      offsets.set(column.key, { right })
      right += renderedWidth(column)
    }
    return offsets
  })
  const widthStyle = (column: TableColumn): CSSProperties => {
    const width = configuredWidth(column)
    return { width: typeof width === 'number' ? `${width}px` : width }
  }
  const columnStyle = (column: TableColumn): CSSProperties => {
    const offsets = fixedOffsets.value.get(column.key)
    return {
      ...widthStyle(column),
      textAlign: column.align || 'left',
      ...(column.fixed ? { position: 'sticky', left: offsets?.left === undefined ? undefined : `${offsets.left}px`, right: offsets?.right === undefined ? undefined : `${offsets.right}px` } : {}),
    }
  }
  const selectionStyle = computed<CSSProperties>(() => ({
    ...(layoutEnabled.value ? { width: `${TABLE_DEFAULTS.selectionWidth}px` } : {}),
    ...(selectionFixed.value ? { position: 'sticky', left: '0px' } : {}),
  }))
  const layoutStyle = computed<CSSProperties>(() => layoutEnabled.value ? {
    tableLayout: 'fixed',
    width: `${visibleColumns.value.reduce((total, column) => total + (pixelWidth(configuredWidth(column)) ?? TABLE_DEFAULTS.columnWidth), props.selectable ? TABLE_DEFAULTS.selectionWidth : 0)}px`,
  } : {})

  const changeVisibility = (value: TableFilterValue | TableFilterValue[] | null) => {
    const requested = new Set(Array.isArray(value) ? value : value === null ? [] : [value])
    const keys = props.columns.filter((column) => requested.has(column.key)).map((column) => column.key)
    if (props.visibleColumnKeys === undefined) localVisible.value = keys
    events.visibility([...keys])
  }
  const setWidths = (value: TableColumnWidths) => {
    if (props.columnWidths === undefined) localWidths.value = value
    events.widths({ ...value })
  }
  const measure = () => {
    if (!mounted || !layoutEnabled.value) return
    const next = new Map<string, number>()
    for (const [key, element] of headers) {
      const width = element.getBoundingClientRect().width
      if (positiveNumber(width)) next.set(key, width)
    }
    if (next.size !== measuredWidths.value.size || [...next].some(([key, width]) => measuredWidths.value.get(key) !== width)) measuredWidths.value = next
    const width = selectionHeader.value?.getBoundingClientRect().width
    measuredSelectionWidth.value = positiveNumber(width) ? width : undefined
  }
  const setHeader = (key: string, element: Element | ComponentPublicInstance | null) => {
    const previous = headers.get(key)
    if (previous === element) return
    if (previous) observer?.unobserve(previous)
    if (element instanceof HTMLElement) {
      headers.set(key, element)
      observer?.observe(element)
    } else headers.delete(key)
  }
  const setSelectionHeader = (element: Element | ComponentPublicInstance | null) => {
    if (selectionHeader.value === element) return
    if (selectionHeader.value) observer?.unobserve(selectionHeader.value)
    selectionHeader.value = element instanceof HTMLElement ? element : undefined
    if (selectionHeader.value) observer?.observe(selectionHeader.value)
  }
  const observe = () => {
    observer?.disconnect()
    observer = undefined
    window.removeEventListener('resize', measure)
    if (!mounted || !layoutEnabled.value) return
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      headers.forEach((element) => observer?.observe(element))
      if (selectionHeader.value) observer.observe(selectionHeader.value)
    }
    window.addEventListener('resize', measure)
    measure()
  }

  const detachResize = () => {
    const previous = session
    if (!previous) return
    session = undefined
    isResizing.value = false
    previous.document.removeEventListener('pointermove', moveResize)
    previous.document.removeEventListener('pointerup', endResize)
    previous.document.removeEventListener('pointercancel', pointerCancel)
    previous.document.removeEventListener('keydown', cancelOnEscape)
    previous.document.defaultView?.removeEventListener('blur', cancelResize)
    previous.target.removeEventListener('lostpointercapture', pointerCancel)
    if (previous.target.hasPointerCapture?.(previous.pointerId)) previous.target.releasePointerCapture(previous.pointerId)
    return previous
  }
  const cancelResize = () => {
    const previous = detachResize()
    if (!previous || previous.lastWidth === undefined) return
    const next = { ...widths.value }
    if (previous.originalOverride === undefined) delete next[previous.column.key]
    else next[previous.column.key] = previous.originalOverride
    setWidths(next)
  }
  const pointerCancel = (event: PointerEvent) => {
    if (session?.pointerId === event.pointerId) cancelResize()
  }
  const cancelOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    cancelResize()
  }
  const moveResize = (event: PointerEvent) => {
    if (!session || session.pointerId !== event.pointerId || !Number.isFinite(event.clientX)) return
    event.preventDefault()
    const width = clampWidth(session.column, session.startWidth + event.clientX - session.startX)
    if (width === session.lastWidth || (session.lastWidth === undefined && width === session.startWidth)) return
    session.lastWidth = width
    setWidths({ ...widths.value, [session.column.key]: width })
  }
  const endResize = (event: PointerEvent) => {
    if (session?.pointerId !== event.pointerId) return
    const previous = detachResize()
    if (previous?.lastWidth !== undefined) events.resize({ key: previous.column.key, width: previous.lastWidth })
  }
  const startResize = (column: TableColumn, event: PointerEvent) => {
    if (!isResizable(column) || event.defaultPrevented || !Number.isFinite(event.clientX) || event.button !== 0 || event.isPrimary === false) return
    event.preventDefault()
    cancelResize()
    const target = event.currentTarget as HTMLElement
    target.focus({ preventScroll: true })
    session = {
      column, target, document: target.ownerDocument, pointerId: event.pointerId,
      startX: event.clientX, startWidth: resizeWidth(column),
      originalOverride: widths.value[column.key], lastWidth: undefined,
      ...bounds(column), columnWidth: column.width,
    }
    isResizing.value = true
    session.document.addEventListener('pointermove', moveResize)
    session.document.addEventListener('pointerup', endResize)
    session.document.addEventListener('pointercancel', pointerCancel)
    session.document.addEventListener('keydown', cancelOnEscape)
    session.document.defaultView?.addEventListener('blur', cancelResize)
    target.addEventListener('lostpointercapture', pointerCancel)
    try { target.setPointerCapture?.(event.pointerId) } catch { /* The pointer may already have been released. */ }
  }
  const resizeWithKeyboard = (column: TableColumn, event: KeyboardEvent) => {
    if (!isResizable(column) || session || event.defaultPrevented || event.isComposing || event.keyCode === COMPOSITION_KEY_CODE || event.ctrlKey || event.metaKey || event.altKey) return
    const step = event.shiftKey ? TABLE_DEFAULTS.resizeLargeStep : TABLE_DEFAULTS.resizeStep
    const current = resizeWidth(column)
    let width: number
    switch (event.key) {
      case 'ArrowLeft': width = current - step; break
      case 'ArrowRight': width = current + step; break
      case 'Home': width = bounds(column).min; break
      case 'End': width = bounds(column).max; break
      default: return
    }
    event.preventDefault()
    event.stopPropagation()
    width = clampWidth(column, width)
    if (width === current) return
    setWidths({ ...widths.value, [column.key]: width })
    events.resize({ key: column.key, width })
  }

  watch(layoutEnabled, observe, { flush: 'post' })
  watch([visibleColumns, () => props.resizable], () => {
    if (!session) return
    const column = visibleColumns.value.find((column) => column.key === session?.column.key)
    if (!column || column !== session.column || !isResizable(column) || column.width !== session.columnWidth || bounds(column).min !== session.min || bounds(column).max !== session.max) cancelResize()
  }, { deep: true, flush: 'sync' })
  watch(() => props.columnWidths, (value) => {
    // A parent override wins over an in-flight drag, without a rollback emission.
    if (session && value?.[session.column.key] !== (session.lastWidth ?? session.originalOverride)) detachResize()
  }, { deep: true })
  onMounted(() => { mounted = true; observe() })
  onUpdated(measure)
  onBeforeUnmount(() => {
    mounted = false
    detachResize()
    observer?.disconnect()
    window.removeEventListener('resize', measure)
  })

  return {
    visibleColumns, visibleKeys, changeVisibility, isResizable, layoutEnabled, layoutStyle,
    columnStyle, widthStyle, selectionStyle, selectionFixed, setHeader, setSelectionHeader,
    bounds, resizeWidth, startResize, resizeWithKeyboard, isResizing,
  }
}
