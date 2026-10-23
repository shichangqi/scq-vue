<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqSpace from '../../../../src/components/Space'
import ScqUpload from '../../../../src/components/Upload'
import type { UploadFile, UploadRequestOptions } from '../../../../src/components/Upload'
import ExampleSection from '../ExampleSection.vue'

const CONFIG = { limit: 3, maxSize: 1024 * 1024, complete: 100, action: '/api/example-upload', headers: { 'X-Example': 'playground' }, data: { category: 'documents' } }
const upload = ref<InstanceType<typeof ScqUpload>>()
const files = ref<UploadFile[]>([])
const disabled = ref(false)
const allowUpload = ref(true)
const allowRemove = ref(true)
const showList = ref(true)
const status = ref('本地模拟，不发送网络请求，也不读取文件内容')
const beforeUpload = () => allowUpload.value
const beforeRemove = (file: UploadFile) => { status.value = allowRemove.value ? `移除：${file.name}` : '已阻止移除'; return allowRemove.value }
const request = async (options: UploadRequestOptions) => {
  options.onProgress(CONFIG.complete)
  return { filename: options.filename, method: options.method, action: options.action, field: options.name, data: options.data, headers: options.headers, withCredentials: options.withCredentials }
}
const addExample = () => upload.value?.addFiles([new File(['Example document'], 'example.txt', { type: 'text/plain' })])
const onError = (error: unknown) => { status.value = error instanceof Error ? error.message : String(error) }
</script>

<template>
  <ExampleSection title="手动上传、前置校验与请求参数" description="先选择文件或添加示例文件，再点击提交。beforeUpload=false 拒绝上传；beforeRemove=false 保留文件。请求参数会传给自定义 httpRequest。">
    <template #controls>
      <ScqCheckbox v-model="disabled">禁用</ScqCheckbox>
      <ScqCheckbox v-model="allowUpload">允许上传</ScqCheckbox>
      <ScqCheckbox v-model="allowRemove">允许移除</ScqCheckbox>
      <ScqCheckbox v-model="showList">显示文件列表</ScqCheckbox>
    </template>
    <ScqUpload ref="upload" v-model:file-list="files" :auto-upload="false" :disabled="disabled" :show-file-list="showList" list-type="picture" accept=".txt,.png" multiple :limit="CONFIG.limit" :max-size="CONFIG.maxSize" :action="CONFIG.action" method="PUT" name="document" :headers="CONFIG.headers" :data="CONFIG.data" :with-credentials="false" :before-upload="beforeUpload" :before-remove="beforeRemove" :http-request="request" @success="response => status = JSON.stringify(response)" @error="onError" @reject="(file, reason) => status = `${file.name}: ${reason}`" @exceed="status = `最多 ${CONFIG.limit} 个文件`" @preview="file => status = `预览：${file.name}`">
      <template #trigger>选择 TXT / PNG</template>
      <template #tip>图片列表可显示缩略图；所有上传均为本地演示。</template>
    </ScqUpload>
    <ScqSpace wrap>
      <ScqButton :disabled="disabled" @click="addExample">添加示例文件</ScqButton>
      <ScqButton :disabled="disabled" @click="upload?.submit()">提交上传</ScqButton>
      <ScqButton :disabled="disabled" @click="upload?.clearFiles()">清空文件</ScqButton>
    </ScqSpace>
    <output role="status">{{ status }}</output>
  </ExampleSection>
</template>
