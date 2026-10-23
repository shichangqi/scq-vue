<template>
  <div class="scq-nav-bar-wrapper" :class="{ 'is-fixed': fixed, 'has-safe-area': safeAreaInsetTop }" :style="fixed && barHeight ? { height: `${barHeight}px` } : undefined">
    <header ref="barRef" class="scq-nav-bar" :class="{ 'is-fixed': fixed, 'has-border': border }">
      <div ref="leftRef" class="scq-nav-bar__left"><slot name="left" :back="back" :pending="pending" :disabled="leftBlocked"><button v-if="leftArrow || leftText" type="button" :disabled="leftBlocked || pending" :aria-busy="pending || leftLoading || undefined" :aria-label="leftText || text('back')" @click="back"><Loading v-if="pending || leftLoading" :size="ICON_SIZE" /><Icon v-else-if="leftArrow" name="chevronLeft" :size="ICON_SIZE" /><span v-if="leftText">{{ leftText }}</span></button></slot></div>
      <div class="scq-nav-bar__title"><slot name="title">{{ title }}</slot></div>
      <div ref="rightRef" class="scq-nav-bar__right"><slot name="right" :click="rightClick" :disabled="rightBlocked"><button v-if="rightText || rightIcon" type="button" :disabled="rightBlocked" :aria-busy="rightLoading || undefined" :aria-label="rightText || rightLabel || text('actions')" @click="rightClick"><Loading v-if="rightLoading" :size="ICON_SIZE" /><Icon v-else-if="rightIcon" :name="rightIcon" :size="ICON_SIZE" /><span v-if="rightText">{{ rightText }}</span></button></slot></div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import type { IconName } from '../Icon/icons'
import { useConfig, useLocale } from '../ConfigProvider/context'
import { useAsyncGuard, type AsyncGuard } from '../../utils/async'
import { useElementHeight } from '../../utils/element-height'
import { useContentFocus } from '../../utils/focus'
export interface NavBarProps { title?: string; leftText?: string; rightText?: string; leftArrow?: boolean; rightIcon?: IconName; rightLabel?: string; fixed?: boolean; border?: boolean; safeAreaInsetTop?: boolean; beforeBack?: AsyncGuard<MouseEvent>; disabled?: boolean; leftDisabled?: boolean; rightDisabled?: boolean; leftLoading?: boolean; rightLoading?: boolean }
const ICON_SIZE = 20
defineOptions({ name: 'NavBar' })
const props = withDefaults(defineProps<NavBarProps>(), { title: '', leftText: '', rightText: '', leftArrow: false, rightLabel: '', fixed: false, border: true, safeAreaInsetTop: false, disabled: undefined, leftDisabled: false, rightDisabled: false, leftLoading: false, rightLoading: false })
const emit = defineEmits<{ (event: 'click-left' | 'click-right', value: MouseEvent): void; (event: 'error', error: unknown): void }>()
const text = useLocale()
const config = useConfig()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const leftBlocked = computed(() => isDisabled.value || props.leftDisabled || props.leftLoading)
const rightBlocked = computed(() => isDisabled.value || props.rightDisabled || props.rightLoading)
const guard = useAsyncGuard(() => props.beforeBack, error => emit('error', error))
const pending = guard.pending
watch([leftBlocked, () => props.beforeBack], guard.cancel, { flush: 'sync' })
const back = (event: MouseEvent) => { if (!leftBlocked.value) void guard.run(event, () => emit('click-left', event)) }
const rightClick = (event: MouseEvent) => { if (!rightBlocked.value) emit('click-right', event) }
const barRef = ref<HTMLElement>()
const leftRef = ref<HTMLElement>()
const rightRef = ref<HTMLElement>()
useContentFocus(() => leftRef.value, () => leftBlocked.value || pending.value)
useContentFocus(() => rightRef.value, () => rightBlocked.value)
const barHeight = useElementHeight(barRef)
defineExpose({ pending, cancelPending: guard.cancel })
</script>