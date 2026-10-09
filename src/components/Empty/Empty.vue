<template>
  <div class="scq-empty">
    <div class="scq-empty__image" :style="{ width: `${imageSize}px`, height: `${imageSize}px` }">
      <slot name="image"><img v-if="image" :src="image" alt="" /><Icon v-else name="inbox" :size="imageSize * 0.65" /></slot>
    </div>
    <div class="scq-empty__description"><slot name="description">{{ description || text('empty') }}</slot></div>
    <div v-if="$slots.default" class="scq-empty__actions"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'
defineOptions({ name: 'Empty' })
withDefaults(defineProps<{ description?: string; image?: string; imageSize?: number }>(), { description: '', image: '', imageSize: 90 })
const text = useLocale()
</script>