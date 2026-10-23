<template>
  <PhonePreview :screen-id="previewId">
    <div class="toast-template-example">
      <ScqNavBar title="消息设置" />
      <ScqCellGroup title="提示选项" inset>
        <ScqCell title="显示位置">
          <ScqSelect :model-value="position" :options="[...POSITIONS]" :clearable="false" aria-label="显示位置" @update:model-value="setPosition" />
        </ScqCell>
        <ScqCell title="点击提示关闭"><ScqSwitch v-model="closeOnClick" aria-label="点击提示关闭" /></ScqCell>
        <ScqCell title="显示遮罩"><ScqSwitch v-model="overlay" aria-label="显示遮罩" /></ScqCell>
      </ScqCellGroup>
      <div class="toast-template-example__actions">
        <ScqButton type="primary" @click="visible = true">预览消息提示</ScqButton>
        <p role="status">已关闭 {{ closedCount }} 次</p>
      </div>
      <ScqToast v-if="ready" v-model="visible" message="这是一条消息提示" :position="position" :overlay="overlay" :close-on-click="closeOnClick" close-on-click-overlay :duration="2500" :teleport="`#${previewId}`" @close="closedCount++" />
    </div>
  </PhonePreview>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCell from '../../../../src/components/Cell'
import ScqCellGroup from '../../../../src/components/CellGroup'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqSelect from '../../../../src/components/Select'
import ScqSwitch from '../../../../src/components/Switch'
import ScqToast from '../../../../src/components/Toast'
import type { SelectValue, ToastPosition } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const previewId = 'toast-template-preview'
const ready = ref(false)
const visible = ref(false)
const closeOnClick = ref(true)
const overlay = ref(false)
const position = ref<ToastPosition>('middle')
const POSITIONS = [{ label: '顶部', value: 'top' }, { label: '居中', value: 'middle' }, { label: '底部', value: 'bottom' }] as const
const setPosition = (value: SelectValue | SelectValue[] | null) => {
  const option = POSITIONS.find(option => option.value === value)
  if (!option) throw new RangeError('Unknown toast position.')
  position.value = option.value
}
const closedCount = ref(0)
onMounted(() => { ready.value = true })
</script>

<style scoped>
.toast-template-example { min-height: 100%; background: #f6f8fb; }
.toast-template-example .scq-select { width: 100%; min-width: 0; }
.toast-template-example__actions { display: grid; gap: 14px; padding: 24px 16px; }
.toast-template-example__actions .my-btn { width: 100%; min-height: 44px; }
.toast-template-example__actions p { margin: 0; color: #73767a; text-align: center; font-size: 13px; }
</style>