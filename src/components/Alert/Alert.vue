<template>
  <div v-if="visible" class="scq-alert" :class="`scq-alert--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    <Icon v-if="showIcon" :name="type === 'success' ? 'check' : 'info'" :size="20" class="scq-alert__icon" />
    <div class="scq-alert__content"><div v-if="title || $slots.title" class="scq-alert__title"><slot name="title">{{ title }}</slot></div><div v-if="description || $slots.default" class="scq-alert__description"><slot>{{ description }}</slot></div></div>
    <button v-if="closable" type="button" class="scq-alert__close" :aria-label="text('close')" @click="close"><Icon name="close" /></button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'
defineOptions({ name: 'Alert' })
withDefaults(defineProps<{ title?: string; description?: string; type?: 'success' | 'info' | 'warning' | 'error'; closable?: boolean; showIcon?: boolean }>(), { title: '', description: '', type: 'info', closable: true, showIcon: true })
const emit = defineEmits<{ (event: 'close', value: MouseEvent): void }>()
const visible = ref(true)
const text = useLocale()
const close = (event: MouseEvent) => { visible.value = false; emit('close', event) }
</script>