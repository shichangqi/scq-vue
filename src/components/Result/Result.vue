<template><section class="scq-result" :class="`scq-result--${status}`" role="status"><div class="scq-result__icon"><slot name="icon"><strong v-if="['403', '404', '500'].includes(status)" class="scq-result__code">{{ status }}</strong><Icon v-else :name="status === 'success' ? 'check' : status === 'error' ? 'close' : 'info'" :size="42" /></slot></div><h2 v-if="title || $slots.title" class="scq-result__title"><slot name="title">{{ title }}</slot></h2><p v-if="subtitle || $slots.subtitle" class="scq-result__subtitle"><slot name="subtitle">{{ subtitle }}</slot></p><div v-if="$slots.default" class="scq-result__content"><slot /></div><div v-if="$slots.extra" class="scq-result__extra"><slot name="extra" /></div></section></template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
export type ResultStatus = 'success' | 'warning' | 'error' | 'info' | '403' | '404' | '500'
defineOptions({ name: 'Result' })
withDefaults(defineProps<{ status?: ResultStatus; title?: string; subtitle?: string }>(), { status: 'info', title: '', subtitle: '' })
</script>