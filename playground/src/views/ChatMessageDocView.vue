<template>
  <section class="doc-block">
    <h1>ChatMessage 聊天气泡</h1>
    <p class="lead">支持字符串、JSON、Markdown 渲染和代码高亮，并可区分 AI / 用户消息样式。</p>

    <h2>基础用法</h2>
    <DocExample :code="basicCode" lang="html">
      <div class="demo-grid">
        <scq-chat-message :message="plainText" role="ai" :timestamp="messageTime" />
        <scq-chat-message :message="plainText" role="user" :show-time="false" />
      </div>
    </DocExample>

    <h2>JSON 数据</h2>
    <DocExample :code="jsonCode" lang="html">
      <div class="demo-grid">
        <scq-chat-message :message="jsonPayload" role="ai" content-type="json" :timestamp="messageTime" />
      </div>
    </DocExample>

    <h2>Markdown + 代码高亮</h2>
    <DocExample :code="markdownCode" lang="html">
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

    <h2>复杂 Markdown 表格</h2>
    <DocExample :code="complexMarkdownCode" lang="html">
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

    <h2>完整使用示例</h2>
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

    <h2>配置项</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
          <th>类型</th>
          <th>默认值</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>message</td><td>接口返回的消息内容</td><td>unknown</td><td>-</td></tr>
        <tr><td>role</td><td>消息发起方</td><td>ai | user</td><td>ai</td></tr>
        <tr><td>contentType</td><td>内容类型</td><td>auto | text | markdown | json</td><td>auto</td></tr>
        <tr><td>showTime</td><td>是否显示时间</td><td>boolean</td><td>true</td></tr>
        <tr><td>timestamp</td><td>消息时间</td><td>string | number | Date | null</td><td>null</td></tr>
        <tr><td>timeFormatter</td><td>自定义时间格式化函数</td><td>(value) =&gt; string</td><td>-</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'

const plainText = '这是普通字符串消息，适合展示接口直接返回的文本。'

const basicCode = `\u003Cscript setup lang="ts">
const aiMessage = '这是普通字符串消息，适合展示接口直接返回的文本。'
const userMessage = '这是用户输入的一条消息。'
const messageTime = Date.now()
\u003C/script>

\u003Ctemplate>
  \u003Cscq-chat-message :message="aiMessage" role="ai" :timestamp="messageTime" />
  \u003Cscq-chat-message :message="userMessage" role="user" :show-time="false" />
\u003C/template>`

const jsonCode = `\u003Cscript setup lang="ts">
const jsonMessage = {
  id: 'msg_001',
  status: 'ok',
  data: {
    title: '接口返回结构化数据',
    list: ['第一项', '第二项', '第三项'],
  },
}

const messageTime = Date.now()
\u003C/script>

\u003Ctemplate>
  \u003Cscq-chat-message
    :message="jsonMessage"
    role="ai"
    content-type="json"
    :timestamp="messageTime"
  />
\u003C/template>`

const markdownCode = `\u003Cscript setup lang="ts">
const markdownMessage = '# 接口返回 Markdown\\n\\n- 第一项\\n- 第二项\\n- 第三项'
const messageTime = Date.now()

const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return '消息时间: ' + date.toLocaleString('zh-CN', { hour12: false })
}
\u003C/script>

\u003Ctemplate>
  \u003Cscq-chat-message
    :message="markdownMessage"
    role="ai"
    content-type="markdown"
    :timestamp="messageTime"
    :time-formatter="formatTime"
  />
\u003C/template>`

const complexMarkdownCode = `\u003Cscript setup lang="ts">
const tableMessage = '| 维度 | Vue 2 | Vue 3 |\\n|---|---|---|\\n| 响应式 | defineProperty | Proxy |\\n| 组合能力 | Mixin 为主 | Composition API |'
const messageTime = Date.now()

const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return '消息时间: ' + date.toLocaleString('zh-CN', { hour12: false })
}
\u003C/script>

\u003Ctemplate>
  \u003Cscq-chat-message
    :message="tableMessage"
    role="ai"
    content-type="markdown"
    :timestamp="messageTime"
    :time-formatter="formatTime"
  />
\u003C/template>`

const fullExampleCode = `\u003Ctemplate>
  \u003Cscq-chat-message
    :message="apiData"
    role="ai"
    content-type="json"
    :show-time="true"
    :timestamp="currentTime"
    :time-formatter="formatTime"
  />
\u003C/template>

\u003Cscript setup lang="ts">
import { ref } from 'vue'

const apiData = {
  answer: '下面是一个示例函数',
  code: 'function hello(name) { return \`hello \${name}\` }',
}

const currentTime = ref(Date.now())

const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return \`消息时间: \${date.toLocaleString('zh-CN', { hour12: false })}\`
}
\u003C/script>`

const apiData = {
  answer: '下面是一个示例函数',
  code: 'function hello(name) { return `hello ${name}` }',
}

const currentTime = ref(Date.now())

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
