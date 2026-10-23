<template>
  <i class="scq-icon" :class="[`scq-icon--${resolvedName}`, `scq-icon--${renderVariant}`]" :style="iconStyle" v-bind="rootAttributes()" :aria-hidden="isSemantic ? undefined : 'true'">
    <svg viewBox="0 0 24 24" :fill="svgFill" :fill-rule="brandOptions?.fillRule" :stroke="svgStroke" :stroke-width="svgStrokeWidth" stroke-linecap="round" stroke-linejoin="round" focusable="false" :role="isSemantic ? 'img' : undefined" :aria-hidden="isSemantic ? undefined : 'true'" :aria-label="isSemantic && accessibleLabel ? accessibleLabel : undefined" :aria-labelledby="isSemantic && !accessibleLabel && accessibleTitle ? titleId : undefined">
      <title v-if="accessibleTitle" :id="titleId">{{ accessibleTitle }}</title>
      <path v-for="path in paths" :key="path" :d="path" />
    </svg>
  </i>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs, watch } from 'vue'
import { useComponentId } from '../../utils/id'
import { toCssLength } from '../../utils/layout'
import { brandIconRenderOptions } from './brands'
import { iconPaths, solidIconPaths, type IconName, type IconVariant } from './icons'

export interface IconProps {
  name: IconName | string
  variant?: IconVariant
  size?: number | string
  color?: string
  decorative?: boolean
  ariaLabel?: string
  title?: string
}

defineOptions({
  name: 'Icon',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<IconProps>(),
  {
    variant: 'outline',
    size: '1em',
    color: '',
    decorative: true,
  },
)
const emit = defineEmits<{ (event: 'accessibility-error', error: Error): void }>()
const ICON_ACCESSIBILITY_ERROR_MESSAGE = '[scq-vue/Icon] Non-decorative icons require a non-empty ariaLabel or title. The unnamed icon remains hidden from assistive technology.'
const ICON_SEMANTIC_ATTRIBUTES = new Set(['role', 'aria-hidden', 'aria-labelledby'])
const attrs = useAttrs()
const instance = getCurrentInstance()
const titleId = useComponentId('scq-icon-title')
const accessibleLabel = computed(() => props.ariaLabel?.trim())
const accessibleTitle = computed(() => props.title?.trim())
const hasAccessibleName = computed(() => Boolean(accessibleLabel.value || accessibleTitle.value))
const isSemantic = computed(() => !props.decorative && hasAccessibleName.value)
const rootAttributes = () => Object.fromEntries(Object.entries(attrs).filter(([key]) => !ICON_SEMANTIC_ATTRIBUTES.has(key)))

watch(() => !props.decorative && !hasAccessibleName.value, (invalid) => {
  if (!invalid) return
  const error = new Error(ICON_ACCESSIBILITY_ERROR_MESSAGE)
  emit('accessibility-error', error)
  if (!instance?.vnode.props?.onAccessibilityError) console.warn(error.message)
}, { immediate: true })

const resolvedName = computed<IconName>(() => {
  return Object.hasOwn(iconPaths, props.name) ? (props.name as IconName) : 'file'
})

const resolvedVariant = computed<IconVariant>(() => {
  return props.variant === 'solid' ? 'solid' : 'outline'
})

const renderVariant = computed<IconVariant>(() => {
  return resolvedVariant.value === 'solid' && solidIconPaths[resolvedName.value] ? 'solid' : 'outline'
})

const paths = computed(() => {
  return renderVariant.value === 'solid' ? solidIconPaths[resolvedName.value] || iconPaths[resolvedName.value] : iconPaths[resolvedName.value]
})

const brandOptions = computed(() => brandIconRenderOptions[resolvedName.value])

const usesFill = computed(() => {
  return renderVariant.value === 'solid' || brandOptions.value?.outlineStrokeWidth === 0
})

const svgFill = computed(() => {
  return usesFill.value ? 'currentColor' : 'none'
})

const svgStroke = computed(() => {
  return usesFill.value ? 'none' : 'currentColor'
})

const svgStrokeWidth = computed(() => {
  return usesFill.value ? 0 : brandOptions.value?.outlineStrokeWidth ?? 2
})

const normalizedSize = computed(() => {
  return toCssLength(props.size)
})

const iconStyle = computed(() => {
  return {
    '--scq-icon-size': normalizedSize.value,
    color: props.color || undefined,
  }
})
</script>

<style scoped>
.scq-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--scq-icon-size, 1em);
  height: var(--scq-icon-size, 1em);
  flex: 0 0 auto;
  line-height: 1;
  color: inherit;
  vertical-align: -0.125em;
}

.scq-icon svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>