<template>
  <div class="docs-layout">
    <div
      class="lang-switch lang-switch--floating"
      :class="locale === 'en-US' ? 'is-en' : 'is-zh'"
      role="group"
      aria-label="Language switch"
    >
      <span class="lang-switch__thumb" aria-hidden="true"></span>
      <button
        type="button"
        class="lang-btn"
        :class="{ 'is-active': locale === 'zh-CN' }"
        @click="setLocale('zh-CN')"
      >
        中文
      </button>
      <button
        type="button"
        class="lang-btn"
        :class="{ 'is-active': locale === 'en-US' }"
        @click="setLocale('en-US')"
      >
        English
      </button>
    </div>

    <aside class="docs-sidebar">
      <div class="brand" aria-label="SCQ VUE">
        <BrandLogo class="brand-mark" />
        <div class="brand-text">
          <span class="brand-text__main">SCQ VUE</span>
          <span class="brand-text__sub">Design System</span>
        </div>
      </div>
      <div class="menu-group">{{ t('app.guide') }}</div>
      <RouterLink class="menu-item" to="/guide">{{ t('app.quickStart') }}</RouterLink>
      <div class="menu-group">{{ t('app.components') }}</div>
      <RouterLink class="menu-item" to="/components/button">{{ t('app.button') }}</RouterLink>
      <RouterLink class="menu-item" to="/components/input">{{ t('app.input') }}</RouterLink>
      <RouterLink class="menu-item" to="/components/chat-message">{{ t('app.chatMessage') }}</RouterLink>
      <RouterLink class="menu-item" to="/components/dialog">{{ t('app.dialog') }}</RouterLink>
      <RouterLink class="menu-item" to="/components/modal">{{ t('app.modal') }}</RouterLink>
      <RouterLink class="menu-item" to="/components/popup">{{ t('app.popup') }}</RouterLink>
    </aside>
    <main class="docs-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BrandLogo from './components/BrandLogo.vue'
import { locale as currentLocale, setLocale, t } from './i18n'

const locale = computed(() => currentLocale.value)
</script>
