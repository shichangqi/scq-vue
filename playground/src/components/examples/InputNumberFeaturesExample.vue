<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqInputNumber from '../../../../src/components/InputNumber'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { min: 0, max: 10, step: 0.25, precision: 2, initial: 2.5, sizes: ['small', 'default', 'large'] } as const
const input = ref<InstanceType<typeof ScqInputNumber>>()
const value = ref<number | undefined>(CONFIG.initial)
const controls = ref(false)
const readonly = ref(false)
const event = ref('清空输入后绑定值为 undefined')
</script>

<template>
  <ExampleSection title="精度、无按钮输入与只读" description="输入超出范围的数字后失焦，会限制到边界；可用方向键步进。无效输入通过 invalid 事件反馈。">
    <template #controls>
      <ScqCheckbox v-model="controls">显示步进按钮</ScqCheckbox>
      <ScqCheckbox v-model="readonly">只读</ScqCheckbox>
    </template>
    <ScqInputNumber ref="input" v-model="value" :min="CONFIG.min" :max="CONFIG.max" :step="CONFIG.step" :precision="CONFIG.precision" :controls="controls" :readonly="readonly" placeholder="输入数量" aria-label="数量" @change="event = `change: ${$event}`" @invalid="(_value, reason) => event = `invalid: ${reason}`" @focus="event = 'focus'" @blur="event = 'blur'" />
    <ScqSpace wrap>
      <ScqInputNumber v-for="size in CONFIG.sizes" :key="size" :size="size" :model-value="value" readonly :aria-label="`${size} 只读数量`" />
      <ScqButton @click="input?.focus()">聚焦数量</ScqButton>
    </ScqSpace>
    <output role="status">{{ event }} · 值：{{ value === undefined ? 'undefined' : value }}</output>
  </ExampleSection>
</template>
