<template>
  <div class="scq-nav-bar-wrapper" :class="{ 'is-fixed': fixed, 'has-safe-area': safeAreaInsetTop }">
    <header class="scq-nav-bar" :class="{ 'is-fixed': fixed, 'has-border': border }">
      <div class="scq-nav-bar__left"><slot name="left"><button v-if="leftArrow || leftText" type="button" :aria-label="leftText || text('back')" @click="emit('click-left', $event)"><Icon v-if="leftArrow" name="chevronLeft" :size="20" /><span v-if="leftText">{{ leftText }}</span></button></slot></div>
      <div class="scq-nav-bar__title"><slot name="title">{{ title }}</slot></div>
      <div class="scq-nav-bar__right"><slot name="right"><button v-if="rightText || rightIcon" type="button" :aria-label="rightText || rightLabel" @click="emit('click-right', $event)"><Icon v-if="rightIcon" :name="rightIcon" :size="20" /><span v-if="rightText">{{ rightText }}</span></button></slot></div>
    </header>
  </div>
</template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import { useLocale } from '../ConfigProvider/context'
defineOptions({ name: 'NavBar' })
withDefaults(defineProps<{ title?: string; leftText?: string; rightText?: string; leftArrow?: boolean; rightIcon?: IconName; rightLabel?: string; fixed?: boolean; border?: boolean; safeAreaInsetTop?: boolean }>(), { title: '', leftText: '', rightText: '', leftArrow: false, rightLabel: 'Actions', fixed: false, border: true, safeAreaInsetTop: false })
const emit = defineEmits<{ (event: 'click-left' | 'click-right', value: MouseEvent): void }>()
const text = useLocale()
</script>