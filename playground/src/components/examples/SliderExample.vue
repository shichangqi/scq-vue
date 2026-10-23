<script setup lang="ts">
import { ref } from 'vue'
import ScqSlider from '../../../../src/components/Slider'
import ScqSwitch from '../../../../src/components/Switch'
import ExampleSection from '../ExampleSection.vue'
import type { SliderValue } from '../../../../src/index'

const volume = ref<SliderValue>(35)
const range = ref<SliderValue>([20, 75])
const sensitivity = ref<SliderValue>(.3)
const disabled = ref(false)
const VERTICAL = { height: 180, min: 0, max: 100, step: 10 }
const vertical = ref<SliderValue>(40)
const event = ref('拖动时 input 连续触发，释放后 change 提交')
</script>

<template>
  <div class="slider-example"><label class="slider-example__lock"><ScqSwitch v-model="disabled" aria-label="锁定设置" />锁定设置</label><label>音量<ScqSlider v-model="volume" :disabled="disabled" aria-label="音量" :format="value => `${value}%`" /></label><label>价格区间<ScqSlider v-model="range" range :disabled="disabled" :marks="{ 0: '0', 50: '50', 100: '100' }" aria-label="价格区间" /></label><label>灵敏度<ScqSlider v-model="sensitivity" :min="0" :max="1" :step=".1" :disabled="disabled" aria-label="灵敏度" /></label></div>
  <ExampleSection title="垂直滑块与提交事件">
    <ScqSlider v-model="vertical" v-bind="VERTICAL" vertical :show-value="false" :disabled="disabled" aria-label="垂直音量" @input="event = `input: ${$event}`" @change="event = `change: ${$event}`" />
    <output role="status">{{ event }}</output>
  </ExampleSection>
</template>

<style scoped>
.slider-example { display: grid; gap: 20px; max-width: 520px; }
.slider-example > label { display: block; color: var(--scq-text); font-size: 13px; }
.slider-example .slider-example__lock { display: flex; align-items: center; gap: 8px; }
</style>