<template>
  <PhonePreview screen-id="notice-bar-preview">
    <div class="notice-example">
      <ScqNavBar title="系统消息" />
      <ScqNoticeBar v-if="!dismissed" type="info" text="你的资料已更新，所有设备将在下次登录时同步。" closable @close="dismissed = true" />
      <ScqNoticeBar text="系统将于本周五 22:00 至 23:00 进行维护，期间文件上传和云端同步将暂时不可用，请提前保存工作。" :wrap="false" scrollable :speed="35" :delay="600" />
      <div class="notice-example__section">
        <h3>服务状态</h3>
        <ScqNoticeBar type="success" icon="shield-check" text="所有服务运行正常" />
      </div>
      <ScqCellGroup title="最近消息" inset>
        <ScqCell title="备份完成" label="资源文件已安全存储" value="10:24" />
        <ScqCell title="新设备登录" label="Windows · 上海" value="昨天" />
      </ScqCellGroup>
      <ScqButton v-if="dismissed" class="notice-example__restore" @click="dismissed = false">恢复通知</ScqButton>
    </div>
  </PhonePreview>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScqButton, ScqCell, ScqCellGroup, ScqNavBar, ScqNoticeBar } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const dismissed = ref(false)
</script>

<style scoped>
.notice-example { min-height: 100%; background: #f6f8fb; }
.notice-example__section { padding: 20px 0 0; }
.notice-example__section h3 { margin: 0 16px 10px; font-size: 14px; color: #303133; }
.notice-example__restore { margin: 20px 16px; }
</style>