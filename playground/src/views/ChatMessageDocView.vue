<template>
  <section class="doc-block">
    <h1>{{ t('chat.title') }}</h1>
    <p class="lead">{{ t('chat.lead') }}</p>

    <h2>{{ t('chat.basic') }}</h2>
    <DocExample :code="basicCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message :message="plainText" role="ai" name="SCQ Assistant" :timestamp="messageTime" />
        <scq-chat-message :message="plainText" role="user" name="Chauncy" :show-time="false" />
      </div>
    </DocExample>

    <h2>{{ t('chat.profile') }}</h2>
    <DocExample :code="profileCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message
          message="头像图片、头像文字和展示昵称可以分别配置。"
          role="ai"
          name="SCQ Assistant"
          avatar-text="AI"
          avatar-alt="SCQ Assistant avatar"
          :avatar="assistantAvatar"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
        <scq-chat-message
          message="也可以隐藏头像或昵称，适配更紧凑的列表。"
          role="user"
          name="Chauncy"
          :show-avatar="false"
          :show-time="false"
        />
      </div>
    </DocExample>

    <h2>{{ t('chat.json') }}</h2>
    <DocExample :code="jsonCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message :message="jsonPayload" role="ai" content-type="json" :timestamp="messageTime" />
      </div>
    </DocExample>

    <h2>{{ t('chat.markdown') }}</h2>
    <DocExample :code="markdownCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message
          :message="markdownPayload"
          role="ai"
          content-type="markdown"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
      </div>
    </DocExample>

    <!-- <h2>真实流式 SSE 调试</h2>
    <DocExample :code="streamingMarkdownCode" lang="vue" :default-expanded="true">
      <div class="demo-grid">
        <div class="stream-debug-panel">
          <label class="stream-debug-panel__label" for="chat-stream-question">question</label>
          <textarea
            id="chat-stream-question"
            v-model="streamQuestion"
            class="stream-debug-panel__textarea"
            rows="3"
          ></textarea>
          <div class="stream-debug-panel__fields">
            <label class="stream-debug-panel__field">
              <span>Chatos8 user_id</span>
              <input v-model="aichatosUserId" class="stream-debug-panel__input" placeholder="/home 链路必填，free 可留空" />
            </label>
            <label class="stream-debug-panel__field">
              <span>Chatos8 Authorization Token</span>
              <input
                v-model="aichatosAuthorization"
                class="stream-debug-panel__input"
                type="password"
                autocomplete="off"
                placeholder="可粘原始 token、token=... 或含 %2B/%3D 的值"
              />
            </label>
          </div>
          <div class="stream-debug-panel__actions">
            <button type="button" class="stream-debug-panel__button" :disabled="streamLoading" @click="runStreamDebug">
              {{ streamLoading ? '请求中...' : '调用真实流式接口' }}
            </button>
            <button type="button" class="stream-debug-panel__button" :disabled="streamLoading" @click="runStreamTableDebug">
              调用真实表格接口
            </button>
            <button type="button" class="stream-debug-panel__button" :disabled="streamLoading" @click="runAichatosFreeStreamDebug">
              调用 Chatos8 free SSE
            </button>
            <button
              type="button"
              class="stream-debug-panel__button"
              :disabled="streamLoading || !aichatosUserId.trim() || !aichatosAuthorization.trim()"
              @click="runAichatosHomeStreamDebug"
            >
              调用 Chatos8 /home 链路
            </button>
            <button type="button" class="stream-debug-panel__button is-secondary" :disabled="streamLoading" @click="loadStreamFixture">
              加载 Markdown 样例
            </button>
            <button type="button" class="stream-debug-panel__button is-secondary" :disabled="streamLoading" @click="loadStreamTableFixture">
              加载 Markdown 表格样例
            </button>
            <button type="button" class="stream-debug-panel__button is-secondary" :disabled="!streamLoading" @click="abortStreamDebug">
              停止
            </button>
          </div>
          <p class="stream-debug-panel__meta">
            Markdown 长度：{{ (streamMarkdownContent || '').length }} 字符；SSE data 帧：{{ streamFrameCount }}；stop 帧：{{ streamStopFrameCount }}；组件只接收 markdown。
          </p>
          <p v-if="streamSourceMeta" class="stream-debug-panel__meta">来源：{{ streamSourceMeta }}</p>
          <pre v-if="streamLastFrameSample" class="stream-debug-panel__frame">最近 data 帧：{{ streamLastFrameSample }}</pre>
          <pre v-if="streamRecentFrameSamples.length" class="stream-debug-panel__frame">最近 {{ streamRecentFrameSamples.length }} 个原始 data payload：
{{ streamRecentFrameSamples.join('\n---\n') }}</pre>
          <p v-if="streamError" class="stream-debug-panel__error">{{ streamError }}</p>
        </div>

        <scq-chat-message
          :message="streamMarkdownContent"
          role="ai"
          name="真实接口 Markdown"
          content-type="markdown"
          :status="streamStatus"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
      </div>
    </DocExample> -->

    <h2>{{ t('chat.actions') }}</h2>
    <DocExample :code="actionsCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message
          message="这个示例使用 actions 插槽放置复制、重试、反馈等消息操作。"
          role="ai"
          name="SCQ Assistant"
          :show-time="false"
        >
          <template #actions>
            <button type="button" class="scq-chat-message__action" aria-label="复制" title="复制">
              <scq-icon name="copy" :size="14" />
            </button>
            <button type="button" class="scq-chat-message__action" aria-label="重新生成" title="重新生成">
              <scq-icon name="refresh" :size="14" />
            </button>
            <button type="button" class="scq-chat-message__action" aria-label="有帮助" title="有帮助">
              <scq-icon name="thumbs-up" :size="14" />
            </button>
          </template>
        </scq-chat-message>
      </div>
    </DocExample>

    <h2>{{ t('chat.choice') }}</h2>
    <DocExample :code="choiceCode" lang="vue" :default-expanded="true">
      <div class="demo-grid">
        <h3 class="chat-choice-demo__title">单选</h3>
        <scq-chat-message
          message="请选择你希望回答采用的详细程度。"
          role="ai"
          name="SCQ Assistant"
          :show-time="false"
        >
          <template #interaction>
            <scq-chat-choice
              v-model="singleAnswer"
              name="answer-detail"
              :options="singleOptions"
              @change="singleSubmitted = null"
              @submit="handleSingleSubmit"
            >
              <template #option="{ option, index, selected }">
                <span class="chat-choice-demo__option" :class="{ 'is-selected': selected }">
                  <span class="chat-choice-demo__index">0{{ index + 1 }}</span>
                  <span>
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.description }}</small>
                  </span>
                </span>
              </template>
            </scq-chat-choice>
            <pre v-if="singleSubmitted" class="chat-choice-demo__result">{{ JSON.stringify(singleSubmitted, null, 2) }}</pre>
          </template>
        </scq-chat-message>

        <h3 class="chat-choice-demo__title">多选</h3>
        <scq-chat-message
          message="请选择要包含的输出内容，最多选择两项。"
          role="ai"
          name="SCQ Assistant"
          :show-time="false"
        >
          <template #interaction>
            <scq-chat-choice
              v-model="multipleAnswer"
              mode="multiple"
              name="output-sections"
              :options="multipleOptions"
              :max="2"
              @change="multipleSubmitted = null"
              @submit="handleMultipleSubmit"
            />
            <pre v-if="multipleSubmitted" class="chat-choice-demo__result">{{ JSON.stringify(multipleSubmitted, null, 2) }}</pre>
          </template>
        </scq-chat-message>

        <h3 class="chat-choice-demo__title">包含其他输入</h3>
        <scq-chat-message
          message="请选择消息发送渠道；没有合适选项时可以填写其他渠道。"
          role="ai"
          name="SCQ Assistant"
          :show-time="false"
        >
          <template #interaction>
            <scq-chat-choice
              v-model="otherAnswer"
              mode="multiple"
              name="delivery-channel"
              :options="channelOptions"
              allow-other
              other-label="其他渠道"
              other-placeholder="请输入渠道名称"
              :other-maxlength="40"
              @change="otherSubmitted = null"
              @submit="handleOtherSubmit"
            />
            <pre v-if="otherSubmitted" class="chat-choice-demo__result">{{ JSON.stringify(otherSubmitted, null, 2) }}</pre>
          </template>
        </scq-chat-message>
      </div>
    </DocExample>

    <h2>{{ t('chat.markdown.table') }}</h2>
    <DocExample :code="complexMarkdownCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message
          :message="vueComparePayload"
          role="ai"
          content-type="markdown"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
      </div>
    </DocExample>

    <h2>{{ t('chat.status') }}</h2>
    <DocExample :code="statusCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message
          message=""
          role="ai"
          :status="{ type: 'thinking', text: '正在思考中' }"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
        <scq-chat-message
          message=""
          role="ai"
          :status="{ type: 'tool', text: '正在调用 pnpm run build' }"
          :show-time="false"
        />
        <scq-chat-message
          message=""
          role="ai"
          :status="{ type: 'loading', text: '正在处理中' }"
          :show-time="false"
        />
        <scq-chat-message
          message="检查完成，当前变更可以进入下一步。"
          role="ai"
          :show-time="false"
        />
        <scq-chat-message
          message="检测到还有未提交的 Select 相关改动，请确认是否属于本次发布。"
          role="ai"
          :show-time="false"
        />
        <scq-chat-message
          message=""
          role="ai"
          :status="{ type: 'error', text: '处理失败', loading: false }"
          :show-time="false"
        />
      </div>
    </DocExample>

    <h2>{{ t('chat.media') }}</h2>
    <DocExample :code="mediaCode" lang="vue" :default-expanded="true">
      <div class="demo-grid">
        <scq-chat-message
          :message="imageUrl"
          role="ai"
          content-type="image"
          image-fallback-text="图片暂时无法加载"
          :timestamp="messageTime"
          :time-formatter="formatTime"
          @preview-open="handlePreviewOpen"
          @preview-close="handlePreviewClose"
          @image-error="handleImageError"
        />
        <scq-chat-message
          :message="videoPayload"
          role="user"
          content-type="video"
          :show-time="false"
        />
      </div>
    </DocExample>

    <h2>{{ t('chat.attachments') }}</h2>
    <DocExample :code="attachmentsCode" lang="vue" :default-expanded="true">
      <div class="demo-grid">
        <scq-chat-message
          :message="attachmentMessage"
          role="ai"
          name="SCQ Assistant"
          :attachments="fileAttachments"
          :attachment-click="handleAttachmentClick"
          @attachment-click="trackAttachmentClick"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
      </div>
    </DocExample>

    <h2>{{ t('chat.full') }}</h2>
    <DocExample :code="fullExampleCode" lang="vue" :default-expanded="true">
      <div class="demo-grid">
        <scq-chat-message
          :message="apiData"
          role="ai"
          content-type="json"
          :show-time="true"
          :timestamp="currentTime"
          :time-formatter="formatTime"
        />
      </div>
    </DocExample>

    <h2>{{ t('chat.props') }}</h2>
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
        <tr><td>message</td><td>{{ t('chat.message.desc') }}</td><td>unknown</td><td>-</td></tr>
        <tr><td>role</td><td>{{ t('chat.role.desc') }}</td><td>ai | user</td><td>ai</td></tr>
        <tr><td>contentType</td><td>{{ t('chat.contentType.desc') }}</td><td>auto | text | markdown | json | image | video</td><td>auto</td></tr>
        <tr><td>markdownBreaks</td><td>{{ t('chat.markdownBreaks.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>avatar</td><td>{{ t('chat.avatar.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>avatarText</td><td>{{ t('chat.avatarText.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>avatarAlt</td><td>{{ t('chat.avatarAlt.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>name</td><td>{{ t('chat.name.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>showAvatar</td><td>{{ t('chat.showAvatar.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>showName</td><td>{{ t('chat.showName.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>status</td><td>{{ t('chat.status.desc') }}</td><td>{ type, text, loading, visible }</td><td>null</td></tr>
        <tr><td>linkTarget</td><td>{{ t('chat.linkTarget.desc') }}</td><td>string</td><td>_blank</td></tr>
        <tr><td>linkRel</td><td>{{ t('chat.linkRel.desc') }}</td><td>string</td><td>noopener noreferrer</td></tr>
        <tr><td>previewable</td><td>{{ t('chat.previewable.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>imageFallbackText</td><td>{{ t('chat.imageFallbackText.desc') }}</td><td>string</td><td>图片加载失败</td></tr>
        <tr><td>attachments</td><td>{{ t('chat.attachments.desc') }}</td><td>ChatAttachment[]</td><td>[]</td></tr>
        <tr><td>attachmentClick</td><td>{{ t('chat.attachmentClick.desc') }}</td><td>(payload, event) =&gt; boolean | void</td><td>-</td></tr>
        <tr><td>showTime</td><td>{{ t('chat.showTime.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>timestamp</td><td>{{ t('chat.timestamp.desc') }}</td><td>string | number | Date | null</td><td>null</td></tr>
        <tr><td>timeFormatter</td><td>{{ t('chat.timeFormatter.desc') }}</td><td>(value) =&gt; string</td><td>-</td></tr>
      </tbody>
    </table>

    <h2>{{ t('chat.events') }}</h2>
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
        <tr><td>@attachment-click</td><td>{{ t('chat.attachmentClickEvent.desc') }}</td><td>(payload, event) =&gt; void</td><td>-</td></tr>
        <tr><td>@preview-open</td><td>{{ t('chat.previewOpen.desc') }}</td><td>(src) =&gt; void</td><td>-</td></tr>
        <tr><td>@preview-close</td><td>{{ t('chat.previewClose.desc') }}</td><td>(src) =&gt; void</td><td>-</td></tr>
        <tr><td>@image-error</td><td>{{ t('chat.imageError.desc') }}</td><td>(src) =&gt; void</td><td>-</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'
import { Message, type ChatChoiceAnswer, type ChatChoiceOption } from 'scq-vue'

const plainText = '这是普通字符串消息，适合展示接口直接返回的文本。'

const basicCode = `<template>
  <scq-chat-message :message="plainText" role="ai" name="SCQ Assistant" :timestamp="messageTime" />
  <scq-chat-message :message="plainText" role="user" name="Chauncy" :show-time="false" />
</template>

<script setup lang="ts">
const plainText = '这是普通字符串消息，适合展示接口直接返回的文本。'
const messageTime = Date.now()
<\/script>`

const profileCode = `<template>
  <scq-chat-message
    message="头像图片、头像文字和展示昵称可以分别配置。"
    role="ai"
    name="SCQ Assistant"
    avatar-text="AI"
    avatar-alt="SCQ Assistant avatar"
    :avatar="assistantAvatar"
    :timestamp="messageTime"
  />

  <scq-chat-message
    message="也可以隐藏头像或昵称，适配更紧凑的列表。"
    role="user"
    name="Chauncy"
    :show-avatar="false"
    :show-time="false"
  />
</template>

<script setup lang="ts">
const assistantAvatar = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=120&q=80'
const messageTime = Date.now()
<\/script>`

const jsonCode = `<template>
  <scq-chat-message
    :message="jsonPayload"
    role="ai"
    content-type="json"
    :timestamp="messageTime"
  />
</template>

<script setup lang="ts">
const jsonPayload = {
  id: 'msg_001',
  status: 'ok',
  data: {
    title: '接口返回结构化数据',
    list: ['第一项', '第二项', '第三项'],
  },
}

const messageTime = Date.now()
<\/script>`

const markdownCode = `<template>
  <scq-chat-message
    :message="markdownPayload"
    role="ai"
    content-type="markdown"
    link-target="_blank"
    link-rel="noopener noreferrer"
    :timestamp="messageTime"
    :time-formatter="formatTime"
  />
</template>

<script setup lang="ts">
const markdownPayload = '# 接口返回 Markdown\\n\\n第一行\\n第二行\\n\\n- 第一项\\n- 第二项\\n- [访问文档](https://example.com)'
const messageTime = Date.now()

const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return '消息时间: ' + date.toLocaleString('zh-CN', { hour12: false })
}
<\/script>`

const actionsCode = `<template>
  <scq-chat-message
    message="这个示例使用 actions 插槽放置复制、重试、反馈等消息操作。"
    role="ai"
    name="SCQ Assistant"
    :show-time="false"
  >
    <template #actions>
      <button type="button" class="scq-chat-message__action" aria-label="复制" title="复制">
        <scq-icon name="copy" :size="14" />
      </button>
      <button type="button" class="scq-chat-message__action" aria-label="重新生成" title="重新生成">
        <scq-icon name="refresh" :size="14" />
      </button>
      <button type="button" class="scq-chat-message__action" aria-label="有帮助" title="有帮助">
        <scq-icon name="thumbs-up" :size="14" />
      </button>
    </template>
  </scq-chat-message>
</template>`

const choiceCode = `<template>
  <h3 class="chat-choice-demo__title">单选</h3>
  <scq-chat-message
    message="请选择你希望回答采用的详细程度。"
    role="ai"
    name="SCQ Assistant"
    :show-time="false"
  >
    <template #interaction>
      <scq-chat-choice
        v-model="singleAnswer"
        name="answer-detail"
        :options="singleOptions"
        @change="singleSubmitted = null"
        @submit="handleSingleSubmit"
      >
        <template #option="{ option, index, selected }">
          <span class="chat-choice-demo__option" :class="{ 'is-selected': selected }">
            <span class="chat-choice-demo__index">0{{ index + 1 }}</span>
            <span>
              <strong>{{ option.label }}</strong>
              <small>{{ option.description }}</small>
            </span>
          </span>
        </template>
      </scq-chat-choice>
      <pre v-if="singleSubmitted" class="chat-choice-demo__result">{{ JSON.stringify(singleSubmitted, null, 2) }}</pre>
    </template>
  </scq-chat-message>

  <h3 class="chat-choice-demo__title">多选</h3>
  <scq-chat-message
    message="请选择要包含的输出内容，最多选择两项。"
    role="ai"
    name="SCQ Assistant"
    :show-time="false"
  >
    <template #interaction>
      <scq-chat-choice
        v-model="multipleAnswer"
        mode="multiple"
        name="output-sections"
        :options="multipleOptions"
        :max="2"
        @change="multipleSubmitted = null"
        @submit="handleMultipleSubmit"
      />
      <pre v-if="multipleSubmitted" class="chat-choice-demo__result">{{ JSON.stringify(multipleSubmitted, null, 2) }}</pre>
    </template>
  </scq-chat-message>

  <h3 class="chat-choice-demo__title">包含其他输入</h3>
  <scq-chat-message
    message="请选择消息发送渠道；没有合适选项时可以填写其他渠道。"
    role="ai"
    name="SCQ Assistant"
    :show-time="false"
  >
    <template #interaction>
      <scq-chat-choice
        v-model="otherAnswer"
        mode="multiple"
        name="delivery-channel"
        :options="channelOptions"
        allow-other
        other-label="其他渠道"
        other-placeholder="请输入渠道名称"
        :other-maxlength="40"
        @change="otherSubmitted = null"
        @submit="handleOtherSubmit"
      />
      <pre v-if="otherSubmitted" class="chat-choice-demo__result">{{ JSON.stringify(otherSubmitted, null, 2) }}</pre>
    </template>
  </scq-chat-message>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChatChoiceAnswer, ChatChoiceOption } from 'scq-vue'

const createChoiceAnswer = (): ChatChoiceAnswer => ({
  values: [],
})

const singleAnswer = ref<ChatChoiceAnswer>(createChoiceAnswer())
const multipleAnswer = ref<ChatChoiceAnswer>(createChoiceAnswer())
const otherAnswer = ref<ChatChoiceAnswer>(createChoiceAnswer())
const singleSubmitted = ref<ChatChoiceAnswer | null>(null)
const multipleSubmitted = ref<ChatChoiceAnswer | null>(null)
const otherSubmitted = ref<ChatChoiceAnswer | null>(null)

const singleOptions: ChatChoiceOption[] = [
  { value: 'concise', label: '简洁', description: '只保留结论和关键步骤' },
  { value: 'standard', label: '标准', description: '给出结论、步骤和必要说明' },
  { value: 'detailed', label: '详细', description: '补充原理、边界和完整示例' },
]

const multipleOptions: ChatChoiceOption[] = [
  { value: 'summary', label: '结论摘要' },
  { value: 'code', label: '代码示例' },
  { value: 'tests', label: '测试建议' },
]

const channelOptions: ChatChoiceOption[] = [
  { value: 'email', label: '邮件' },
  { value: 'sms', label: '短信' },
]

const handleSingleSubmit = (answer: ChatChoiceAnswer) => {
  singleSubmitted.value = answer
}

const handleMultipleSubmit = (answer: ChatChoiceAnswer) => {
  multipleSubmitted.value = answer
}

const handleOtherSubmit = (answer: ChatChoiceAnswer) => {
  otherSubmitted.value = answer
}
<\/script>

<style scoped>
.chat-choice-demo__title {
  margin: 8px 0 0;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.chat-choice-demo__title:first-child {
  margin-top: 0;
}

.chat-choice-demo__option {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
}

.chat-choice-demo__index {
  color: #94a3b8;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.chat-choice-demo__option strong,
.chat-choice-demo__option small {
  display: block;
}

.chat-choice-demo__option strong {
  color: #1e293b;
  font-size: 14px;
}

.chat-choice-demo__option small {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 400;
}

.chat-choice-demo__option.is-selected .chat-choice-demo__index,
.chat-choice-demo__option.is-selected strong {
  color: #2563eb;
}

.chat-choice-demo__result {
  margin: 8px 0 0;
  padding: 10px 12px;
  overflow: auto;
  border-left: 3px solid #16a34a;
  background: #f0fdf4;
  color: #166534;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}
<\/style>`

const complexMarkdownCode = `<template>
  <scq-chat-message
    :message="vueComparePayload"
    role="ai"
    content-type="markdown"
    :timestamp="messageTime"
    :time-formatter="formatTime"
  />
</template>

<script setup lang="ts">
const vueComparePayload = '| 对比维度 | Vue 2 | Vue 3 |\\n|---|---|---|\\n| 响应式 | defineProperty | Proxy |\\n| 组合能力 | Mixin 为主 | Composition API |'
const messageTime = Date.now()

const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return '消息时间: ' + date.toLocaleString('zh-CN', { hour12: false })
}
<\/script>`

/* const streamingMarkdownCode = `<template>
  <textarea v-model="streamQuestion" />
  <input v-model="aichatosUserId" placeholder="Chatos8 user_id" />
  <input v-model="aichatosAuthorization" type="password" placeholder="Chatos8 Authorization Token" />
  <button :disabled="streamLoading" @click="runStreamDebug">调用真实流式接口</button>
  <button :disabled="streamLoading" @click="runAichatosFreeStreamDebug">调用 Chatos8 free SSE</button>
  <button :disabled="streamLoading || !aichatosUserId.trim() || !aichatosAuthorization.trim()" @click="runAichatosHomeStreamDebug">
    调用 Chatos8 /home 链路
  </button>

  <!-- SSE 在请求层解析成 markdown 后再交给组件。 -->
  <scq-chat-message
    :message="streamMarkdownContent"
    role="ai"
    content-type="markdown"
    :status="streamStatus"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const streamQuestion = ref('给我一个 react 的 input 组件代码')
const streamTableQuestion = '请只返回一个 markdown 表格，表头为 功能 和 说明，至少 3 行，不要代码块，不要额外解释'
const streamMarkdownContent = ref('')
const streamLoading = ref(false)
const streamError = ref('')
const streamController = ref<AbortController | null>(null)
const streamLineBuffer = ref('')
const streamEventLines = ref<string[]>([])
const streamRecentFrameSamples = ref<string[]>([])
const aichatosUserId = ref('')
const aichatosAuthorization = ref('')

// Chatos8 /home 抓包链路：
// 1. POST /go/api/group/add 创建会话，响应 AES-CBC 解密后取 data.group_id。
// 2. POST /go/api/steam/see 创建问题，响应 AES-CBC 解密后取 data.question_id。
// 3. GET /go/api/event/see?question_id=...&group_id=...&user_id=...&token=...&server_id=1。
// 4. SSE 帧形如 event:message + data:{"Data":"...","Status":"","QuestionId":"...","GroupId":"...","Type":"question"}，结束帧 Status/Type 为 stop。

const streamStatus = computed(() => ({
  type: streamError.value ? 'error' : 'loading',
  text: streamError.value || (streamLoading.value ? '正在读取流式接口' : ''),
  loading: streamLoading.value,
  visible: streamLoading.value || Boolean(streamError.value),
}))

const getStreamPayloadText = (payload: string): string => {
  if (!payload || payload === '[DONE]') return ''
  const text = payload.trim()
  if (!/^[{[]/.test(text)) return payload

  try {
    const json = JSON.parse(text)
    return json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? json?.content ?? json?.text ?? ''
  } catch {
    return payload
  }
}

const flushStreamEvent = () => {
  if (!streamEventLines.value.length) return
  const dataLines = streamEventLines.value
    .map((line) => line.match(/^data:[ \t]?(.*)$/)?.[1])
    .filter((line): line is string => line !== undefined)
  const rawLines = streamEventLines.value.filter((line) => !line.startsWith(':') && !/^(event|id|retry|data):/.test(line))

  if (dataLines.length) {
    let content = dataLines.length === 1 && dataLines[0] === '' ? '\n' : getStreamPayloadText(dataLines.join('\n'))
    rawLines.forEach((line) => {
      const separator = content.endsWith('|') && line.trim().startsWith('|') ? '\n' : ''
      content += separator + line
    })
    streamMarkdownContent.value += content
  } else if (rawLines.length) {
    streamMarkdownContent.value += rawLines.join('\n') + '\n'
  }

  streamEventLines.value = []
}

const appendStreamLine = (line: string) => {
  if (!line.trim()) {
    if (!streamEventLines.value.length) {
      streamMarkdownContent.value += '\n'
      return
    }

    flushStreamEvent()
    return
  }

  if (!line.startsWith(':') && !/^(event|id|retry):/.test(line)) {
    streamEventLines.value.push(line)
  }
}

const appendStreamChunk = (chunk: string) => {
  const lines = (streamLineBuffer.value + chunk.replace(/\r\n?/g, '\n')).split('\n')
  streamLineBuffer.value = lines.pop() ?? ''
  lines.forEach(appendStreamLine)
}

const flushStreamChunk = () => {
  if (streamLineBuffer.value) {
    appendStreamLine(streamLineBuffer.value)
    streamLineBuffer.value = ''
  }

  flushStreamEvent()
}

const runStreamDebug = async () => {
  streamController.value?.abort()
  streamMarkdownContent.value = ''
  streamLineBuffer.value = ''
  streamEventLines.value = []
  streamError.value = ''
  streamLoading.value = true

  const controller = new AbortController()
  streamController.value = controller

  try {
    const url = '/api/AI/GetChatGptAnswerStream?' + new URLSearchParams({ question: streamQuestion.value, aiModel: 'qwen-max', temperatureNumber: '0.7' })
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('HTTP ' + response.status)
    if (!response.body) throw new Error('当前浏览器不支持 ReadableStream')

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      appendStreamChunk(decoder.decode(value, { stream: true }))
    }

    appendStreamChunk(decoder.decode())
    flushStreamChunk()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    streamError.value = error instanceof Error ? error.message : String(error)
  } finally {
    streamLoading.value = false
    streamController.value = null
  }
}

const runAichatosFreeStreamDebug = async () => {
  // POST /chatos8/go/api/event/free，data JSON 的 Data 字段直接拼成 markdown。
}

const runAichatosHomeStreamDebug = async () => {
  // 使用上面的三步链路拿到 /event/see 的真实 SSE，再复用同一套 data.Data 解析。
}
<\/script>` */

const statusCode = `<template>
  <scq-chat-message
    message=""
    role="ai"
    :status="{ type: 'thinking', text: '正在思考中' }"
  />

  <scq-chat-message
    message=""
    role="ai"
    :status="{ type: 'tool', text: '正在调用 pnpm run build' }"
  />

  <scq-chat-message
    message=""
    role="ai"
    :status="{ type: 'loading', text: '正在处理中' }"
  />

  <scq-chat-message
    message="检查完成，当前变更可以进入下一步。"
    role="ai"
  />

  <scq-chat-message
    message="检测到还有未提交的 Select 相关改动，请确认是否属于本次发布。"
    role="ai"
  />

  <scq-chat-message
    message=""
    role="ai"
    :status="{ type: 'error', text: '处理失败', loading: false }"
  />
</template>`

const mediaCode = `<template>
  <!-- 图片：传 URL，并指定 content-type -->
  <scq-chat-message
    :message="imageUrl"
    role="ai"
    content-type="image"
    image-fallback-text="图片暂时无法加载"
    :timestamp="messageTime"
    :time-formatter="formatTime"
    @preview-open="handlePreviewOpen"
    @preview-close="handlePreviewClose"
    @image-error="handleImageError"
  />

  <!-- 视频：传对象，可配置 controls、poster 等媒体属性 -->
  <scq-chat-message
    :message="videoPayload"
    role="user"
    content-type="video"
    :show-time="false"
  />

  <!-- 也可以通过对象里的 type 自动识别媒体类型 -->
  <scq-chat-message
    :message="autoImagePayload"
    role="ai"
    :show-time="false"
  />
</template>

<script setup lang="ts">
import { Message } from 'scq-vue'

const imageUrl = 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80'

const videoPayload = {
  src: 'https://www.w3schools.com/html/movie.mp4',
  controls: true,
}

const autoImagePayload = {
  type: 'image',
  src: imageUrl,
  alt: '代码编辑器示例图',
}

const messageTime = Date.now()

const handlePreviewOpen = (src: string) => {
  Message.info({ message: '图片预览已打开', description: src })
}

const handlePreviewClose = (src: string) => {
  Message.success({ message: '图片预览已关闭', description: src })
}

const handleImageError = (src: string) => {
  Message.error({ message: '图片加载失败', description: src })
}
<\/script>`

const attachmentsCode = `<template>
  <scq-chat-message
    :message="attachmentMessage"
    role="ai"
    name="SCQ Assistant"
    :attachments="fileAttachments"
    :attachment-click="handleAttachmentClick"
    @attachment-click="trackAttachmentClick"
    :timestamp="messageTime"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message } from 'scq-vue'

const attachmentMessage = ref('下面展示 5 类主要文档附件，点击可下载，也可以在 attachmentClick 中接管。')

const fileAttachments = [
  {
    name: '需求说明.pdf',
    url: 'https://filesamples.com/samples/document/pdf/sample3.pdf',
    size: 245760,
    download: true,
  },
  {
    name: '会议纪要.docx',
    url: 'https://filesamples.com/samples/document/docx/sample3.docx',
    size: 348160,
  },
  {
    name: '数据分析.xlsx',
    url: 'https://filesamples.com/samples/document/xlsx/sample3.xlsx',
    size: 1048576,
  },
  {
    name: '产品路演.ppt',
    url: 'https://filesamples.com/samples/document/ppt/sample3.ppt',
    size: 2097152,
    download: '产品路演.ppt',
  },
  {
    name: '日志归档.zip',
    url: 'https://github.com/vitejs/vite/archive/refs/heads/main.zip',
    size: 5242880,
    download: true,
  },
]

const handleAttachmentClick = (payload, event) => {
  if (payload.type === 'ppt') {
    event.preventDefault()
    Message.info({
      message: '已接管 PPT 点击',
      description: 'name: ' + payload.name + '\nurl: ' + payload.url + '\ntype: ' + payload.type + '\nlabel: ' + payload.label + '\nsizeText: ' + payload.sizeText,
      duration: 0,
      closable: true,
    })
    return false
  }

  Message.success({
    message: '附件点击数据',
    description: 'name: ' + payload.name + '\nurl: ' + payload.url + '\ntype: ' + payload.type + '\nlabel: ' + payload.label + '\nstatus: ' + payload.status,
  })
}

const trackAttachmentClick = (payload) => {
  console.log('附件点击事件', payload.name, payload.type)
}

const messageTime = Date.now()
<\/script>`

const fullExampleCode = `<template>
  <scq-chat-message
    :message="apiData"
    role="ai"
    content-type="json"
    :show-time="true"
    :timestamp="currentTime"
    :time-formatter="formatTime"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const apiData = {
  answer: '下面是一个示例函数',
  code: 'function hello(name) { return \`hello \${name}\` }',
}

const currentTime = ref(Date.now())
const assistantAvatar = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=120&q=80'
const attachmentMessage = ref('下面展示 5 类主要文档附件，点击可下载，也可以在 attachmentClick 中接管。')

const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return \`消息时间: \${date.toLocaleString('zh-CN', { hour12: false })}\`
}
<\/script>`

const apiData = {
  answer: '下面是一个示例函数',
  code: 'function hello(name) { return `hello ${name}` }',
}

const currentTime = ref(Date.now())
const assistantAvatar = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=120&q=80'
const attachmentMessage = ref('下面展示 5 类主要文档附件，点击可下载，也可以在 attachmentClick 中接管。')
/* const streamQuestion = ref('给我一个 react 的 input 组件代码')
const streamTableQuestion = '请只返回一个 markdown 表格，表头为 功能 和 说明，至少 3 行，不要代码块，不要额外解释'
const streamMarkdownContent = ref('')
const streamLoading = ref(false)
const streamError = ref('')
const streamController = ref<AbortController | null>(null)
const streamLineBuffer = ref('')
const streamEventLines = ref<string[]>([])
const streamSourceMeta = ref('')
const streamFrameCount = ref(0)
const streamStopFrameCount = ref(0)
const streamLastFrameSample = ref('')
const streamRecentFrameSamples = ref<string[]>([])
const aichatosUserId = ref('')
const aichatosAuthorization = ref('') */
/* const aichatosProxyBase = '/chatos8/go'
const aichatosCryptoIv = 'hj6cdzrhj72x8ht1'
const aichatosFreeAuthKey = 'qMwNebrbtGskdJfh'
const aichatosServerId = '1'
const aichatosDebugUserId = `scq-vue-${Date.now()}-${Math.random().toString(36).slice(2)}`

type AichatosApiResponse<Data> = {
  code?: number
  data?: Data
  retMsg?: string
}

type AichatosGroupAddData = {
  group_id?: string | number
}

type AichatosSteamData = {
  question_id?: string | number
}

const streamStatus = computed(() => ({
  type: streamError.value ? 'error' : 'loading',
  text: streamError.value || (streamLoading.value ? '正在读取流式接口' : ''),
  loading: streamLoading.value,
  visible: streamLoading.value || Boolean(streamError.value),
}))

const getUtf8Bytes = (text: string): Uint8Array => {
  const encoded = encodeURIComponent(text)
  const bytes: number[] = []

  for (let index = 0; index < encoded.length; index += 1) {
    if (encoded[index] === '%') {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16))
      index += 2
    } else {
      bytes.push(encoded.charCodeAt(index))
    }
  }

  return new Uint8Array(bytes)
}

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

const base64ToBytes = (base64: string): Uint8Array => {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

const getAesSubtleCrypto = (): SubtleCrypto => {
  const subtleCrypto = globalThis.crypto?.subtle
  if (!subtleCrypto) {
    throw new Error('当前浏览器不支持 Web Crypto AES-CBC')
  }

  return subtleCrypto
}

const encryptAichatosAesBase64 = async (plainText: string, keyText: string): Promise<string> => {
  const subtleCrypto = getAesSubtleCrypto()
  const cryptoKey = await subtleCrypto.importKey('raw', getUtf8Bytes(keyText), { name: 'AES-CBC' }, false, ['encrypt'])
  const encrypted = await subtleCrypto.encrypt(
    { name: 'AES-CBC', iv: getUtf8Bytes(aichatosCryptoIv) },
    cryptoKey,
    getUtf8Bytes(plainText),
  )

  return bytesToBase64(new Uint8Array(encrypted))
}

const decryptAichatosAesText = async (encryptedBase64: string, keyText: string): Promise<string> => {
  const subtleCrypto = getAesSubtleCrypto()
  const cryptoKey = await subtleCrypto.importKey('raw', getUtf8Bytes(keyText), { name: 'AES-CBC' }, false, ['decrypt'])
  const decrypted = await subtleCrypto.decrypt(
    { name: 'AES-CBC', iv: getUtf8Bytes(aichatosCryptoIv) },
    cryptoKey,
    base64ToBytes(encryptedBase64),
  )

  return new TextDecoder('utf-8').decode(decrypted)
}

const parseAichatosEncryptedText = (payload: string): string => {
  try {
    const parsed = JSON.parse(payload)
    return typeof parsed === 'string' ? parsed : payload
  } catch {
    return payload
  }
}

const decryptAichatosResponse = async <Data,>(payload: string): Promise<AichatosApiResponse<Data>> => {
  const encryptedText = parseAichatosEncryptedText(payload).trim()
  const keyText = encryptedText.slice(0, 16)
  const encryptedBase64 = encryptedText.slice(16)
  const decryptedText = await decryptAichatosAesText(encryptedBase64, keyText)
  return JSON.parse(decryptedText) as AichatosApiResponse<Data>
}

const getAichatosFreeAuthorization = async (): Promise<string> => {
  const encrypted = await encryptAichatosAesBase64(JSON.stringify({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }), aichatosFreeAuthKey)
  return `${aichatosFreeAuthKey}${encrypted}`
}

const getAichatosWrappedPayload = (pars: Record<string, unknown>, os = 'pc') => {
  return JSON.stringify({
    version: '1.1.1',
    os,
    channel: 'chatos',
    language: 'zh',
    pars,
  })
}

const postAichatosEncrypted = async <Data,>(path: string, pars: Record<string, unknown>, authorization: string, signal: AbortSignal): Promise<AichatosApiResponse<Data>> => {
  const response = await fetch(`${aichatosProxyBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: getAichatosWrappedPayload(pars),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Chatos8 ${path} HTTP ${response.status}`)
  }

  const apiResponse = await decryptAichatosResponse<Data>(await response.text())
  if (apiResponse.code !== 200) {
    throw new Error(`Chatos8 ${path} ${apiResponse.retMsg || apiResponse.code || '请求失败'}`)
  }

  return apiResponse
}

const getAichatosUserId = (): string => {
  return aichatosUserId.value.trim() || aichatosDebugUserId
}

const normalizeAichatosAuthorization = (value: string): string => {
  let token = value.trim()
  const tokenMatch = token.match(/(?:^|[?&])token=([^&]+)/i)
  if (tokenMatch?.[1]) {
    token = tokenMatch[1]
  }

  token = token.replace(/^Bearer\s+/i, '')

  try {
    return decodeURIComponent(token)
  } catch {
    return token
  }
} */

const fileAttachments = [
  {
    name: '需求说明.pdf',
    url: 'https://filesamples.com/samples/document/pdf/sample3.pdf',
    size: 245760,
    download: true,
  },
  {
    name: '会议纪要.docx',
    url: 'https://filesamples.com/samples/document/docx/sample3.docx',
    size: 348160,
  },
  {
    name: '数据分析.xlsx',
    url: 'https://filesamples.com/samples/document/xlsx/sample3.xlsx',
    size: 1048576,
  },
  {
    name: '产品路演.ppt',
    url: 'https://filesamples.com/samples/document/ppt/sample3.ppt',
    size: 2097152,
    download: '产品路演.ppt',
  },
  {
    name: '日志归档.zip',
    url: 'https://github.com/vitejs/vite/archive/refs/heads/main.zip',
    size: 5242880,
    download: true,
  },
]

const createChoiceAnswer = (): ChatChoiceAnswer => ({
  values: [],
})

const singleAnswer = ref<ChatChoiceAnswer>(createChoiceAnswer())
const multipleAnswer = ref<ChatChoiceAnswer>(createChoiceAnswer())
const otherAnswer = ref<ChatChoiceAnswer>(createChoiceAnswer())
const singleSubmitted = ref<ChatChoiceAnswer | null>(null)
const multipleSubmitted = ref<ChatChoiceAnswer | null>(null)
const otherSubmitted = ref<ChatChoiceAnswer | null>(null)

const singleOptions: ChatChoiceOption[] = [
  { value: 'concise', label: '简洁', description: '只保留结论和关键步骤' },
  { value: 'standard', label: '标准', description: '给出结论、步骤和必要说明' },
  { value: 'detailed', label: '详细', description: '补充原理、边界和完整示例' },
]

const multipleOptions: ChatChoiceOption[] = [
  { value: 'summary', label: '结论摘要' },
  { value: 'code', label: '代码示例' },
  { value: 'tests', label: '测试建议' },
]

const channelOptions: ChatChoiceOption[] = [
  { value: 'email', label: '邮件' },
  { value: 'sms', label: '短信' },
]

const handleSingleSubmit = (answer: ChatChoiceAnswer) => {
  singleSubmitted.value = answer
}

const handleMultipleSubmit = (answer: ChatChoiceAnswer) => {
  multipleSubmitted.value = answer
}

const handleOtherSubmit = (answer: ChatChoiceAnswer) => {
  otherSubmitted.value = answer
}

const handleAttachmentClick = (payload: { name: string; url: string; type: string; label: string; sizeText: string; status: string }, event: MouseEvent) => {
  if (payload.type === 'ppt') {
    event.preventDefault()
    Message.info({
      message: '已接管 PPT 点击',
      description: `name: ${payload.name}\nurl: ${payload.url}\ntype: ${payload.type}\nlabel: ${payload.label}\nsizeText: ${payload.sizeText}`,
      duration: 0,
      closable: true,
    })
    return false
  }

  Message.success({
    message: '附件点击数据',
    description: `name: ${payload.name}\nurl: ${payload.url}\ntype: ${payload.type}\nlabel: ${payload.label}\nstatus: ${payload.status}`,
  })
}

/* const findStreamPayloadText = (payload: unknown): string => {
  if (typeof payload === 'string') {
    return repairLikelyMojibake(payload)
  }

  if (Array.isArray(payload)) {
    return payload.map(findStreamPayloadText).join('')
  }

  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const record = payload as Record<string, unknown>
  const direct = record.content ?? record.text ?? record.answer ?? record.Data
  if (typeof direct === 'string') {
    return direct
  }

  if (Array.isArray(record.choices)) {
    return record.choices.map((choice) => {
      if (!choice || typeof choice !== 'object') {
        return ''
      }

      const choiceRecord = choice as Record<string, unknown>
      return findStreamPayloadText(choiceRecord.delta ?? choiceRecord.message ?? choiceRecord)
    }).join('')
  }

  return findStreamPayloadText(record.delta ?? record.message ?? record.data)
}

const getMojibakeScore = (value: string): number => {
  return (value.match(/[ÃÂ�]|â[\u0080-\u00bf]|ï¼/g) ?? []).length
}

const repairLikelyMojibake = (value: string): string => {
  if (!/[ÃÂ�]|â[\u0080-\u00bf]|ï¼/.test(value)) {
    return value
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff)
    const decoded = new TextDecoder('utf-8').decode(bytes)
    return getMojibakeScore(decoded) < getMojibakeScore(value) ? decoded : value
  } catch {
    return value
  }
}

const isStopStreamPayload = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const record = payload as Record<string, unknown>
  return record.Status === 'stop' || record.Type === 'stop'
}

const trackStreamPayload = (payload: string) => {
  streamFrameCount.value += 1
  const sample = repairLikelyMojibake(payload).slice(0, 500)
  streamLastFrameSample.value = sample
  streamRecentFrameSamples.value = [...streamRecentFrameSamples.value.slice(-7), sample]

  try {
    if (isStopStreamPayload(JSON.parse(payload.trim()))) {
      streamStopFrameCount.value += 1
    }
  } catch {
    if (payload === '[DONE]') {
      streamStopFrameCount.value += 1
    }
  }
}

const getStreamPayloadText = (payload: string): string => {
  if (!payload || payload === '[DONE]') {
    return ''
  }

  const text = payload.trim()
  if (!text || !/^[{[]/.test(text)) {
    return payload
  }

  try {
    return findStreamPayloadText(JSON.parse(text))
  } catch {
    return payload
  }
}

const appendStreamPayload = (payload: string) => {
  trackStreamPayload(payload)
  streamMarkdownContent.value += getStreamPayloadText(payload)
}

const appendStreamDataLines = (dataLines: string[]) => {
  if (dataLines.length === 1 && dataLines[0] === '') {
    streamMarkdownContent.value += '\n'
    return
  }

  appendStreamPayload(dataLines.join('\n'))
}

const flushStreamEvent = () => {
  if (!streamEventLines.value.length) {
    return
  }

  const dataLines: string[] = []
  const rawLines: string[] = []

  streamEventLines.value.forEach((line) => {
    if (!line || line.startsWith(':') || /^(?:event|id|retry):/.test(line)) {
      return
    }

    const dataMatch = line.match(/^data:[ \t]?(.*)$/)
    if (dataMatch) {
      dataLines.push(dataMatch[1] ?? '')
      return
    }

    rawLines.push(line)
  })

  if (dataLines.length) {
    appendStreamDataLines(dataLines)
    rawLines.forEach((line) => {
      const separator = streamMarkdownContent.value.endsWith('|') && line.trim().startsWith('|') ? '\n' : ''
      streamMarkdownContent.value += `${separator}${line}`
    })
  } else if (rawLines.length) {
    streamMarkdownContent.value += `${rawLines.join('\n')}\n`
  }

  streamEventLines.value = []
}

const appendStreamLine = (line: string) => {
  if (!line.trim()) {
    if (!streamEventLines.value.length) {
      streamMarkdownContent.value += '\n'
      return
    }

    flushStreamEvent()
    return
  }

  streamEventLines.value.push(line)
}

const appendStreamChunk = (chunk: string) => {
  const lines = `${streamLineBuffer.value}${chunk.replace(/\r\n?/g, '\n')}`.split('\n')
  streamLineBuffer.value = lines.pop() ?? ''
  lines.forEach(appendStreamLine)
}

const flushStreamChunk = () => {
  if (streamLineBuffer.value) {
    appendStreamLine(streamLineBuffer.value)
    streamLineBuffer.value = ''
  }

  flushStreamEvent()
}

const resetStreamDebugState = (sourceMeta = '') => {
  streamController.value?.abort()
  streamController.value = null
  streamMarkdownContent.value = ''
  streamLineBuffer.value = ''
  streamEventLines.value = []
  streamError.value = ''
  streamSourceMeta.value = sourceMeta
  streamFrameCount.value = 0
  streamStopFrameCount.value = 0
  streamLastFrameSample.value = ''
  streamRecentFrameSamples.value = []
}

const readStreamResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok && !/text\/event-stream/i.test(contentType)) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}${errorText ? `: ${errorText.slice(0, 240)}` : ''}`)
  }

  if (!response.body) {
    throw new Error('当前浏览器不支持 ReadableStream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    appendStreamChunk(decoder.decode(value, { stream: true }))
  }

  appendStreamChunk(decoder.decode())
  flushStreamChunk()

  if (!response.ok) {
    streamError.value = `HTTP ${response.status}，已解析响应中的 SSE data 帧`
  }
}

const runStreamDebug = async () => {
  resetStreamDebugState('/api/AI/GetChatGptAnswerStream；原样发送 question；展示最近原始 data payload')
  streamLoading.value = true

  const controller = new AbortController()
  streamController.value = controller

  try {
    const url = `/api/AI/GetChatGptAnswerStream?${new URLSearchParams({ question: streamQuestion.value, aiModel: 'qwen-max', temperatureNumber: '0.7' })}`
    const response = await fetch(url, { signal: controller.signal })
    await readStreamResponse(response)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    streamError.value = error instanceof Error ? error.message : String(error)
    Message.error({ message: '流式接口请求失败', description: streamError.value })
  } finally {
    streamLoading.value = false
    streamController.value = null
  }
}

const runAichatosFreeStreamDebug = async () => {
  resetStreamDebugState('Chatos8 free：POST /go/api/event/free；SSE data 为 { Data, Status, Type }')
  streamLoading.value = true

  const controller = new AbortController()
  streamController.value = controller

  try {
    const response = await fetch(`${aichatosProxyBase}/api/event/free`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await getAichatosFreeAuthorization(),
      },
      body: JSON.stringify({
        version: '1.1.1',
        os: 'h5',
        language: 'zh',
        pars: {
          user_id: getAichatosUserId(),
          question: streamQuestion.value,
          group_id: '1',
          server_id: aichatosServerId,
          message: null,
        },
      }),
      signal: controller.signal,
    })

    await readStreamResponse(response)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    streamError.value = error instanceof Error ? error.message : String(error)
    Message.error({ message: 'Chatos8 free SSE 请求失败', description: streamError.value })
  } finally {
    streamLoading.value = false
    streamController.value = null
  }
}

const runAichatosHomeStreamDebug = async () => {
  const authorization = normalizeAichatosAuthorization(aichatosAuthorization.value)
  const userId = aichatosUserId.value.trim()
  if (!authorization || !userId) {
    streamError.value = 'Chatos8 /home 链路需要填写 user_id 和 Authorization Token'
    return
  }

  resetStreamDebugState('Chatos8 /home：POST /go/api/group/add -> POST /go/api/steam/see -> GET /go/api/event/see；SSE data 为 { Data, Status, QuestionId, GroupId, Type }')
  streamLoading.value = true

  const controller = new AbortController()
  streamController.value = controller

  try {
    const groupResponse = await postAichatosEncrypted<AichatosGroupAddData>('/api/group/add', {
      type: '1',
      user_id: userId,
      examples_id: '',
      examples_describe: streamQuestion.value,
      server_id: aichatosServerId,
    }, authorization, controller.signal)
    const groupId = String(groupResponse.data?.group_id ?? '')
    if (!groupId) {
      throw new Error('Chatos8 group/add 未返回 group_id')
    }

    const steamResponse = await postAichatosEncrypted<AichatosSteamData>('/api/steam/see', {
      user_id: userId,
      question: streamQuestion.value,
      group_id: groupId,
      question_id: '',
      server_id: aichatosServerId,
    }, authorization, controller.signal)
    const questionId = String(steamResponse.data?.question_id ?? '')
    if (!questionId) {
      throw new Error('Chatos8 steam/see 未返回 question_id')
    }

    streamSourceMeta.value = `Chatos8 /home：group_id=${groupId}；question_id=${questionId}；GET /go/api/event/see；Data 字段直接拼接成 Markdown`
    const params = new URLSearchParams({
      question_id: questionId,
      group_id: groupId,
      user_id: userId,
      token: authorization,
      server_id: aichatosServerId,
    })
    const response = await fetch(`${aichatosProxyBase}/api/event/see?${params}`, { signal: controller.signal })
    await readStreamResponse(response)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    streamError.value = error instanceof Error ? error.message : String(error)
    Message.error({ message: 'Chatos8 /home 链路请求失败', description: streamError.value })
  } finally {
    streamLoading.value = false
    streamController.value = null
  }
}

const runStreamTableDebug = () => {
  streamQuestion.value = streamTableQuestion
  return runStreamDebug()
}

const abortStreamDebug = () => {
  streamController.value?.abort()
  streamLoading.value = false
  streamController.value = null
}

const loadStreamFixture = () => {
  resetStreamDebugState('本地 Markdown fixture')
  streamLoading.value = false
  streamMarkdownContent.value = '```vue\n<template>\n  <div class="pfa-journey">PFA术者学习之旅</div>\n</template>\n<' + 'script setup>\nconst title = "PFA术者学习之旅"\n</' + 'script>\n<style scoped>\n.pfa-journey { font-size: 14px; color: #333; }\n</style>'
}

const loadStreamTableFixture = () => {
  resetStreamDebugState('本地 Markdown 表格 fixture')
  streamLoading.value = false
  streamMarkdownContent.value = '| 功能 | 说明 |\n|---|---|\n| 术者列表 | 展示辖区内管理的计划开台和已开台术者 |\n| 学习详情 | 包含学习之旅、毕业详情、互动之旅等模块 |\n| 报表 | 提供术者开发漏斗和手术经验值分布 |'
} */

const jsonPayload = {
  id: 'msg_001',
  status: 'ok',
  data: {
    title: '接口返回结构化数据',
    list: ['第一项', '第二项', '第三项'],
  },
}

const markdownPayload = `# 接口返回 Markdown\n\n第一行\n第二行\n\n- 第一项\n- 第二项\n\n这是一个带代码块的消息：\n\n\`\`\`ts\ninterface User {\n  id: number\n  name: string\n}\n\nconst user: User = { id: 1, name: 'SCQ' }\nconsole.log(user)\n\`\`\``

const vueComparePayload = `以下是 Vue 2 与 Vue 3 的核心特性对比表格（基于官方文档、RFC 及主流实践，截至 2024 年）：

| 对比维度             | Vue 2（v2.7 LTS）                                  | Vue 3（v3.4+，当前稳定主力版本）                     | 说明与影响 |
|----------------------|---------------------------------------------------|--------------------------------------------------------|------------|
| **架构设计**         | Options API（选项式 API）为主                    | **Composition API（组合式 API）为推荐方式**，同时兼容 Options API | Vue 3 提供更灵活的逻辑复用与类型推导能力；Options API 仍完全支持（含 \`setup()\` 中使用） |
| **响应式系统**       | 基于 \`Object.defineProperty\`（无法检测新增/删除属性、数组索引赋值等） | 基于 **Proxy + Reflect**（深度监听、支持 Map/Set/WeakMap/WeakSet、无响应式陷阱） | Vue 3 响应式更强大、更语义化，性能更优，消除了 Vue 2 的诸多限制（如 \`vm.$set\` 不再必需） |
| **模板编译器**       | 运行时编译（需 \`vue-template-compiler\`）         | **编译时优化**：静态提升（hoist static）、Patch flag 标记、Block tree 优化 | 渲染性能显著提升（尤其首次渲染和更新），更小的运行时体积 |
| **组件写法**         | 单文件组件（SFC）中 \`<script>\` 写 \`export default { data() {…} }\` | 支持 \`<script setup>\`（语法糖，推荐）：<br>\`\`\`&lt;script setup lang="ts"&gt;<br>const count = ref(0)<br>const increment = () => count.value++<br>&lt;/script&gt;\`\`\` | \`<script setup>\` 更简洁、自动暴露、天然支持 TypeScript，是 Vue 3 SFC 的首选范式 |
| **TypeScript 支持**  | 类型支持较弱（需 \`Vue.extend\` / \`ComponentOptions\` 等复杂声明） | **一级 TypeScript 支持**：Composition API + \`<script setup>\` 天然类型推导，无需额外配置即可获得完整类型提示 | 开发体验大幅提升，尤其在大型项目中 |
| **生命周期钩子**     | \`beforeCreate\`, \`created\`, \`beforeMount\`, \`mounted\`, \`beforeUpdate\`, \`updated\`, \`beforeDestroy\`, \`destroyed\` | \`setup()\` 替代前两个；新钩子：<br>\`onBeforeMount\`, \`onMounted\`, \`onBeforeUpdate\`, \`onUpdated\`, \`onBeforeUnmount\`, \`onUnmounted\`<br>（\`destroyed\` → \`unmounted\`） | 钩子全部改为 \`onXXX\` 形式，统一命名规范；\`beforeDestroy\`/\`destroyed\` 已废弃（Vue 2.7 中标记为 deprecated） |
| **全局 API**         | \`Vue.use()\`, \`Vue.component()\`, \`Vue.directive()\`, \`Vue.set()\` 等 | **全局 API 被重构为应用实例方法**：<br>\`app.use()\`, \`app.component()\`, \`app.directive()\`, \`app.config.globalProperties.xxx\`<br>\`Vue.createApp()\` 创建独立应用实例 | 支持**多个 Vue 应用共存**（微前端友好），避免全局污染；\`new Vue()\` 被 \`createApp()\` 替代 |
| **Teleport & Suspense** | ❌ 不支持                                         | ✅ 内置 \`<Teleport>\`（跨 DOM 移动内容，如 Modal）<br>✅ 内置 \`<Suspense>\`（异步组件加载状态处理） | 原生支持现代 UI 模式，无需插件或 hack |
| **自定义渲染器（Renderer）** | 无官方抽象层                                     | ✅ 官方提供可扩展的 \`@vue/runtime-core\` 和 \`@vue/runtime-dom\`，支持自定义渲染器（如 Canvas、WebGL、小程序） | 极大拓展 Vue 生态边界（如 [Vue Native](https://github.com/GeekyAnts/vue-native-core)、[Weex](https://weex.apache.org/)、[Taro](https://taro.jd.com/) 等） |
| **性能与体积**       | 运行时约 20–25 KB（gzip）                         | 运行时约 **12–16 KB（gzip）**，Tree-shaking 更彻底，按需引入 | 更小体积 + 更快 diff + 更少内存占用，尤其利于移动端与低网速场景 |
| **兼容性与迁移**     | Vue 2.7 是最后一个版本（LTS 至 2023.12，现已结束官方支持） | **Vue 3.3+ 提供 \`@vue/compat\`（迁移构建模式）**，可渐进升级 Vue 2 项目 | 推荐新项目直接使用 Vue 3；存量 Vue 2 项目可通过 \`@vue/compat\` + \`migration build\` 辅助平滑升级 |

✅ **补充说明**：
- **Vue 2.7** 是兼容 Vue 3 的“桥接版本”，支持部分 Vue 3 特性（如 Composition API、\`<script setup>\` 实验性支持），但**不包含 Proxy 响应式、编译优化等核心升级**。
- **Vue 3 的默认构建**已移除 IE11 支持（需 polyfill 或使用 \`@vue/compat\`）。
- **状态管理**：Vuex 4 适配 Vue 3，但官方推荐 **Pinia**（轻量、TypeScript 友好、无 mutations、支持 SSR 和 DevTools）作为首选。
- **构建工具**：Vue CLI（Vue 2） vs **Vite**（Vue 3 官方推荐，默认构建工具，冷启动极快）。

📌 **总结建议**：
- ✅ **新项目务必选择 Vue 3（+ Vite + Pinia + \`<script setup>\` + TS）**
- ⚠️ Vue 2 仅限维护旧项目，**不再接收新功能，安全补丁也已停止**
- 🔄 迁移路径：Vue 2.7 → 启用 \`@vue/compat\` → 逐步替换为 Composition API → 移除 compat 模式

如需我为你生成一份 **Vue 2 → Vue 3 迁移检查清单** 或 **一个最小可运行的 Vue 3 + TS + Vite 示例结构**，欢迎随时提出！`

const imageUrl = 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80'

const handlePreviewOpen = (src: string) => {
  Message.info({ message: '图片预览已打开', description: src })
}

const handlePreviewClose = (src: string) => {
  Message.success({ message: '图片预览已关闭', description: src })
}

const handleImageError = (src: string) => {
  Message.error({ message: '图片加载失败', description: src })
}

const videoPayload = {
  src: 'https://www.w3schools.com/html/movie.mp4',
  controls: true,
}

const messageTime = Date.now()

const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return `消息时间: ${date.toLocaleString('zh-CN', { hour12: false })}`
}
</script>

<style scoped>
.chat-choice-demo__title {
  margin: 8px 0 0;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.chat-choice-demo__title:first-child {
  margin-top: 0;
}

.chat-choice-demo__option {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
}

.chat-choice-demo__index {
  color: #94a3b8;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.chat-choice-demo__option strong,
.chat-choice-demo__option small {
  display: block;
}

.chat-choice-demo__option strong {
  color: #1e293b;
  font-size: 14px;
}

.chat-choice-demo__option small {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 400;
}

.chat-choice-demo__option.is-selected .chat-choice-demo__index,
.chat-choice-demo__option.is-selected strong {
  color: #2563eb;
}

.chat-choice-demo__result {
  margin: 8px 0 0;
  padding: 10px 12px;
  overflow: auto;
  border-left: 3px solid #16a34a;
  background: #f0fdf4;
  color: #166534;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.stream-debug-panel {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.stream-debug-panel__label,
.stream-debug-panel__meta {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.stream-debug-panel__meta,
.stream-debug-panel__error {
  margin: 0;
}

.stream-debug-panel__error {
  color: #dc2626;
  font-size: 12px;
}

.stream-debug-panel__textarea {
  width: 100%;
  min-width: 0;
  resize: vertical;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  padding: 10px 12px;
  color: #1f2937;
  background: #ffffff;
  font: inherit;
  line-height: 1.5;
}

.stream-debug-panel__textarea:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.14);
}

.stream-debug-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stream-debug-panel__fields {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.stream-debug-panel__field {
  display: grid;
  gap: 4px;
  color: #64748b;
  font-size: 12px;
}

.stream-debug-panel__input {
  min-width: 0;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  padding: 8px 10px;
  color: #1f2937;
  background: #ffffff;
  font: inherit;
}

.stream-debug-panel__input:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.14);
}

.stream-debug-panel__frame {
  overflow: auto;
  max-height: 120px;
  margin: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  color: #334155;
  background: #f8fafc;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.stream-debug-panel__button {
  border: 1px solid #2b6ef2;
  border-radius: 8px;
  background: #2b6ef2;
  color: #ffffff;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}

.stream-debug-panel__button.is-secondary {
  border-color: #dbe4ee;
  background: #ffffff;
  color: #334155;
}

.stream-debug-panel__button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}
</style>
