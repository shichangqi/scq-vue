<template>
  <div class="scq-loading" :class="{ 'has-content': $slots.default, 'is-loading': loading }" :aria-busy="loading">
    <div v-if="$slots.default" class="scq-loading__content" :inert="loading || undefined"><slot /></div>
    <div v-if="loading" class="scq-loading__indicator" role="status" :aria-label="text || localeText('loading')">
      <span class="scq-loading__spinner" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true"></span>
      <span v-if="text" class="scq-loading__text">{{ text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '../ConfigProvider/context'
defineOptions({ name: 'Loading' })
withDefaults(defineProps<{ loading?: boolean; text?: string; size?: number }>(), { loading: true, text: '', size: 24 })
const localeText = useLocale()
</script>