<script setup lang="ts">
import { ScqGrid, ScqImage } from '../../../../src/index'

const photos = [
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&auto=format&fit=crop&q=85',
]
</script>

<template><ScqGrid :columns="{ xs: 1, sm: 2 }" :gap="20"><figure class="image-example__figure"><ScqImage :src="photos[0]" alt="旅行照片" :preview-src-list="photos" :height="200" loading="eager" /><figcaption>山野 · 封面</figcaption></figure><figure class="image-example__figure"><ScqImage :src="photos[1]" alt="旅行照片" :preview-src-list="photos" :initial-index="1" :height="200" fit="contain" loading="eager" /><figcaption>湖畔 · 原图</figcaption></figure></ScqGrid></template>

<style scoped>
.image-example__figure { margin: 0; min-width: 0; }
.image-example__figure figcaption { padding: 10px 0 0; color: var(--scq-muted); font-size: 13px; }
</style>