<template>
  <Drawer :model-value="modelValue" position="bottom" size="auto" :title="title" :show-close="false" :teleport="teleport" :close-on-click-overlay="closeOnClickOverlay" :close-on-press-escape="closeOnPressEscape" :aria-label="title || text('actions')" @update:model-value="updateVisible" @close="emit('close', $event)" @opened="emit('opened')" @closed="emit('closed')">
    <div ref="contentRef" class="scq-action-sheet" tabindex="-1">
      <p v-if="description" class="scq-action-sheet__description">{{ description }}</p>
      <div class="scq-action-sheet__actions" :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }">
        <template v-for="(action, index) in actions" :key="action.value ?? index">
          <h3 v-if="action.group && action.group !== actions[index - 1]?.group" class="scq-action-sheet__group">{{ action.group }}</h3>
          <button type="button" class="scq-action-sheet__action" :class="{ 'is-danger': action.danger, 'is-grid': columnCount > 1 }" :disabled="action.disabled || action.loading || pending" :aria-busy="action.loading || (pending && pendingIndex === index) || undefined" @click="select(action, index)"><slot name="action" :action="action" :index="index" :pending="pending && pendingIndex === index"><Loading v-if="action.loading || (pending && pendingIndex === index)" :size="ACTION_SHEET_SIZES.loading" /><Icon v-else-if="action.icon" :name="action.icon" :size="ACTION_SHEET_SIZES.icon" /><span><span class="scq-action-sheet__name">{{ action.name }}</span><span v-if="action.description" class="scq-action-sheet__subtitle">{{ action.description }}</span></span></slot></button>
        </template>
      </div>
      <div v-if="failed" class="scq-action-sheet__error" role="alert"><slot name="error" :error="lastError">{{ errorText || text('confirmationFailed') }}</slot></div>
      <slot />
      <button v-if="cancelText !== ''" type="button" class="scq-action-sheet__cancel" @click="cancel">{{ cancelText ?? text('cancel') }}</button>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import Drawer, { type DrawerCloseReason } from '../Drawer/Drawer.vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import { useLocale } from '../ConfigProvider/context'
import type { IconName } from '../Icon/icons'
import { useAsyncGuard } from '../../utils/async'
import { useContentFocus, useUpdateFocus } from '../../utils/focus'

export interface ActionSheetItem { name: string; value?: string | number; description?: string; disabled?: boolean; loading?: boolean; danger?: boolean; icon?: IconName; group?: string }
export interface ActionSheetProps { modelValue?: boolean; actions?: readonly ActionSheetItem[]; title?: string; description?: string; cancelText?: string; closeOnSelect?: boolean; closeOnClickOverlay?: boolean; closeOnPressEscape?: boolean; teleport?: boolean | string; beforeSelect?: (action: ActionSheetItem, index: number, signal: AbortSignal) => boolean | void | Promise<boolean | void>; columns?: number; errorText?: string }
const ACTION_SHEET_SIZES = { maxColumns: 4, loading: 18, icon: 20 } as const
defineOptions({ name: 'ActionSheet' })
const props = withDefaults(defineProps<ActionSheetProps>(), { modelValue: false, actions: () => [], title: '', description: '', closeOnSelect: true, closeOnClickOverlay: true, closeOnPressEscape: true, teleport: true, columns: 1, errorText: '' })
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'select', action: ActionSheetItem, index: number): void
  (event: 'cancel' | 'opened' | 'closed'): void
  (event: 'close', reason: DrawerCloseReason | 'select' | 'cancel'): void
  (event: 'error', error: unknown, action: ActionSheetItem, index: number): void
}>()
const text = useLocale()
const failed = ref(false)
const lastError = shallowRef<unknown>()
const pendingIndex = ref(-1)
const contentRef = ref<HTMLElement>()
const columnCount = computed(() => Math.max(1, Math.min(ACTION_SHEET_SIZES.maxColumns, Math.floor(props.columns))))
watch(() => props.columns, value => {
  if (!Number.isFinite(value)) throw new RangeError('[scq-vue] ActionSheet columns must be finite.')
}, { immediate: true, flush: 'sync' })
const guard = useAsyncGuard<{ action: ActionSheetItem; index: number }>(() => props.beforeSelect ? (selection, signal) => props.beforeSelect!(selection.action, selection.index, signal) : undefined, (error, { action, index }) => { failed.value = true; lastError.value = error; emit('error', error, action, index) })
const pending = guard.pending
useContentFocus(() => contentRef.value, () => pending.value, () => contentRef.value)
useUpdateFocus(() => props.modelValue ? contentRef.value : undefined)
const updateVisible = (value: boolean) => { if (!value) guard.cancel(); emit('update:modelValue', value) }
watch([() => props.modelValue, () => props.actions, () => props.beforeSelect], () => { guard.cancel(); failed.value = false; lastError.value = undefined }, { deep: true, flush: 'sync' })
const select = (action: ActionSheetItem, index: number) => {
  if (!props.modelValue || props.actions[index] !== action || action.disabled || action.loading || pending.value) return
  failed.value = false
  lastError.value = undefined
  pendingIndex.value = index
  void guard.run({ action, index }, () => {
    emit('select', action, index)
    if (props.closeOnSelect) { updateVisible(false); emit('close', 'select') }
  })
}
const cancel = () => { if (!props.modelValue) return; guard.cancel(); emit('cancel'); updateVisible(false); emit('close', 'cancel') }
defineExpose({ pending, cancelPending: guard.cancel })
</script>