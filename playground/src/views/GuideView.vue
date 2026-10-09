<template>
  <section class="doc-block">
    <h1>{{ t('guide.title') }}</h1>
    <p class="lead">{{ label('面向 Vue 3 的 PC 与移动端组件库，包含基础控件、表单、数据展示、反馈和聊天交互。', 'A Vue 3 component library for desktop and mobile, with form controls, data display, feedback and chat interactions.') }}</p>

    <div class="guide-summary"><span>Vue 3.3+</span><span>TypeScript</span><span>PC / Mobile</span><span>{{ componentDocs.length }} {{ label('个组件文档', 'component guides') }}</span></div>

    <h2>{{ t('guide.install') }}</h2>
    <DocExample :code="installCode" lang="bash" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <h2>{{ t('guide.global') }}</h2>
    <DocExample :code="globalUseCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <p class="lead">
      {{ label('全局组件使用 scq- 前缀，如 scq-button、scq-form 和 scq-action-sheet；原有组件名称及调用方式保持不变。', 'Global components use the scq- prefix, such as scq-button, scq-form and scq-action-sheet. Existing names and invocation patterns remain unchanged.') }}
    </p>

    <h2>{{ t('guide.ondemand') }}</h2>
    <DocExample :code="onDemandCode" lang="vue" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('所有组件都支持独立子路径。script setup 中导入后可直接使用，不需要 app.use；子路径区分大小写。', 'Every component supports an independent, case-sensitive subpath. Imported components are directly usable in script setup without app.use.') }}</p>

    <h2 id="individual-registration">{{ label('按需全局注册', 'Individual Global Registration') }}</h2>
    <DocExample :code="individualRegistrationCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('FormItem、CellGroup、RadioGroup、CheckboxGroup 和 CollapseItem 也可以独立引入和注册；原有父组件注册与命名导出继续支持。', 'FormItem, CellGroup, RadioGroup, CheckboxGroup and CollapseItem can also be imported and installed independently. Parent installation and existing named exports remain supported.') }}</p>

    <h2>{{ t('guide.style') }}</h2>
    <DocExample :code="styleCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('按需路径不自动加载 CSS。先引入一次 tokens.css，再引入所用组件的样式；组件内部依赖的图标和控件样式会一并加载。', 'Individual entries do not load CSS automatically. Import tokens.css once, then each component stylesheet; internal icon and control styles are included as dependencies.') }}</p>

    <h2 id="configuration">{{ label('主题与全局配置', 'Theme and Global Configuration') }}</h2>
    <DocExample :code="configCode" lang="vue" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('ConfigProvider 为新增组件提供默认语言、尺寸、禁用和主题。既有组件保持原有默认样式及 Props，不会被隐式改写。', 'ConfigProvider supplies defaults for new components. Existing component styles and props are preserved without implicit changes.') }}</p>

    <h2 id="mobile">{{ label('移动端使用', 'Mobile Usage') }}</h2>
    <DocExample :code="mobileCode" lang="html" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('移动端专用组件集中在移动端区域：Toast、Search、NoticeBar、Cell、NavBar、Tabbar、ActionSheet、Modal，以及 Picker、List、PullRefresh、Swipe、SwipeCell、Calendar 和 ActionBar。它们的示例在手机 UI 中展示，通用组件不区分 PC 与窄屏预览模式。', 'Mobile-specific components are grouped in the Mobile section, including Toast, Search, NoticeBar, Cell, NavBar, Tabbar, ActionSheet, Modal, Picker, List, PullRefresh, Swipe, SwipeCell, Calendar and ActionBar. Their examples use phone UI previews; general components do not have separate desktop and narrow preview modes.') }}</p>

    <h2 id="catalog">{{ label('组件目录', 'Component Catalog') }}</h2>
    <div v-for="group in docGroups" :key="group.key" class="guide-component-group"><h3>{{ locale === 'zh-CN' ? group.zh : group.en }}</h3><div class="guide-component-links"><RouterLink v-for="entry in componentDocs.filter(item => item.group === group.key)" :key="entry.slug" :to="`/components/${entry.slug}`">{{ entry.name }} {{ locale === 'zh-CN' ? entry.title : '' }}</RouterLink></div></div>
  </section>
</template>

<script setup lang="ts">
import DocExample from '../components/DocExample.vue'
import { locale, t } from '../i18n'
import { componentDocs, docGroups } from '../docs/catalog'

const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en

const installCode = `pnpm add scq-vue`

const globalUseCode = `import { createApp } from 'vue'
import App from './App.vue'
import ScqVue from 'scq-vue'
import 'scq-vue/style.css'

createApp(App).use(ScqVue).mount('#app')`

const onDemandCode = `<script setup lang="ts">
import { ref } from 'vue'
import ScqSwitch from 'scq-vue/components/Switch'
import ScqInputNumber from 'scq-vue/components/InputNumber'
import 'scq-vue/styles/tokens.css'
import 'scq-vue/styles/switch.css'
import 'scq-vue/styles/input-number.css'

const enabled = ref(true)
const count = ref(3)
<\/script>

<template>
  <div class="settings">
    <ScqSwitch v-model="enabled" aria-label="Notifications" />
    <ScqInputNumber v-model="count" :min="0" aria-label="Quantity" />
  </div>
</template>

<style scoped>
.settings { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; }
</style>`

const individualRegistrationCode = `import { createApp } from 'vue'
import App from './App.vue'
import ScqButton from 'scq-vue/components/Button'
import ScqInput from 'scq-vue/components/Input'
import ScqFormItem from 'scq-vue/components/FormItem'
import ScqSwitch from 'scq-vue/components/Switch'
import 'scq-vue/styles/tokens.css'
import 'scq-vue/styles/button.css'
import 'scq-vue/styles/input.css'
import 'scq-vue/styles/form-item.css'
import 'scq-vue/styles/switch.css'

const app = createApp(App)
app.use(ScqButton)
app.use(ScqInput)
app.use(ScqFormItem)
app.use(ScqSwitch)
app.mount('#app')`

const styleCode = `import ScqActionSheet from 'scq-vue/components/ActionSheet'
import ScqCell from 'scq-vue/components/Cell'
import ScqCellGroup from 'scq-vue/components/CellGroup'
import 'scq-vue/styles/tokens.css'
import 'scq-vue/styles/action-sheet.css'
import 'scq-vue/styles/cell.css'
import 'scq-vue/styles/cell-group.css'`

const configCode = `<scq-config-provider
  locale="zh-CN"
  size="default"
  :tokens="{ primary: '#00875a', radius: '6px' }"
>
  <AppContent />
</scq-config-provider>`

const mobileCode = `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

<scq-nav-bar title="Account" fixed safe-area-inset-top />
<scq-tabbar v-model="active" :items="items" fixed safe-area-inset-bottom />`
</script>

<style scoped>
.guide-summary { display: flex; flex-wrap: wrap; gap: 10px 24px; padding-block: 12px; border-block: 1px solid #ebeef5; color: #73767a; font-size: 13px; }
.guide-component-group { padding-block: 8px 16px; border-bottom: 1px solid #ebeef5; }
.guide-component-links { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.guide-component-links a { color: #409eff; text-decoration: none; font-size: 14px; }
.guide-component-links a:hover { text-decoration: underline; }
</style>
