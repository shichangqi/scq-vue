<template>
  <section class="doc-block">
    <h1>{{ t('input.title') }}</h1>
    <p class="lead">{{ t('input.lead') }}</p>
    <OnDemandExample :code="basicCode">
      <div class="demo-grid">
        <scq-input v-model="text" placeholder="请输入内容" clearable />
        <scq-input v-model="password" type="password" show-password placeholder="请输入密码" />
        <scq-input v-model="desc" type="textarea" placeholder="请输入多行内容" />
      </div>
    </OnDemandExample>

    <h2>{{ t('input.props') }}</h2>
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
        <tr><td>modelValue</td><td>{{ t('input.modelValue.desc') }}</td><td>string | number</td><td>''</td></tr>
        <tr><td>type</td><td>{{ t('input.type.desc') }}</td><td>text | password | textarea | number | email | tel | url | search</td><td>text</td></tr>
        <tr><td>size</td><td>{{ t('input.size.desc') }}</td><td>large | default | small</td><td>provider / default</td></tr>
        <tr><td>placeholder</td><td>{{ t('input.placeholder.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>disabled</td><td>{{ t('input.disabled.desc') }}</td><td>boolean</td><td>provider / false</td></tr>
        <tr><td>readonly</td><td>{{ t('input.readonly.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>clearable</td><td>{{ t('input.clearable.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>showPassword</td><td>{{ t('input.showPassword.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>prefixIcon</td><td>{{ t('input.prefixIcon.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>suffixIcon</td><td>{{ t('input.suffixIcon.desc') }}</td><td>string</td><td>''</td></tr>
      </tbody>
    </table>
    <ComponentDocView slug="input" supplement />
  </section>
</template>

<script setup lang="ts">
import ScqInput from '../../../src/components/Input'
import { ref } from 'vue'
import OnDemandExample from '../components/OnDemandExample.vue'
import ComponentDocView from './ComponentDocView.vue'
import { t } from '../i18n'

const text = ref('')
const password = ref('')
const desc = ref('')

const basicCode = `<template>
  <div class="demo-grid">
    <scq-input v-model="text" placeholder="请输入内容" clearable />
    <scq-input v-model="password" type="password" show-password placeholder="请输入密码" />
    <scq-input v-model="desc" type="textarea" placeholder="请输入多行内容" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
const password = ref('')
const desc = ref('')
<\/script>`

</script>
