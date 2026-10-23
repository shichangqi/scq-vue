<script setup lang="ts">
import { ref } from 'vue'
import ScqCell from '../../../../src/components/Cell'
import ScqCellGroup from '../../../../src/components/CellGroup'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqIcon from '../../../../src/components/Icon'
import ScqTag from '../../../../src/components/Tag'
import ExampleSection from '../ExampleSection.vue'

const disabled = ref(false)
const bordered = ref(true)
const event = ref('链接示例拦截跳转，只显示目的地址')
</script>

<template>
  <ExampleSection title="链接、点击行为与内容插槽">
    <template #controls><ScqCheckbox v-model="disabled">禁用单元格</ScqCheckbox><ScqCheckbox v-model="bordered">显示分隔线</ScqCheckbox></template>
    <ScqCellGroup inset>
      <template #title>账号与服务</template>
      <template #description>组标题、说明和底部均可以自定义。</template>
      <ScqCell href="https://example.com/help" is-link :disabled="disabled" :border="bordered" @click.prevent="event = '目标：https://example.com/help'">
        <template #icon><ScqIcon name="info" /></template>
        <template #title>帮助中心</template>
        <template #label>此项使用原生链接语义</template>
        <template #extra><ScqTag size="small">外部链接</ScqTag></template>
      </ScqCell>
      <ScqCell clickable title="检查更新" :disabled="disabled" :border="bordered" @click="event = '已检查更新（本地演示）'">点击操作</ScqCell>
      <template #footer>禁用时链接与点击操作均不会执行。</template>
    </ScqCellGroup>
    <output role="status">{{ event }}</output>
  </ExampleSection>
</template>
