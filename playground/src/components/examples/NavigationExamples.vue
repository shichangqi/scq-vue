<template>
  <div class="navigation-example">
    <scq-tabs v-if="kind === 'tabs'" v-model="active" :items="items" :direction="secondary ? 'vertical' : 'horizontal'" :lazy="secondary" :aria-label="label('项目视图', 'Project views')"><template #overview><scq-input v-if="secondary" v-model="draft" :placeholder="label('项目名称', 'Project name')" /><dl v-else class="project-facts"><div><dt>{{ label('项目', 'Project') }}</dt><dd>SCQ Design</dd></div><div><dt>{{ label('状态', 'Status') }}</dt><dd><scq-tag type="success">{{ label('进行中', 'Active') }}</scq-tag></dd></div></dl></template><template #activity><p>{{ label('今天 10:30：发布了新版本。', 'Today at 10:30: a new version was published.') }}</p></template></scq-tabs>
    <scq-pagination v-else-if="kind === 'pagination'" v-model="page" v-model:page-size="pageSize" :total="secondary ? 120 : 388" :page-sizes="secondary ? [10, 20, 50] : []" :simple="secondary" show-total />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { locale } from '../../i18n'
const props = defineProps<{ kind: string; variant?: string }>()
const secondary = computed(() => props.variant === 'states')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const active = ref('overview')
const page = ref(3)
const pageSize = ref(10)
const draft = ref('')
const items = computed(() => [{ name: 'overview', label: label('概览', 'Overview') }, { name: 'activity', label: label('动态', 'Activity') }, { name: 'locked', label: label('归档', 'Archive'), disabled: true }])
</script>

<style scoped>
.navigation-example { padding: 10px; min-width: 0; }
.project-facts { display: flex; gap: 40px; margin: 0; }
.project-facts dt { font-size: 12px; color: #909399; margin-bottom: 8px; }
.project-facts dd { margin: 0; font-size: 14px; }
</style>