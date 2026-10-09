<template>
  <div class="avatar-example">
    <ScqSpace :size="20" align="center">
      <ScqAvatar :src="useImage ? imageUrl : ''" alt="Ada" :size="64">AL</ScqAvatar>
      <ScqAvatar size="large" alt="Lin">LN</ScqAvatar>
      <ScqAvatar shape="square" alt="团队" icon="users" />
      <ScqAvatar size="small" alt="默认头像" />
    </ScqSpace>
    <ScqButton @click="useImage = !useImage">{{ useImage ? '使用首字母头像' : '恢复图片头像' }}</ScqButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScqAvatar, ScqButton, ScqSpace } from '../../../../src/index'

const useImage = ref(true)
const imageUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80'
</script>

<style scoped>
.avatar-example { display: grid; justify-items: start; gap: 24px; padding: 16px; }
</style>