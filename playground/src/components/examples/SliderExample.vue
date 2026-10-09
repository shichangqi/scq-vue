<script setup lang="ts">
import { ref } from 'vue'
import { ScqSlider, ScqSwitch, type SliderValue } from '../../../../src/index'

const volume = ref<SliderValue>(35)
const range = ref<SliderValue>([20, 75])
const sensitivity = ref<SliderValue>(.3)
const disabled = ref(false)
</script>

<template>
  <div class="slider-example"><label class="slider-example__lock"><ScqSwitch v-model="disabled" aria-label="锁定设置" />锁定设置</label><label>音量<ScqSlider v-model="volume" :disabled="disabled" aria-label="音量" :format="value => `${value}%`" /></label><label>价格区间<ScqSlider v-model="range" range :disabled="disabled" :marks="{ 0: '0', 50: '50', 100: '100' }" aria-label="价格区间" /></label><label>灵敏度<ScqSlider v-model="sensitivity" :min="0" :max="1" :step=".1" :disabled="disabled" aria-label="灵敏度" /></label></div>
</template>

<style scoped>
.slider-example { display: grid; gap: 20px; max-width: 520px; }
.slider-example > label { display: block; color: var(--scq-text); font-size: 13px; }
.slider-example .slider-example__lock { display: flex; align-items: center; gap: 8px; }
</style>