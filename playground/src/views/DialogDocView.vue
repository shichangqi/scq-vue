<template>
  <section class="doc-block">
    <h1>{{ t('dialog.title') }}</h1>
    <p class="lead">{{ t('dialog.lead') }}</p>

    <h2>{{ t('dialog.sec.template.basic') }}</h2>
    <DocExample :code="basicCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="primary" @click="basicVisible = true">{{ t('dialog.openBasic') }}</scq-button>
      </div>
      <scq-dialog
        v-model="basicVisible"
        :title="t('dialog.basicTitle')"
        type="info"
        :show-cancel-button="true"
      >
        <p>{{ t('dialog.basicContent') }}</p>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.sec.template.type') }}</h2>
    <DocExample :code="typeCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="info" @click="openByType('info')">{{ t('dialog.type.info') }}</scq-button>
        <scq-button type="success" @click="openByType('success')">{{ t('dialog.type.success') }}</scq-button>
        <scq-button type="warning" @click="openByType('warning')">{{ t('dialog.type.warning') }}</scq-button>
        <scq-button type="danger" @click="openByType('error')">{{ t('dialog.type.error') }}</scq-button>
        <scq-button type="primary" @click="openByType('confirm')">{{ t('dialog.type.confirm') }}</scq-button>
      </div>
      <scq-dialog
        v-model="typeVisible"
        :title="activeTypeTitle"
        :type="activeType"
        :show-cancel-button="activeType === 'confirm'"
      >
        <p>{{ t('dialog.typeContent') }} {{ activeType }}</p>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.sec.template.footerSlot') }}</h2>
    <DocExample :code="slotCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="primary" @click="slotVisible = true">{{ t('dialog.openSlot') }}</scq-button>
      </div>
      <scq-dialog v-model="slotVisible" :title="t('dialog.slotTitle')" :show-close="true">
        <div class="dialog-custom-body">
          <h4>{{ t('dialog.slotHeadline') }}</h4>
          <p>{{ t('dialog.slotDesc') }}</p>
          <ul>
            <li>CPU: 8 Cores</li>
            <li>Memory: 16 GB</li>
            <li>Region: ap-southeast-1</li>
          </ul>
        </div>
        <template #footer="{ cancel, confirm }">
          <scq-button @click="cancel()">{{ t('dialog.later') }}</scq-button>
          <scq-button type="success" @click="confirm()">{{ t('dialog.deployNow') }}</scq-button>
        </template>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.sec.template.noFooter') }}</h2>
    <DocExample :code="noFooterCode" lang="vue">
      <div class="demo-panel">
        <scq-button @click="noFooterVisible = true">{{ t('dialog.btn.openNoFooter') }}</scq-button>
      </div>
      <scq-dialog
        v-model="noFooterVisible"
        :title="t('dialog.demo.noFooterTitle')"
        type="info"
        :show-cancel-button="false"
        :show-confirm-button="false"
      >
        <p>{{ t('dialog.demo.noFooterDesc') }}</p>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.sec.template.closeBehavior') }}</h2>
    <DocExample :code="closeBehaviorCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="warning" @click="closeBehaviorVisible = true">{{ t('dialog.btn.openCloseBehavior') }}</scq-button>
      </div>
      <scq-dialog
        v-model="closeBehaviorVisible"
        :title="t('dialog.demo.closeBehaviorTitle')"
        type="warning"
        :show-close="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-cancel-button="true"
      >
        <p>{{ t('dialog.demo.closeBehaviorDesc') }}</p>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.sec.template.size') }}</h2>
    <DocExample :code="sizeCode" lang="vue">
      <div class="demo-panel">
        <scq-button @click="sizeVisible = true">{{ t('dialog.btn.openSize') }}</scq-button>
      </div>
      <scq-dialog
        v-model="sizeVisible"
        :title="t('dialog.demo.sizeTitle')"
        type="info"
        :width="760"
        :z-index="3500"
        :show-cancel-button="true"
      >
        <p>{{ t('dialog.demo.sizeDesc') }}</p>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.fullscreen') }}</h2>
    <DocExample :code="fullscreenCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="primary" @click="fullscreenVisible = true">{{ t('dialog.openFullscreen') }}</scq-button>
      </div>
      <scq-dialog
        v-model="fullscreenVisible"
        :title="t('dialog.fullscreenTitle')"
        :fullscreen="true"
        :show-cancel-button="true"
      >
        <p>{{ t('dialog.fullscreenDesc') }}</p>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.sec.api.type') }}</h2>
    <DocExample :code="apiTypeCode" lang="vue">
      <div class="demo-panel">
        <scq-button @click="openApi('info')">type: {{ t('dialog.type.info') }}</scq-button>
        <scq-button type="success" @click="openApi('success')">type: {{ t('dialog.type.success') }}</scq-button>
        <scq-button type="warning" @click="openApi('warning')">type: {{ t('dialog.type.warning') }}</scq-button>
        <scq-button type="danger" @click="openApi('error')">type: {{ t('dialog.type.error') }}</scq-button>
        <scq-button type="primary" @click="openApi('confirm')">type: {{ t('dialog.type.confirm') }}</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('dialog.sec.api.buttons') }}</h2>
    <DocExample :code="apiButtonsCode" lang="vue">
      <div class="demo-panel">
        <scq-button @click="openApiButtons('confirm-only')">{{ t('dialog.btn.confirmOnly') }}</scq-button>
        <scq-button type="primary" @click="openApiButtons('both')">{{ t('dialog.btn.bothButtons') }}</scq-button>
        <scq-button type="warning" @click="openApiButtons('none')">{{ t('dialog.btn.noFooter') }}</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('dialog.sec.api.instance') }}</h2>
    <DocExample :code="apiInstanceCode" lang="vue">
      <div class="demo-panel">
        <scq-button @click="openApiWithUpdate">{{ t('dialog.btn.openUpdateDemo') }}</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('dialog.sec.api.chain') }}</h2>
    <DocExample :code="apiChainCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="primary" @click="openApiChain">{{ t('dialog.btn.openChain') }}</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('dialog.sec.api.global') }}</h2>
    <DocExample :code="apiGlobalCode" lang="vue">
      <div class="demo-panel">
        <scq-button @click="applyGlobalZIndex">Dialog.setGlobalZIndex</scq-button>
        <scq-button type="danger" @click="destroyAllApi">Dialog.destroyAll</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('dialog.beforeClose') }}</h2>
    <DocExample :code="beforeCloseCode" lang="vue">
      <div class="demo-panel">
        <scq-button type="primary" @click="beforeCloseVisible = true">{{ t('dialog.openBeforeClose') }}</scq-button>
      </div>
      <scq-dialog
        v-model="beforeCloseVisible"
        :title="t('dialog.beforeCloseTitle')"
        type="warning"
        :show-cancel-button="true"
        :before-close="handleBeforeClose"
      >
        <p>{{ t('dialog.beforeCloseDesc') }}</p>
      </scq-dialog>
    </DocExample>

    <h2>{{ t('dialog.props') }}（{{ t('dialog.props.template') }}）</h2>
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
        <tr><td>v-model</td><td>{{ t('dialog.model.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>title</td><td>{{ t('dialog.title.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>type</td><td>{{ t('dialog.type.desc') }}</td><td>default | info | success | warning | error | confirm</td><td>default</td></tr>
        <tr><td>width</td><td>{{ t('dialog.width.desc') }}</td><td>string | number</td><td>520</td></tr>
        <tr><td>zIndex</td><td>{{ t('dialog.zIndex.desc') }}</td><td>number</td><td>2100</td></tr>
        <tr><td>fullscreen</td><td>{{ t('dialog.fullscreen.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>showClose</td><td>{{ t('dialog.showClose.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>showFooter</td><td>{{ t('dialog.showFooter.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>showCancelButton</td><td>{{ t('dialog.showCancel.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>showConfirmButton</td><td>{{ t('dialog.showConfirm.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>cancelButtonText</td><td>{{ t('dialog.cancelText.desc') }}</td><td>string</td><td>取消</td></tr>
        <tr><td>confirmButtonText</td><td>{{ t('dialog.confirmText.desc') }}</td><td>string</td><td>确定</td></tr>
        <tr><td>confirmButtonType</td><td>{{ t('dialog.confirmButtonType.desc') }}</td><td>default | primary | success | warning | info | danger</td><td>{{ t('dialog.confirmButtonType.default') }}</td></tr>
        <tr><td>confirmLoading</td><td>{{ t('dialog.confirmLoading.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>autoCloseOnCancel</td><td>{{ t('dialog.autoCloseOnCancel.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>autoCloseOnConfirm</td><td>{{ t('dialog.autoCloseOnConfirm.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>closeOnClickModal</td><td>{{ t('dialog.closeOnClickModal.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>closeOnPressEscape</td><td>{{ t('dialog.closeOnPressEscape.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>teleport</td><td>{{ t('dialog.teleport.desc') }}</td><td>boolean | string</td><td>{{ t('dialog.teleport.default') }}</td></tr>
        <tr><td>beforeClose</td><td>{{ t('dialog.beforeClose.desc') }}</td><td>(reason) =&gt; boolean | Promise&lt;boolean&gt;</td><td>-</td></tr>
      </tbody>
    </table>

    <h2>{{ t('dialog.props') }}（{{ t('dialog.props.api') }}）</h2>
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
        <tr><td>type</td><td>{{ t('dialog.type.desc') }}</td><td>default | info | success | warning | error | confirm</td><td>info</td></tr>
        <tr><td>title</td><td>{{ t('dialog.title.desc') }}</td><td>string</td><td>{{ t('dialog.title.defaultByType') }}</td></tr>
        <tr><td>message</td><td>{{ t('dialog.message.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>content</td><td>{{ t('dialog.content.desc') }}</td><td>string | VNode | () =&gt; VNodeChild</td><td>-</td></tr>
        <tr><td>width</td><td>{{ t('dialog.width.desc') }}</td><td>string | number</td><td>520</td></tr>
        <tr><td>zIndex</td><td>{{ t('dialog.zIndex.desc') }}</td><td>number</td><td>{{ t('dialog.zIndex.auto') }}</td></tr>
        <tr><td>fullscreen</td><td>{{ t('dialog.fullscreen.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>showClose</td><td>{{ t('dialog.showClose.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>showFooter</td><td>{{ t('dialog.showFooter.desc') }}</td><td>boolean</td><td>{{ t('dialog.showFooter.auto') }}</td></tr>
        <tr><td>cancelButtonText</td><td>{{ t('dialog.cancelButtonText.apiDesc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>confirmButtonText</td><td>{{ t('dialog.confirmButtonText.apiDesc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>closeOnClickModal</td><td>{{ t('dialog.closeOnClickModal.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>closeOnPressEscape</td><td>{{ t('dialog.closeOnPressEscape.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>teleport</td><td>{{ t('dialog.teleport.desc') }}</td><td>boolean | string</td><td>{{ t('dialog.teleport.default') }}</td></tr>
        <tr><td>beforeClose</td><td>{{ t('dialog.beforeClose.apiDesc') }}</td><td>(reason) =&gt; boolean | Promise&lt;boolean&gt;</td><td>-</td></tr>
        <tr><td>onConfirm</td><td>{{ t('dialog.onConfirm.desc') }}</td><td>() =&gt; boolean | Promise&lt;boolean&gt;</td><td>-</td></tr>
        <tr><td>onCancel</td><td>{{ t('dialog.onCancel.desc') }}</td><td>() =&gt; boolean | Promise&lt;boolean&gt;</td><td>-</td></tr>
        <tr><td>onClose</td><td>{{ t('dialog.onClose.desc') }}</td><td>(reason) =&gt; void</td><td>-</td></tr>
        <tr><td>onClosed</td><td>{{ t('dialog.onClosed.desc') }}</td><td>() =&gt; void</td><td>-</td></tr>
      </tbody>
    </table>

    <h2>{{ t('dialog.sec.api.methods') }}</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>{{ t('dialog.method.col.method') }}</th>
          <th>{{ t('dialog.method.col.usage') }}</th>
          <th>{{ t('dialog.method.col.scene') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Dialog.open(options)</td>
          <td>{{ t('dialog.method.open.usage') }}</td>
          <td>{{ t('dialog.method.open.scene') }}</td>
        </tr>
        <tr>
          <td>Dialog.setGlobalZIndex(value)</td>
          <td>{{ t('dialog.method.zIndex.usage') }}</td>
          <td>{{ t('dialog.method.zIndex.scene') }}</td>
        </tr>
        <tr>
          <td>Dialog.destroyAll()</td>
          <td>{{ t('dialog.method.destroyAll.usage') }}</td>
          <td>{{ t('dialog.method.destroyAll.scene') }}</td>
        </tr>
      </tbody>
    </table>

    <h2>{{ t('dialog.sec.api.instanceMethods') }}</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>{{ t('dialog.method.col.instanceMethod') }}</th>
          <th>{{ t('dialog.method.col.usage') }}</th>
          <th>{{ t('dialog.method.col.scene') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>instance.update(partialOptions)</td>
          <td>{{ t('dialog.method.update.usage') }}</td>
          <td>{{ t('dialog.method.update.scene') }}</td>
        </tr>
        <tr>
          <td>instance.close()</td>
          <td>{{ t('dialog.method.close.usage') }}</td>
          <td>{{ t('dialog.method.close.scene') }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'
import { Dialog } from 'scq-vue'

type ExampleDialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

const basicVisible = ref(false)
const typeVisible = ref(false)
const slotVisible = ref(false)
const noFooterVisible = ref(false)
const closeBehaviorVisible = ref(false)
const sizeVisible = ref(false)
const fullscreenVisible = ref(false)
const beforeCloseVisible = ref(false)
const activeType = ref<ExampleDialogType>('info')
const activeTypeTitle = ref('Info')

const openByType = (type: ExampleDialogType) => {
  activeType.value = type
  activeTypeTitle.value = t(`dialog.type.${type}`)
  typeVisible.value = true
}

const openApi = (type: ExampleDialogType) => {
  const content = `${t('dialog.apiContent')} ${type}`
  Dialog.open({
    type,
    title: `Dialog.${type}`,
    message: content,
    showClose: true,
    cancelButtonText: type === 'confirm' ? t('dialog.btn.cancel') : '',
    confirmButtonText: t('dialog.btn.confirm'),
    onConfirm: () => {
      Dialog.open({
        type: 'success',
        title: t('dialog.done'),
        message: t('dialog.confirmed'),
        confirmButtonText: t('dialog.btn.gotIt'),
        showClose: true,
      })
    },
  })
}

type ApiButtonMode = 'confirm-only' | 'both' | 'none'

const openApiButtons = (mode: ApiButtonMode) => {
  if (mode === 'confirm-only') {
    Dialog.open({
      type: 'info',
      title: t('dialog.demo.confirmOnlyTitle'),
      message: t('dialog.demo.confirmOnlyDesc'),
      confirmButtonText: t('dialog.btn.gotIt'),
      cancelButtonText: '',
      showClose: true,
    })
    return
  }

  if (mode === 'both') {
    Dialog.open({
      type: 'confirm',
      title: t('dialog.demo.bothButtonsTitle'),
      message: t('dialog.demo.bothButtonsDesc'),
      cancelButtonText: t('dialog.btn.cancel'),
      confirmButtonText: t('dialog.btn.continue'),
      showClose: true,
    })
    return
  }

  Dialog.open({
    type: 'warning',
    title: t('dialog.demo.noFooterTitle'),
    message: t('dialog.demo.noFooterApiDesc'),
    cancelButtonText: '',
    confirmButtonText: '',
    showClose: true,
  })
}

const openApiWithUpdate = () => {
  const instance = Dialog.open({
    type: 'info',
    title: t('dialog.demo.updateInitTitle'),
    message: t('dialog.demo.updateInitDesc'),
    confirmButtonText: t('dialog.btn.close'),
    showClose: true,
  })

  window.setTimeout(() => {
    instance.update({
      title: t('dialog.demo.updateDoneTitle'),
      message: t('dialog.demo.updateDoneDesc'),
    })
  }, 1200)
}

const openApiChain = () => {
  Dialog.open({
    type: 'confirm',
    title: t('dialog.demo.chainFirstTitle'),
    message: t('dialog.demo.chainFirstDesc'),
    cancelButtonText: t('dialog.btn.cancel'),
    confirmButtonText: t('dialog.btn.confirmAndContinue'),
    onConfirm: () => {
      Dialog.open({
        type: 'success',
        title: t('dialog.demo.chainSecondTitle'),
        message: t('dialog.demo.chainSecondDesc'),
        confirmButtonText: t('dialog.btn.finish'),
        showClose: true,
      })
    },
  })
}

const applyGlobalZIndex = () => {
  Dialog.setGlobalZIndex(5000)
  Dialog.open({
    type: 'info',
    title: 'Dialog.setGlobalZIndex',
    message: t('dialog.demo.globalZIndexDesc'),
    confirmButtonText: t('dialog.btn.gotIt'),
    showClose: true,
  })
}

const destroyAllApi = () => {
  Dialog.destroyAll()
}

const handleBeforeClose = (reason: string) => {
  if (reason === 'mask') {
    Dialog.open({
      type: 'warning',
      title: t('dialog.blockedTitle'),
      message: t('dialog.blockedDesc'),
      confirmButtonText: t('dialog.btn.understand'),
      showClose: true,
    })
    return false
  }
  return true
}

const basicCode = `<template>
  <scq-button type="primary" @click="basicVisible = true">打开 Dialog</scq-button>

  <scq-dialog
    v-model="basicVisible"
    title="基础弹窗"
    type="info"
    :show-cancel-button="true"
  >
    <p>这是一个支持取消和确认按钮的 Dialog。</p>
  </scq-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const basicVisible = ref(false)
<\/script>`

const typeCode = `<template>
  <div class="demo-panel">
    <scq-button type="info" @click="openByType('info')">Info</scq-button>
    <scq-button type="success" @click="openByType('success')">Success</scq-button>
    <scq-button type="warning" @click="openByType('warning')">Warning</scq-button>
    <scq-button type="danger" @click="openByType('error')">Error</scq-button>
    <scq-button type="primary" @click="openByType('confirm')">Confirm</scq-button>
  </div>

  <scq-dialog
    v-model="typeVisible"
    :title="activeTypeTitle"
    :type="activeType"
    :show-cancel-button="activeType === 'confirm'"
  >
    <p>当前对话框类型：{{ activeType }}</p>
  </scq-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

const typeVisible = ref(false)
const activeType = ref<DialogType>('info')
const activeTypeTitle = ref('Info')

const titleMap: Record<DialogType, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  confirm: 'Confirm',
}

const openByType = (type: DialogType) => {
  activeType.value = type
  activeTypeTitle.value = titleMap[type]
  typeVisible.value = true
}
<\/script>`

const slotCode = `<template>
  <scq-button type="primary" @click="slotVisible = true">打开自定义内容</scq-button>

  <scq-dialog v-model="slotVisible" title="发布配置确认" :show-close="true">
    <div class="dialog-custom-body">
      <h4>发布前检查项</h4>
      <p>你可以通过默认插槽放入任意内容。</p>
      <ul>
        <li>CPU: 8 Cores</li>
        <li>Memory: 16 GB</li>
        <li>Region: ap-southeast-1</li>
      </ul>
    </div>
    <template #footer="{ cancel, confirm }">
      <scq-button @click="cancel()">稍后处理</scq-button>
      <scq-button type="success" @click="confirm()">立即部署</scq-button>
    </template>
  </scq-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const slotVisible = ref(false)
<\/script>`

const noFooterCode = `<template>
  <scq-button @click="noFooterVisible = true">打开无底部 Dialog</scq-button>

  <scq-dialog
    v-model="noFooterVisible"
    title="无底部区域"
    type="info"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <p>未提供 #footer 插槽，且默认按钮都关闭，因此底部区域不会显示。</p>
  </scq-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const noFooterVisible = ref(false)
<\/script>`

const closeBehaviorCode = `<template>
  <scq-button type="warning" @click="closeBehaviorVisible = true">打开受限关闭 Dialog</scq-button>

  <scq-dialog
    v-model="closeBehaviorVisible"
    title="关闭行为控制"
    type="warning"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-cancel-button="true"
  >
    <p>已关闭右上角叉号、遮罩点击关闭、ESC 关闭，只能通过底部按钮关闭。</p>
  </scq-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const closeBehaviorVisible = ref(false)
<\/script>`

const sizeCode = `<template>
  <scq-button @click="sizeVisible = true">打开宽 760 的 Dialog</scq-button>

  <scq-dialog
    v-model="sizeVisible"
    title="尺寸与层级"
    type="info"
    :width="760"
    :z-index="3500"
    :show-cancel-button="true"
  >
    <p>该示例设置了 width=760 和 z-index=3500。</p>
  </scq-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const sizeVisible = ref(false)
<\/script>`

const fullscreenCode = `<template>
  <scq-button type="primary" @click="fullscreenVisible = true">打开全屏 Dialog</scq-button>

  <scq-dialog
    v-model="fullscreenVisible"
    title="全屏编辑器"
    :fullscreen="true"
    :show-cancel-button="true"
  >
    <p>全屏模式适合复杂表单、多标签页配置或编辑器场景。</p>
  </scq-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const fullscreenVisible = ref(false)
<\/script>`

const apiTypeCode = `<template>
  <div class="demo-panel">
    <scq-button @click="openApi('info')">type: info</scq-button>
    <scq-button type="success" @click="openApi('success')">type: success</scq-button>
    <scq-button type="warning" @click="openApi('warning')">type: warning</scq-button>
    <scq-button type="danger" @click="openApi('error')">type: error</scq-button>
    <scq-button type="primary" @click="openApi('confirm')">type: confirm</scq-button>
  </div>
</template>

<script setup lang="ts">
import { Dialog } from 'scq-vue'

type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

const openApi = (type: DialogType) => {
  const content = '这是通过 Dialog API 打开的弹窗，类型：' + type

  Dialog.open({
    type,
    title: \`Dialog.\${type}\`,
    message: content,
    showClose: true,
    cancelButtonText: type === 'confirm' ? '取消' : '',
    confirmButtonText: '确定',
    onConfirm: () => {
      Dialog.open({
        type: 'success',
        title: '完成',
        message: '你已确认该操作。',
        confirmButtonText: '知道了',
        showClose: true,
      })
    },
  })
}
<\/script>`

const apiButtonsCode = `<template>
  <div class="demo-panel">
    <scq-button @click="openApiButtons('confirm-only')">仅确认按钮</scq-button>
    <scq-button type="primary" @click="openApiButtons('both')">取消 + 确认</scq-button>
    <scq-button type="warning" @click="openApiButtons('none')">无底部</scq-button>
  </div>
</template>

<script setup lang="ts">
import { Dialog } from 'scq-vue'

type ApiButtonMode = 'confirm-only' | 'both' | 'none'

const openApiButtons = (mode: ApiButtonMode) => {
  if (mode === 'confirm-only') {
    Dialog.open({
      type: 'info',
      title: '仅确认按钮',
      message: '只保留确认按钮的 API 调用。',
      confirmButtonText: '知道了',
      cancelButtonText: '',
      showClose: true,
    })
    return
  }

  if (mode === 'both') {
    Dialog.open({
      type: 'confirm',
      title: '取消 + 确认按钮',
      message: '同时配置 cancelButtonText 和 confirmButtonText。',
      cancelButtonText: '取消',
      confirmButtonText: '继续',
      showClose: true,
    })
    return
  }

  Dialog.open({
    type: 'warning',
    title: '无底部',
    message: '两个按钮文案都不配置时，不显示底部区域。',
    cancelButtonText: '',
    confirmButtonText: '',
    showClose: true,
  })
}
<\/script>`

const apiInstanceCode = `<template>
  <scq-button @click="openApiWithUpdate">打开后更新内容</scq-button>
</template>

<script setup lang="ts">
import { Dialog } from 'scq-vue'

const openApiWithUpdate = () => {
  const instance = Dialog.open({
    type: 'info',
    title: '初始标题',
    message: '弹窗打开后 1.2 秒会更新标题和内容。',
    confirmButtonText: '关闭',
    showClose: true,
  })

  window.setTimeout(() => {
    instance.update({
      title: '已更新标题',
      message: '这是通过 instance.update 动态更新后的内容。',
    })
  }, 1200)
}
<\/script>`

const apiChainCode = `<template>
  <scq-button type="primary" @click="openApiChain">打开链式弹窗</scq-button>
</template>

<script setup lang="ts">
import { Dialog } from 'scq-vue'

const openApiChain = () => {
  Dialog.open({
    type: 'confirm',
    title: '第一步确认',
    message: '点击确定后会继续打开第二个弹窗。',
    cancelButtonText: '取消',
    confirmButtonText: '确定并继续',
    onConfirm: () => {
      Dialog.open({
        type: 'success',
        title: '第二个弹窗',
        message: '这是点击上一个弹窗“确定”后打开的。',
        confirmButtonText: '完成',
        showClose: true,
      })
    },
  })
}
<\/script>`

const apiGlobalCode = `<template>
  <div class="demo-panel">
    <scq-button @click="applyGlobalZIndex">Dialog.setGlobalZIndex</scq-button>
    <scq-button type="danger" @click="destroyAllApi">Dialog.destroyAll</scq-button>
  </div>
</template>

<script setup lang="ts">
import { Dialog } from 'scq-vue'

const applyGlobalZIndex = () => {
  Dialog.setGlobalZIndex(5000)

  Dialog.open({
    type: 'info',
    title: 'Dialog.setGlobalZIndex',
    message: '已将全局 zIndex 起始值设置为 5000。',
    confirmButtonText: '知道了',
    showClose: true,
  })
}

const destroyAllApi = () => {
  Dialog.destroyAll()
}
<\/script>`

const beforeCloseCode = `<template>
  <scq-button type="primary" @click="beforeCloseVisible = true">打开关闭拦截示例</scq-button>

  <scq-dialog
    v-model="beforeCloseVisible"
    title="请确认关闭方式"
    type="warning"
    :show-cancel-button="true"
    :before-close="handleBeforeClose"
  >
    <p>示例中点击遮罩会被 beforeClose 拦截，其它关闭方式可正常关闭。</p>
  </scq-dialog>
</template>

<script setup lang="ts">
import { Dialog } from 'scq-vue'
import { ref } from 'vue'

const beforeCloseVisible = ref(false)

const handleBeforeClose = (reason: string) => {
  if (reason === 'mask') {
    Dialog.open({
      type: 'warning',
      title: '已拦截关闭',
      message: '当前示例不允许通过点击遮罩关闭 Dialog。',
      confirmButtonText: '明白',
      showClose: true,
    })
    return false
  }
  return true
}
<\/script>`

</script>

<style scoped>
.dialog-custom-body {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
}

.dialog-custom-body h4 {
  margin: 0 0 8px;
  color: #303133;
}

.dialog-custom-body p {
  margin: 0 0 8px;
}

.dialog-custom-body ul {
  margin: 0;
  padding-left: 18px;
  color: #606266;
}
</style>
