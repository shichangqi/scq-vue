<template>
  <section class="doc-block">
    <h1>{{ t('radio.title') }}</h1>
    <p class="lead">{{ t('radio.lead') }}</p>

    <h2>{{ t('radio.basic') }}</h2>
    <DocExample :code="basicCode" lang="vue">
      <div class="demo-grid">
        <scq-radio v-model="singleValue" value="ready">{{ t('radio.singleLabel') }}</scq-radio>
        <div>{{ t('radio.current') }}{{ singleValue }}</div>
      </div>
    </DocExample>

    <h2>{{ t('radio.group') }}</h2>
    <DocExample :code="groupCode" lang="vue">
      <div class="demo-grid">
        <scq-radio-group v-model="pickedChannel" name="channel">
          <scq-radio value="web">Web</scq-radio>
          <scq-radio value="mini-app">Mini App</scq-radio>
          <scq-radio value="ios">iOS</scq-radio>
        </scq-radio-group>
        <div>{{ t('radio.current') }}{{ pickedChannel }}</div>
      </div>
    </DocExample>

    <h2>{{ t('radio.vertical') }}</h2>
    <DocExample :code="verticalCode" lang="vue">
      <div class="demo-grid">
        <scq-radio-group v-model="pickedPlan" direction="vertical" name="plan" size="large">
          <scq-radio value="starter">Starter</scq-radio>
          <scq-radio value="pro">Pro</scq-radio>
          <scq-radio value="enterprise" disabled>Enterprise</scq-radio>
        </scq-radio-group>
        <div>{{ t('radio.current') }}{{ pickedPlan }}</div>
      </div>
    </DocExample>

    <h2>{{ t('radio.props') }}</h2>
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
        <tr><td>modelValue</td><td>{{ t('radio.model.desc') }}</td><td>string | number | boolean</td><td>-</td></tr>
        <tr><td>value</td><td>{{ t('radio.value.desc') }}</td><td>string | number | boolean</td><td>true</td></tr>
        <tr><td>text</td><td>{{ t('radio.text.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>name</td><td>{{ t('radio.name.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>disabled</td><td>{{ t('radio.disabled.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>size</td><td>{{ t('radio.size.desc') }}</td><td>small | default | large</td><td>default</td></tr>
        <tr><td>direction</td><td>{{ t('radio.direction.desc') }}</td><td>horizontal | vertical</td><td>horizontal</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'

const singleValue = ref('ready')
const pickedChannel = ref('web')
const pickedPlan = ref('pro')

const basicCode = `<template>
  <scq-radio v-model="singleValue" value="ready">立即发布</scq-radio>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const singleValue = ref('ready')
<\/script>`

const groupCode = `<template>
  <scq-radio-group v-model="pickedChannel" name="channel">
    <scq-radio value="web">Web</scq-radio>
    <scq-radio value="mini-app">Mini App</scq-radio>
    <scq-radio value="ios">iOS</scq-radio>
  </scq-radio-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const pickedChannel = ref('web')
<\/script>`

const verticalCode = `<template>
  <scq-radio-group v-model="pickedPlan" direction="vertical" name="plan" size="large">
    <scq-radio value="starter">Starter</scq-radio>
    <scq-radio value="pro">Pro</scq-radio>
    <scq-radio value="enterprise" disabled>Enterprise</scq-radio>
  </scq-radio-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const pickedPlan = ref('pro')
<\/script>`
</script>
