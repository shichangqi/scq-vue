<template>
  <section class="doc-block">
    <h1>{{ t('popup.title') }}</h1>
    <p class="lead">{{ t('popup.lead') }}</p>

    <h2>{{ t('popup.basic') }}</h2>
    <DocExample :code="basicCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="primary" @click="openCenter">{{ t('popup.openBasic') }}</scq-button>
      </div>
      <scq-popup
        v-model="visible"
        position="center"
        :show-close="true"
        overlay-theme="dialog"
      >
        <div class="popup-content">
          <h4>SCQ Popup</h4>
          <p>{{ t('popup.desc.basic') }}</p>
          <p>position = center / overlay = dialog</p>
        </div>
      </scq-popup>
    </DocExample>

    <h2>{{ t('popup.placement') }}</h2>
    <DocExample :code="placementCode" lang="vue">
      <div class="demo-panel popup-actions">
        <scq-button @click="openByPosition('top')">{{ t('popup.openTop') }}</scq-button>
        <scq-button @click="openByPosition('bottom')">{{ t('popup.openBottom') }}</scq-button>
        <scq-button @click="openByPosition('left')">{{ t('popup.openLeft') }}</scq-button>
        <scq-button @click="openByPosition('right')">{{ t('popup.openRight') }}</scq-button>
        <scq-button @click="openByPosition('center')">{{ t('popup.openCenter') }}</scq-button>
      </div>
      <scq-popup
        v-model="positionVisible"
        :position="position"
        :show-close="true"
        :round="position !== 'left' && position !== 'right'"
      >
        <div class="popup-content popup-content--placement">
          <h4>Popup {{ position }}</h4>
          <p>Try top / bottom / left / right / center.</p>
        </div>
      </scq-popup>
    </DocExample>

    <h2>{{ t('popup.custom') }}</h2>
    <DocExample :code="customCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="success" @click="customVisible = true">{{ t('popup.openCustom') }}</scq-button>
      </div>
      <scq-popup
        v-model="customVisible"
        position="center"
        overlay-theme="modal"
        :show-close="true"
        :round-radius="20"
      >
        <template #close-icon>
          <span class="popup-custom-close">✦</span>
        </template>
        <div class="popup-content">
          <h4>{{ t('popup.slotCloseIcon') }}</h4>
          <p>{{ t('popup.desc.custom') }}</p>
          <p>overlay = modal / roundRadius = 20</p>
        </div>
      </scq-popup>
    </DocExample>

    <h2>{{ t('popup.callback') }}</h2>
    <DocExample :code="callbackCode" lang="vue">
      <div class="demo-panel callback-actions">
        <scq-button type="primary" @click="openCallbackDemo">{{ t('popup.openCallback') }}</scq-button>
        <scq-button @click="clearCallbackLogs">{{ t('popup.clearLogs') }}</scq-button>
      </div>
      <scq-popup
        v-model="callbackVisible"
        position="right"
        size="30%"
        :show-close="true"
        @opened="handlePopupOpened"
        @closed="handlePopupClosed"
      >
        <div class="popup-content popup-content--placement">
          <h4>{{ t('popup.callbackPanelTitle') }}</h4>
          <p>{{ t('popup.callbackPanelDesc') }}</p>
        </div>
      </scq-popup>

      <div class="callback-log-panel">
        <div class="callback-log-panel__title">{{ t('popup.logTitle') }}</div>
        <ul v-if="callbackLogs.length" class="callback-log-list">
          <li v-for="(item, index) in callbackLogs" :key="`${item}-${index}`">{{ item }}</li>
        </ul>
        <p v-else class="callback-log-empty">{{ t('popup.logEmpty') }}</p>
      </div>
    </DocExample>

    <h2>{{ t('popup.props') }}</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>{{ t('doc.param') }}</th>
          <th>{{ t('doc.desc') }}</th>
          <th>{{ t('doc.type') }}</th>
          <th>{{ t('doc.default') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>v-model</td><td>{{ t('popup.model.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>position</td><td>{{ t('popup.position.desc') }}</td><td>left | right | top | bottom | center</td><td>center</td></tr>
        <tr><td>size</td><td>{{ t('popup.size.desc') }}</td><td>string | number</td><td>-</td></tr>
        <tr><td>showClose</td><td>{{ t('popup.showClose.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>closeIcon</td><td>{{ t('popup.closeIcon.desc') }}</td><td>string | Component</td><td>×</td></tr>
        <tr><td>round</td><td>{{ t('popup.round.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>roundRadius</td><td>{{ t('popup.roundRadius.desc') }}</td><td>string | number</td><td>12</td></tr>
        <tr><td>overlayTheme</td><td>{{ t('popup.overlayTheme.desc') }}</td><td>dialog | modal</td><td>dialog</td></tr>
        <tr><td>closeOnClickOverlay</td><td>{{ t('popup.closeOnClickOverlay.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>closeOnPressEscape</td><td>{{ t('popup.closeOnPressEscape.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>teleport</td><td>{{ t('popup.teleport.desc') }}</td><td>boolean | string</td><td>true</td></tr>
        <tr><td>@opened</td><td>{{ t('popup.onOpened.desc') }}</td><td>() =&gt; void</td><td>-</td></tr>
        <tr><td>@closed</td><td>{{ t('popup.onClosed.desc') }}</td><td>() =&gt; void</td><td>-</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'
import type { PopupPosition } from 'scq-vue'

const visible = ref(false)
const positionVisible = ref(false)
const customVisible = ref(false)
const callbackVisible = ref(false)
const callbackLogs = ref<string[]>([])
const position = ref<PopupPosition>('center')

const openCenter = () => {
  visible.value = true
}

const openByPosition = (next: PopupPosition) => {
  position.value = next
  positionVisible.value = true
}

const appendLog = (message: string) => {
  const time = new Date().toLocaleTimeString()
  callbackLogs.value.unshift(`[${time}] ${message}`)
}

const handlePopupOpened = () => {
  appendLog(t('popup.logOpened'))
}

const handlePopupClosed = () => {
  appendLog(t('popup.logClosed'))
}

const openCallbackDemo = () => {
  callbackVisible.value = true
}

const clearCallbackLogs = () => {
  callbackLogs.value = []
}

const basicCode = `<template>
  <scq-button type="primary" @click="visible = true">打开居中 Popup</scq-button>

  <scq-popup v-model="visible" position="center" :show-close="true" overlay-theme="dialog">
    <div class="popup-content">
      <h4>SCQ Popup</h4>
      <p>内容区域会根据插槽内容自适应尺寸。</p>
      <p>position = center / overlay = dialog</p>
    </div>
  </scq-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
<\/script>`

const placementCode = `<template>
  <div class="demo-panel popup-actions">
    <scq-button @click="openByPosition('top')">顶部</scq-button>
    <scq-button @click="openByPosition('bottom')">底部</scq-button>
    <scq-button @click="openByPosition('left')">左侧</scq-button>
    <scq-button @click="openByPosition('right')">右侧</scq-button>
    <scq-button @click="openByPosition('center')">中间</scq-button>
  </div>

  <scq-popup v-model="positionVisible" :position="position" :show-close="true">
    <div class="popup-content popup-content--placement">
      <h4>Popup {{ position }}</h4>
      <p>Try top / bottom / left / right / center.</p>
    </div>
  </scq-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PopupPosition } from 'scq-vue'

const positionVisible = ref(false)
const position = ref<PopupPosition>('center')

const openByPosition = (next: PopupPosition) => {
  position.value = next
  positionVisible.value = true
}
<\/script>`

const customCode = `<template>
  <scq-button type="success" @click="customVisible = true">打开自定义样式 Popup</scq-button>

  <scq-popup
    v-model="customVisible"
    position="center"
    overlay-theme="modal"
    :show-close="true"
    :round-radius="20"
  >
    <template #close-icon>
      <span class="popup-custom-close">✦</span>
    </template>

    <div class="popup-content">
      <h4>自定义图标</h4>
      <p>该示例使用 Modal 风格遮罩，并通过 slot 自定义右上角关闭图标。</p>
      <p>overlay = modal / roundRadius = 20</p>
    </div>
  </scq-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const customVisible = ref(false)
<\/script>`

const callbackCode = `<template>
  <div class="demo-panel callback-actions">
    <scq-button type="primary" @click="callbackVisible = true">打开回调示例 Popup</scq-button>
    <scq-button @click="clearCallbackLogs">清空日志</scq-button>
  </div>

  <scq-popup
    v-model="callbackVisible"
    position="right"
    size="30%"
    :show-close="true"
    @opened="handlePopupOpened"
    @closed="handlePopupClosed"
  >
    <div class="popup-content popup-content--placement">
      <h4>回调演示面板</h4>
      <p>打开/关闭动画完成后会触发 @opened / @closed。</p>
    </div>
  </scq-popup>

  <div class="callback-log-panel">
    <div class="callback-log-panel__title">回调触发日志</div>
    <ul v-if="callbackLogs.length" class="callback-log-list">
      <li v-for="(item, index) in callbackLogs" :key="\`\${item}-\${index}\`">{{ item }}</li>
    </ul>
    <p v-else class="callback-log-empty">暂无回调日志。</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const callbackVisible = ref(false)
const callbackLogs = ref<string[]>([])

const appendLog = (message: string) => {
  const time = new Date().toLocaleTimeString()
  callbackLogs.value.unshift(\`[\${time}] \${message}\`)
}

const handlePopupOpened = () => {
  appendLog('onOpened triggered')
}

const handlePopupClosed = () => {
  appendLog('onClosed triggered')
}

const clearCallbackLogs = () => {
  callbackLogs.value = []
}
<\/script>`
</script>

<style scoped>
.popup-actions {
  flex-wrap: wrap;
}

.callback-actions {
  flex-wrap: wrap;
}

.popup-content {
  min-width: 220px;
}

.popup-content h4 {
  margin: 0;
  color: #111827;
  font-size: 18px;
}

.popup-content p {
  margin: 10px 0 0;
  color: #4b5563;
}

.popup-content--placement {
  min-width: 260px;
}

.popup-custom-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 16px;
  color: #14b8a6;
}

.callback-log-panel {
  margin-top: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  padding: 12px;
}

.callback-log-panel__title {
  font-size: 13px;
  color: #334155;
  margin-bottom: 8px;
  font-weight: 600;
}

.callback-log-list {
  margin: 0;
  padding-left: 18px;
  color: #1e293b;
}

.callback-log-list li + li {
  margin-top: 6px;
}

.callback-log-empty {
  margin: 0;
  color: #64748b;
}
</style>
