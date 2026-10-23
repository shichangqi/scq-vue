<template>
  <div v-if="visible" class="scq-alert" :class="`scq-alert--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    <template v-if="showIcon"><slot name="icon"><Icon :name="type === 'success' ? 'check' : 'info'" :size="ICON_SIZE" class="scq-alert__icon" /></slot></template>
    <div class="scq-alert__content"><div v-if="title || $slots.title" class="scq-alert__title"><slot name="title">{{ title }}</slot></div><div v-if="description || $slots.default" class="scq-alert__description"><slot>{{ description }}</slot></div><div v-if="$slots.actions" class="scq-alert__actions"><slot name="actions" /></div></div>
    <button v-if="closable" type="button" class="scq-alert__close" :class="{ 'has-text': closeText }" :aria-label="closeText || text('close')" @click="close"><template v-if="closeText">{{ closeText }}</template><Icon v-else name="close" /></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'
defineOptions({ name: 'Alert' })
export interface AlertProps { modelValue?: boolean; title?: string; description?: string; type?: 'success' | 'info' | 'warning' | 'error'; closable?: boolean; showIcon?: boolean; closeText?: string }
const ICON_SIZE = 20
const props = withDefaults(defineProps<AlertProps>(), { modelValue: undefined, title: '', description: '', type: 'info', closable: true, showIcon: true, closeText: '' })
const emit = defineEmits<{ (event: 'close', value: MouseEvent): void; (event: 'update:modelValue', value: boolean): void }>()
const dismissed = ref(false)
const visible = computed(() => props.modelValue ?? !dismissed.value)
watch(() => props.modelValue, (value) => { if (value === true) dismissed.value = false })
const text = useLocale()
const close = (event: MouseEvent) => { if (!visible.value || dismissed.value) return; dismissed.value = true; emit('update:modelValue', false); emit('close', event) }
</script>