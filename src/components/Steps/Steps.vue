<template><ol class="scq-steps" :class="`scq-steps--${direction}`" :aria-label="ariaLabel || text('steps')"><li v-for="(item, index) in items" :key="index" class="scq-steps__item" :class="[`is-${status(item, index)}`, { 'is-disabled': item.disabled }]" :aria-current="index === current ? 'step' : undefined"><component :is="clickable ? 'button' : 'div'" :type="clickable ? 'button' : undefined" class="scq-steps__step" :disabled="clickable ? isDisabled || item.disabled : undefined" @click="select(index)"><span class="scq-steps__number" aria-hidden="true"><Icon v-if="item.icon" :name="item.icon" :size="18" /><Icon v-else-if="status(item, index) === 'finish'" name="check" :size="18" /><Icon v-else-if="status(item, index) === 'error'" name="close" :size="18" /><span v-else>{{ index + 1 }}</span></span><span class="scq-steps__content"><strong>{{ item.title }}</strong><span v-if="item.description" class="scq-steps__description">{{ item.description }}</span></span></component></li></ol></template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useConfig, useLocale } from '../ConfigProvider/context'

export type StepStatus = 'wait' | 'process' | 'finish' | 'error'
export interface StepItem { title: string; description?: string; icon?: IconName; status?: StepStatus; disabled?: boolean }
defineOptions({ name: 'Steps' })
const props = withDefaults(defineProps<{ active?: number; items?: StepItem[]; direction?: 'horizontal' | 'vertical'; clickable?: boolean; disabled?: boolean; processStatus?: StepStatus; ariaLabel?: string }>(), { items: () => [], direction: 'horizontal', clickable: false, disabled: undefined, processStatus: 'process', ariaLabel: '' })
const emit = defineEmits<{ (event: 'update:active' | 'change', index: number): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const internal = ref(0)
const current = computed(() => Math.max(0, Math.min(props.items.length, props.active ?? internal.value)))
const status = (item: StepItem, index: number): StepStatus => item.status ?? (index < current.value ? 'finish' : index === current.value ? props.processStatus : 'wait')
const select = (index: number) => { if (!props.clickable || isDisabled.value || props.items[index].disabled) return; internal.value = index; emit('update:active', index); emit('change', index) }
</script>