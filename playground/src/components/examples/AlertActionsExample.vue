<script setup lang="ts">
import { ref } from 'vue'
import ScqAlert from '../../../../src/components/Alert'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqIcon from '../../../../src/components/Icon'
import ExampleSection from '../ExampleSection.vue'

const visible = ref(true)
const showIcon = ref(true)
const event = ref('尚未操作')
</script>

<template>
  <ExampleSection title="受控关闭与操作插槽">
    <template #controls><ScqCheckbox v-model="showIcon">显示图标</ScqCheckbox></template>
    <ScqAlert v-model="visible" type="warning" :show-icon="showIcon" close-text="暂不处理" @close="event = 'close：已关闭提醒'">
      <template #icon><ScqIcon name="settings" /></template>
      <template #title>尚未配置通知方式</template>
      保存配置后可以接收项目更新。
      <template #actions><ScqButton size="small" @click="event = '已选择配置通知'">配置通知</ScqButton></template>
    </ScqAlert>
    <ScqButton :disabled="visible" @click="visible = true; event = '已重新显示'">重新显示</ScqButton>
    <output role="status">{{ event }}</output>
  </ExampleSection>
</template>
