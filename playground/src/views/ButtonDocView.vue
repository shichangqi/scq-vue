<template>
  <section class="doc-block">
    <h1>{{ t('button.title') }}</h1>
    <p class="lead">{{ t('button.lead') }}</p>

    <h2>{{ t('button.basic') }}</h2>
    <DocExample :code="basicCode" lang="html">
      <div class="demo-panel">
        <scq-button>Default</scq-button>
        <scq-button type="primary">Primary</scq-button>
        <scq-button type="success">Success</scq-button>
        <scq-button type="warning">Warning</scq-button>
        <scq-button type="info">Info</scq-button>
        <scq-button type="danger">Danger</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('button.plain') }}</h2>
    <DocExample :code="plainCode" lang="html">
      <div class="demo-panel">
        <scq-button plain type="primary">Primary Plain</scq-button>
        <scq-button plain type="success">Success Plain</scq-button>
        <scq-button plain type="warning">Warning Plain</scq-button>
        <scq-button plain type="info">Info Plain</scq-button>
        <scq-button plain type="danger">Danger Plain</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('button.state') }}</h2>
    <DocExample :code="stateCode" lang="html">
      <div class="demo-panel">
        <scq-button round type="success">Round</scq-button>
        <scq-button circle type="danger">+</scq-button>
        <scq-button loading type="primary">Loading</scq-button>
        <scq-button disabled>Disabled</scq-button>
        <scq-button text>Text</scq-button>
        <scq-button link>Link</scq-button>
      </div>
    </DocExample>

    <h2>{{ t('button.props') }}</h2>
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
        <tr><td>type</td><td>{{ t('button.type.desc') }}</td><td>default | primary | success | warning | info | danger</td><td>default</td></tr>
        <tr><td>size</td><td>{{ t('button.size.desc') }}</td><td>large | default | small</td><td>default</td></tr>
        <tr><td>plain</td><td>{{ t('button.plain.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>round</td><td>{{ t('button.round.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>circle</td><td>{{ t('button.circle.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>loading</td><td>{{ t('button.loading.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>disabled</td><td>{{ t('button.disabled.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>text</td><td>{{ t('button.text.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>link</td><td>{{ t('button.link.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>bg</td><td>{{ t('button.bg.desc') }}</td><td>boolean</td><td>false</td></tr>
        <tr><td>nativeType</td><td>{{ t('button.nativeType.desc') }}</td><td>button | submit | reset</td><td>button</td></tr>
        <tr><td>autofocus</td><td>{{ t('button.autofocus.desc') }}</td><td>boolean</td><td>false</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'

const basicCode = `<scq-button>Default</scq-button>
<scq-button type="primary">Primary</scq-button>
<scq-button type="success">Success</scq-button>
<scq-button type="warning">Warning</scq-button>
<scq-button type="info">Info</scq-button>
<scq-button type="danger">Danger</scq-button>`

const plainCode = `<scq-button plain type="primary">Primary Plain</scq-button>
<scq-button plain type="success">Success Plain</scq-button>
<scq-button plain type="warning">Warning Plain</scq-button>
<scq-button plain type="info">Info Plain</scq-button>
<scq-button plain type="danger">Danger Plain</scq-button>`

const stateCode = `<scq-button round type="success">Round</scq-button>
<scq-button circle type="danger">+</scq-button>
<scq-button loading type="primary">Loading</scq-button>
<scq-button disabled>Disabled</scq-button>
<scq-button text>Text</scq-button>
<scq-button link>Link</scq-button>`
</script>
