<template>
  <span class="scq-tag" :class="[`scq-tag--${type}`, `scq-tag--${size || config.size}`, `scq-tag--${effect}`]"><span class="scq-tag__text"><slot /></span><button v-if="closable" type="button" class="scq-tag__close" :aria-label="text('close')" @click.stop="emit('close', $event)"><Icon name="close" :size="12" /></button></span>
</template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
defineOptions({ name: 'Tag' })
withDefaults(defineProps<{ type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'; size?: ComponentSize; effect?: 'light' | 'dark' | 'plain'; closable?: boolean }>(), { type: 'primary', effect: 'light', closable: false })
const emit = defineEmits<{ (event: 'close', value: MouseEvent): void }>()
const config = useConfig()
const text = useLocale()
</script>