<template>
  <section class="doc-block">
    <h1>{{ t('icon.title') }}</h1>
    <p class="lead">{{ t('icon.lead') }}</p>

    <h2>{{ t('icon.basic') }}</h2>
    <DocExample :code="basicCode" lang="vue">
      <div class="demo-panel">
        <scq-icon name="copy" :size="22" />
        <scq-icon name="refresh" variant="solid" :size="22" color="#2563eb" />
        <scq-icon name="success" :size="22" color="#16a34a" />
        <scq-icon name="warning" variant="solid" :size="22" color="#d97706" />
        <scq-icon name="error" variant="solid" :size="22" color="#dc2626" />
      </div>
    </DocExample>

    <h2>{{ t('icon.library') }}</h2>
    <DocExample :code="libraryCode" lang="vue" :default-expanded="true">
      <div class="icon-categories">
        <section v-for="category in iconCategories" :key="category.labelKey" class="icon-category">
          <h3>{{ t(category.labelKey) }}</h3>
          <div class="icon-grid">
            <button v-for="name in category.names" :key="name" type="button" class="icon-item" :class="{ 'icon-item--copied': copiedCode === getIconCode(name) }" :title="t('icon.copy')" @click="copyIconCode(name)">
              <scq-icon :name="name" :size="22" />
              <span>{{ name }}</span>
            </button>
          </div>
        </section>
      </div>
    </DocExample>

    <h2>{{ t('icon.solid') }}</h2>
    <DocExample :code="solidCode" lang="vue">
      <div class="icon-categories">
        <section v-for="category in solidIconCategories" :key="category.labelKey" class="icon-category">
          <h3>{{ t(category.labelKey) }}</h3>
          <div class="icon-grid">
            <button v-for="name in category.names" :key="name" type="button" class="icon-item" :class="{ 'icon-item--copied': copiedCode === getIconCode(name, 'solid') }" :title="t('icon.copy')" @click="copyIconCode(name, 'solid')">
              <scq-icon :name="name" variant="solid" :size="22" />
              <span>{{ name }}</span>
            </button>
          </div>
        </section>
      </div>
    </DocExample>

    <h2>{{ t('icon.props') }}</h2>
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
        <tr><td>name</td><td>{{ t('icon.name.desc') }}</td><td>IconName | string</td><td>-</td></tr>
        <tr><td>variant</td><td>{{ t('icon.variant.desc') }}</td><td>'outline' | 'solid'</td><td>outline</td></tr>
        <tr><td>size</td><td>{{ t('icon.size.desc') }}</td><td>number | string</td><td>1em</td></tr>
        <tr><td>color</td><td>{{ t('icon.color.desc') }}</td><td>string</td><td>-</td></tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type IconName, type IconVariant } from 'scq-vue'
import DocExample from '../components/DocExample.vue'
import { t } from '../i18n'

let copyTimer: ReturnType<typeof window.setTimeout> | undefined

const copiedCode = ref('')

type IconCategory = {
  labelKey: string
  names: readonly IconName[]
}

const iconCategories: IconCategory[] = [
  {
    labelKey: 'icon.category.actions',
    names: ['copy', 'refresh', 'download', 'upload', 'edit', 'delete', 'save', 'print', 'share', 'external', 'clipboard', 'archive', 'inbox', 'filter', 'sort', 'more'],
  },
  {
    labelKey: 'icon.category.navigation',
    names: ['home', 'menu', 'close', 'check', 'plus', 'minus', 'chevronDown', 'chevronUp', 'chevronLeft', 'chevronRight', 'arrowLeft', 'arrowRight', 'arrow-up', 'arrow-down'],
  },
  {
    labelKey: 'icon.category.status',
    names: ['star', 'heart', 'thumbs-up', 'dislike', 'bookmark', 'flag', 'trophy', 'info', 'warning', 'error', 'success', 'help', 'shield', 'shield-check', 'key', 'lock', 'unlock'],
  },
  {
    labelKey: 'icon.category.communication',
    names: ['user', 'users', 'mail', 'phone', 'message', 'message-circle', 'send', 'headset', 'bell', 'link', 'unlink'],
  },
  {
    labelKey: 'icon.category.timeLocation',
    names: ['calendar', 'clock', 'history', 'timer-reset', 'map', 'location', 'compass'],
  },
  {
    labelKey: 'icon.category.mediaFiles',
    names: ['play', 'pause', 'stop', 'volume', 'mute', 'microphone', 'camera', 'image', 'video', 'file', 'folder', 'folder-open', 'file-pdf', 'file-word', 'file-excel', 'file-zip', 'file-audio', 'file-video', 'file-image'],
  },
  {
    labelKey: 'icon.category.tech',
    names: ['code', 'terminal', 'package', 'rocket', 'bug', 'cpu', 'monitor', 'mobile', 'tablet', 'wifi', 'bluetooth', 'qrcode', 'database', 'server', 'cloud', 'cloud-upload', 'cloud-download'],
  },
  {
    labelKey: 'icon.category.layoutCommerce',
    names: ['grid', 'list', 'layers', 'target', 'eye', 'eye-off', 'sun', 'moon', 'gift', 'wallet', 'cart', 'tag', 'coupon', 'order', 'truck'],
  },
  {
    labelKey: 'icon.category.brands',
    names: ['wechat', 'alipay', 'qq', 'weibo', 'douyin', 'bilibili', 'zhihu', 'baidu', 'taobao', 'tmall', 'jd', 'pinduoduo', 'xiaohongshu', 'meituan', 'ctrip', 'amap', 'dingding', 'feishu'],
  },
]

const solidIconCategories: IconCategory[] = [
  {
    labelKey: 'icon.category.actions',
    names: ['copy', 'download', 'upload', 'delete', 'save', 'clipboard', 'archive', 'inbox', 'more'],
  },
  {
    labelKey: 'icon.category.navigation',
    names: ['home', 'menu', 'close', 'check', 'plus', 'minus'],
  },
  {
    labelKey: 'icon.category.status',
    names: ['star', 'heart', 'thumbs-up', 'bookmark', 'flag', 'trophy', 'info', 'warning', 'error', 'success', 'help', 'shield', 'shield-check', 'key', 'lock', 'unlock'],
  },
  {
    labelKey: 'icon.category.communication',
    names: ['user', 'users', 'mail', 'phone', 'message', 'send', 'bell'],
  },
  {
    labelKey: 'icon.category.timeLocation',
    names: ['calendar', 'clock', 'location'],
  },
  {
    labelKey: 'icon.category.mediaFiles',
    names: ['play', 'pause', 'stop', 'volume', 'microphone', 'camera', 'image', 'video', 'file', 'folder', 'folder-open', 'file-pdf', 'file-word', 'file-excel', 'file-zip'],
  },
  {
    labelKey: 'icon.category.tech',
    names: ['code', 'terminal', 'package', 'rocket', 'bug', 'cpu', 'monitor', 'mobile', 'database', 'server', 'cloud'],
  },
  {
    labelKey: 'icon.category.layoutCommerce',
    names: ['grid', 'list', 'eye', 'sun', 'moon', 'gift', 'wallet', 'cart', 'tag', 'coupon', 'order', 'truck'],
  },
  {
    labelKey: 'icon.category.brands',
    names: ['wechat', 'alipay', 'qq', 'douyin', 'bilibili'],
  },
]

const basicCode = `<template>
  <scq-icon name="copy" :size="22" />
  <scq-icon name="refresh" variant="solid" :size="22" color="#2563eb" />
  <scq-icon name="success" :size="22" color="#16a34a" />
</template>`

const solidCode = `<template>
  <scq-icon name="copy" variant="solid" />
  <scq-icon name="success" variant="solid" />
  <scq-icon name="wechat" variant="solid" />
</template>`

const libraryCode = `<template>
  <scq-icon name="copy" />
  <scq-icon name="success" />
  <scq-icon name="file-pdf" />
  <scq-icon name="wechat" />
</template>`

const getIconCode = (name: IconName | string, variant: IconVariant = 'outline') => {
  return variant === 'solid' ? `<scq-icon name="${name}" variant="solid" />` : `<scq-icon name="${name}" />`
}

const copyIconCode = async (name: IconName | string, variant: IconVariant = 'outline') => {
  const code = getIconCode(name, variant)

  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    if (copyTimer) {
      window.clearTimeout(copyTimer)
    }
    copyTimer = window.setTimeout(() => {
      copiedCode.value = ''
    }, 1600)
  } catch {
    copiedCode.value = ''
  }
}
</script>
