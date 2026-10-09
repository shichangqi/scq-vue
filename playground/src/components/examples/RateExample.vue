<script setup lang="ts">
import { ref } from 'vue'
import { ScqRate, ScqSwitch } from '../../../../src/index'

const score = ref(3.5)
const readonly = ref(false)
const texts = ['不满意', '一般', '还不错', '满意', '非常满意']
</script>

<template>
  <div class="rate-example"><div><span>本次服务</span><ScqRate v-model="score" allow-half :readonly="readonly" show-text :texts="texts" aria-label="本次服务评分" /></div><label><ScqSwitch v-model="readonly" aria-label="只读评分" />已提交</label><div><span>用户平均</span><ScqRate :model-value="4.5" readonly allow-half show-text aria-label="用户平均评分" /></div></div>
</template>

<style scoped>
.rate-example { display: flex; flex-wrap: wrap; align-items: center; gap: 28px; }
.rate-example > div { display: grid; gap: 10px; min-width: 0; }
.rate-example > div > span, .rate-example > label { color: var(--scq-muted); font-size: 13px; }
.rate-example > label { display: flex; align-items: center; gap: 8px; }
</style>