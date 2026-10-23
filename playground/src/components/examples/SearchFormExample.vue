<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqSearch from '../../../../src/components/Search'
import ExampleSection from '../ExampleSection.vue'

const MAX_LENGTH = 30
const keyword = ref('')
const disabled = ref(false)
const readonly = ref(false)
const status = ref('Enter 只搜索，不提交外部表单')
</script>

<template>
  <ExampleSection title="原生表单与自定义操作" description="Search 放进原生 form 时设置 nativeForm=false，避免嵌套 form。">
    <template #controls><ScqCheckbox v-model="disabled">禁用</ScqCheckbox><ScqCheckbox v-model="readonly">只读</ScqCheckbox></template>
    <form @submit.prevent="status = '外部表单已提交'">
      <ScqSearch v-model="keyword" :native-form="false" label="文档" name="query" shape="square" :maxlength="MAX_LENGTH" :disabled="disabled" :readonly="readonly" :clearable="true" show-action aria-label="搜索文档" @search="status = `搜索：${$event}`" @clear="status = '已清空'">
        <template #action><ScqButton size="small" :disabled="disabled || readonly" @click="keyword = ''; status = '筛选已重置'">重置</ScqButton></template>
      </ScqSearch>
      <ScqButton native-type="submit">提交外部表单</ScqButton>
    </form>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>
