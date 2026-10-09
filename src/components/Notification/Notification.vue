<template>
  <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="teleport === false || !mounted">
    <Transition name="scq-notification" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <section v-if="visible" class="scq-notification" :class="[`scq-notification--${type}`, `scq-notification--${position}`]" :role="type === 'error' ? 'alert' : 'status'" :style="style" @mouseenter="pause" @mouseleave="resume" @focusin="pause" @focusout="focusOut" @click="click">
        <Icon :name="icon || (type === 'success' ? 'check' : type === 'error' ? 'close' : 'info')" :size="24" class="scq-notification__icon" />
        <div class="scq-notification__content"><strong v-if="title || $slots.title" class="scq-notification__title"><slot name="title">{{ title }}</slot></strong><div class="scq-notification__message"><slot>{{ message }}</slot></div><div v-if="$slots.actions" class="scq-notification__actions"><slot name="actions" /></div></div>
        <button v-if="showClose" class="scq-notification__close" type="button" :aria-label="text('close')" @click.stop="close"><Icon name="close" :size="16" /></button>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useLocale, useThemeStyle } from '../ConfigProvider/context'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
defineOptions({ name: 'Notification' })
const props = withDefaults(defineProps<{ modelValue?: boolean; title?: string; message?: string; type?: NotificationType; position?: NotificationPosition; duration?: number; offset?: number; showClose?: boolean; closeOnClick?: boolean; icon?: IconName; teleport?: boolean | string; zIndex?: number }>(), { modelValue: false, title: '', message: '', type: 'info', position: 'top-right', duration: 4500, offset: 16, showClose: true, closeOnClick: false, teleport: true, zIndex: 4000 })
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'open' | 'opened' | 'close' | 'closed'): void; (event: 'click', value: MouseEvent): void }>()
const mounted = ref(false)
const visible = computed(() => mounted.value && props.modelValue)
const text = useLocale()
const themeStyle = useThemeStyle()
const style = computed<CSSProperties>(() => ({ ...themeStyle.value, zIndex: props.zIndex, [props.position.startsWith('top') ? 'top' : 'bottom']: `${Math.max(0, props.offset)}px`, [props.position.endsWith('left') ? 'left' : 'right']: '16px' }))
let timer: ReturnType<typeof setTimeout> | undefined
let remaining = props.duration
let started = 0
let requested = false
let hovered = false
let focused = false
const stop = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined }
const close = () => {
  if (!visible.value || requested) return
  requested = true
  stop()
  emit('update:modelValue', false)
  emit('close')
}
const schedule = () => { stop(); if (visible.value && !requested && !hovered && !focused && props.duration > 0) { started = Date.now(); timer = setTimeout(close, Math.max(0, remaining)) } }
const pause = (event: Event) => {
  if (!hovered && !focused && timer !== undefined) remaining = Math.max(0, remaining - (Date.now() - started))
  if (event.type === 'mouseenter') hovered = true
  else focused = true
  stop()
}
const resume = () => { hovered = false; schedule() }
const focusOut = (event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) { focused = false; schedule() } }
const click = (event: MouseEvent) => { emit('click', event); if (props.closeOnClick) close() }
watch(visible, (value) => { requested = false; remaining = props.duration; hovered = false; focused = false; if (value) emit('open'); schedule() })
watch(() => [props.duration, props.message, props.title], () => { remaining = props.duration; schedule() })
onMounted(() => { mounted.value = true })
onBeforeUnmount(stop)
defineExpose({ close })
</script>