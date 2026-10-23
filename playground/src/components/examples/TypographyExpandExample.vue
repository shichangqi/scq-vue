<script setup lang="ts">
import { computed, ref } from 'vue'
import ScqTypography from '../../../../src/components/Typography'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ExampleSection from '../ExampleSection.vue'

const COLLAPSED_LINES = 2
const EXAMPLE_TEXT = {
  full: '设计阶段已经完成，研发与质量保障正在并行推进。交付内容包括需求说明、设计稿、接口协议和验收记录。评审通过后会同步至项目空间，并通知所有相关成员。展开可以查看完整说明；复制始终取得完整内容，不包含展开、收起或复制按钮的文案。',
  short: '评审已经通过。',
  path: '项目资料 / 2026 / 第四季度 / 交付评审 / 产品与研发联合评审记录 / 最终归档版本',
} as const
const expanded = ref(false)
const shortContent = ref(false)
const copyResult = ref('')
const content = computed(() => shortContent.value ? EXAMPLE_TEXT.short : EXAMPLE_TEXT.full)
const reportCopy = (value: string) => { copyResult.value = `已复制完整内容（${value.length} 字符）` }
const reportCopyError = () => { copyResult.value = '复制失败：请确认浏览器允许访问剪贴板，或手动选择文本复制。' }
</script>

<template>
  <ExampleSection class="typography-expand-example" title="文本展开与复制" subtitle="Expandable typography">
    <template #controls>
      <ScqCheckbox v-model="expanded">从外部控制展开</ScqCheckbox>
      <ScqCheckbox v-model="shortContent">使用短内容</ScqCheckbox>
    </template>
    <ScqTypography
      v-model:expanded="expanded"
      as="p"
      :lines="COLLAPSED_LINES"
      :content="content"
      expandable
      copyable
      @copy="reportCopy"
      @copy-error="reportCopyError"
    />
    <ScqTypography as="p" type="secondary">
      下方的单行示例由组件自身管理展开状态；仅在实际溢出时显示展开入口和完整文本提示。
    </ScqTypography>
    <ScqTypography ellipsis expandable copyable class="typography-expand-example__path" @copy="reportCopy" @copy-error="reportCopyError">
      <strong>归档路径：</strong>{{ EXAMPLE_TEXT.path }}
    </ScqTypography>
    <p class="typography-expand-example__result" role="status">{{ copyResult }}</p>
  </ExampleSection>
</template>

<style scoped>
.typography-expand-example { max-width: 520px; }
.typography-expand-example__path { width: 360px; max-width: 100%; }
.typography-expand-example__result { margin: 0; min-height: 1.5em; color: var(--scq-muted); font-size: 13px; }
</style>
