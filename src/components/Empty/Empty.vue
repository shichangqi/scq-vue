<template>
  <div class="scq-empty" :class="{ 'scq-empty--small': size === 'small' }">
    <div class="scq-empty__image" :style="{ width: imageLength, height: imageLength }">
      <slot name="image"><img v-if="source.available.value" ref="imageRef" :key="source.key.value" :data-image-key="source.key.value" :src="source.src.value" alt="" @load="source.loaded" @error="source.error" /><Icon v-else :name="resolvedPreset.icon" :size="Math.max(0, imageSize) * ICON_SCALE" /></slot>
    </div>
    <div v-if="$slots.description || resolvedDescription" class="scq-empty__description"><slot name="description">{{ resolvedDescription }}</slot></div>
    <div v-if="$slots.default" class="scq-empty__actions"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useLocale, type LocaleKey } from '../ConfigProvider/context'
import { useImageSource } from '../../utils/image-source'
import { toCssLength } from '../../utils/layout'
export interface EmptyProps { description?: string; image?: string; imageSize?: number; preset?: 'default' | 'search' | 'unconfigured'; size?: 'default' | 'small' }
const ICON_SCALE = 0.65
const PRESETS = { default: { icon: 'inbox', text: 'empty' }, search: { icon: 'search', text: 'emptySearch' }, unconfigured: { icon: 'settings', text: 'emptyUnconfigured' } } satisfies Record<string, { icon: IconName; text: LocaleKey }>
defineOptions({ name: 'Empty' })
const props = withDefaults(defineProps<EmptyProps>(), { description: undefined, image: '', imageSize: 90, preset: 'default', size: 'default' })
const emit = defineEmits<{ (event: 'load' | 'error', value: Event): void }>()
const text = useLocale()
const imageRef = ref<HTMLImageElement>()
const source = useImageSource(() => ({ src: props.image }), () => imageRef.value, event => emit('load', event), event => emit('error', event))
const resolvedPreset = computed(() => {
  if (!Object.hasOwn(PRESETS, props.preset)) throw new RangeError('[scq-vue] Unknown Empty preset.')
  return PRESETS[props.preset]
})
const resolvedDescription = computed(() => props.description ?? text(resolvedPreset.value.text))
const imageLength = computed(() => toCssLength(props.imageSize))
defineExpose({ retry: source.retry })
</script>