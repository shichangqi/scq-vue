<script setup lang="ts">
import { ref } from 'vue'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqCheckboxGroup from '../../../../src/components/CheckboxGroup'
import ScqRadio from '../../../../src/components/Radio'
import ScqRadioGroup from '../../../../src/components/RadioGroup'
import ExampleSection from '../ExampleSection.vue'

const OPTIONS = [{ value: 'email', text: '邮件' }, { value: 'sms', text: '短信' }, { value: 'push', text: '推送' }]
const disabled = ref(false)
const radio = ref<string | number | boolean>('email')
const checked = ref<(string | number | boolean)[]>(['email'])
const event = ref('可使用键盘方向键切换单选，空格切换复选')
</script>

<template>
  <ExampleSection title="整组禁用、尺寸与变化事件">
    <template #controls><ScqCheckbox v-model="disabled">禁用整组</ScqCheckbox></template>
    <ScqRadioGroup v-model="radio" :disabled="disabled" name="notification-channel" aria-label="首选通知方式" @change="event = `radio: ${$event}`">
      <ScqRadio v-for="option in OPTIONS" :key="option.value" :value="option.value" :text="option.text" size="small" />
    </ScqRadioGroup>
    <ScqCheckboxGroup v-model="checked" :disabled="disabled" name="notification-channels" aria-label="启用通知方式" @change="event = `checkbox: ${JSON.stringify($event)}`">
      <ScqCheckbox v-for="option in OPTIONS" :key="option.value" :value="option.value" :text="option.text" size="large" />
    </ScqCheckboxGroup>
    <output role="status">{{ event }}</output>
  </ExampleSection>
</template>
