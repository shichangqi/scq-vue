<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ScqActionBar, ScqCell, ScqImage, ScqNavBar, Toast, type ActionBarItem } from '../../../../src/index'
import PhonePreview from '../PhonePreview.vue'

const favorite = ref(false)
const cart = ref(0)
const order = ref('待选择')
const actions = computed<ActionBarItem[]>(() => [
  { key: 'favorite', label: favorite.value ? '已收藏' : '收藏', icon: 'heart', type: 'icon' },
  { key: 'cart', label: '加入购物车', type: 'default' },
  { key: 'buy', label: '立即购买', type: 'primary' },
])
const act = (action: ActionBarItem) => {
  if (action.key === 'favorite') favorite.value = !favorite.value
  if (action.key === 'cart') { cart.value += 1; Toast.success({ message: '已加入购物车', teleport: '#action-bar-product-preview' }) }
  if (action.key === 'buy') { order.value = '待确认'; Toast.show({ message: '订单待确认', teleport: '#action-bar-product-preview' }) }
}
onBeforeUnmount(() => Toast.clear('#action-bar-product-preview'))
</script>

<template>
  <PhonePreview screen-id="action-bar-product-preview"><ScqNavBar title="商品详情" /><ScqImage src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=85" alt="打开的轻薄笔记本电脑" :height="190" loading="eager" /><div class="action-bar-example__details"><strong class="action-bar-example__price">¥ 5,999</strong><h3>轻薄便携笔记本</h3><p>银色 · 16 GB + 512 GB</p></div><ScqCell title="购物车" :value="`${cart} 件`" /><ScqCell title="订单状态" :value="order" /><ScqActionBar :actions="actions" fixed @click="act" /></PhonePreview>
</template>

<style scoped>
.action-bar-example__details { padding: 18px 16px 12px; background: var(--scq-surface); }
.action-bar-example__price { font-size: 22px; color: var(--scq-primary); font-variant-numeric: tabular-nums; }
.action-bar-example__details h3 { margin: 8px 0; font-size: 16px; color: var(--scq-text); }
.action-bar-example__details p { margin: 0; color: var(--scq-muted); font-size: 13px; }
</style>