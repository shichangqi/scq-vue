<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqChatChoice from '../../../../src/components/ChatChoice'
import type { ChatChoiceAnswer, ChatChoiceOption } from '../../../../src/components/ChatChoice'
import ExampleSection from '../ExampleSection.vue'

const LIMITS = { min: 2, max: 3, otherMaxlength: 20 }
const OPTIONS: ChatChoiceOption[] = [
  { value: 'design', label: '设计', description: '界面与交互' },
  { value: 'code', label: '开发', description: '组件与应用' },
  { value: 'test', label: '测试', description: '质量保障' },
  { value: 'archived', label: '归档', disabled: true },
]
const choice = ref<InstanceType<typeof ScqChatChoice>>()
const answer = ref<ChatChoiceAnswer>({ values: [] })
const disabled = ref(false)
const loading = ref(false)
const submitted = ref(false)
const customFooter = ref(true)
const status = ref('至少选择两项，最多选择三项；其他内容也占一个选项。')
const submit = (value: ChatChoiceAnswer) => { submitted.value = true; status.value = `提交成功：${JSON.stringify(value)}` }
</script>

<template>
  <ExampleSection title="校验、提交状态与插槽">
    <template #controls>
      <ScqCheckbox v-model="disabled">禁用</ScqCheckbox>
      <ScqCheckbox v-model="loading">加载中</ScqCheckbox>
      <ScqCheckbox v-model="customFooter">自定义底部</ScqCheckbox>
    </template>
    <ScqChatChoice ref="choice" v-model="answer" mode="multiple" :options="OPTIONS" :min="LIMITS.min" :max="LIMITS.max" :other-maxlength="LIMITS.otherMaxlength" allow-other other-required required :disabled="disabled" :loading="loading" :submitted="submitted" loading-text="正在保存" submitted-text="已保存" @submit="submit" @validation-error="error => status = `${error.type}: ${error.message}`">
      <template #option="{ option, selected }">{{ selected ? '✓ ' : '' }}{{ option.label }} <small>{{ option.description }}</small></template>
      <template #other-label="{ selected }">其他技能{{ selected ? '（请填写）' : '' }}</template>
      <template v-if="customFooter" #footer="{ submit: confirm, disabled: unavailable, validationMessage }">
        <ScqButton :disabled="unavailable" :loading="loading" @click="confirm">{{ submitted ? '已保存' : '确认技能' }}</ScqButton>
        <p v-if="validationMessage" role="alert">{{ validationMessage }}</p>
      </template>
    </ScqChatChoice>
    <ScqButton @click="choice?.validate()">仅校验</ScqButton>
    <ScqButton @click="submitted = false; answer = { values: [] }; status = '已重置'">重置选择</ScqButton>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>
