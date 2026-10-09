<template><span class="scq-popconfirm"><Popover v-model="opened" :disabled="isDisabled" :teleport="teleport" :placement="placement" :width="width" :aria-label="title || text('confirm')"><template #reference><span ref="referenceRef"><slot name="reference"><slot /></slot></span></template><div class="scq-popconfirm__body"><Icon v-if="showIcon" name="info" :size="20" /><div><strong v-if="title">{{ title }}</strong><div v-if="message || $slots.content" class="scq-popconfirm__message"><slot name="content">{{ message }}</slot></div></div></div><div class="scq-popconfirm__actions"><button type="button" :disabled="pending && !allowCancelWhilePending" @click="cancel">{{ cancelText || text('cancel') }}</button><button class="scq-popconfirm__confirm" type="button" :disabled="pending || isDisabled" :aria-busy="pending" @click="confirm"><Loading v-if="pending" :size="14" />{{ confirmText || text('confirm') }}</button></div></Popover></span></template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import type { FloatingPlacement } from '../../utils/floating'
import { useConfig, useLocale } from '../ConfigProvider/context'

defineOptions({ name: 'Popconfirm' })
const props = withDefaults(defineProps<{ modelValue?: boolean; title?: string; message?: string; confirmText?: string; cancelText?: string; showIcon?: boolean; disabled?: boolean; allowCancelWhilePending?: boolean; beforeConfirm?: (signal: AbortSignal) => boolean | void | Promise<boolean | void>; placement?: FloatingPlacement; width?: string | number; teleport?: boolean | string }>(), { modelValue: undefined, title: '', message: '', showIcon: true, disabled: undefined, allowCancelWhilePending: true, placement: 'top', width: 260, teleport: true })
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'confirm' | 'cancel'): void; (event: 'error', error: unknown): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref(false)
const pending = ref(false)
const referenceRef = ref<HTMLElement>()
let controller: AbortController | undefined
const opened = computed({ get: () => props.modelValue ?? internal.value, set: (value) => { internal.value = value; emit('update:modelValue', value) } })
const close = () => { opened.value = false; referenceRef.value?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus() }
const cancel = () => { if (pending.value && !props.allowCancelWhilePending) return; controller?.abort(); pending.value = false; close(); emit('cancel') }
const confirm = async () => {
  if (pending.value || isDisabled.value || !opened.value) return
  const current = new AbortController()
  controller?.abort()
  controller = current
  pending.value = true
  try {
    const allowed = await props.beforeConfirm?.(current.signal)
    if (current.signal.aborted || allowed === false) return
    emit('confirm')
    close()
  } catch (error) { if (!current.signal.aborted) emit('error', error) }
  finally { if (controller === current) pending.value = false }
}
watch(opened, (value) => { if (!value) { controller?.abort(); pending.value = false } })
watch(isDisabled, (value) => { if (value) { controller?.abort(); pending.value = false; opened.value = false } })
onBeforeUnmount(() => controller?.abort())
</script>