<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqIcon from '../../../../src/components/Icon'
import ScqInput from '../../../../src/components/Input'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { maxlength: 80, minlength: 2, sizes: ['small', 'default', 'large'], statuses: ['default', 'success', 'warning', 'error'] } as const
const input = ref<InstanceType<typeof ScqInput>>()
const value = ref('scq-vue')
const description = ref('输入多行内容，观察高度与字数变化。')
const disabled = ref(false)
const readonly = ref(false)
const event = ref('尚未编辑')
</script>

<template>
  <ExampleSection title="组合输入与实例方法" description="前后置内容使用插槽；focus、select、clear 和 blur 操作同一个输入框。readonly 保留阅读和选中能力，disabled 禁止交互。">
    <template #controls>
      <ScqCheckbox v-model="disabled">禁用</ScqCheckbox>
      <ScqCheckbox v-model="readonly">只读</ScqCheckbox>
    </template>
    <ScqInput ref="input" v-model="value" :disabled="disabled" :readonly="readonly" name="project" autocomplete="off" clearable @change="event = `change: ${$event}`" @clear="event = 'clear'" @focus="event = 'focus'" @blur="event = 'blur'">
      <template #prepend>https://</template>
      <template #prefix><ScqIcon name="link" /></template>
      <template #suffix><ScqIcon name="check" /></template>
      <template #append>.example</template>
    </ScqInput>
    <ScqSpace wrap>
      <ScqButton @click="input?.focus()">聚焦</ScqButton>
      <ScqButton @click="input?.select()">全选</ScqButton>
      <ScqButton @click="input?.clear()">清空</ScqButton>
      <ScqButton @click="input?.blur()">失焦</ScqButton>
    </ScqSpace>
    <output role="status">{{ event }} · {{ value }}</output>
  </ExampleSection>
  <ExampleSection title="尺寸、状态与自适应文本域">
    <ScqInput v-for="size in CONFIG.sizes" :key="size" :size="size" :placeholder="size" :aria-label="`${size} 输入框`" />
    <ScqInput v-for="status in CONFIG.statuses" :key="status" :status="status" :model-value="status" :aria-label="`${status} 状态`" />
    <ScqInput v-model="description" type="textarea" autosize show-word-limit :maxlength="CONFIG.maxlength" :minlength="CONFIG.minlength" :disabled="disabled" :readonly="readonly" aria-label="项目描述" />
  </ExampleSection>
</template>
