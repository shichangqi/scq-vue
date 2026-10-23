<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqChatMessage from '../../../../src/components/ChatMessage'
import type { ChatMessageSelection, ChatMessageSelectionValue } from '../../../../src/components/ChatMessage'
import ExampleSection from '../ExampleSection.vue'

const SELECTION: ChatMessageSelection = { title: '选择关注领域', mode: 'multiple', min: 1, max: 2, options: [{ value: 'design', label: '设计', description: '界面与交互' }, { value: 'code', label: '开发', description: '组件与工具' }] }
const CONTENT = '第一行\n第二行\n\n[示例链接](https://example.com)\n\n```ts\nconst message = "Hello"\n```'
const STATUS_TEXTS = { success: '内容已准备完成' }
const values = ref<ChatMessageSelectionValue[]>([])
const disabled = ref(false)
const breaks = ref(true)
const showName = ref(true)
const event = ref('尚未确认')
</script>

<template>
  <ExampleSection title="选择插槽与内容显示选项">
    <template #controls><ScqCheckbox v-model="disabled">禁用选择</ScqCheckbox><ScqCheckbox v-model="breaks">Markdown 换行</ScqCheckbox><ScqCheckbox v-model="showName">显示昵称</ScqCheckbox></template>
    <ScqChatMessage v-model:selection-values="values" :message="CONTENT" content-type="markdown" :markdown-breaks="breaks" name="SCQ Assistant" :show-name="showName" :show-time="false" :status="{ type: 'success' }" :status-texts="STATUS_TEXTS" :selection="SELECTION" :selection-disabled="disabled" link-target="_self" link-rel="nofollow" code-copy-text="复制示例" code-copied-text="已复制示例" code-copy-failed-text="复制失败，请手动选择" @selection-submit="payload => event = JSON.stringify(payload.values)">
      <template #selection-title="{ selection }"><strong>{{ selection.title }}（最多两项）</strong></template>
      <template #selection-option="{ option, selected }">{{ selected ? '✓ ' : '' }}{{ option.label }} · {{ option.description }}</template>
      <template #selection-actions="{ values: selected, disabled: unavailable, confirm }"><ScqButton :disabled="unavailable" @click="confirm">确认 {{ selected.length }} 项</ScqButton></template>
    </ScqChatMessage>
    <output role="status">{{ event }}</output>
  </ExampleSection>
</template>
