<script setup lang="ts">
import { reactive, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqForm from '../../../../src/components/Form'
import ScqFormItem from '../../../../src/components/FormItem'
import ScqInput from '../../../../src/components/Input'
import ScqSelect from '../../../../src/components/Select'
import ScqSpace from '../../../../src/components/Space'
import type { FormInstance, FormRules, SelectValue } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const VALIDATION_DELAY = 150
const form = ref<FormInstance>()
const model = reactive<{ name: string; confirmation: string; role: SelectValue | null }>({ name: '', confirmation: '', role: null })
const options = [{ label: 'Editor', value: 'editor' }, { label: 'Reader', value: 'reader' }]
const result = ref('')
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
    <ScqForm ref="form" :model="model" :rules="rules" show-error-summary focus-on-error label-position="top" @submit="submitted">
    <ScqFormItem prop="name" label="名称 / Name" help="请输入名称，并在下一项中再次输入以确认 / Enter a name, then repeat it below to confirm"><ScqInput v-model="model.name" clearable /></ScqFormItem>
    <ScqFormItem prop="confirmation" label="再次输入 / Confirmation" :dependencies="['name']" :validate-debounce="VALIDATION_DELAY"><ScqInput v-model="model.confirmation" /></ScqFormItem>
    <ScqFormItem prop="role" label="角色 / Role"><ScqSelect v-model="model.role" :options="options" /></ScqFormItem>
      <ScqSpace>
        <ScqButton native-type="submit" type="primary">校验 / Validate</ScqButton>
        <ScqButton @click="form?.resetFields()">重置 / Reset</ScqButton>
      </ScqSpace>
    </ScqForm>
    <p role="status">{{ result }}</p>
    <pre class="form-protocol-example__state">{{ form?.state }}</pre>
  </ExampleSection>
</template>

<style scoped>
.form-protocol-example__state { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; }
</style>
