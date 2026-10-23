<template>
  <div class="scq-action-bar" :class="{ 'is-fixed': fixed, 'has-safe-area': safeArea }" :style="fixed ? { paddingBottom: `${barHeight}px` } : undefined">
    <div ref="barRef" class="scq-action-bar__content" role="toolbar" :aria-label="ariaLabel || text('actions')" :aria-busy="pending || undefined">
      <div v-if="$slots.summary" class="scq-action-bar__summary"><slot name="summary" /></div>
      <slot :execute="execute" :pending="pending" :pending-key="pendingKey"><button v-for="action in actions" :key="action.key" type="button" class="scq-action-bar__action" :class="`scq-action-bar__action--${action.type || 'default'}`" :disabled="isDisabled || action.disabled || action.loading || pending" :aria-busy="action.loading || (pending && pendingKey === action.key) || undefined" :title="action.label" @click="execute(action)"><Loading v-if="action.loading || (pending && pendingKey === action.key)" :size="ACTION_BAR_DEFAULTS.iconSize" /><Badge v-else-if="action.icon" :value="action.badge"><Icon :name="action.icon" :size="action.type === 'icon' ? ACTION_BAR_DEFAULTS.iconActionSize : ACTION_BAR_DEFAULTS.iconSize" /></Badge><span>{{ action.label }}</span></button></slot>
      <div v-if="failed" class="scq-action-bar__error" role="alert"><slot name="error" :error="lastError" :action="pendingAction">{{ errorText || text('confirmationFailed') }}</slot></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import Badge from '../Badge/Badge.vue'
import type { IconName } from '../Icon/icons'
import { useLocale } from '../ConfigProvider/context'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'
import { useElementHeight } from '../../utils/element-height'
import { useContentFocus } from '../../utils/focus'
import { useFormDisabled } from '../Form/useFormControl'

export interface ActionBarItem { key: string | number; label: string; icon?: IconName; type?: 'icon' | 'default' | 'primary' | 'danger'; badge?: string | number; disabled?: boolean; loading?: boolean }
export interface ActionBarProps { actions?: readonly ActionBarItem[]; fixed?: boolean; safeArea?: boolean; disabled?: boolean; ariaLabel?: string; beforeAction?: AsyncGuard<ActionBarItem>; errorText?: string }
const ACTION_BAR_DEFAULTS = { height: 64, iconSize: 18, iconActionSize: 22 } as const
defineOptions({ name: 'ActionBar' })
const props = withDefaults(defineProps<ActionBarProps>(), { actions: () => [], fixed: false, safeArea: true, disabled: undefined, ariaLabel: '', errorText: '' })
const emit = defineEmits<{ (event: 'click', action: ActionBarItem): void; (event: 'error', error: unknown, action: ActionBarItem): void }>()
const text = useLocale()
const isDisabled = useFormDisabled(() => props.disabled)
const barRef = ref<HTMLElement>()
const barHeight = useElementHeight(barRef, ACTION_BAR_DEFAULTS.height)
const failed = ref(false)
const lastError = shallowRef<unknown>()
const pendingAction = shallowRef<ActionBarItem>()
const guard = useAsyncGuard(() => props.beforeAction, (error, action) => { failed.value = true; lastError.value = error; emit('error', error, action) })
const pending = guard.pending
useContentFocus(() => barRef.value, () => pending.value || isDisabled.value)
const pendingKey = computed(() => pending.value ? pendingAction.value?.key : undefined)
watch([isDisabled, () => props.actions, () => props.beforeAction], () => { guard.cancel(); failed.value = false; lastError.value = undefined }, { deep: true, flush: 'sync' })
const execute = (action: ActionBarItem) => {
  if (isDisabled.value || action.disabled || action.loading || pending.value) return
  failed.value = false
  lastError.value = undefined
  pendingAction.value = action
  void guard.run(action, () => emit('click', action))
}
defineExpose({ pending, pendingKey, cancelPending: guard.cancel })
</script>