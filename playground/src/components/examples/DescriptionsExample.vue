<script setup lang="ts">
import { ScqDescriptions, ScqTag, ScqTypography, type DescriptionItem } from '../../../../src/index'

const items: DescriptionItem[] = [
  { key: 'order', label: '订单编号', value: 'SCQ-20261009' }, { key: 'owner', label: '负责人', value: '林一' },
  { key: 'status', label: '当前状态', value: 'confirmed' }, { key: 'count', label: '文件数量', value: 12 },
  { key: 'date', label: '创建日期', value: '2026-10-09' }, { key: 'cost', label: '费用', value: 0 },
  { key: 'address', label: '交付地址', value: '浙江省杭州市西湖区文三路 18 号 A 座 402', span: 3 },
]
</script>

<template><ScqDescriptions title="订单详情" :items="items" :columns="3" border><template #order="{ item }"><ScqTypography code copyable>{{ item.value }}</ScqTypography></template><template #status><ScqTag type="success">已确认</ScqTag></template></ScqDescriptions></template>