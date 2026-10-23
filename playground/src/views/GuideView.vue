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
      {{ label('全局注册后，使用 scq- 前缀标签，例如 scq-button、scq-form 和 scq-action-sheet。', 'After global registration, use tags with the scq- prefix, such as scq-button, scq-form and scq-action-sheet.') }}
    </p>

    <h2>{{ t('guide.ondemand') }}</h2>
    <DocExample :code="onDemandCode" lang="vue" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('所有组件都支持独立子路径。script setup 中导入后可直接使用，不需要 app.use；子路径区分大小写。', 'Every component supports an independent, case-sensitive subpath. Imported components are directly usable in script setup without app.use.') }}</p>

    <h2 id="individual-registration">{{ label('按需全局注册', 'Individual Global Registration') }}</h2>
    <DocExample :code="individualRegistrationCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('FormItem、CellGroup、RadioGroup、CheckboxGroup 和 CollapseItem 也可以独立引入和注册，或通过对应父组件注册。', 'FormItem, CellGroup, RadioGroup, CheckboxGroup and CollapseItem can also be imported and registered independently, or registered with their parent component.') }}</p>

    <h2>{{ t('guide.style') }}</h2>
    <DocExample :code="styleCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('组件的 JavaScript 入口不自动加载 CSS，只需引入所用组件的样式；公共主题变量及内部依赖的图标和控件样式会自动加载，无需额外引入。', 'JavaScript component entries do not load CSS automatically. Import only the component styles you use; shared theme variables and internal icon and control styles are included automatically.') }}</p>

    <h2 id="configuration">{{ label('主题与全局配置', 'Theme and Global Configuration') }}</h2>
    <DocExample :code="configCode" lang="vue" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('使用 ConfigProvider 统一配置组件的语言、尺寸、禁用状态和主题。支持继承的配置项以各组件 API 为准，组件显式传入的属性优先于全局默认值；Form 的整表禁用约束仍然生效。自定义文案和示例内容不会自动翻译。', 'Use ConfigProvider to share locale, size, disabled state and theme settings. See each component API for supported settings. Explicit component props take precedence over provider defaults; form-wide disabling still applies. Custom labels and example content are not translated automatically.') }}</p>

    <h2 id="mobile">{{ label('移动端使用', 'Mobile Usage') }}</h2>
    <DocExample :code="mobileCode" lang="html" :show-demo="false" :default-expanded="true" :collapsible="false" />
    <p class="lead">{{ label('可在导航中选择“移动端”，查看适合触屏交互的组件。示例通过手机预览展示布局；在实际页面中使用时，请设置 viewport，并按需开启安全区适配。', 'Choose Mobile in the navigation to browse touch-friendly components. Examples use phone previews to show their layouts. Set the viewport on your application page and enable safe-area support where needed.') }}</p>
  </section>
</template>

<script setup lang="ts">
import DocExample from '../components/DocExample.vue'
import { locale, t } from '../i18n'
import { componentDocs } from '../docs/catalog'

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
</style>
