<template>
  <div class="scq-rate" :class="{ 'is-disabled': isDisabled, 'is-readonly': readonly }" role="slider" :tabindex="isDisabled ? -1 : 0" :aria-label="ariaLabel || text('rating')" aria-valuemin="0" :aria-valuemax="count" :aria-valuenow="value" :aria-valuetext="texts[Math.ceil(value) - 1] || String(value)" :aria-disabled="isDisabled" :aria-readonly="readonly" :style="{ '--scq-rate-color': color }" @keydown="keydown" @mouseleave="hover = undefined">
    <button v-for="star in count" :key="star" type="button" tabindex="-1" aria-hidden="true" :disabled="isDisabled || readonly" @mousemove="preview($event, star)" @click="choose(pointerValue($event, star))"><Icon name="star" :size="size" /><span class="scq-rate__fill" :style="{ width: `${Math.max(0, Math.min(1, (hover ?? value) - star + 1)) * 100}%` }"><Icon name="star" :size="size" /></span></button>
    <span v-if="showText" class="scq-rate__text">{{ texts[Math.ceil(hover ?? value) - 1] || (hover ?? value) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale } from '../ConfigProvider/context'

defineOptions({ name: 'Rate' })
const props = withDefaults(defineProps<{ modelValue?: number; max?: number; allowHalf?: boolean; clearable?: boolean; readonly?: boolean; disabled?: boolean; size?: number; color?: string; showText?: boolean; texts?: string[]; ariaLabel?: string }>(), { max: 5, allowHalf: false, clearable: true, readonly: false, disabled: undefined, size: 24, color: 'var(--scq-warning)', showText: false, texts: () => [], ariaLabel: '' })
const emit = defineEmits<{ (event: 'update:modelValue' | 'change' | 'hover-change', value: number): void }>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const count = computed(() => Math.max(1, Math.min(20, Number.isFinite(props.max) ? Math.floor(props.max) : 5)))
const internal = ref(0)
const value = computed(() => Math.max(0, Math.min(count.value, Number.isFinite(props.modelValue ?? internal.value) ? props.modelValue ?? internal.value : 0)))
const hover = ref<number>()
const pointerValue = (event: MouseEvent, star: number) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return props.allowHalf && rect.width && event.clientX - rect.left < rect.width / 2 ? star - .5 : star
}
const preview = (event: MouseEvent, star: number) => {
  if (isDisabled.value || props.readonly) return
  hover.value = pointerValue(event, star)
  emit('hover-change', hover.value)
}
const choose = (next: number, toggle = true) => {
  if (isDisabled.value || props.readonly) return
  const result = props.clearable && toggle && next === value.value ? 0 : Math.max(0, Math.min(count.value, next))
  internal.value = result
  emit('update:modelValue', result)
  emit('change', result)
}
const keydown = (event: KeyboardEvent) => {
  const step = props.allowHalf ? .5 : 1
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? count.value : ['ArrowRight', 'ArrowUp'].includes(event.key) ? value.value + step : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? value.value - step : undefined
  if (next !== undefined) { event.preventDefault(); choose(next, false) }
}
</script>