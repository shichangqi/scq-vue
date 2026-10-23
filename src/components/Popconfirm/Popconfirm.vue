<template><span class="scq-popconfirm"><Popover v-model="opened" :disabled="isDisabled" :teleport="teleport" :placement="placement" :width="width" :aria-label="title || text('confirm')"><template #reference><span ref="referenceRef"><slot name="reference"><slot /></slot></span></template><div class="scq-popconfirm__body"><Icon v-if="showIcon" name="info" :size="20" /><div><strong v-if="title || $slots.title"><slot name="title">{{ title }}</slot></strong><div v-if="message || $slots.content" class="scq-popconfirm__message"><slot name="content">{{ message }}</slot></div></div></div><div v-if="failed" class="scq-popconfirm__error" role="alert"><slot name="error" :error="lastError">{{ errorText || text('confirmationFailed') }}</slot></div><div ref="actionsRef" class="scq-popconfirm__actions"><slot name="actions" :confirm="confirm" :cancel="cancel" :pending="pending"><button type="button" :disabled="pending && !allowCancelWhilePending" @click="cancel">{{ cancelText || text('cancel') }}</button><button class="scq-popconfirm__confirm" :class="{ 'is-danger': danger }" type="button" :disabled="pending || isDisabled" :aria-busy="pending" @click="confirm"><Loading v-if="pending" :size="14" />{{ confirmText || text('confirm') }}</button></slot></div></Popover></span></template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import { FLOATING_FOCUSABLE_SELECTOR, type FloatingPlacement } from '../../utils/floating'
import { useAsyncGuard } from '../../utils/async'
import { useContentFocus } from '../../utils/focus'
import { useConfig, useLocale } from '../ConfigProvider/context'

defineOptions({ name: 'Popconfirm' })
export interface PopconfirmProps { modelValue?: boolean; title?: string; message?: string; confirmText?: string; cancelText?: string; showIcon?: boolean; disabled?: boolean; allowCancelWhilePending?: boolean; beforeConfirm?: (signal: AbortSignal) => boolean | void | Promise<boolean | void>; placement?: FloatingPlacement; width?: string | number; teleport?: boolean | string; danger?: boolean; errorText?: string }
const props = withDefaults(defineProps<PopconfirmProps>(), { modelValue: undefined, title: '', message: '', showIcon: true, disabled: undefined, allowCancelWhilePending: true, placement: 'top', width: 260, teleport: true, danger: false, errorText: '' })
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'confirm' | 'cancel'): void; (event: 'error', error: unknown): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref(false)
const failed = ref(false)
const lastError = shallowRef<unknown>()
const referenceRef = ref<HTMLElement>()
const actionsRef = ref<HTMLElement>()
const guard = useAsyncGuard<void>(() => {
  const handler = props.beforeConfirm
  return (_value, signal) => handler?.(signal)
}, error => {
  lastError.value = error
  failed.value = true
  emit('error', error)
})
const pending = guard.pending
useContentFocus(() => actionsRef.value, () => pending.value)
const setOpened = (value: boolean, completed = false) => {
  if (value && isDisabled.value) return
  if (!value && pending.value && !props.allowCancelWhilePending && !completed) return
  if (!value) guard.cancel()
  else { failed.value = false; lastError.value = undefined }
  internal.value = value
  emit('update:modelValue', value)
}
const opened = computed({ get: () => props.modelValue ?? internal.value, set: (value) => setOpened(value) })
const close = () => { setOpened(false, true); (referenceRef.value?.querySelector<HTMLElement>(FLOATING_FOCUSABLE_SELECTOR) ?? referenceRef.value?.parentElement)?.focus({ preventScroll: true }) }
const cancel = () => { if (!opened.value || (pending.value && !props.allowCancelWhilePending)) return; guard.cancel(); close(); emit('cancel') }
const confirm = () => {
  if (pending.value || isDisabled.value || !opened.value) return
  failed.value = false
  lastError.value = undefined
  return guard.run(undefined, () => {
    emit('confirm')
    close()
  })
}
watch(opened, (value) => { if (!value) guard.cancel(); else { failed.value = false; lastError.value = undefined } }, { flush: 'sync' })
watch(isDisabled, (value) => { if (value) { guard.cancel(); opened.value = false } }, { flush: 'sync' })
</script>