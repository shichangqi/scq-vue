<template>
  <section class="doc-block">
    <h1>快速开始</h1>
    <p class="lead">scq-vue 是一个 Vue 3 组件库，目前提供 Button 和 Input。</p>

    <h2>安装</h2>
    <DocExample :code="installCode" lang="bash" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <h2>全局引入</h2>
    <DocExample :code="globalUseCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <p class="lead">
      全局引入后，请使用前缀标签：&lt;scq-button /&gt;、&lt;scq-input /&gt;。
    </p>

    <h2>按需引入</h2>
    <DocExample :code="onDemandCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <h2>按需样式</h2>
    <DocExample :code="styleCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />
  </section>
</template>

<script setup lang="ts">
import DocExample from '../components/DocExample.vue'

const installCode = `pnpm add scq-vue`

const globalUseCode = `import { createApp } from 'vue'
import App from './App.vue'
import ScqVue from 'scq-vue'
import 'scq-vue/style.css'

createApp(App).use(ScqVue).mount('#app')`

const onDemandCode = `import { createApp } from 'vue'
import App from './App.vue'
import { ScqButton, ScqInput } from 'scq-vue'
import 'scq-vue/style.css'

const app = createApp(App)
app.use(ScqButton)
app.use(ScqInput)
app.mount('#app')`

const styleCode = `import { ScqButton, ScqInput } from 'scq-vue'
import 'scq-vue/styles/button.css'
import 'scq-vue/styles/input.css'`
</script>
