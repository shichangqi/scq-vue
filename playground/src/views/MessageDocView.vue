<template>
  <section class="doc-block">
    <h1>{{ t('message.title') }}</h1>
    <p class="lead">{{ t('message.lead') }}</p>

    <h2>{{ t('message.template') }}</h2>
    <DocExample :code="templateCode" lang="vue">
      <div class="message-template-demo">
        <div class="message-template-demo__preview">
          <scq-message v-model="templateVisible" type="success" message="保存成功" description="模板方式适合页面局部或受控提示。" :teleport="false" :duration="0" closable />
          <span v-if="!templateVisible" class="message-template-demo__empty">Message 已隐藏</span>
        </div>
        <div class="message-template-demo__actions">
          <scq-button type="success" @click="templateVisible = true">{{ t('message.showTemplate') }}</scq-button>
        </div>
      </div>
    </DocExample>

    <h2>{{ t('message.api') }}</h2>
    <DocExample :code="apiCode" lang="vue">
      <div class="chat-demo-actions">
        <scq-button size="small" @click="openInfo">Message.info</scq-button>
        <scq-button size="small" type="success" @click="openSuccess">Message.success</scq-button>
        <scq-button size="small" type="warning" @click="openWarning">Message.warning</scq-button>
        <scq-button size="small" type="danger" @click="openError">Message.error</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('message.placement') }}</h2>
    <DocExample :code="placementCode" lang="vue">
      <div class="chat-demo-actions">
        <scq-button v-for="placement in placements" :key="placement" size="small" @click="openPlacement(placement)">{{ placement }}</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('message.props') }}</h2>
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
        <tr><td>v-model</td><td>{{ t('message.model.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>type</td><td>{{ t('message.type.desc') }}</td><td>info | success | warning | error | loading</td><td>info</td></tr>
        <tr><td>message</td><td>{{ t('message.message.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>description</td><td>{{ t('message.description.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>duration</td><td>{{ t('message.duration.desc') }}</td><td>number</td><td>3000</td></tr>
        <tr><td>closable</td><td>{{ t('message.closable.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>placement</td><td>{{ t('message.placement.desc') }}</td><td>top | top-left | top-right | bottom | bottom-left | bottom-right</td><td>top</td></tr>
        <tr><td>offset</td><td>{{ t('message.offset.desc') }}</td><td>number</td><td>24</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'
import { Message, type MessagePlacement } from 'scq-vue'

const templateVisible = ref(false)
const placements: MessagePlacement[] = ['top', 'top-left', 'top-right', 'bottom', 'bottom-left', 'bottom-right']

const openInfo = () => {
  Message.info('这是一条普通提示')
}

const openSuccess = () => {
  Message.success({ message: '保存成功', description: 'API 调用会自动挂载到页面顶部。' })
}

const openWarning = () => {
  Message.warning({ message: '请检查配置', duration: 4000 })
}

const openError = () => {
  Message.error({ message: '提交失败', description: '可以传入 description 展示更多上下文。', closable: true, duration: 0 })
}

const openPlacement = (placement: MessagePlacement) => {
  Message.info({
    message: `当前位置：${placement}`,
    description: 'placement 可用于控制全局提示出现的位置。',
    placement,
  })
}

const templateCode = `<template>
  <div class="message-template-demo">
    <div class="message-template-demo__preview">
      <scq-message
        v-model="visible"
        type="success"
        message="保存成功"
        description="模板方式适合页面局部或受控提示。"
        :teleport="false"
        :duration="0"
        closable
      />
      <span v-if="!visible" class="message-template-demo__empty">Message 已隐藏</span>
    </div>
    <div class="message-template-demo__actions">
      <scq-button type="success" @click="visible = true">重新显示模板提示</scq-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
<\/script>`

const apiCode = `<script setup lang="ts">
import { Message } from 'scq-vue'

Message.info('这是一条普通提示')

Message.success({
  message: '保存成功',
  description: 'API 调用会自动挂载到页面顶部。',
})

Message.error({
  message: '提交失败',
  description: '可以传入 description 展示更多上下文。',
  closable: true,
  duration: 0,
})
<\/script>`

const placementCode = `<script setup lang="ts">
import { Message } from 'scq-vue'

Message.info({
  message: '右上角提示',
  description: 'placement 支持 top、top-left、top-right、bottom、bottom-left、bottom-right。',
  placement: 'top-right',
})

Message.success({
  message: '底部居中提示',
  placement: 'bottom',
  offset: 32,
})
<\/script>`
</script>

<style scoped>
.message-template-demo {
  display: grid;
  gap: 14px;
  border: 1px solid var(--demo-border-color, #dcfce7);
  border-radius: 8px;
  padding: 16px;
  background: linear-gradient(135deg, var(--demo-bg-start, #fbfffb) 0%, var(--demo-bg-end, #f0fdf4) 100%);
}

.message-template-demo__preview {
  display: flex;
  align-items: center;
  min-height: 74px;
}

.message-template-demo__empty {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  border: 1px dashed #b3e19d;
  border-radius: 6px;
  padding: 0 14px;
  color: #67c23a;
  background: rgba(240, 249, 235, 0.72);
  font-size: 13px;
}

.message-template-demo__actions {
  display: flex;
  justify-content: flex-start;
}
</style>
