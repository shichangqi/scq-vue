<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqInput from '../../../../src/components/Input'
import ScqPopover from '../../../../src/components/Popover'
import ScqTooltip from '../../../../src/components/Tooltip'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { showDelay: 400, hideDelay: 200, width: 260 }
const tooltip = ref(false)
const popover = ref(false)
const disabled = ref(false)
const teleport = ref(true)
const event = ref('悬停提示，或用 Tab 聚焦气泡卡片的触发按钮')
</script>

<template>
  <ExampleSection title="受控显示、延迟与挂载位置">
    <template #controls><ScqCheckbox v-model="disabled">禁用</ScqCheckbox><ScqCheckbox v-model="teleport">挂载至 body</ScqCheckbox></template>
    <ScqTooltip v-model="tooltip" v-bind="CONFIG" :disabled="disabled" :teleport="teleport" placement="bottom" :shift-cross-axis="false" aria-label="延迟提示" @show="event = 'tooltip: show'" @hide="event = 'tooltip: hide'">
      <ScqButton>悬停查看延迟提示</ScqButton>
      <template #content><strong>自定义提示内容</strong> · 延迟 {{ CONFIG.showDelay }}ms</template>
    </ScqTooltip>
    <ScqPopover v-model="popover" v-bind="CONFIG" trigger="focus" placement="bottom-start" :disabled="disabled" :teleport="teleport" initial-focus=".floating-options-input input" title="键盘可交互内容" @show="event = 'popover: show'" @hide="event = 'popover: hide'">
      <template #reference><ScqButton>聚焦打开卡片</ScqButton></template>
      <ScqInput class="floating-options-input" aria-label="卡片备注" placeholder="输入备注；Escape 关闭" />
    </ScqPopover>
    <ScqButton :disabled="disabled" @click="tooltip = !tooltip">切换受控提示</ScqButton>
    <output role="status">{{ event }} · Tooltip: {{ tooltip }} · Popover: {{ popover }}</output>
  </ExampleSection>
</template>
