<script setup lang="ts">
import { ref } from 'vue'
import ScqBadge from '../../../../src/components/Badge'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqInputNumber from '../../../../src/components/InputNumber'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { max: 9, initial: 12, offset: [4, -4], placements: ['top-right', 'top-left', 'bottom-right', 'bottom-left'] } as const
const count = ref<number | undefined>(CONFIG.initial)
const hidden = ref(false)
</script>

<template>
  <ExampleSection title="位置、偏移与自定义计数">
    <template #controls>
      <ScqCheckbox v-model="hidden">隐藏徽标</ScqCheckbox>
      <ScqInputNumber v-model="count" aria-label="未读数量" />
    </template>
    <ScqSpace size="xl" wrap>
      <ScqBadge v-for="placement in CONFIG.placements" :key="placement" :value="count" :max="CONFIG.max" :placement="placement" :offset="CONFIG.offset" :hidden="hidden" show-zero><ScqButton>{{ placement }}</ScqButton></ScqBadge>
    </ScqSpace>
    <ScqBadge :value="count" :max="CONFIG.max" :hidden="hidden" text="未读消息" live="polite" label="未读消息数量" show-zero>
      <template #content="{ displayValue }">{{ displayValue }} 条</template>
    </ScqBadge>
  </ExampleSection>
</template>
