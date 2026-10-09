<template>
  <Drawer :model-value="modelValue" position="bottom" size="auto" :title="title" :show-close="false" :teleport="teleport" :close-on-click-overlay="closeOnClickOverlay" :close-on-press-escape="closeOnPressEscape" :aria-label="title || 'Actions'" @update:model-value="emit('update:modelValue', $event)" @close="emit('close', $event)" @opened="emit('opened')" @closed="emit('closed')">
    <div class="scq-action-sheet">
      <p v-if="description" class="scq-action-sheet__description">{{ description }}</p>
      <button v-for="(action, index) in actions" :key="action.value ?? index" type="button" class="scq-action-sheet__action" :class="{ 'is-danger': action.danger }" :disabled="action.disabled || action.loading" :aria-busy="action.loading || undefined" @click="select(action, index)"><Loading v-if="action.loading" :size="18" /><Icon v-else-if="action.icon" :name="action.icon" :size="20" /><span><span class="scq-action-sheet__name">{{ action.name }}</span><span v-if="action.description" class="scq-action-sheet__subtitle">{{ action.description }}</span></span></button>
      <slot />
      <button v-if="cancelText !== ''" type="button" class="scq-action-sheet__cancel" @click="cancel">{{ cancelText ?? text('cancel') }}</button>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import Drawer, { type DrawerCloseReason } from '../Drawer/Drawer.vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import { useLocale } from '../ConfigProvider/context'
import type { IconName } from '../Icon/icons'

export interface ActionSheetItem { name: string; value?: string | number; description?: string; disabled?: boolean; loading?: boolean; danger?: boolean; icon?: IconName }
defineOptions({ name: 'ActionSheet' })
const props = withDefaults(defineProps<{ modelValue?: boolean; actions?: ActionSheetItem[]; title?: string; description?: string; cancelText?: string; closeOnSelect?: boolean; closeOnClickOverlay?: boolean; closeOnPressEscape?: boolean; teleport?: boolean | string }>(), { modelValue: false, actions: () => [], title: '', description: '', closeOnSelect: true, closeOnClickOverlay: true, closeOnPressEscape: true, teleport: true })
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'select', action: ActionSheetItem, index: number): void
  (event: 'cancel' | 'opened' | 'closed'): void
  (event: 'close', reason: DrawerCloseReason | 'select' | 'cancel'): void
}>()
const text = useLocale()
const select = (action: ActionSheetItem, index: number) => {
  if (action.disabled || action.loading) return
  emit('select', action, index)
  if (props.closeOnSelect) { emit('update:modelValue', false); emit('close', 'select') }
}
const cancel = () => { emit('cancel'); emit('update:modelValue', false); emit('close', 'cancel') }
</script>