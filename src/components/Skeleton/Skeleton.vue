<template>
  <div v-if="loading" class="scq-skeleton" :class="{ 'is-animated': animated }" role="status" :aria-label="text('loading')" aria-busy="true">
    <slot name="template"><div v-if="avatar" class="scq-skeleton__avatar" aria-hidden="true"></div><div class="scq-skeleton__lines" aria-hidden="true"><div v-for="row in rowCount" :key="row" class="scq-skeleton__row"></div></div></slot>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../ConfigProvider/context'
defineOptions({ name: 'Skeleton' })
const props = withDefaults(defineProps<{ loading?: boolean; rows?: number; animated?: boolean; avatar?: boolean }>(), { loading: true, rows: 3, animated: true, avatar: false })
const rowCount = computed(() => Number.isFinite(props.rows) ? Math.max(0, Math.min(50, Math.floor(props.rows))) : 3)
const text = useLocale()
</script>