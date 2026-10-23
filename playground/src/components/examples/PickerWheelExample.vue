<script setup lang="ts">
import { ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCell from '../../../../src/components/Cell'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqPicker from '../../../../src/components/Picker'
import type { PickerOption, PickerSelection, PickerValue } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const columns: PickerOption[] = [
  { label: '北京', value: 'beijing', children: [{ label: '朝阳区', value: 'chaoyang' }, { label: '海淀区', value: 'haidian' }] },
  { label: '暂未开放', value: 'unavailable', disabled: true },
  { label: '上海', value: 'shanghai', children: [{ label: '黄浦区', value: 'huangpu' }, { label: '徐汇区', value: 'xuhui' }, { label: '浦东新区', value: 'pudong' }] },
  { label: '杭州', value: 'hangzhou', children: [{ label: '西湖区', value: 'xihu' }, { label: '临平区（暂停配送）', value: 'linping', disabled: true }, { label: '滨江区', value: 'binjiang' }] },
  { label: '南京', value: 'nanjing', children: [{ label: '鼓楼区', value: 'gulou' }, { label: '秦淮区', value: 'qinhuai' }] },
  { label: '广州', value: 'guangzhou', children: [{ label: '天河区', value: 'tianhe' }, { label: '越秀区', value: 'yuexiu' }] },
  { label: '深圳', value: 'shenzhen', children: [{ label: '南山区', value: 'nanshan' }, { label: '福田区', value: 'futian' }] },
]
const selected = ref<PickerValue[]>(['hangzhou', 'xihu'])
const loading = ref(false)
const confirmation = ref('尚未确认')
const confirm = (selection: PickerSelection) => { confirmation.value = selection.options.map((option) => option.label).join(' / ') }
</script>

<template>
  <PhonePreview screen-id="picker-wheel-preview">
    <ScqNavBar title="滚轮与级联" />
    <div class="picker-wheel-example__intro">
      <p>上下滑动后居中吸附，灰色选项不可选。支持方向键、Home / End 和 Enter。</p>
      <ScqButton size="small" @click="selected = ['shenzhen', 'futian']">外部切换到深圳</ScqButton>
      <ScqButton size="small" :aria-pressed="loading" @click="loading = !loading">{{ loading ? '结束加载' : '模拟加载' }}</ScqButton>
    </div>
    <ScqPicker v-model="selected" mode="wheel" title="配送地区" :columns="columns" :loading="loading" @confirm="confirm" @cancel="confirmation = '已取消确认；即时选择值保持不变'" />
    <ScqCell title="即时受控值" :label="selected.join(' / ')" />
    <ScqCell title="最近确认" :label="confirmation" />
  </PhonePreview>
</template>

<style scoped>
.picker-wheel-example__intro { padding: 12px 16px; color: var(--scq-muted); font-size: 13px; }
.picker-wheel-example__intro p { margin: 0 0 12px; line-height: 1.6; }
</style>
