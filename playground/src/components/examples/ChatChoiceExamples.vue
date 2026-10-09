<template>
  <div class="chat-choice-example"><scq-chat-choice v-model="answer" :mode="secondary ? 'multiple' : 'single'" :options="options" :allow-other="secondary" :max="secondary ? 3 : undefined" :other-label="label('其他', 'Other')" :other-placeholder="label('输入其他内容', 'Enter another option')" :submit-text="label('确认', 'Confirm')" :required-message="label('请至少选择一项', 'Choose at least one option')" :other-required-message="label('请输入其他内容', 'Enter custom text')" @submit="submitted = $event" /><pre v-if="submitted" class="code" role="status">{{ JSON.stringify(submitted, null, 2) }}</pre></div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { locale } from '../../i18n'
import type { ChatChoiceAnswer } from '../../../../src/components/ChatChoice'
const props = defineProps<{ variant?: string }>()
const secondary = computed(() => props.variant === 'states')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const answer = ref<ChatChoiceAnswer>({ values: [] })
const submitted = ref<ChatChoiceAnswer>()
const options = computed(() => secondary.value ? [{ value: 'design', label: label('设计', 'Design') }, { value: 'frontend', label: label('前端', 'Frontend') }] : [{ value: 'online', label: label('线上沟通', 'Online') }, { value: 'offline', label: label('线下见面', 'In person') }])
</script>

<style scoped>
.chat-choice-example { max-width: 520px; padding: 10px; }
</style>