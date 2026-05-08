<template>
  <section class="doc-block">
    <h1>{{ t('guide.title') }}</h1>
    <p class="lead">{{ t('guide.lead') }}</p>

    <h2>{{ t('guide.install') }}</h2>
    <DocExample :code="installCode" lang="bash" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <h2>{{ t('guide.global') }}</h2>
    <DocExample :code="globalUseCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <p class="lead">
      {{ t('guide.global.tip') }}
    </p>

    <h2>{{ t('guide.ondemand') }}</h2>
    <DocExample :code="onDemandCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />

    <h2>{{ t('guide.style') }}</h2>
    <DocExample :code="styleCode" lang="ts" :show-demo="false" :default-expanded="true" :collapsible="false" />
  </section>
</template>

<script setup lang="ts">
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'

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
