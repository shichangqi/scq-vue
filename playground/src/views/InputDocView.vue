<template>
  <section class="doc-block">
    <h1>Input 输入框</h1>
    <p class="lead">通过键盘输入字符内容，支持清空、密码显示和多行文本。</p>

    <h2>基础用法</h2>
    <DocExample :code="basicCode" lang="html">
      <div class="demo-grid">
        <scq-input v-model="text" placeholder="请输入内容" clearable />
        <scq-input v-model="password" type="password" show-password placeholder="请输入密码" />
        <scq-input v-model="desc" type="textarea" placeholder="请输入多行内容" />
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
        <tr><td>modelValue</td><td>绑定值</td><td>string | number</td><td>''</td></tr>
        <tr><td>type</td><td>输入框类型</td><td>text | password | textarea | number | email | tel | url | search</td><td>text</td></tr>
        <tr><td>size</td><td>输入框尺寸</td><td>large | default | small</td><td>default</td></tr>
        <tr><td>placeholder</td><td>占位文本</td><td>string</td><td>''</td></tr>
        <tr><td>disabled</td><td>禁用</td><td>boolean</td><td>false</td></tr>
        <tr><td>readonly</td><td>只读</td><td>boolean</td><td>false</td></tr>
        <tr><td>clearable</td><td>可清空</td><td>boolean</td><td>false</td></tr>
        <tr><td>showPassword</td><td>显示密码切换</td><td>boolean</td><td>false</td></tr>
        <tr><td>prefixIcon</td><td>前缀图标类名</td><td>string</td><td>''</td></tr>
        <tr><td>suffixIcon</td><td>后缀图标类名</td><td>string</td><td>''</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'

const text = ref('')
const password = ref('')
const desc = ref('')

const basicCode = `<scq-input v-model="text" placeholder="请输入内容" clearable />
<scq-input v-model="password" type="password" show-password placeholder="请输入密码" />
<scq-input v-model="desc" type="textarea" placeholder="请输入多行内容" />`

</script>
