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
          message="头像可以传图片，也可以只传昵称生成首字母头像。"
          role="ai"
          name="SCQ Assistant"
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

    <h2>{{ t('chat.streaming') }}</h2>
    <DocExample :code="streamingCode" lang="vue">
      <div class="demo-grid">
        <div class="chat-demo-actions">
          <scq-button type="primary" size="small" :disabled="streaming" @click="startSseDemo">
            {{ streaming ? t('chat.streaming.running') : t('chat.streaming.start') }}
          </scq-button>
          <scq-button size="small" @click="resetSseDemo">
            {{ t('chat.streaming.reset') }}
          </scq-button>
        </div>
        <scq-chat-message
          :message="streamMessage || t('chat.streaming.placeholder')"
          role="ai"
          content-type="markdown"
          :streaming="streaming"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
      </div>
    </DocExample>

    <h2>{{ t('chat.status') }}</h2>
    <DocExample :code="statusCode" lang="vue">
      <div class="demo-grid">
        <scq-chat-message
          message="我正在整理上下文，稍后给出完整回答。"
          role="ai"
          :status="{ type: 'thinking', text: '正在思考中' }"
          :timestamp="messageTime"
          :time-formatter="formatTime"
        />
        <scq-chat-message
          message="已读取项目依赖和构建脚本，准备执行验证。"
          role="ai"
          :status="{ type: 'tool', text: '正在调用 pnpm run build' }"
          :show-time="false"
        />
        <scq-chat-message
          message="正在生成类型声明和样式产物。"
          role="ai"
          :status="{ type: 'loading', text: '正在处理中' }"
          :show-time="false"
        />
        <scq-chat-message
          message="检查完成，当前变更可以进入下一步。"
          role="ai"
          :status="{ type: 'success', text: '处理完成', loading: false }"
          :show-time="false"
        />
        <scq-chat-message
          message="检测到还有未提交的 Select 相关改动，请确认是否属于本次发布。"
          role="ai"
          :status="{ type: 'warning', text: '需要注意', loading: false }"
          :show-time="false"
        />
        <scq-chat-message
          message="工具执行失败，请检查命令输出后重试。"
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
        <tr><td>avatar</td><td>{{ t('chat.avatar.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>name</td><td>{{ t('chat.name.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>showAvatar</td><td>{{ t('chat.showAvatar.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>showName</td><td>{{ t('chat.showName.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>streaming</td><td>{{ t('chat.streaming.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>status</td><td>{{ t('chat.status.desc') }}</td><td>{ type, text, loading, visible }</td><td>null</td></tr>
        <tr><td>showStatus</td><td>{{ t('chat.showStatus.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>statusText</td><td>{{ t('chat.statusText.desc') }}</td><td>string</td><td>-</td></tr>
        <tr><td>statusType</td><td>{{ t('chat.statusType.desc') }}</td><td>thinking | tool | loading | success | warning | error</td><td>thinking</td></tr>
        <tr><td>statusLoading</td><td>{{ t('chat.statusLoading.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>linkTarget</td><td>{{ t('chat.linkTarget.desc') }}</td><td>string</td><td>_blank</td></tr>
        <tr><td>linkRel</td><td>{{ t('chat.linkRel.desc') }}</td><td>string</td><td>noopener noreferrer</td></tr>
        <tr><td>previewable</td><td>{{ t('chat.previewable.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>imageFallbackText</td><td>{{ t('chat.imageFallbackText.desc') }}</td><td>string</td><td>图片加载失败</td></tr>
        <tr><td>attachments</td><td>{{ t('chat.attachments.desc') }}</td><td>ChatAttachment[]</td><td>[]</td></tr>
        <tr><td>attachmentClick</td><td>{{ t('chat.attachmentClick.desc') }}</td><td>(payload, event) =&gt; boolean | void</td><td>-</td></tr>
        <tr><td>@attachment-click</td><td>{{ t('chat.attachmentClickEvent.desc') }}</td><td>(payload, event) =&gt; void</td><td>-</td></tr>
        <tr><td>showTime</td><td>{{ t('chat.showTime.desc') }}</td><td>boolean</td><td>true</td></tr>
        <tr><td>timestamp</td><td>{{ t('chat.timestamp.desc') }}</td><td>string | number | Date | null</td><td>null</td></tr>
        <tr><td>timeFormatter</td><td>{{ t('chat.timeFormatter.desc') }}</td><td>(value) =&gt; string</td><td>-</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'
import { Message } from 'scq-vue'

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
    message="头像可以传图片，也可以只传昵称生成首字母头像。"
    role="ai"
    name="SCQ Assistant"
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
const markdownPayload = '# 接口返回 Markdown\\n\\n- 第一项\\n- 第二项\\n- [访问文档](https://example.com)'
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

const streamingCode = `<template>
  <scq-button type="primary" :disabled="streaming" @click="startSseDemo">
    {{ streaming ? '输出中' : '模拟 SSE 输出' }}
  </scq-button>
  <scq-button @click="resetSseDemo">重置</scq-button>

  <scq-chat-message
    :message="streamMessage || '等待 SSE 消息...'"
    role="ai"
    content-type="markdown"
    :streaming="streaming"
    :timestamp="messageTime"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const streamMessage = ref('')
const streaming = ref(false)
const messageTime = Date.now()
const chunks = [
  '正在读取 SSE 数据源...\\n\\n',
  '### 分析结果\\n',
  '- 文本会随着 message 更新逐步渲染\\n',
  '- Markdown、代码块和 JSON 也可以同步刷新\\n',
  '- 图片和视频内容不会显示流式光标\\n\\n',
  '~~~ts\\nconst source = new EventSource(url)\\n',
  'source.onmessage = (event) => {\\n  streamMessage.value += event.data\\n}\\n',
  '~~~',
]

let timer: ReturnType<typeof window.setInterval> | null = null

const stopSseDemo = () => {
  if (timer) window.clearInterval(timer)
  timer = null
  streaming.value = false
}

const startSseDemo = () => {
  if (streaming.value) return
  streamMessage.value = ''
  streaming.value = true
  let index = 0

  timer = window.setInterval(() => {
    streamMessage.value += chunks[index] ?? ''
    index += 1
    if (index >= chunks.length) stopSseDemo()
  }, 220)
}

const resetSseDemo = () => {
  stopSseDemo()
  streamMessage.value = ''
}

onBeforeUnmount(stopSseDemo)
<\/script>`

const statusCode = `<template>
  <scq-chat-message
    message="我正在整理上下文，稍后给出完整回答。"
    role="ai"
    :status="{ type: 'thinking', text: '正在思考中' }"
  />

  <scq-chat-message
    message="已读取项目依赖和构建脚本，准备执行验证。"
    role="ai"
    :status="{ type: 'tool', text: '正在调用 pnpm run build' }"
  />

  <scq-chat-message
    message="正在生成类型声明和样式产物。"
    role="ai"
    :status="{ type: 'loading', text: '正在处理中' }"
  />

  <scq-chat-message
    message="检查完成，当前变更可以进入下一步。"
    role="ai"
    :status="{ type: 'success', text: '处理完成', loading: false }"
  />

  <scq-chat-message
    message="检测到还有未提交的 Select 相关改动，请确认是否属于本次发布。"
    role="ai"
    :status="{ type: 'warning', text: '需要注意', loading: false }"
  />

  <scq-chat-message
    message="工具执行失败，请检查命令输出后重试。"
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
<\/script>`

const attachmentsCode = `<template>
  <scq-chat-message
    :message="attachmentMessage"
    role="ai"
    name="SCQ Assistant"
    :attachments="fileAttachments"
    :attachment-click="handleAttachmentClick"
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

const streamMessage = ref('')
const streaming = ref(false)
const streamChunks = [
  '正在读取 SSE 数据源...\n\n',
  '### 分析结果\n',
  '- 文本会随着 message 更新逐步渲染\n',
  '- Markdown、代码块和 JSON 也可以同步刷新\n',
  '- 图片和视频内容不会显示流式光标\n\n',
  '~~~ts\nconst source = new EventSource(url)\n',
  'source.onmessage = (event) => {\n  streamMessage.value += event.data\n}\n',
  '~~~',
]

let streamTimer: ReturnType<typeof window.setInterval> | null = null

const stopSseDemo = () => {
  if (streamTimer) {
    window.clearInterval(streamTimer)
  }

  streamTimer = null
  streaming.value = false
}

const startSseDemo = () => {
  if (streaming.value) {
    return
  }

  streamMessage.value = ''
  streaming.value = true
  let index = 0

  streamTimer = window.setInterval(() => {
    streamMessage.value += streamChunks[index] ?? ''
    index += 1

    if (index >= streamChunks.length) {
      stopSseDemo()
    }
  }, 220)
}

const resetSseDemo = () => {
  stopSseDemo()
  streamMessage.value = ''
}

onBeforeUnmount(stopSseDemo)

const jsonPayload = {
  id: 'msg_001',
  status: 'ok',
  data: {
    title: '接口返回结构化数据',
    list: ['第一项', '第二项', '第三项'],
  },
}

const markdownPayload = `# 接口返回 Markdown\n\n这是一个带代码块的消息：\n\n\`\`\`ts\ninterface User {\n  id: number\n  name: string\n}\n\nconst user: User = { id: 1, name: 'SCQ' }\nconsole.log(user)\n\`\`\``

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
