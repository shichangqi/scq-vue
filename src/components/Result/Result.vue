<template><section class="scq-result" :class="[`scq-result--${resolvedStatus}`, `scq-result--${size}`]" role="status"><div class="scq-result__icon"><slot name="icon"><strong v-if="CODE_STATUSES.includes(resolvedStatus)" class="scq-result__code">{{ resolvedStatus }}</strong><Icon v-else :name="resolvedStatus === 'success' ? 'check' : resolvedStatus === 'error' ? 'close' : 'info'" :size="ICON_SIZE" /></slot></div><h2 v-if="displayTitle || $slots.title" class="scq-result__title"><slot name="title">{{ displayTitle }}</slot></h2><p v-if="displaySubtitle || $slots.subtitle" class="scq-result__subtitle"><slot name="subtitle">{{ displaySubtitle }}</slot></p><div v-if="$slots.default" class="scq-result__content"><slot /></div><div v-if="$slots.extra" class="scq-result__extra"><slot name="extra" /></div></section></template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale, type LocaleKey } from '../ConfigProvider/context'
export type ResultStatus = 'success' | 'warning' | 'error' | 'info' | '403' | '404' | '500'
export interface ResultProps { status?: ResultStatus; title?: string; subtitle?: string; preset?: boolean; size?: 'default' | 'small' | 'full' }
const ICON_SIZE = 42
const CODE_STATUSES: readonly ResultStatus[] = ['403', '404', '500']
const PRESETS = {
	success: ['resultSuccess', 'resultSaved'], warning: ['resultWarning', 'resultReview'], error: ['resultError', 'resultRetry'], info: ['resultInfo', 'resultPending'],
	'403': ['result403', 'resultContact'], '404': ['result404', 'resultUnavailable'], '500': ['result500', 'resultRetry'],
} satisfies Record<ResultStatus, [LocaleKey, LocaleKey]>
defineOptions({ name: 'Result' })
const props = withDefaults(defineProps<ResultProps>(), { status: 'info', preset: false, size: 'default' })
const text = useLocale()
const resolvedStatus = computed(() => {
  if (typeof props.status !== 'string' || !Object.hasOwn(PRESETS, props.status)) throw new RangeError('[scq-vue] Unknown Result status.')
  return props.status
})
const displayTitle = computed(() => props.title ?? (props.preset ? text(PRESETS[resolvedStatus.value][0]) : ''))
const displaySubtitle = computed(() => props.subtitle ?? (props.preset ? text(PRESETS[resolvedStatus.value][1]) : ''))
</script>