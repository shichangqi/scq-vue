<script setup lang="ts">
import { computed, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqDialog from '../../../../src/components/Dialog'
import ScqDrawer from '../../../../src/components/Drawer'
import ScqModal from '../../../../src/components/Modal'
import ScqPopup from '../../../../src/components/Popup'
import ScqRadio from '../../../../src/components/Radio'
import ScqRadioGroup from '../../../../src/components/RadioGroup'
import ScqSpace from '../../../../src/components/Space'
import ExampleSection from '../ExampleSection.vue'
import LocalDraft from './LocalDraft.vue'

const LAYERS = { Dialog: ScqDialog, Modal: ScqModal, Drawer: ScqDrawer, Popup: ScqPopup }
const CONFIG = { width: 480, delay: 600 }
const kind = ref<keyof typeof LAYERS>('Dialog')
const layer = ref<InstanceType<typeof ScqDialog | typeof ScqModal | typeof ScqDrawer | typeof ScqPopup>>()
const opened = ref(false)
const destroy = ref(false)
const lockScroll = ref(true)
const dismiss = ref(true)
const reject = ref(false)
const fail = ref(false)
const fullscreen = ref(false)
const customFooter = ref(false)
const event = ref('尚未打开')
const isDialog = computed(() => kind.value === 'Dialog' || kind.value === 'Modal')
const options = computed(() => isDialog.value
  ? { title: `${kind.value} 配置`, width: CONFIG.width, fullscreen: fullscreen.value, closeOnClickModal: dismiss.value, showCancelButton: true, confirmButtonText: '保存', cancelButtonText: '返回', onConfirm: () => { event.value = 'confirm' }, onCancel: () => { event.value = 'cancel' } }
  : { size: CONFIG.width, ...(kind.value === 'Drawer' ? { title: 'Drawer 配置' } : { ariaLabel: 'Popup 配置' }), closeOnClickOverlay: dismiss.value })
const beforeClose = (reason: string, signal: AbortSignal) => new Promise<boolean>((resolve, rejectPromise) => {
  event.value = `等待关闭：${reason}`
  const abort = () => { clearTimeout(timer); resolve(false) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    if (fail.value) rejectPromise(new Error('保存失败，请关闭模拟失败后重试'))
    else { event.value = reject.value ? '已阻止关闭' : `允许关闭：${reason}`; resolve(!reject.value) }
  }, CONFIG.delay)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
const onError = (error: unknown) => { event.value = error instanceof Error ? error.message : String(error) }
const onClose = (reason: string) => { event.value = `close: ${reason}` }
</script>

<template>
  <ExampleSection title="关闭守卫、内容保留与生命周期" description="切换浮层类型，再输入局部草稿。关闭后重开可以比较 destroyOnClose 的效果；关闭按钮、遮罩、Escape 与实例 close() 均经过守卫。">
    <template #controls>
      <ScqRadioGroup v-model="kind" :disabled="opened" aria-label="浮层类型"><ScqRadio v-for="(_, name) in LAYERS" :key="name" :value="name">{{ name }}</ScqRadio></ScqRadioGroup>
    </template>
    <ScqSpace wrap>
      <ScqCheckbox v-model="destroy">关闭后销毁</ScqCheckbox>
      <ScqCheckbox v-model="lockScroll">锁定页面滚动</ScqCheckbox>
      <ScqCheckbox v-model="dismiss">允许遮罩与 Escape 关闭</ScqCheckbox>
      <ScqCheckbox v-model="reject">阻止关闭</ScqCheckbox>
      <ScqCheckbox v-model="fail">模拟失败</ScqCheckbox>
      <ScqCheckbox v-if="isDialog" v-model="fullscreen">全屏</ScqCheckbox>
      <ScqCheckbox v-if="isDialog" v-model="customFooter">自定义底部</ScqCheckbox>
    </ScqSpace>
    <ScqButton type="primary" @click="opened = true">打开 {{ kind }}</ScqButton>
    <output role="status">{{ event }}</output>
    <component :is="LAYERS[kind]" :key="kind" ref="layer" v-model="opened" v-bind="options" show-close :destroy-on-close="destroy" :lock-scroll="lockScroll" :close-on-press-escape="dismiss" :before-close="beforeClose" initial-focus=".layer-options-draft input" @open="event = 'open'" @opened="event = 'opened'" @close="onClose" @closed="event = 'closed'" @error="onError">
      <ScqSpace direction="vertical" fill>
        <LocalDraft class="layer-options-draft" label="浮层局部草稿" />
        <ScqCheckbox v-model="reject">阻止关闭</ScqCheckbox>
        <ScqCheckbox v-model="fail">模拟失败</ScqCheckbox>
        <ScqButton @click="layer?.close()">调用 close()</ScqButton>
        <p role="status">{{ event }}</p>
      </ScqSpace>
      <template v-if="isDialog && customFooter" #footer="{ cancel, confirm }">
        <ScqButton @click="cancel">自定义取消</ScqButton>
        <ScqButton type="primary" @click="confirm">自定义确认</ScqButton>
      </template>
    </component>
  </ExampleSection>
</template>
