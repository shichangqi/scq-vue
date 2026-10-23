<script setup lang="ts">
import { ref } from 'vue'
import ScqInput from '../../../../src/components/Input'

defineProps<{ label: string }>()
const draft = ref('')
</script>

<template>
  <ScqInput v-model="draft" :aria-label="label" placeholder="输入组件内部草稿" />
</template>
