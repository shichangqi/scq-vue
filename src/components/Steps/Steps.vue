<template><ol ref="stepsRef" class="scq-steps" :class="`scq-steps--${direction}`" :aria-label="ariaLabel || text('steps')" :aria-busy="guard.pending.value || undefined"><li v-for="(item, index) in items" :key="index" class="scq-steps__item" :class="[`is-${status(item, index)}`, { 'is-disabled': item.disabled }]" :aria-current="index === current ? 'step' : undefined"><component :is="clickable ? 'button' : 'div'" :type="clickable ? 'button' : undefined" class="scq-steps__step" :disabled="clickable ? isDisabled || item.disabled || guard.pending.value : undefined" @click="select(index)"><span class="scq-steps__number" aria-hidden="true"><Icon v-if="item.icon" :name="item.icon" :size="STEP_ICON_SIZE" /><Icon v-else-if="status(item, index) === 'finish'" name="check" :size="STEP_ICON_SIZE" /><Icon v-else-if="status(item, index) === 'error'" name="close" :size="STEP_ICON_SIZE" /><span v-else>{{ index + 1 }}</span></span><span class="scq-steps__content"><strong>{{ item.title }}</strong><span v-if="item.description" class="scq-steps__description">{{ item.description }}</span></span></component></li></ol></template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'
import { useContentFocus } from '../../utils/focus'

export type StepStatus = 'wait' | 'process' | 'finish' | 'error'
export interface StepItem { title: string; description?: string; icon?: IconName; status?: StepStatus; disabled?: boolean }
defineOptions({ name: 'Steps' })
const props = withDefaults(defineProps<{ active?: number; items?: readonly StepItem[]; direction?: 'horizontal' | 'vertical'; clickable?: boolean; disabled?: boolean; processStatus?: StepStatus; ariaLabel?: string; beforeChange?: AsyncGuard<number> }>(), { items: () => [], direction: 'horizontal', clickable: false, disabled: undefined, processStatus: 'process', ariaLabel: '' })
const emit = defineEmits<{ (event: 'update:active' | 'change', index: number): void; (event: 'error', error: unknown, index: number): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref(0)
const STEP_ICON_SIZE = 18
const current = computed(() => {
  const active = props.active ?? internal.value
  if (!Number.isInteger(active)) throw new RangeError('[scq-vue] Steps active must be a finite integer.')
  return Math.max(0, Math.min(props.items.length, active))
})
const status = (item: StepItem, index: number): StepStatus => item.status ?? (index < current.value ? 'finish' : index === current.value ? props.processStatus : 'wait')
const guard = useAsyncGuard(() => props.beforeChange, (error, index) => emit('error', error, index))
const stepsRef = ref<HTMLElement>()
useContentFocus(() => stepsRef.value, () => guard.pending.value || isDisabled.value || !props.clickable)
const select = (index: number) => {
  if (!props.clickable || isDisabled.value || !props.items[index] || props.items[index].disabled) return
  void guard.run(index, () => { internal.value = index; emit('update:active', index); emit('change', index) })
}
watch(() => props.active, guard.cancel, { flush: 'sync' })
watch(() => props.items, guard.cancel, { deep: true, flush: 'sync' })
watch([isDisabled, () => props.clickable], ([disabled, clickable]) => { if (disabled || !clickable) guard.cancel() }, { flush: 'sync' })
defineExpose({ pending: guard.pending, cancelPending: guard.cancel })
</script>