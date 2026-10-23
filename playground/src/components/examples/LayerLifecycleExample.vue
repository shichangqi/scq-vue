<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqInput from '../../../../src/components/Input'
import ScqSpace from '../../../../src/components/Space'
import ScqDialog from '../../../../src/components/Dialog'
import ScqModal from '../../../../src/components/Modal'
import ScqPopup from '../../../../src/components/Popup'
import ScqPopover from '../../../../src/components/Popover'
import ExampleSection from '../ExampleSection.vue'

const first = ref(false)
const second = ref(false)
const third = ref(false)
const draft = ref('')
</script>

<template>
  <ExampleSection title="多层浮层与焦点管理" subtitle="Layer lifecycle" description="逐层打开弹窗，使用 Escape 关闭顶层，检查焦点恢复与草稿保留。">
    <ScqButton type="primary" @click="first = true">打开第一层 / Open layer 1</ScqButton>
    <ScqDialog v-model="first" title="Dialog · Layer 1" initial-focus=".layer-lifecycle-example__draft input">
      <ScqSpace direction="vertical" align="stretch" fill>
        <ScqInput v-model="draft" class="layer-lifecycle-example__draft" aria-label="草稿 / Draft" placeholder="输入草稿" />
        <ScqSpace>
          <ScqPopover title="Non-modal content">
            <template #reference><ScqButton>Popover</ScqButton></template>
            <ScqInput aria-label="可交互内容 / Input" placeholder="可交互内容" />
          </ScqPopover>
          <ScqButton @click="second = true">打开第二层 / Open layer 2</ScqButton>
        </ScqSpace>
      </ScqSpace>
      <ScqModal v-model="second" title="Modal · Layer 2" show-close>
        <ScqButton @click="third = true">打开第三层 / Open layer 3</ScqButton>
        <ScqPopup v-model="third" show-close aria-label="Popup layer 3">
          <p>每次 Escape 只关闭顶层。全部关闭后归还焦点并恢复滚动。</p>
          <p>Escape dismisses only the top layer. Focus and scrolling return after dismissal.</p>
          <ScqButton @click="third = false">关闭第三层 / Close layer 3</ScqButton>
        </ScqPopup>
      </ScqModal>
    </ScqDialog>
  </ExampleSection>
</template>
