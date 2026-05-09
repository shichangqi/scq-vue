<template>
  <section class="doc-block">
    <h1>{{ t('modal.title') }}</h1>
    <p class="lead">{{ t('modal.lead') }}</p>

    <div class="modal-lab">
      <div class="modal-lab__left">
        <h2>{{ t('modal.sec.template.basic') }}</h2>
        <p class="modal-lab__desc">{{ t('modal.basicDesc') }}</p>
        <DocExample :code="basicCode" lang="vue" :default-expanded="true" :collapsible="false" :show-demo="false" />

        <h2>{{ t('modal.sec.template.footerSlot') }}</h2>
        <p class="modal-lab__desc">{{ t('modal.slotDesc') }}</p>
        <DocExample :code="slotCode" lang="vue" :default-expanded="true" :collapsible="false" :show-demo="false" />

        <h2>{{ t('modal.sec.template.custom') }}</h2>
        <p class="modal-lab__desc">{{ t('modal.customCardDesc') }}</p>
        <DocExample :code="customCode" lang="vue" :default-expanded="true" :collapsible="false" :show-demo="false" />

        <h2>{{ t('modal.sec.api.main') }}</h2>
        <p class="modal-lab__desc">{{ t('modal.phoneApiDesc') }}</p>
        <DocExample :code="apiCode" lang="vue" :default-expanded="true" :collapsible="false" :show-demo="false" />
      </div>

      <aside class="modal-lab__right">
        <div class="phone-demo phone-demo--single">
          <div class="phone-demo__device">
            <div class="phone-demo__notch"></div>
            <div id="modal-preview-phone" class="phone-demo__screen">
              <div class="phone-demo__status-bar">
                <span>9:41</span>
                <span>5G</span>
              </div>
              <div class="phone-demo__content">
                <div class="phone-demo__app">
                  <div class="phone-demo__sheet">
                    <div class="phone-demo__sheet-title">{{ t('modal.phoneTitle') }}</div>
                    <div class="phone-demo__sheet-desc">{{ t('modal.phoneDesc') }}</div>

                    <div class="phone-demo__examples">
                      <button type="button" class="phone-demo__example-item" @click="openBasicDemo">
                        <span>{{ t('modal.sec.template.basic') }}</span>
                        <span class="phone-demo__example-arrow">›</span>
                      </button>
                      <button type="button" class="phone-demo__example-item" @click="openSlotDemo">
                        <span>{{ t('modal.sec.template.footerSlot') }}</span>
                        <span class="phone-demo__example-arrow">›</span>
                      </button>
                      <button type="button" class="phone-demo__example-item" @click="openCustomDemo">
                        <span>{{ t('modal.sec.template.custom') }}</span>
                        <span class="phone-demo__example-arrow">›</span>
                      </button>
                      <button type="button" class="phone-demo__example-item" @click="openApiInfoDemo">
                        <span>Modal.open (info)</span>
                        <span class="phone-demo__example-arrow">›</span>
                      </button>
                      <button type="button" class="phone-demo__example-item" @click="openApiConfirmDemo">
                        <span>Modal.confirm</span>
                        <span class="phone-demo__example-arrow">›</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="phone-demo__home-indicator"></div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <scq-modal
      v-model="basicVisible"
      :title="t('modal.basicTitle')"
      type="info"
      :teleport="previewTeleport"
    >
      <p>{{ t('modal.basicDesc') }}</p>
    </scq-modal>

    <scq-modal
      v-model="slotVisible"
      :title="t('modal.slotTitle')"
      :show-close="true"
      :teleport="previewTeleport"
    >
      <div class="modal-custom-body">
        <h4>{{ t('modal.slotHeadline') }}</h4>
        <p>{{ t('modal.slotDesc') }}</p>
        <ul>
          <li>{{ t('modal.slotItem1') }}</li>
          <li>{{ t('modal.slotItem2') }}</li>
          <li>{{ t('modal.slotItem3') }}</li>
        </ul>
      </div>
      <template #footer="{ cancel, confirm }">
        <scq-button @click="cancel()">{{ t('modal.later') }}</scq-button>
        <scq-button type="success" @click="confirm()">{{ t('modal.confirmNow') }}</scq-button>
      </template>
    </scq-modal>

    <scq-modal
      v-model="customVisible"
      type="custom"
      :show-close="true"
      :show-footer="false"
      :teleport="previewTeleport"
    >
      <div class="custom-card">
        <img class="custom-card__image" :src="customImage" alt="Modal custom preview" />
        <strong>{{ t('modal.customCardTitle') }}</strong>
        <p>{{ t('modal.customCardDesc') }}</p>
      </div>
    </scq-modal>

    <h2>{{ t('modal.props') }}</h2>
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
        <tr><td>v-model</td><td>{{ t('modal.model.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>type</td><td>{{ t('modal.type.desc') }}</td><td>info | confirm | custom</td><td>info</td></tr>
        <tr><td>showClose</td><td>{{ t('modal.showClose.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>showFooter</td><td>{{ t('modal.showFooter.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>showCancelButton</td><td>{{ t('modal.showCancel.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>showConfirmButton</td><td>{{ t('modal.showConfirm.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>cancelButtonText</td><td>{{ t('modal.cancelText.desc') }}</td><td>string</td><td>取消</td></tr>
        <tr><td>confirmButtonText</td><td>{{ t('modal.confirmText.desc') }}</td><td>string</td><td>确定</td></tr>
        <tr><td>beforeClose</td><td>{{ t('modal.beforeClose.desc') }}</td><td>(reason) =&gt; boolean | Promise&lt;boolean&gt;</td><td>-</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'
import { Modal } from 'scq-vue'

const basicVisible = ref(false)
const slotVisible = ref(false)
const customVisible = ref(false)
const previewTeleport = ref<boolean | string>(false)

onMounted(() => {
  previewTeleport.value = '#modal-preview-phone'
})

const resolvePreviewTeleport = (): boolean | string => {
  if (typeof document === 'undefined') {
    return false
  }
  return document.querySelector('#modal-preview-phone') ? '#modal-preview-phone' : false
}

const basicCode = `<template>
  <scq-button type="primary" @click="basicVisible = true">打开基础 Modal</scq-button>

  <scq-modal v-model="basicVisible" title="基础提示" type="info" teleport="#phone-screen">
    <p>默认按移动端系统提示框的方式展示，标题与内容都可以直接通过模板控制。</p>
  </scq-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const basicVisible = ref(false)
<\/script>`

const slotCode = `<template>
  <scq-button type="primary" @click="slotVisible = true">打开自定义底部 Modal</scq-button>

  <scq-modal v-model="slotVisible" title="自定义内容" :show-close="true" teleport="#phone-screen">
    <div class="modal-custom-body">
      <h4>发布前检查项</h4>
      <p>默认插槽可以放任意内容，footer 插槽支持 cancel / confirm。</p>
      <ul>
        <li>内容布局可完全自定义</li>
        <li>底部按钮可换成任意组件</li>
        <li>适合移动端确认流程</li>
      </ul>
    </div>
    <template #footer="{ cancel, confirm }">
      <scq-button @click="cancel()">稍后处理</scq-button>
      <scq-button type="success" @click="confirm()">立即确认</scq-button>
    </template>
  </scq-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const slotVisible = ref(false)
<\/script>`

const customCode = `<template>
  <scq-button type="primary" @click="customVisible = true">打开自定义内容 Modal</scq-button>

  <scq-modal
    v-model="customVisible"
    type="custom"
    :show-close="true"
    :show-footer="false"
    teleport="#phone-screen"
  >
    <div class="custom-card">
      <img
        class="custom-card__image"
        :src="customImage"
        alt="Modal custom preview"
      />
      <strong>完全自定义</strong>
      <p>custom 类型适合没有固定标题和图标的内容展示。</p>
    </div>
  </scq-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const customVisible = ref(false)
const customImage = 'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=900&q=80'
<\/script>`

const customImage = 'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=900&q=80'

const apiCode = `<template>
  <div class="demo-panel">
    <scq-button @click="openApi('info')">Modal.open (info)</scq-button>
    <scq-button type="primary" @click="openApi('confirm')">Modal.confirm</scq-button>
  </div>
</template>

<script setup lang="ts">
import { Modal } from 'scq-vue'

const titleMap = {
  info: '信息提示',
  confirm: '确认操作',
}

const messageMap = {
  info: '这是通过 Modal.open 打开的移动端提示框。',
  confirm: '按钮文案不为空时，底部按钮会自动显示。',
}

const openApi = (type: 'info' | 'confirm') => {
  const api = type === 'confirm' ? Modal.confirm : Modal.open

  api({
    type,
    title: titleMap[type],
    message: messageMap[type],
    showClose: false,
    showFooter: undefined,
    cancelButtonText: type === 'confirm' ? '取消' : '',
    confirmButtonText: '确定',
    teleport: '#phone-screen',
  })
}
<\/script>`

const closeAllTemplateModals = () => {
  basicVisible.value = false
  slotVisible.value = false
  customVisible.value = false
}

const openApi = (type: 'info' | 'confirm') => {
  const api = type === 'confirm' ? Modal.confirm : Modal.open

  api({
    type,
    title: t(`modal.api.${type}Title`),
    message: t(`modal.api.${type}Message`),
    showClose: false,
    showFooter: undefined,
    cancelButtonText: type === 'confirm' ? t('modal.btn.cancel') : '',
    confirmButtonText: t('modal.btn.confirm'),
    teleport: resolvePreviewTeleport(),
  })
}

const runTemplateDemo = (key: 'basic' | 'slot' | 'custom') => {
  closeAllTemplateModals()
  Modal.destroyAll()

  if (key === 'basic') {
    basicVisible.value = true
    return
  }

  if (key === 'slot') {
    slotVisible.value = true
    return
  }

  customVisible.value = true
}

const openBasicDemo = () => runTemplateDemo('basic')
const openSlotDemo = () => runTemplateDemo('slot')
const openCustomDemo = () => runTemplateDemo('custom')

const openApiInfoDemo = () => {
  closeAllTemplateModals()
  Modal.destroyAll()
  openApi('info')
}

const openApiConfirmDemo = () => {
  closeAllTemplateModals()
  Modal.destroyAll()
  openApi('confirm')
}
</script>

<style scoped>
.modal-lab {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;
}

.modal-lab__desc {
  margin: 10px 0 14px;
  color: #64748b;
}

.modal-lab__right {
  position: sticky;
  top: 20px;
}

.phone-demo {
  display: flex;
  justify-content: center;
  padding: 6px 0;
}

.phone-demo--single {
  padding-top: 0;
}

.phone-demo__device {
  position: relative;
  width: 286px;
  border-radius: 42px;
  padding: 12px;
  background: linear-gradient(180deg, #1b1b1f 0%, #0f0f12 100%);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.26);
}

.phone-demo__notch {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 118px;
  height: 30px;
  border-radius: 999px;
  background: #050505;
  z-index: 3;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.04);
}

.phone-demo__screen {
  position: relative;
  height: 560px;
  overflow: hidden;
  border-radius: 30px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.88), transparent 34%),
    linear-gradient(180deg, #eef3fb 0%, #e6ebf5 100%);
  transform: translateZ(0);
  isolation: isolate;
}

.phone-demo__status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 26px 8px;
  color: #111827;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.phone-demo__content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100% - 64px);
  padding: 16px 14px 42px;
}

.phone-demo__app {
  width: 100%;
}

.phone-demo__sheet {
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.48);
  box-shadow: 0 14px 36px rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(10px);
}

.phone-demo__sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.phone-demo__sheet-desc {
  margin-top: 6px;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.45;
  color: #64748b;
}

.phone-demo__examples {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.86);
}

.phone-demo__example-item {
  width: 100%;
  border: none;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  color: #0f172a;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.phone-demo__example-item:last-child {
  border-bottom: none;
}

.phone-demo__example-item:active {
  background: rgba(59, 130, 246, 0.1);
}

.phone-demo__example-arrow {
  opacity: 0.5;
  font-size: 16px;
}

.phone-demo__home-indicator {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  width: 118px;
  height: 5px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.88);
  z-index: 2;
}

.modal-custom-body,
.custom-card {
  border: 1px solid rgba(210, 214, 220, 0.9);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
}

.custom-card {
  overflow: hidden;
}

.custom-card__image {
  width: 100%;
  height: 132px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
  display: block;
}

.modal-custom-body h4,
.custom-card strong {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
}

.modal-custom-body p,
.custom-card p {
  margin: 0 0 8px;
  color: #475569;
}

.modal-custom-body ul {
  margin: 0;
  padding-left: 18px;
  color: #475569;
}

@media (max-width: 768px) {
  .modal-lab {
    grid-template-columns: 1fr;
  }

  .modal-lab__right {
    position: static;
  }

  .phone-demo__device {
    width: min(100%, 268px);
    padding: 10px;
    border-radius: 30px;
  }

  .phone-demo__screen {
    height: 510px;
  }

  .phone-demo__sheet {
    padding: 16px;
  }
}
</style>
