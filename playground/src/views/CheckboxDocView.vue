<template>
  <section class="doc-block">
    <h1>{{ t('checkbox.title') }}</h1>
    <p class="lead">{{ t('checkbox.lead') }}</p>

    <h2>{{ t('checkbox.basic') }}</h2>
    <DocExample :code="basicCode" lang="vue">
      <div class="demo-grid">
        <scq-checkbox v-model="singleChecked">{{ t('checkbox.singleLabel') }}</scq-checkbox>
        <div>{{ t('checkbox.current') }}{{ singleChecked ? 'true' : 'false' }}</div>
      </div>
    </DocExample>

    <h2>{{ t('checkbox.group') }}</h2>
    <DocExample :code="groupCode" lang="vue">
      <div class="demo-grid">
        <scq-checkbox-group v-model="pickedTags" name="tags">
          <scq-checkbox value="design">Design</scq-checkbox>
          <scq-checkbox value="frontend">Frontend</scq-checkbox>
          <scq-checkbox value="ai">AI</scq-checkbox>
        </scq-checkbox-group>
        <div>{{ t('checkbox.currentList') }}{{ pickedTags.join(', ') || '-' }}</div>
      </div>
    </DocExample>

    <h2>{{ t('checkbox.vertical') }}</h2>
    <DocExample :code="verticalCode" lang="vue">
      <div class="demo-grid">
        <scq-checkbox-group v-model="pickedPlans" direction="vertical" size="large">
          <scq-checkbox value="starter">Starter</scq-checkbox>
          <scq-checkbox value="pro">Pro</scq-checkbox>
          <scq-checkbox value="enterprise" disabled>Enterprise</scq-checkbox>
        </scq-checkbox-group>
        <div>{{ t('checkbox.currentList') }}{{ pickedPlans.join(', ') || '-' }}</div>
      </div>
    </DocExample>

    <h2>{{ t('checkbox.indeterminate') }}</h2>
    <DocExample :code="indeterminateCode" lang="vue">
      <div class="demo-grid">
        <scq-checkbox :indeterminate="true">{{ t('checkbox.indeterminateLabel') }}</scq-checkbox>
      </div>
    </DocExample>

    <h2>{{ t('checkbox.props') }}</h2>
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
        <tr><td>modelValue</td><td>{{ t('checkbox.model.desc') }}</td><td>boolean | (string | number | boolean)[]</td><td>false / []</td></tr>
        <tr><td>value</td><td>{{ t('checkbox.value.desc') }}</td><td>string | number | boolean</td><td>true</td></tr>
        <tr><td>text</td><td>{{ t('checkbox.text.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>name</td><td>{{ t('checkbox.name.desc') }}</td><td>string</td><td>''</td></tr>
        <tr><td>disabled</td><td>{{ t('checkbox.disabled.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>size</td><td>{{ t('checkbox.size.desc') }}</td><td>small | default | large</td><td>default</td></tr>
        <tr><td>direction</td><td>{{ t('checkbox.direction.desc') }}</td><td>horizontal | vertical</td><td>horizontal</td></tr>
        <tr><td>indeterminate</td><td>{{ t('checkbox.indeterminate.desc') }}</td><td>boolean</td><td>false</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'

const singleChecked = ref(true)
const pickedTags = ref<Array<string | number | boolean>>(['frontend'])
const pickedPlans = ref<Array<string | number | boolean>>(['pro'])

const basicCode = `<template>
  <scq-checkbox v-model="singleChecked">启用消息通知</scq-checkbox>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const singleChecked = ref(true)
<\/script>`

const groupCode = `<template>
  <scq-checkbox-group v-model="pickedTags" name="tags">
    <scq-checkbox value="design">Design</scq-checkbox>
    <scq-checkbox value="frontend">Frontend</scq-checkbox>
    <scq-checkbox value="ai">AI</scq-checkbox>
  </scq-checkbox-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const pickedTags = ref(['frontend'])
<\/script>`

const verticalCode = `<template>
  <scq-checkbox-group v-model="pickedPlans" direction="vertical" size="large">
    <scq-checkbox value="starter">Starter</scq-checkbox>
    <scq-checkbox value="pro">Pro</scq-checkbox>
    <scq-checkbox value="enterprise" disabled>Enterprise</scq-checkbox>
  </scq-checkbox-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const pickedPlans = ref(['pro'])
<\/script>`

const indeterminateCode = `<template>
  <scq-checkbox :indeterminate="true">部分选择</scq-checkbox>
</template>

<script setup lang="ts">
<\/script>`
</script>
