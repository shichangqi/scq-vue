<script setup lang="ts">
import { ref } from 'vue'
import { ScqLink } from '../../../../src/index'

const synced = ref(false)
</script>

<template><div class="link-example"><ScqLink href="https://vuejs.org/" target="_blank" type="primary">Vue 官方文档</ScqLink><ScqLink href="https://github.com/" target="_blank">GitHub</ScqLink><ScqLink type="success" @click="synced = true">同步状态</ScqLink><ScqLink disabled>已归档项目</ScqLink></div><p class="link-example__status" role="status">{{ synced ? '已同步' : '等待同步' }}</p></template>

<style scoped>
.link-example { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; }
.link-example__status { margin: 18px 0 0; color: var(--scq-muted); font-size: 13px; }
</style>