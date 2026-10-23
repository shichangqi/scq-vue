<script setup lang="ts">
import { reactive, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqForm from '../../../../src/components/Form'
import ScqFormItem from '../../../../src/components/FormItem'
import ScqInput from '../../../../src/components/Input'
import ScqSelect from '../../../../src/components/Select'
import ScqSpace from '../../../../src/components/Space'
import ScqCheckbox from '../../../../src/components/Checkbox'
import type { FormInstance, FormRules, SelectValue } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const VALIDATION_DELAY = 150
const form = ref<FormInstance>()
const model = reactive<{ name: string; confirmation: string; role: SelectValue | null }>({ name: '', confirmation: '', role: null })
const options = [{ label: 'Editor', value: 'editor' }, { label: 'Reader', value: 'reader' }]
const result = ref('')
const customSummary = ref(false)
const rules: FormRules = {
  name: { required: true, message: '请输入名称 / Name is required' },
  confirmation: [
    { required: true, message: '请再次输入 / Confirm the name' },
    { asyncValidator: (_rule, value, _callback, source) => value === source.name ? Promise.resolve() : Promise.reject(new Error('内容不一致 / Names do not match')) },
  ],
  role: { required: true, message: '请选择角色 / Choose a role' },
}
const submitted = (valid: boolean) => { result.value = valid ? '校验通过 / Valid' : '请检查字段 / Review the fields' }
</script>

<template>
  <ExampleSection title="字段校验与表单状态" subtitle="Form validation &amp; state">
    <template #controls><ScqCheckbox v-model="customSummary">自定义错误摘要</ScqCheckbox></template>
    <ScqForm ref="form" :model="model" :rules="rules" show-error-summary focus-on-error scroll-to-error label-position="top" @submit="submitted">
    <template v-if="customSummary" #error-summary="{ errors, focusError }"><p>请处理以下 {{ errors.length }} 项问题：</p><ScqButton v-for="error in errors" :key="error.id" text @click="focusError(error)">{{ error.label }}：{{ error.error }}</ScqButton></template>
    <ScqFormItem prop="name" label="名称 / Name" help="请输入名称，并在下一项中再次输入以确认 / Enter a name, then repeat it below to confirm"><ScqInput v-model="model.name" clearable /></ScqFormItem>
    <ScqFormItem prop="confirmation" label="再次输入 / Confirmation" :dependencies="['name']" :validate-debounce="VALIDATION_DELAY"><ScqInput v-model="model.confirmation" /><template #help>名称变化后，会重新校验两次输入是否一致。</template></ScqFormItem>
    <ScqFormItem prop="role" label="角色 / Role"><ScqSelect v-model="model.role" :options="options" /></ScqFormItem>
      <ScqSpace>
        <ScqButton native-type="submit" type="primary">校验 / Validate</ScqButton>
        <ScqButton @click="form?.resetFields()">重置 / Reset</ScqButton>
        <ScqButton @click="form?.focusField('name')">聚焦姓名</ScqButton>
        <ScqButton @click="result = JSON.stringify(form?.getFieldState('name'))">读取姓名状态</ScqButton>
      </ScqSpace>
    </ScqForm>
    <p role="status">{{ result }}</p>
    <pre class="form-protocol-example__state">{{ form?.state }}</pre>
  </ExampleSection>
</template>

<style scoped>
.form-protocol-example__state { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; }
</style>
