<template>
  <div class="collapse-example">
    <ScqSwitch v-model="accordion" active-text="手风琴模式" inactive-text="多面板展开" />
    <ScqCollapse v-model="opened" :accordion="accordion">
      <ScqCollapseItem name="delivery" title="何时可以收到更新？"><p>新版本发布后会推送至工作区，你可以在设置中选择通知方式。</p></ScqCollapseItem>
      <ScqCollapseItem name="contact" title="如何修改联系邮箱？" lazy><ScqInput v-model="email" aria-label="联系邮箱" placeholder="name@example.com" /></ScqCollapseItem>
      <ScqCollapseItem name="archived" title="已归档的申请" disabled><p>此申请已归档。</p></ScqCollapseItem>
    </ScqCollapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScqCollapse, ScqCollapseItem, ScqInput, ScqSwitch, type CollapseValue } from '../../../../src/index'

const opened = ref<CollapseValue>(['delivery'])
const accordion = ref(false)
const email = ref('')
</script>

<style scoped>
.collapse-example { display: grid; gap: 16px; width: 100%; max-width: 620px; padding: 12px; box-sizing: border-box; }
.collapse-example .scq-input { min-width: 0; max-width: 100%; }
</style>