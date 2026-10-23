<template>
  <h2 id="on-demand">{{ label('按需引入', 'On-demand Import') }}</h2>
  <p>{{ label('在 Vue 单文件组件中导入所需组件及其样式即可使用，无需 app.use 全局注册。组件样式会自动加载公共主题变量和内部依赖样式。', 'Import the components and their styles directly in a Vue single-file component without global app.use registration. Component styles automatically include shared theme variables and internal dependency styles.') }}</p>
  <DocExample :code="example.code" :files="example.files" lang="vue"><slot /></DocExample>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DocExample from './DocExample.vue'
import { createOnDemandExample } from '../docs/on-demand'
import { locale } from '../i18n'

const props = defineProps<{ code: string; files?: Record<string, string> }>()
const example = computed(() => createOnDemandExample(props))
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
</script>
