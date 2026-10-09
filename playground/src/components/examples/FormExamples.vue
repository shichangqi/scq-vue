<template>
  <div class="form-example">
    <scq-switch v-if="secondary" v-model="disabled" :active-text="label('表单已禁用', 'Form disabled')" :inactive-text="label('表单可编辑', 'Form enabled')" class="form-example__toggle" />
    <scq-form ref="formRef" :model="model" :rules="rules" :disabled="disabled" :label-position="secondary ? 'top' : 'right'" :label-width="84" @submit="submit">
      <scq-form-item prop="name" :label="label('姓名', 'Name')" :for-id="`${id}-name`"><scq-input :id="`${id}-name`" v-model="model.name" :placeholder="label('输入姓名', 'Enter your name')" clearable /></scq-form-item>
      <scq-form-item v-if="!secondary" prop="email" :label="label('邮箱', 'Email')" :for-id="`${id}-email`"><scq-input :id="`${id}-email`" v-model="model.email" type="email" placeholder="name@example.com" /></scq-form-item>
      <scq-form-item v-if="!secondary" prop="notifications" :label="label('通知', 'Notify')"><scq-switch v-model="model.notifications" :aria-label="label('消息通知', 'Notifications')" /></scq-form-item>
      <scq-form-item><scq-space><template v-if="!secondary"><scq-button type="primary" native-type="submit">{{ label('保存', 'Save') }}</scq-button><scq-button @click="reset">{{ label('重置', 'Reset') }}</scq-button></template><template v-else><scq-button type="primary" @click="validateName">{{ label('校验姓名', 'Validate name') }}</scq-button><scq-button @click="formRef?.clearValidate()">{{ label('清除校验', 'Clear errors') }}</scq-button></template></scq-space></scq-form-item>
    </scq-form>
    <p v-if="result" class="form-example__result" :class="{ 'is-success': validResult }" role="status">{{ result }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from '../../../../src/components/Form'
import { useComponentId } from '../../../../src/utils/id'
import { locale } from '../../i18n'
const props = defineProps<{ variant?: string }>()
const secondary = computed(() => props.variant === 'states')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const id = useComponentId('example-form')
const formRef = ref<FormInstance>()
const model = reactive({ name: '', email: '', notifications: true })
const disabled = ref(false)
const result = ref('')
const validResult = ref(false)
const rules = computed<FormRules>(() => ({ name: { required: true, message: label('请输入姓名', 'Name is required'), trigger: 'blur' }, email: [{ required: true, message: label('请输入邮箱', 'Email is required') }, { type: 'email', message: label('请输入有效邮箱', 'Enter a valid email'), trigger: 'blur' }] }))
const submit = (valid: boolean) => { validResult.value = valid; result.value = valid ? label('设置已保存', 'Settings saved') : label('请检查表单字段', 'Please check the form fields') }
const reset = async () => { await formRef.value?.resetFields(); result.value = '' }
const validateName = async () => { submit(await formRef.value?.validateField('name') ?? false) }
</script>

<style scoped>
.form-example { max-width: 560px; margin: 0 auto; padding: 16px 8px 0; }
.form-example__toggle { margin-bottom: 20px; }
.form-example__result { color: #e45656; font-size: 13px; }
.form-example__result.is-success { color: #16833a; }
</style>