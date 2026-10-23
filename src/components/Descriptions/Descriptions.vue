<template>
	<section class="scq-descriptions" :class="{ 'is-bordered': border, 'is-vertical': direction === 'vertical', 'is-responsive': responsiveColumns }">
		<header v-if="title || $slots.title || $slots.extra" class="scq-descriptions__header">
			<strong><slot name="title">{{ title }}</slot></strong>
			<slot name="extra" />
		</header>
		<dl class="scq-descriptions__list" :style="listStyle">
			<div v-for="({ item, displayValue }, index) in entries" :key="item.key ?? index" class="scq-descriptions__item" :style="itemStyle(item)">
				<dt><slot :name="`label-${item.key ?? index}`" :item="item" :index="index">{{ item.label }}</slot></dt>
				<dd><slot :name="String(item.key ?? index)" :item="item" :index="index" :value="item.value" :display-value="displayValue">{{ displayValue }}</slot></dd>
			</div>
		</dl>
		<div v-if="!items.length" class="scq-descriptions__empty"><slot name="empty">{{ text('empty') }}</slot></div>
	</section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../ConfigProvider/context'
import { isResponsiveValue, resolveResponsiveValue, toCssLength, useLayoutBreakpoint, type ResponsiveValue } from '../../utils/layout'
import { DESCRIPTIONS_DEFAULTS, DESCRIPTIONS_MIN_COUNT } from './constants'

export type DescriptionValue = string | number | boolean | null | undefined
export type DescriptionFormatter = (value: DescriptionValue, item: DescriptionItem, index: number) => DescriptionValue
export interface DescriptionItem {
	key?: string | number
	label: string
	value?: DescriptionValue
	span?: number
	labelWidth?: number | string
	labelAlign?: 'start' | 'center' | 'end'
	formatter?: DescriptionFormatter
}
export interface DescriptionsProps {
	items?: readonly DescriptionItem[]
	title?: string
	columns?: ResponsiveValue<number>
	border?: boolean
	direction?: 'horizontal' | 'vertical'
	labelWidth?: number | string
	labelAlign?: 'start' | 'center' | 'end'
	emptyText?: string
	formatter?: DescriptionFormatter
}

defineOptions({ name: 'Descriptions' })
const props = withDefaults(defineProps<DescriptionsProps>(), {
	...DESCRIPTIONS_DEFAULTS, items: () => [],
})
const text = useLocale()
const responsiveColumns = computed(() => isResponsiveValue(props.columns))
const breakpoint = useLayoutBreakpoint(() => undefined, () => responsiveColumns.value)
const normalizeCount = (value: number) => Number.isFinite(value) ? Math.max(DESCRIPTIONS_MIN_COUNT, Math.floor(value)) : DESCRIPTIONS_MIN_COUNT
const columnCount = computed(() => normalizeCount(resolveResponsiveValue(props.columns, breakpoint.value, DESCRIPTIONS_MIN_COUNT)))
const listStyle = computed(() => ({
	'--scq-descriptions-columns': columnCount.value,
	'--scq-descriptions-label-width': toCssLength(props.labelWidth),
	'--scq-descriptions-label-align': props.labelAlign,
}))
const itemStyle = (item: DescriptionItem) => ({
	'--scq-descriptions-span': Math.min(columnCount.value, normalizeCount(item.span ?? DESCRIPTIONS_MIN_COUNT)),
	'--scq-descriptions-label-width': item.labelWidth === undefined ? undefined : toCssLength(item.labelWidth),
	'--scq-descriptions-label-align': item.labelAlign,
})
const entries = computed(() => props.items.map((item, index) => {
	const formatter = item.formatter ?? props.formatter
	const formatted = formatter ? formatter(item.value, item, index) : item.value
	return { item, displayValue: formatted ?? props.emptyText }
}))
</script>