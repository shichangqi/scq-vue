<template>
  <component :is="tag" class="scq-cell" :class="{ 'is-link': isLink || clickable || href, 'is-disabled': disabled, 'has-border': border }" :type="tag === 'button' ? 'button' : undefined" :href="tag === 'a' ? href : undefined" :disabled="tag === 'button' ? disabled : undefined" :aria-disabled="disabled || undefined" @click="handleClick">
    <span v-if="icon || $slots.icon" class="scq-cell__icon"><slot name="icon"><Icon v-if="icon" :name="icon" :size="20" /></slot></span>
    <span class="scq-cell__main"><span class="scq-cell__title"><slot name="title">{{ title }}</slot></span><span v-if="label || $slots.label" class="scq-cell__label"><slot name="label">{{ label }}</slot></span></span>
    <span v-if="value !== '' || $slots.default" class="scq-cell__value"><slot>{{ value }}</slot></span>
    <slot name="extra"><Icon v-if="isLink" name="chevronRight" class="scq-cell__arrow" /></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
defineOptions({ name: 'Cell' })
const props = withDefaults(defineProps<{ title?: string; value?: string | number; label?: string; icon?: IconName; href?: string; isLink?: boolean; clickable?: boolean; disabled?: boolean; border?: boolean }>(), { title: '', value: '', label: '', href: '', isLink: false, clickable: false, disabled: false, border: true })
const emit = defineEmits<{ (event: 'click', value: MouseEvent): void }>()
const tag = computed(() => props.href && !props.disabled ? 'a' : props.isLink || props.clickable || props.href ? 'button' : 'div')
const handleClick = (event: MouseEvent) => { if (props.disabled) event.preventDefault(); else emit('click', event) }
</script>