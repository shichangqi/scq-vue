<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ScqCell, ScqCellGroup, ScqDrawer, ScqNavBar, ScqPicker, type PickerOption, type PickerSelection, type PickerValue } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const ready = ref(false)
const opened = ref(false)
const selected = ref<PickerValue[]>(['zhejiang', 'hangzhou', 'xihu'])
const draft = ref<PickerValue[]>([])
const address = ref('浙江 / 杭州 / 西湖区')
const columns: PickerOption[] = [
  { label: '浙江', value: 'zhejiang', children: [
    { label: '杭州', value: 'hangzhou', children: [{ label: '西湖区', value: 'xihu' }, { label: '滨江区', value: 'binjiang' }] },
    { label: '宁波', value: 'ningbo', children: [{ label: '海曙区', value: 'haishu' }] },
  ] },
  { label: '江苏', value: 'jiangsu', children: [
    { label: '南京', value: 'nanjing', children: [{ label: '鼓楼区', value: 'gulou' }, { label: '秦淮区', value: 'qinhuai' }] },
    { label: '苏州', value: 'suzhou', disabled: true },
  ] },
]
const edit = () => { draft.value = [...selected.value]; opened.value = true }
const confirm = (selection: PickerSelection) => { selected.value = selection.values; address.value = selection.options.map((option) => option.label).join(' / '); opened.value = false }
onMounted(() => { ready.value = true })
</script>

<template>
  <PhonePreview screen-id="picker-shipping-preview">
    <ScqNavBar title="配送地址" />
    <div class="picker-example__content"><ScqCellGroup inset><ScqCell title="收件人" value="林一" /><ScqCell title="联系电话" value="138 0000 8264" /><ScqCell title="所在地区" :label="address" is-link @click="edit" /><ScqCell title="详细地址" label="文三路 18 号，A 座 402" /></ScqCellGroup></div>
    <ScqDrawer v-if="ready" v-model="opened" position="bottom" size="auto" :show-close="false" teleport="#picker-shipping-preview" aria-label="所在地区"><ScqPicker v-model="draft" title="所在地区" :columns="columns" @confirm="confirm" @cancel="opened = false" /></ScqDrawer>
  </PhonePreview>
</template>

<style scoped>
.picker-example__content { padding: 20px 0; }
</style>