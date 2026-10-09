<template>
  <div class="overlay-example">
    <template v-if="kind === 'tooltip'"><scq-tooltip v-if="!secondary" :content="label('账号设置', 'Account settings')"><scq-button :aria-label="label('设置', 'Settings')"><scq-icon name="settings" :size="20" /></scq-button></scq-tooltip><scq-space v-else><scq-tooltip v-for="placement in placements" :key="placement" :placement="placement" :content="label('此处是提示内容', 'Contextual information')" trigger="click"><scq-button>{{ placement }}</scq-button></scq-tooltip></scq-space></template>
    <template v-else-if="kind === 'popover'"><scq-popover v-model="visible" :title="secondary ? label('导出', 'Export') : label('消息通知', 'Notifications')" :width="260" :aria-label="label('偏好设置', 'Preferences')"><template #reference><scq-button>{{ secondary ? label('导出', 'Export') : label('偏好设置', 'Preferences') }}</scq-button></template><scq-button v-if="secondary" type="primary" @click="completeExport">{{ label('完成', 'Done') }}</scq-button><scq-switch v-else v-model="enabled" :active-text="label('已开启', 'Enabled')" :inactive-text="label('已关闭', 'Disabled')" /></scq-popover><p v-if="notice" role="status">{{ notice }}</p></template>
    <template v-else-if="kind === 'drawer'"><scq-space><scq-button v-if="!secondary" type="primary" @click="visible = true">{{ label('编辑资料', 'Edit profile') }}</scq-button><scq-button v-for="placement in secondary ? placements : []" :key="placement" @click="openDrawer(placement)">{{ placement }}</scq-button></scq-space><scq-drawer v-model="visible" :position="position" :size="position === 'top' || position === 'bottom' ? 'auto' : 360" :title="label('个人资料', 'Profile')"><template v-if="!secondary"><label class="overlay-example__label" :for="inputId">{{ label('姓名', 'Name') }}</label><scq-input :id="inputId" v-model="name" /><scq-button class="overlay-example__more" @click="nested = true">{{ label('更多设置', 'More settings') }}</scq-button><scq-drawer v-model="nested" :title="label('更多设置', 'More settings')" :size="320"><scq-switch v-model="enabled" :active-text="label('消息通知已开启', 'Notifications enabled')" :inactive-text="label('消息通知已关闭', 'Notifications disabled')" /></scq-drawer></template><p v-else>{{ label('项目资料与偏好设置', 'Project details and preferences') }}</p><template #footer><scq-button @click="visible = false">{{ label('取消', 'Cancel') }}</scq-button><scq-button type="primary" @click="visible = false">{{ label('保存', 'Save') }}</scq-button></template></scq-drawer></template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DrawerPosition } from '../../../../src/components/Drawer'
import { useComponentId } from '../../../../src/utils/id'
import { locale } from '../../i18n'
const props = defineProps<{ kind: string; variant?: string }>()
const secondary = computed(() => props.variant === 'states')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const visible = ref(false)
const nested = ref(false)
const enabled = ref(true)
const name = ref('Ada')
const notice = ref('')
const position = ref<DrawerPosition>('right')
const placements: DrawerPosition[] = ['top', 'right', 'bottom', 'left']
const inputId = useComponentId('drawer-example-name')
const openDrawer = (placement: DrawerPosition) => { position.value = placement; visible.value = true }
const completeExport = () => { visible.value = false; notice.value = label('导出设置已确认', 'Export settings confirmed') }
</script>

<style scoped>
.overlay-example { padding: 18px 10px; }
.overlay-example__label { display: block; margin-bottom: 8px; font-size: 14px; }
.overlay-example__more { margin-top: 20px; }
</style>