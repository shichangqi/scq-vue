<script setup lang="ts">
import { ref } from 'vue'
import ScqCell from '../../../../src/components/Cell'
import ScqCellGroup from '../../../../src/components/CellGroup'
import ScqNavBar from '../../../../src/components/NavBar'
import ScqSwipe from '../../../../src/components/Swipe'
import ScqSwitch from '../../../../src/components/Switch'
import ScqButton from '../../../../src/components/Button'
import ScqSpace from '../../../../src/components/Space'
import PhonePreview from '../PhonePreview.vue'

const active = ref(0)
const autoplay = ref(false)
const vertical = ref(false)
const CONFIG = { height: 220, gap: 12, autoplay: 3500 }
const swipe = ref<InstanceType<typeof ScqSwipe>>()
const loop = ref(true)
const disabled = ref(false)
const customIndicators = ref(false)
const slides = [
  { key: 'mountain', src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&auto=format&fit=crop&q=85', alt: '山谷与湖泊', title: '山野周末', distance: '12 km', time: '约 4 小时' },
  { key: 'lake', src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&auto=format&fit=crop&q=85', alt: '湖畔与远处的山峰', title: '湖畔慢行', distance: '6 km', time: '约 2 小时' },
  { key: 'forest', src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&auto=format&fit=crop&q=85', alt: '阳光穿过森林', title: '林间步道', distance: '8 km', time: '约 3 小时' },
]
</script>

<template>
  <PhonePreview screen-id="swipe-trips-preview">
    <ScqNavBar title="周末行程" />
    <ScqSwipe ref="swipe" v-model="active" :items="slides" :height="CONFIG.height" :vertical="vertical" :gap="CONFIG.gap" :autoplay="autoplay ? CONFIG.autoplay : 0" :loop="loop" :disabled="disabled" pause-on-hover show-arrows aria-label="行程照片">
      <template v-if="customIndicators" #indicators="{ active: current, count, swipeTo }"><ScqButton v-for="index in count" :key="index" size="small" :disabled="disabled" :aria-current="index - 1 === current ? 'true' : undefined" @click="swipeTo(index - 1)">{{ index }}</ScqButton></template>
    </ScqSwipe>
    <div class="swipe-example__heading"><h3>{{ slides[active].title }}</h3><span>{{ active + 1 }} / {{ slides.length }}</span></div>
    <ScqCellGroup inset>
      <ScqCell title="路线距离" :value="slides[active].distance" />
      <ScqCell title="预计用时" :value="slides[active].time" />
      <ScqCell title="自动播放"><ScqSwitch v-model="autoplay" aria-label="自动播放行程照片" /></ScqCell>
      <ScqCell title="纵向轮播"><ScqSwitch v-model="vertical" aria-label="纵向轮播" /></ScqCell>
      <ScqCell title="循环"><ScqSwitch v-model="loop" aria-label="循环轮播" /></ScqCell>
      <ScqCell title="禁用"><ScqSwitch v-model="disabled" aria-label="禁用轮播" /></ScqCell>
      <ScqCell title="自定义指示器"><ScqSwitch v-model="customIndicators" aria-label="自定义指示器" /></ScqCell>
    </ScqCellGroup>
    <ScqSpace wrap><ScqButton @click="swipe?.prev()">上一张</ScqButton><ScqButton @click="swipe?.next()">下一张</ScqButton><ScqButton @click="swipe?.pause()">暂停</ScqButton><ScqButton @click="swipe?.resume()">恢复</ScqButton></ScqSpace>
  </PhonePreview>
</template>

<style scoped>
.swipe-example__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 18px 12px; }
.swipe-example__heading h3 { margin: 0; font-size: 18px; color: var(--scq-text); }
.swipe-example__heading span { font-size: 12px; color: var(--scq-muted); }
</style>