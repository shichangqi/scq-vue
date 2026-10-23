<script setup lang="ts">
import { reactive, ref } from 'vue'
import ScqConfigProvider from '../../../../src/components/ConfigProvider'
import ScqDateTimePicker from '../../../../src/components/DateTimePicker'
import ScqSwitch from '../../../../src/components/Switch'
import ScqForm, { FormItem as ScqFormItem, type FormInstance } from '../../../../src/components/Form'
import ScqButton from '../../../../src/components/Button'
import type { ComponentSize, DateTimePickerValue } from '../../../../src/index'

const SIZES: ComponentSize[] = ['small', 'default', 'large']
const THEME = { primary: '#8b5cf6' }
const value = ref<DateTimePickerValue>('')
const englishValue = ref<DateTimePickerValue>('')
const locked = ref(false)
const formRef = ref<FormInstance>()
const formModel = reactive<{ appointment: DateTimePickerValue }>({ appointment: '' })
const formDisabled = ref(false)
</script>

<template>
  <div class="datetime-states-example">
    <label v-for="size in SIZES" :key="size">
      {{ size }}
      <ScqDateTimePicker v-model="value" :size="size" :aria-label="`${size} 日期时间`" />
    </label>
    <label>禁用<ScqDateTimePicker :model-value="value" disabled aria-label="禁用日期时间" /></label>
    <label>只读<ScqDateTimePicker :model-value="value" readonly aria-label="只读日期时间" /></label>
    <label>不可清空<ScqDateTimePicker v-model="value" :clearable="false" aria-label="不可清空日期时间" /></label>
  </div>
  <label class="datetime-states-example__toggle"><ScqSwitch v-model="locked" aria-label="全局禁用选择器" />通过 ConfigProvider 统一禁用</label>
  <ScqConfigProvider :disabled="locked" size="large">
    <ScqDateTimePicker v-model="value" aria-label="继承全局配置" />
  </ScqConfigProvider>
  <ScqConfigProvider locale="en-US" theme="dark" :tokens="THEME" class="datetime-states-example__theme">
    <label>English · Dark theme<ScqDateTimePicker v-model="englishValue" seconds /></label>
  </ScqConfigProvider>
  <p class="datetime-states-example__hint">上方尺寸与状态示例共享绑定值。可使用 ↓ 打开，方向键选择日期/时间，范围标签支持 ← / → 切换，Escape 放弃草稿。</p>
  <section class="datetime-states-example__form">
    <label class="datetime-states-example__toggle"><ScqSwitch v-model="formDisabled" aria-label="禁用预约表单" />表单级禁用（即使选择器显式 disabled=false）</label>
    <ScqForm ref="formRef" :model="formModel" :disabled="formDisabled" show-error-summary focus-on-error>
      <ScqFormItem prop="appointment" label="预约时间" help="确认后才提交；取消保留原值。" :rules="{ required: true, message: '请选择预约时间', trigger: 'blur' }">
        <ScqDateTimePicker v-model="formModel.appointment" :disabled="false" name="appointment" />
      </ScqFormItem>
      <ScqButton native-type="submit">校验预约</ScqButton>
      <ScqButton @click="formRef?.resetFields()">重置预约</ScqButton>
    </ScqForm>
    <p class="datetime-states-example__hint">已修改：{{ formRef?.state.dirty ? '是' : '否' }}；已离开字段：{{ formRef?.state.touched ? '是' : '否' }}</p>
  </section>
</template>

<style scoped>
.datetime-states-example { display: flex; flex-wrap: wrap; align-items: end; gap: 20px; }
.datetime-states-example label, .datetime-states-example__theme label { display: flex; flex-direction: column; gap: 8px; max-width: 100%; font-size: 13px; }
.datetime-states-example__toggle { display: flex; align-items: center; gap: 8px; margin: 20px 0 12px; color: var(--scq-text); font-size: 13px; }
.datetime-states-example__theme { margin-top: 20px; padding: 16px; background: var(--scq-surface); border-radius: var(--scq-radius); }
.datetime-states-example__hint { color: var(--scq-muted); font-size: 13px; line-height: 1.7; }
</style>
