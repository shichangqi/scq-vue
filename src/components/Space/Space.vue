<template>
  <div class="scq-space" :class="{ 'is-vertical': direction === 'vertical', 'is-fill': fill }" :style="spaceStyle">
    <Content><template #default><slot /></template><template v-if="$slots.separator" #separator="scope"><slot name="separator" v-bind="scope" /></template></Content>
  </div>
</template>

<script setup lang="ts">
import { cloneVNode, computed, createTextVNode, Fragment, h, isVNode, type CSSProperties, type FunctionalComponent, type VNode, type VNodeChild } from 'vue'
import { isResponsiveValue, resolveResponsiveValue, SPACING_TOKENS, toCssGap, useLayoutBreakpoint, type LayoutBreakpoints, type ResponsiveValue, type SpacingValue } from '../../utils/layout'
import { hasSlotContent } from '../../utils/slots'

defineOptions({ name: 'Space' })
export interface SpaceProps {
  direction?: 'horizontal' | 'vertical'
  size?: ResponsiveValue<SpacingValue>
  breakpoints?: LayoutBreakpoints
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around'
  wrap?: boolean
  fill?: boolean
}
export interface SpaceSlots {
  default?: () => VNode[]
  separator?: (props: { index: number }) => VNode[]
}
defineSlots<SpaceSlots>()
const props = withDefaults(defineProps<SpaceProps>(), { direction: 'horizontal', size: SPACING_TOKENS.md, align: 'center', justify: 'start', wrap: true, fill: false })
const breakpoint = useLayoutBreakpoint(() => props.breakpoints, () => isResponsiveValue(props.size))
const spaceStyle = computed<CSSProperties>(() => ({
  gap: toCssGap(resolveResponsiveValue<SpacingValue>(props.size, breakpoint.value, SPACING_TOKENS.md)),
  alignItems: props.align,
  justifyContent: props.justify,
  flexWrap: props.wrap ? 'wrap' : 'nowrap',
}))
const keys = new Map<PropertyKey, number>()
const usedKeys = new Set<PropertyKey>()
let nextKey = 0
const nodeKey = (key: PropertyKey | null, index: number) => {
  if (key === null) return `index:${index}`
  usedKeys.add(key)
  if (!keys.has(key)) keys.set(key, nextKey++)
  return `key:${keys.get(key)}`
}
const flatten = (children: VNodeChild[], parent = ''): VNode[] => children.flatMap((child, index) => {
  if (Array.isArray(child)) return flatten(child, `${parent}/array:${index}`)
  if (child === null || child === undefined || typeof child === 'boolean') return []
  const node = isVNode(child) ? child : createTextVNode(String(child))
  if (node.type !== Fragment && !hasSlotContent([node])) return []
  const key = `${parent}/${nodeKey(node.key, index)}`
  if (node.type === Fragment && Array.isArray(node.children)) return flatten(node.children, key)
  return [cloneVNode(node, { key })]
})
const Content: FunctionalComponent = (_props, { slots }) => {
  usedKeys.clear()
  const children = flatten(slots.default?.() ?? [])
  for (const key of keys.keys()) if (!usedKeys.has(key)) keys.delete(key)
  if (!slots.separator) return children
  return children.flatMap((child, index) => index
    ? [h('span', { class: 'scq-space__separator', 'aria-hidden': 'true', key: `separator:${String(child.key)}` }, slots.separator?.({ index: index - 1 })), child]
    : [child])
}
</script>