<template>
  <div ref="wrapperRef" class="scq-watermark" :style="rootStyle">
    <div class="scq-watermark__content" :style="contentStyle">
      <slot />
    </div>
    <div
      v-if="!props.fullscreen"
      ref="layerRef"
      class="scq-watermark__layer"
      :style="layerStyle"
      aria-hidden="true"
    ></div>
    <teleport v-else to="body">
      <div
        ref="layerRef"
        class="scq-watermark__layer is-fullscreen"
        :style="layerStyle"
        aria-hidden="true"
      ></div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'

defineOptions({
  name: 'Watermark',
})

const props = defineProps({
  content: {
    type: String,
    default: 'SCQ VUE',
  },
  color: {
    type: String,
    default: 'rgba(0, 0, 0, 0.12)',
  },
  gap: {
    type: [Number, Array],
    default: 120,
  },
  size: {
    type: Number,
    default: 16,
  },
  rotate: {
    type: Number,
    default: -22,
  },
  zIndex: {
    type: Number,
    default: 9,
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },
})

const wrapperRef = ref(null)
const layerRef = ref(null)
let observer = null

const gapPair = computed(() => {
  return Array.isArray(props.gap) ? [props.gap[0], props.gap[1]] : [props.gap, props.gap]
})

const escapeXml = (value) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const createWatermarkImage = () => {
  const [gapX, gapY] = gapPair.value
  const width = Math.max(gapX, props.size * 8)
  const height = Math.max(gapY, props.size * 5)
  const lines = props.content.split('\n').map((line) => escapeXml(line))
  const lineHeight = props.size * 1.4
  const centerY = height / 2 - ((lines.length - 1) * lineHeight) / 2

  const textContent = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight
      return `<tspan x="50%" dy="${dy}">${line}</tspan>`
    })
    .join('')

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <text
        x="50%"
        y="${centerY}"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${escapeXml(props.color)}"
        font-family="Arial, sans-serif"
        font-size="${props.size}"
        font-weight="500"
        transform="rotate(${props.rotate} ${width / 2} ${height / 2})"
      >
        ${textContent}
      </text>
    </svg>
  `

  return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`
}

const rootStyle = computed(() => ({
  position: 'relative',
  display: 'block',
  overflow: 'hidden',
  isolation: 'isolate',
}))

const normalizedZIndex = computed(() => {
  const value = Number(props.zIndex)
  return Number.isFinite(value) ? Math.trunc(value) : 0
})

const contentZIndex = computed(() => {
  return 0
})

const contentStyle = computed(() => ({
  position: 'relative',
  zIndex: String(contentZIndex.value),
}))

const layerStyle = computed(() => ({
  position: props.fullscreen ? 'fixed' : 'absolute',
  inset: '0',
  zIndex: String(normalizedZIndex.value),
  pointerEvents: 'none',
  userSelect: 'none',
  backgroundRepeat: 'repeat',
  backgroundPosition: '0 0',
  backgroundImage: createWatermarkImage(),
  backgroundSize: `${gapPair.value[0]}px ${gapPair.value[1]}px`,
}))

const syncWatermark = () => {
  const wrapper = wrapperRef.value
  const layer = layerRef.value
  const host = props.fullscreen ? document.body : wrapper

  if (!host || !layer) {
    return
  }

  if (layer.parentElement !== host) {
    host.appendChild(layer)
  }

  if (wrapper) {
    Object.assign(wrapper.style, rootStyle.value)
  }
  Object.assign(layer.style, layerStyle.value)
}

const startObserver = () => {
  const target = props.fullscreen ? document.body : wrapperRef.value

  if (!target || observer) {
    return
  }

  observer = new MutationObserver(() => {
    syncWatermark()
  })

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
}

const restartObserver = async () => {
  observer?.disconnect()
  observer = null
  await nextTick()
  startObserver()
  syncWatermark()
}

watchEffect(() => {
  syncWatermark()
})

watch(
  () => props.fullscreen,
  () => {
    void restartObserver()
  },
)

onMounted(() => {
  startObserver()
  syncWatermark()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style>
.scq-watermark {
  position: relative;
  display: block;
  overflow: hidden;
  isolation: isolate;
}

.scq-watermark__content {
  position: relative;
  z-index: 1;
}

.scq-watermark__layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  user-select: none;
  background-repeat: repeat;
  background-position: 0 0;
}

.scq-watermark__layer.is-fullscreen {
  position: fixed;
}
</style>