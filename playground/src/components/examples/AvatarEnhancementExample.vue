<script setup lang="ts">
import { computed, ref } from 'vue'
import ScqAvatar from '../../../../src/components/Avatar'
import ScqBadge from '../../../../src/components/Badge'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqInput from '../../../../src/components/Input'
import ScqSpace from '../../../../src/components/Space'
import type { AvatarFallback } from '../../../../src/components/Avatar'
import ExampleSection from '../ExampleSection.vue'

const GROUP_LIMIT = 3
const title = ref('Development team')
const preferText = ref(false)
const errors = ref(0)
const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#2563eb"/><text x="40" y="50" text-anchor="middle" font-size="30" fill="white">AL</text></svg>')}`
const order = computed<AvatarFallback[]>(() => preferText.value ? ['text', 'image', 'icon'] : ['image', 'text', 'icon'])
const people = ['Ada', 'Grace', 'Lin', 'Sam', 'Alex']
</script>

<template>
  <ExampleSection class="avatar-enhancement-example" title="头像回退与成员组合" subtitle="Avatar fallback &amp; groups">
    <template #controls><ScqCheckbox v-model="preferText">文本优先</ScqCheckbox></template>
    <ScqInput v-model="title" aria-label="头像文本" placeholder="输入团队名称" />
    <ScqSpace>
      <ScqAvatar :text="title" alt="Team name" />
      <ScqAvatar :text="title" :size="64" alt="Large team name" />
      <ScqAvatar :src="portrait" :srcset="`${portrait} 1x, ${portrait} 2x`" sizes="40px" text="AL" :fallback-order="order" alt="Responsive avatar" />
      <ScqAvatar src="/__scq-avatar-missing.png" :fallback-src="portrait" text="Fallback" alt="Backup avatar" @error="errors += 1" />
      <ScqBadge is-dot type="success" label="Online"><ScqAvatar text="AL" alt="Ada" /></ScqBadge>
    </ScqSpace>
    <div class="avatar-enhancement-example__group" aria-label="Team members">
      <ScqAvatar v-for="person in people.slice(0, GROUP_LIMIT)" :key="person" :text="person.slice(0, 1)" :alt="person" />
      <ScqAvatar v-if="people.length > GROUP_LIMIT" :text="`+${people.length - GROUP_LIMIT}`" :alt="`${people.length - GROUP_LIMIT} more members`" />
    </div>
    <p role="status">Image errors reported: {{ errors }}</p>
    <p>在线状态只描述状态，不重复成员姓名；堆叠与聚合由业务组合，不新增组接口。</p>
  </ExampleSection>
</template>

<style scoped>
.avatar-enhancement-example__group { display: flex; padding-inline-start: 8px; }
.avatar-enhancement-example__group > .scq-avatar { margin-inline-start: -8px; border: 2px solid var(--scq-surface); }
</style>
