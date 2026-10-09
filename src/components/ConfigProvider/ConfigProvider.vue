<template>
  <div class="scq-config-provider" :class="{ 'scq-theme-dark': theme === 'dark' }" :style="tokenStyle"><slot /></div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { configKey, getThemeStyle, useConfig, type ComponentLocale, type ComponentSize, type ThemeTokens } from './context'

defineOptions({ name: 'ConfigProvider' })
const props = withDefaults(defineProps<{
  size?: ComponentSize
  locale?: ComponentLocale
  disabled?: boolean
  theme?: 'light' | 'dark'
  tokens?: ThemeTokens
}>(), { disabled: undefined })
const parent = useConfig()
const resolved = computed(() => ({
  size: props.size ?? parent.value.size,
  locale: props.locale ?? parent.value.locale,
  disabled: props.disabled ?? parent.value.disabled,
  theme: props.theme ?? parent.value.theme,
  tokens: { ...parent.value.tokens, ...props.tokens },
}))
provide(configKey, resolved)
const tokenStyle = computed(() => getThemeStyle(resolved.value))
</script>