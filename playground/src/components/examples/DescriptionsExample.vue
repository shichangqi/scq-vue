<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqDescriptions from '../../../../src/components/Descriptions'
import ScqForm from '../../../../src/components/Form'
import ScqFormItem from '../../../../src/components/FormItem'
import ScqInput from '../../../../src/components/Input'
import ScqTag from '../../../../src/components/Tag'
import ScqTypography from '../../../../src/components/Typography'
import type { DescriptionFormatter, DescriptionItem, FormRules } from '../../../../src/index'

const COLUMNS = { xs: 1, md: 2, xl: 3 } as const
const LABEL_WIDTH = 96
const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' })
const editing = ref(false)
const profile = reactive({ owner: '林一', address: '浙江省杭州市西湖区文三路 18 号 A 座 402' })
const draft = reactive({ ...profile })
const rules: FormRules = {
  owner: [{ required: true, whitespace: true, message: '请输入负责人', trigger: 'blur' }],
  address: [{ required: true, whitespace: true, message: '请输入交付地址', trigger: 'blur' }],
}
const formatValue: DescriptionFormatter = (value) => typeof value === 'boolean' ? (value ? '是' : '否') : value
const items = computed<DescriptionItem[]>(() => [
  { key: 'order', label: '订单编号', value: 'SCQ-20261022', labelAlign: 'end' },
  { key: 'owner', label: '负责人', value: profile.owner },
  { key: 'status', label: '当前状态', value: 'confirmed' }, { key: 'count', label: '文件数量', value: 12 },
  { key: 'renew', label: '自动续费', value: false },
  { key: 'cost', label: '费用', value: 0, formatter: (value) => typeof value === 'number' ? currency.format(value) : value },
  { key: 'invoice', label: '发票抬头', value: null },
  { key: 'address', label: '交付地址', value: profile.address, span: COLUMNS.xl },
])
const contactItems: readonly DescriptionItem[] = [
  { key: 'phone', label: '联系电话', value: '138****5678' },
  { key: 'email', label: '联系邮箱', value: 'l***@example.com' },
  { key: 'notes', label: '交付备注', value: '工作日请在到达前联系收件人，周末交付需提前预约。纸质资料与电子文件分别整理，外包装注明订单编号。交付完成后核对文件数量，并由负责人确认回执；如现场临时调整地址，请通过订单留言更新信息。', span: COLUMNS.xl },
]
const beginEdit = () => { Object.assign(draft, profile); editing.value = true }
const save = (valid: boolean) => {
  if (!valid) return
  Object.assign(profile, draft)
  editing.value = false
}
</script>

<template>
  <div class="descriptions-example">
    <ScqForm v-if="editing" :model="draft" :rules="rules" label-position="top" focus-on-error @submit="save">
      <ScqFormItem label="负责人" prop="owner"><ScqInput v-model="draft.owner" /></ScqFormItem>
      <ScqFormItem label="交付地址" prop="address"><ScqInput v-model="draft.address" type="textarea" /></ScqFormItem>
      <div class="descriptions-example__actions">
        <ScqButton native-type="submit" type="primary">保存</ScqButton>
        <ScqButton @click="editing = false">取消</ScqButton>
      </div>
    </ScqForm>
    <ScqDescriptions v-else title="订单详情" :items="items" :columns="COLUMNS" :label-width="LABEL_WIDTH" :formatter="formatValue" empty-text="未填写" border>
      <template #extra><ScqButton size="small" @click="beginEdit">编辑资料</ScqButton></template>
      <template #order="{ displayValue }"><ScqTypography code copyable>{{ displayValue }}</ScqTypography></template>
      <template #status><ScqTag type="success">已确认</ScqTag></template>
    </ScqDescriptions>
    <ScqDescriptions class="descriptions-example__contact" title="联系与交付" :items="contactItems" :columns="COLUMNS" direction="vertical" border>
      <template #phone="{ displayValue }"><ScqTypography copyable :copy-text="String(displayValue)">{{ displayValue }}</ScqTypography></template>
      <template #email="{ displayValue }"><ScqTypography copyable :copy-text="String(displayValue)">{{ displayValue }}</ScqTypography></template>
      <template #notes="{ displayValue }"><ScqTypography as="p" :lines="1" expandable>{{ displayValue }}</ScqTypography></template>
    </ScqDescriptions>
  </div>
</template>

<style scoped>
.descriptions-example { display: grid; gap: 24px; min-width: 0; width: 100%; }
.descriptions-example__actions { display: flex; flex-wrap: wrap; gap: 12px; }
</style>