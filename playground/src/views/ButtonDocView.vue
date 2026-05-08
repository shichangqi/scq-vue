<template>
  <section class="doc-block">
    <h1>Button 按钮</h1>
    <p class="lead">常用的操作按钮，支持不同类型、尺寸和状态。</p>

    <h2>基础用法</h2>
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

    <h2>Plain 颜色示例</h2>
    <DocExample :code="plainCode" lang="html">
      <div class="demo-panel">
        <scq-button plain type="primary">Primary Plain</scq-button>
        <scq-button plain type="success">Success Plain</scq-button>
        <scq-button plain type="warning">Warning Plain</scq-button>
        <scq-button plain type="info">Info Plain</scq-button>
        <scq-button plain type="danger">Danger Plain</scq-button>
      </div>
    </DocExample>

    <h2>状态与形状</h2>
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
        <tr><td>type</td><td>按钮类型</td><td>default | primary | success | warning | info | danger</td><td>default</td></tr>
        <tr><td>size</td><td>按钮尺寸</td><td>large | default | small</td><td>default</td></tr>
        <tr><td>plain</td><td>朴素按钮</td><td>boolean</td><td>false</td></tr>
        <tr><td>round</td><td>圆角按钮</td><td>boolean</td><td>false</td></tr>
        <tr><td>circle</td><td>圆形按钮</td><td>boolean</td><td>false</td></tr>
        <tr><td>loading</td><td>加载状态</td><td>boolean</td><td>false</td></tr>
        <tr><td>disabled</td><td>禁用状态</td><td>boolean</td><td>false</td></tr>
        <tr><td>text</td><td>文本按钮</td><td>boolean</td><td>false</td></tr>
        <tr><td>link</td><td>链接按钮</td><td>boolean</td><td>false</td></tr>
        <tr><td>bg</td><td>text 模式下背景</td><td>boolean</td><td>false</td></tr>
        <tr><td>nativeType</td><td>原生 type</td><td>button | submit | reset</td><td>button</td></tr>
        <tr><td>autofocus</td><td>自动聚焦</td><td>boolean</td><td>false</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import DocExample from '../components/DocExample.vue'

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
