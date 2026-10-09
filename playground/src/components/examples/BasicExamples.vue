<template>
  <div class="component-demo">
    <template v-if="kind === 'config-provider'"><scq-config-provider v-if="!secondary" :tokens="{ primary: '#00875a' }" size="large"><scq-space><scq-switch v-model="enabled" :aria-label="label('消息通知', 'Notifications')" /><scq-input-number v-model="count" :aria-label="label('数量', 'Quantity')" /><scq-tag type="success">Ready</scq-tag></scq-space></scq-config-provider><scq-config-provider v-else theme="dark" locale="en-US" class="theme-demo"><scq-empty /></scq-config-provider></template>
    <scq-space v-else-if="kind === 'switch'"><template v-if="!secondary"><scq-switch v-model="enabled" :active-text="label('已开启', 'Enabled')" :inactive-text="label('已关闭', 'Disabled')" /></template><template v-else><scq-switch :model-value="true" size="small" aria-label="Small" /><scq-switch :model-value="true" aria-label="Default" /><scq-switch :model-value="true" size="large" aria-label="Large" /><scq-switch :model-value="true" loading :aria-label="label('加载中', 'Loading')" /><scq-switch disabled :aria-label="label('禁用', 'Disabled')" /></template></scq-space>
    <scq-space v-else-if="kind === 'input-number'"><scq-input-number v-if="!secondary" v-model="count" :min="0" :max="10" :aria-label="label('数量', 'Quantity')" /><template v-else><scq-input-number v-model="price" :step="0.1" :precision="2" :min="0" :aria-label="label('价格', 'Price')" /><scq-input-number :model-value="5" disabled :aria-label="label('禁用', 'Disabled')" /></template></scq-space>
    <template v-else-if="kind === 'space'"><scq-space v-if="!secondary" :size="16" wrap><scq-button type="primary">{{ label('保存', 'Save') }}</scq-button><scq-button>{{ label('取消', 'Cancel') }}</scq-button><scq-tag type="success">{{ label('就绪', 'Ready') }}</scq-tag></scq-space><scq-space v-else direction="vertical" align="stretch" fill :size="12"><scq-input :placeholder="label('姓名', 'Name')" /><scq-input :placeholder="label('邮箱', 'Email')" /></scq-space></template>
    <template v-else-if="kind === 'divider'"><template v-if="!secondary"><p>{{ label('账号信息', 'Account') }}</p><scq-divider content-position="left">{{ label('偏好设置', 'Preferences') }}</scq-divider><p>{{ label('消息通知', 'Notifications') }}</p></template><template v-else><span>{{ label('概览', 'Overview') }}</span><scq-divider direction="vertical" /><span>{{ label('动态', 'Activity') }}</span><scq-divider dashed /></template></template>
    <template v-else-if="kind === 'loading'"><scq-loading v-if="!secondary" :text="label('加载中', 'Loading')" /><template v-else><scq-switch v-model="busy" :active-text="label('加载中', 'Loading')" :inactive-text="label('已完成', 'Ready')" /><scq-loading :loading="busy" :text="label('加载中', 'Loading')"><div class="loading-demo-content"><p>{{ label('季度报告', 'Quarterly report') }}</p><scq-button>{{ label('导出', 'Export') }}</scq-button></div></scq-loading></template></template>
    <scq-empty v-else-if="kind === 'empty'" :description="secondary ? label('没有匹配的记录', 'No matching records') : ''"><scq-button v-if="secondary" type="primary" @click="emit('notify', label('筛选条件已重置', 'Filters reset'))">{{ label('重置筛选', 'Reset filters') }}</scq-button></scq-empty>
    <template v-else-if="kind === 'skeleton'"><scq-skeleton v-if="!secondary" :rows="4" avatar /><template v-else><scq-switch v-model="busy" :active-text="label('加载中', 'Loading')" :inactive-text="label('已完成', 'Ready')" /><scq-skeleton :loading="busy" class="skeleton-demo"><p>{{ label('内容已准备完成。', 'Content is ready.') }}</p></scq-skeleton></template></template>
    <scq-space v-else-if="kind === 'alert'" direction="vertical" align="stretch" fill><template v-if="!secondary"><scq-alert :title="label('保存成功', 'Saved')" type="success" /><scq-alert :title="label('请检查配置', 'Review required')" type="warning" /><scq-alert :title="label('连接失败', 'Connection failed')" type="error" /></template><scq-alert v-else :title="label('维护计划', 'Scheduled maintenance')" :description="label('周五 20:00 - 21:00', 'Friday, 20:00 - 21:00')" :closable="false" /></scq-space>
    <scq-space v-else-if="kind === 'tag'"><template v-if="!secondary"><scq-tag>Vue 3</scq-tag><scq-tag type="success">{{ label('已发布', 'Published') }}</scq-tag><scq-tag type="warning">{{ label('待审核', 'Pending') }}</scq-tag><scq-tag type="danger">{{ label('失败', 'Failed') }}</scq-tag></template><template v-else><scq-tag v-for="tag in tags" :key="tag" closable @close="tags = tags.filter(value => value !== tag)">{{ tag }}</scq-tag><scq-button v-if="!tags.length" size="small" @click="tags = ['Design', 'Frontend', 'Mobile']">{{ label('重置', 'Reset') }}</scq-button></template></scq-space>
    <scq-space v-else-if="kind === 'badge'" :size="32" class="badge-demo"><template v-if="!secondary"><scq-badge :value="12"><scq-button>{{ label('收件箱', 'Inbox') }}</scq-button></scq-badge><scq-badge :value="120"><scq-button>{{ label('任务', 'Tasks') }}</scq-button></scq-badge><scq-badge is-dot :label="label('有更新', 'Updates available')"><scq-icon name="settings" :size="24" /></scq-badge></template><template v-else><scq-badge :value="0" show-zero /><scq-badge value="NEW" type="success" /><scq-badge :value="8" type="primary" /></template></scq-space>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { locale } from '../../i18n'
const props = defineProps<{ kind: string; variant?: string }>()
const emit = defineEmits<{ (event: 'notify', message: string): void }>()
const secondary = computed(() => props.variant === 'states')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const enabled = ref(true)
const count = ref(3)
const price = ref(0.2)
const busy = ref(true)
const tags = ref(['Design', 'Frontend', 'Mobile'])
</script>

<style scoped>
.component-demo { min-width: 0; padding: 10px; }
.theme-demo { padding: 8px; background: var(--scq-surface); border-radius: 4px; }
.loading-demo-content { padding: 20px; min-height: 120px; }
.skeleton-demo { margin-top: 20px; }
.badge-demo { padding: 8px; }
</style>