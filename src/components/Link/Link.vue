<template>
  <component :is="href ? 'a' : 'button'" class="scq-link" :class="[`scq-link--${type}`, { 'is-disabled': isDisabled, 'has-underline': underline }]" :href="isDisabled ? undefined : safeHref(href)" :type="href ? undefined : 'button'" :disabled="href ? undefined : isDisabled" :aria-disabled="isDisabled || undefined" :tabindex="isDisabled ? -1 : undefined" :target="target" :rel="target === '_blank' ? 'noopener noreferrer' : undefined" @click="click"><Icon v-if="icon" :name="icon" :size="16" /><slot /></component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useConfig } from '../ConfigProvider/context'
import { safeHref } from '../../utils/link'

defineOptions({ name: 'Link' })
const props = withDefaults(defineProps<{ href?: string; target?: '_self' | '_blank' | '_parent' | '_top'; type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'; disabled?: boolean; underline?: boolean; icon?: IconName }>(), { href: '', target: '_self', type: 'default', disabled: undefined, underline: true })
const emit = defineEmits<{ (event: 'click', value: MouseEvent): void }>()
const config = useConfig()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const click = (event: MouseEvent) => { if (isDisabled.value || (props.href && !safeHref(props.href))) { event.preventDefault(); event.stopPropagation(); return }; emit('click', event) }
</script>