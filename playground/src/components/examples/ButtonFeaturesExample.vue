<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'

const SIZES = ['small', 'default', 'large'] as const
const loading = ref(false)
const mounted = ref(false)
const clicks = ref(0)
</script>

<template>
  <ExampleSection title="尺寸、加载文案与原生焦点" description="加载时按钮不触发点击；autofocus 在按钮挂载时生效。">
    <template #controls><ScqCheckbox v-model="loading">加载中</ScqCheckbox></template>
    <ScqSpace wrap><ScqButton v-for="size in SIZES" :key="size" :size="size" type="primary" :loading="loading" loading-text="保存中…" @click="clicks++">{{ size }}</ScqButton></ScqSpace>
    <ScqSpace wrap><ScqButton text bg>带背景的文字按钮</ScqButton><ScqButton @click="mounted = !mounted">切换自动聚焦按钮</ScqButton><ScqButton v-if="mounted" autofocus @click="clicks++">挂载后聚焦</ScqButton></ScqSpace>
    <output role="status">有效点击：{{ clicks }}</output>
  </ExampleSection>
</template>
