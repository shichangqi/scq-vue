<template>
  <component :is="as" class="scq-typography" :class="[`scq-typography--${type}`, { 'is-bold': bold, 'is-italic': italic, 'is-underline': underline, 'is-code': code, 'is-mark': mark, 'is-ellipsis': ellipsis, 'is-clamped': lines > 0 }]" :style="{ fontSize: typeof size === 'number' ? `${size}px` : size, '--scq-typography-lines': lines }"><span ref="contentRef" class="scq-typography__content"><slot>{{ content }}</slot></span><button v-if="copyable" type="button" class="scq-typography__copy" :aria-label="text(copied ? 'copied' : 'copy')" :title="text(copied ? 'copied' : 'copy')" @click="copy"><Icon :name="copied ? 'check' : 'copy'" :size="15" /></button></component>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useLocale } from '../ConfigProvider/context'

defineOptions({ name: 'Typography' })
const props = withDefaults(defineProps<{ as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; content?: string; type?: 'default' | 'secondary' | 'primary' | 'success' | 'warning' | 'danger'; size?: number | string; bold?: boolean; italic?: boolean; underline?: boolean; code?: boolean; mark?: boolean; ellipsis?: boolean; lines?: number; copyable?: boolean; copyText?: string }>(), { as: 'span', content: '', type: 'default', bold: false, italic: false, underline: false, code: false, mark: false, ellipsis: false, lines: 0, copyable: false })
const emit = defineEmits<{ (event: 'copy', value: string): void; (event: 'copy-error', error: unknown): void }>()
const text = useLocale()
const contentRef = ref<HTMLElement>()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let disposed = false
const copy = async () => {
  const value = props.copyText ?? contentRef.value?.textContent ?? props.content
  try {
    if (!navigator.clipboard) throw new Error('Clipboard API requires a secure context')
    await navigator.clipboard.writeText(value)
    if (disposed) return
    copied.value = true
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => { copied.value = false }, 2000)
    emit('copy', value)
  } catch (error) { if (!disposed) emit('copy-error', error) }
}
onBeforeUnmount(() => { disposed = true; if (timer !== undefined) clearTimeout(timer) })
</script>