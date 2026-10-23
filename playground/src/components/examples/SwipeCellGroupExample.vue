<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCell from '../../../../src/components/Cell'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqSelect from '../../../../src/components/Select'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqSwipeCell from '../../../../src/components/SwipeCell'
import type { SelectValue, SwipeCellClose, SwipeCellPosition } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const GROUP = 'guarded-inbox-example'
const GUARD_DELAY_MS = 600
const ACTION_WIDTH = 84
const MODES = [{ label: '允许', value: 'allow' }, { label: '拒绝', value: 'deny' }, { label: '抛错', value: 'error' }] as const
const mode = ref<'allow' | 'deny' | 'error'>('allow')
const setMode = (value: SelectValue | SelectValue[] | null) => {
  const option = MODES.find(option => option.value === value)
  if (!option) throw new RangeError('Unknown swipe-cell guard mode.')
  mode.value = option.value
}
const closeOutside = ref(true)
const deferAcknowledgement = ref(false)
const awaiting = ref<number[]>([])
const message = ref('左滑或按 ← 打开操作区，再打开另一行。')
const items = ref([
  { id: 1, title: '设计评审', position: '' as SwipeCellPosition },
  { id: 2, title: '开发周报', position: '' as SwipeCellPosition },
  { id: 3, title: '项目资料', position: '' as SwipeCellPosition },
])

const beforeClose = (context: SwipeCellClose, signal: AbortSignal) => new Promise<boolean>((resolve, reject) => {
  const decision = mode.value
  message.value = `正在处理 ${context.reason} 关闭请求…`
  const cancel = () => { clearTimeout(timer); resolve(false) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', cancel)
    if (decision === 'error') { reject(new Error('模拟关闭请求失败，请重试')); return }
    message.value = decision === 'deny' ? '关闭被拒绝，新行不会打开。' : '守卫已同意，仍需受控值确认关闭。'
    resolve(decision === 'allow')
  }, GUARD_DELAY_MS)
  if (signal.aborted) cancel()
  else signal.addEventListener('abort', cancel, { once: true })
})
const update = (item: typeof items.value[number], value: SwipeCellPosition) => {
  if (value === '' && deferAcknowledgement.value) {
    if (!awaiting.value.includes(item.id)) awaiting.value.push(item.id)
    return
  }
  item.position = value
}
const acknowledge = () => {
  items.value.forEach((item) => { if (awaiting.value.includes(item.id)) item.position = '' })
  awaiting.value = []
}
const error = (value: unknown) => { message.value = value instanceof Error ? value.message : String(value) }
</script>

<template>
  <PhonePreview screen-id="swipe-cell-group-preview">
    <ScqNavBar title="同组互斥与异步关闭" />
    <div class="swipe-cell-group-example__controls">
      <label class="swipe-cell-group-example__mode">关闭守卫<ScqSelect :model-value="mode" :options="[...MODES]" :clearable="false" aria-label="关闭守卫" @update:model-value="setMode" /></label>
      <ScqCheckbox v-model="closeOutside">点击外部关闭</ScqCheckbox>
      <ScqCheckbox v-model="deferAcknowledgement">延迟受控关闭确认</ScqCheckbox>
      <ScqButton v-if="awaiting.length" size="small" @click="acknowledge">确认关闭，允许下一行打开</ScqButton>
      <p role="status">{{ message }}</p>
    </div>
    <ScqSwipeCell v-for="item in items" :key="item.id" :model-value="item.position" :group="GROUP" :right-width="ACTION_WIDTH" :close-on-click-outside="closeOutside" :before-close="beforeClose" :aria-label="item.title" :style="{ '--example-action-width': `${ACTION_WIDTH}px` }" @update:model-value="update(item, $event)" @error="error" @group-conflict="message = '检测到外部同时打开多行；请由业务协调受控值。'">
      <ScqCell :title="item.title" label="关闭旧行完成后，下一行才能打开。" />
      <template #right><button type="button" class="swipe-cell-group-example__action">标为已读</button></template>
    </ScqSwipeCell>
  </PhonePreview>
</template>

<style scoped>
.swipe-cell-group-example__controls { display: grid; gap: 10px; padding: 16px; color: var(--scq-muted); font-size: 13px; }
.swipe-cell-group-example__mode { display: grid; gap: var(--scq-space-sm, 8px); min-width: 0; }
.swipe-cell-group-example__mode .scq-select { width: 100%; min-width: 0; }
.swipe-cell-group-example__controls p { margin: 0; min-height: 3em; line-height: 1.5; }
.swipe-cell-group-example__action { width: var(--example-action-width); border: 0; background: var(--scq-primary); color: var(--scq-on-primary, white); font: inherit; cursor: pointer; }
</style>
