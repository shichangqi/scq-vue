<template>
  <section class="doc-block">
    <h1>{{ t('watermark.title') }}</h1>
    <p class="lead">{{ t('watermark.lead') }}</p>

    <h2>{{ t('watermark.basic') }}</h2>
    <DocExample :code="basicCode" lang="vue">
      <scq-watermark content="SCQ VUE" color="rgba(15, 23, 42, 0.24)">
        <div class="watermark-demo">
          <h3>Watermark Demo</h3>
          <p>这是一块被水印覆盖的内容区域，适合放页面容器、说明卡片或敏感信息展示区。</p>
          <div class="watermark-demo__actions">
            <scq-button type="primary">Primary Action</scq-button>
            <scq-button>Default Action</scq-button>
          </div>
        </div>
      </scq-watermark>
    </DocExample>

    <h2>{{ t('watermark.custom') }}</h2>
    <DocExample :code="customCode" lang="vue">
      <scq-watermark content="CONFIDENTIAL" color="rgba(16, 185, 129, 0.18)" :gap="[180, 120]" :rotate="-18" :size="18">
        <div class="watermark-demo watermark-demo--dark">
          <h3>Custom Watermark</h3>
          <p>可以单独调整颜色、间距和字号，水印节点被移除或样式被修改时会自动恢复。</p>
          <div class="watermark-demo__chips">
            <span>color</span>
            <span>gap</span>
            <span>size</span>
          </div>
        </div>
      </scq-watermark>
    </DocExample>

    <h2>{{ t('watermark.topLayer') }}</h2>
    <DocExample :code="topLayerCode" lang="vue">
      <scq-watermark
        content="TOP LAYER"
        color="rgba(220, 38, 38, 0.34)"
        :gap="[150, 110]"
        :size="22"
        :z-index="99"
        :fullscreen="isTopLayerFullscreen"
      >
        <div class="watermark-demo">
          <h3>Top Layer Overlay</h3>
          <p>{{ isTopLayerFullscreen ? t('watermark.topLayer.active') : t('watermark.topLayer.inactive') }}</p>
          <div class="watermark-demo__actions">
            <scq-button type="danger" @click="isTopLayerFullscreen = !isTopLayerFullscreen">
              {{ isTopLayerFullscreen ? t('watermark.topLayer.exit') : t('watermark.topLayer.enter') }}
            </scq-button>
            <scq-button>Normal</scq-button>
          </div>
        </div>
      </scq-watermark>
    </DocExample>

    <h2>{{ t('watermark.props') }}</h2>
    <table class="prop-table">
      <thead>
        <tr>
          <th>{{ t('doc.param') }}</th>
          <th>{{ t('doc.desc') }}</th>
          <th>{{ t('doc.type') }}</th>
          <th>{{ t('doc.default') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>content</td><td>{{ t('watermark.content.desc') }}</td><td>string</td><td>SCQ VUE</td></tr>
        <tr><td>color</td><td>{{ t('watermark.color.desc') }}</td><td>string</td><td>rgba(0, 0, 0, 0.12)</td></tr>
        <tr><td>gap</td><td>{{ t('watermark.gap.desc') }}</td><td>number | [number, number]</td><td>120</td></tr>
        <tr><td>size</td><td>{{ t('watermark.size.desc') }}</td><td>number</td><td>16</td></tr>
        <tr><td>rotate</td><td>{{ t('watermark.rotate.desc') }}</td><td>number</td><td>-22</td></tr>
        <tr><td>zIndex</td><td>{{ t('watermark.zIndex.desc') }}</td><td>number</td><td>9</td></tr>
        <tr><td>fullscreen</td><td>{{ t('watermark.fullscreen.desc') }}</td><td>boolean</td><td>false</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'

const isTopLayerFullscreen = ref(false)

const basicCode = `<template>
  <scq-watermark content="SCQ VUE" color="rgba(15, 23, 42, 0.24)">
    <div class="watermark-demo">
      <h3>Watermark Demo</h3>
      <p>这是一块被水印覆盖的内容区域，适合放页面容器、说明卡片或敏感信息展示区。</p>
      <div class="watermark-demo__actions">
        <scq-button type="primary">Primary Action</scq-button>
        <scq-button>Default Action</scq-button>
      </div>
    </div>
  </scq-watermark>
</template>

<script setup lang="ts">
<\/script>`

const customCode = `<template>
  <scq-watermark content="CONFIDENTIAL" color="rgba(16, 185, 129, 0.18)" :gap="[180, 120]" :rotate="-18" :size="18">
    <div class="watermark-demo watermark-demo--dark">
      <h3>Custom Watermark</h3>
      <p>可以单独调整颜色、间距和字号，水印节点被移除或样式被修改时会自动恢复。</p>
      <div class="watermark-demo__chips">
        <span>color</span>
        <span>gap</span>
        <span>size</span>
      </div>
    </div>
  </scq-watermark>
</template>

<script setup lang="ts">
<\/script>`

const topLayerCode = `<template>
  <scq-watermark
    content="TOP LAYER"
    color="rgba(220, 38, 38, 0.34)"
    :gap="[150, 110]"
    :size="22"
    :z-index="99"
    :fullscreen="isTopLayerFullscreen"
  >
    <div class="watermark-demo">
      <h3>Top Layer Overlay</h3>
      <p>{{ isTopLayerFullscreen ? '水印已覆盖整个视口' : '初始仅覆盖当前内容区域' }}</p>
      <div class="watermark-demo__actions">
        <scq-button type="danger" @click="isTopLayerFullscreen = !isTopLayerFullscreen">
          {{ isTopLayerFullscreen ? '退出 body 顶层' : '切换到 body 顶层' }}
        </scq-button>
        <scq-button>Normal</scq-button>
      </div>
    </div>
  </scq-watermark>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isTopLayerFullscreen = ref(false)
<\/script>`
</script>

<style scoped>
.watermark-demo {
  min-height: 220px;
  padding: 24px;
  border-radius: 14px;
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.16), transparent 35%),
    linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #d9e7ff;
  color: #243042;
}

.watermark-demo--dark {
  background:
    radial-gradient(circle at top left, rgba(16, 185, 129, 0.22), transparent 32%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-color: rgba(148, 163, 184, 0.22);
  color: #e2e8f0;
}

.watermark-demo h3 {
  margin: 0 0 12px;
  font-size: 20px;
  line-height: 1.3;
}

.watermark-demo p {
  margin: 0;
  max-width: 640px;
  line-height: 1.7;
}

.watermark-demo__actions,
.watermark-demo__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.watermark-demo__chips span {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.24);
  font-size: 13px;
}
</style>