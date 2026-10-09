<template>
  <div class="scq-action-bar" :class="{ 'is-fixed': fixed, 'has-safe-area': safeArea }" :style="fixed ? { paddingBottom: `${barHeight}px` } : undefined">
    <div ref="barRef" class="scq-action-bar__content" role="toolbar" :aria-label="ariaLabel || text('actions')">
      <slot><button v-for="action in actions" :key="action.key" type="button" class="scq-action-bar__action" :class="`scq-action-bar__action--${action.type || 'default'}`" :disabled="isDisabled || action.disabled || action.loading" :aria-busy="action.loading || undefined" :title="action.label" @click="emit('click', action)"><Loading v-if="action.loading" :size="18" /><Badge v-else-if="action.icon" :value="action.badge"><Icon :name="action.icon" :size="action.type === 'icon' ? 22 : 18" /></Badge><span>{{ action.label }}</span></button></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import Loading from '../Loading/Loading.vue'
import Badge from '../Badge/Badge.vue'
import type { IconName } from '../Icon/icons'
import { useConfig, useLocale } from '../ConfigProvider/context'

export interface ActionBarItem { key: string | number; label: string; icon?: IconName; type?: 'icon' | 'default' | 'primary' | 'danger'; badge?: string | number; disabled?: boolean; loading?: boolean }
defineOptions({ name: 'ActionBar' })
const props = withDefaults(defineProps<{ actions?: ActionBarItem[]; fixed?: boolean; safeArea?: boolean; disabled?: boolean; ariaLabel?: string }>(), { actions: () => [], fixed: false, safeArea: true, disabled: undefined, ariaLabel: '' })
const emit = defineEmits<{ (event: 'click', action: ActionBarItem): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const barRef = ref<HTMLElement>()
const barHeight = ref(64)
let observer: ResizeObserver | undefined
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined' && barRef.value) {
    observer = new ResizeObserver(() => { barHeight.value = barRef.value?.getBoundingClientRect().height || 64 })
    observer.observe(barRef.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>