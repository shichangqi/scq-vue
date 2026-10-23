<template>
  <component :is="isAnchor ? 'a' : 'button'" v-bind="elementAttrs()" class="scq-link" :class="[`scq-link--${type}`, { 'is-disabled': blocked, 'is-loading': busy, 'is-active': isActive, 'has-underline': underline }]" @click="click">
    <span v-if="busy" class="scq-link__loading" aria-hidden="true"><slot name="loading"><Loading :size="LINK_DEFAULTS.iconSize" /></slot></span>
    <Icon v-else-if="icon" :name="icon" :size="LINK_DEFAULTS.iconSize" />
    <slot />
    <Icon v-if="suffixIcon" :name="suffixIcon" :size="LINK_DEFAULTS.iconSize" />
    <template v-if="external"><Icon v-if="suffixIcon !== 'external'" name="external" :size="LINK_DEFAULTS.iconSize" /><span class="scq-link__external-label">{{ text(target === '_blank' ? 'opensInNewWindow' : 'externalLink') }}</span></template>
  </component>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { safeHref } from '../../utils/link'
import { useAsyncGuard } from '../../utils/async'
import { useNavigationAdapter } from '../../utils/navigation'
import { LINK_DEFAULTS } from './constants'
import type { LinkProps } from './types'

defineOptions({ name: 'Link', inheritAttrs: false })
const props = withDefaults(defineProps<LinkProps>(), { href: '', target: '_self', type: 'default', disabled: undefined, underline: true, replace: false, exact: false, active: undefined, loading: false, external: false })
const emit = defineEmits<{
  (event: 'click', value: MouseEvent): void
  (event: 'navigate', to: string): void
  (event: 'error', error: unknown, to: string): void
}>()
const attrs = useAttrs()
const instance = getCurrentInstance()
const config = useConfig()
const text = useLocale()
const adapter = useNavigationAdapter(() => props.adapter)
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const location = computed(() => {
  if (props.to === undefined) return undefined
  if (!adapter.value) throw new Error('[scq-vue] Link to requires an adapter or provideNavigationAdapter.')
  const resolved = adapter.value.resolve(props.to)
  if (!resolved || typeof resolved.href !== 'string' || !safeHref(resolved.href)) {
    throw new TypeError('[scq-vue] Navigation adapter.resolve must return a safe href.')
  }
  return resolved
})
const guard = useAsyncGuard<string>(() => {
  const current = adapter.value
  const replace = props.replace
  return (to, signal) => {
    if (!current) throw new Error('[scq-vue] Link navigation adapter is unavailable.')
    return current.navigate(to, { replace, signal })
  }
}, (error, to) => emit('error', error, to))
const busy = computed(() => props.loading || guard.pending.value)
const blocked = computed(() => isDisabled.value || busy.value)
const isAnchor = computed(() => props.to !== undefined || Boolean(props.href))
const isActive = computed(() => props.active ?? Boolean(props.exact ? location.value?.exactActive : location.value?.active || location.value?.exactActive))
const destination = computed(() => location.value?.href ?? props.href)
const elementAttrs = () => ({
  ...attrs,
  href: blocked.value ? undefined : safeHref(destination.value),
  type: isAnchor.value ? undefined : 'button',
  role: attrs.role ?? (isAnchor.value ? 'link' : undefined),
  disabled: isAnchor.value ? undefined : blocked.value,
  'aria-disabled': blocked.value || attrs['aria-disabled'],
  'aria-busy': busy.value || attrs['aria-busy'],
  'aria-current': attrs['aria-current'] ?? (isActive.value ? 'page' : undefined),
  tabindex: blocked.value ? -1 : attrs.tabindex,
  target: props.target,
  rel: [...new Set([...(props.rel?.split(/\s+/).filter(Boolean) ?? []), ...(props.target === '_blank' ? ['noopener', 'noreferrer'] : [])])].join(' ') || undefined,
})
const click = (event: MouseEvent) => {
  if (blocked.value) { event.preventDefault(); event.stopPropagation(); return }
  if (isAnchor.value && !safeHref(destination.value)) {
    event.preventDefault()
    event.stopPropagation()
    const error = new TypeError('[scq-vue] Link href uses an unsupported or invalid URL.')
    emit('error', error, destination.value)
    if (!instance?.vnode.props?.onError) console.error('[scq-vue] Link navigation failed', error)
    return
  }
  emit('click', event)
  const to = props.to
  if (event.defaultPrevented || to === undefined || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || props.target !== '_self' || attrs.download !== undefined) return
  event.preventDefault()
  void guard.run(to, () => emit('navigate', to))
}
watch([() => props.to, () => props.href, () => props.target, () => props.replace, adapter, isDisabled, () => props.loading], () => guard.cancel(), { flush: 'sync' })
defineExpose({ pending: guard.pending, cancelPending: guard.cancel })
</script>