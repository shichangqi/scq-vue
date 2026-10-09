<template>
  <div class="docs-layout">
    <a class="docs-skip-link" href="#docs-content">{{ label('跳至内容', 'Skip to content') }}</a>
    <header class="docs-header">
      <button class="docs-icon-button docs-menu-toggle" type="button" :aria-label="label('打开导航', 'Open navigation')" :aria-expanded="menuOpen" @click="menuOpen = true"><Icon name="menu" :size="22" /></button>
      <RouterLink class="brand" to="/guide" aria-label="SCQ VUE"><BrandLogo class="brand-mark" /><span class="brand-text"><span class="brand-text__main">SCQ VUE</span><span class="brand-text__sub">Design System</span></span></RouterLink>
      <nav class="docs-header-nav" :aria-label="label('主导航', 'Main navigation')"><RouterLink to="/guide">{{ label('指南', 'Guide') }}</RouterLink><RouterLink to="/components/button" :class="{ 'is-active': route.path.startsWith('/components/') }">{{ t('app.components') }}</RouterLink></nav>
      <span class="docs-version">v{{ version }}</span>
      <div class="lang-switch" :class="locale === 'en-US' ? 'is-en' : 'is-zh'" role="group" aria-label="Language switch"><span class="lang-switch__thumb" aria-hidden="true"></span><button type="button" class="lang-btn" :class="{ 'is-active': locale === 'zh-CN' }" :aria-pressed="locale === 'zh-CN'" @click="setLocale('zh-CN')">中文</button><button type="button" class="lang-btn" :class="{ 'is-active': locale === 'en-US' }" :aria-pressed="locale === 'en-US'" @click="setLocale('en-US')">English</button></div>
    </header>
    <aside class="docs-sidebar"><DocsNavigation v-model:query="query" v-model:platform="platform" /></aside>
    <div class="docs-body">
      <main id="docs-content" ref="mainRef" class="docs-main" tabindex="-1">
        <div class="docs-breadcrumb">{{ currentEntry ? groupTitle : label('开发指南', 'Guide') }}<span>/</span>{{ pageTitle }}<span v-if="currentEntry?.platform === 'mobile'" class="docs-platform-label">{{ label('移动端', 'Mobile') }}</span></div>
        <ConfigProvider :locale="locale"><RouterView v-slot="{ Component }"><component :is="Component" :key="route.path" /></RouterView></ConfigProvider>
        <footer v-if="previous || next" class="docs-page-navigation"><RouterLink v-if="previous" :to="`/components/${previous.slug}`"><Icon name="arrowLeft" /><span>{{ previous.name }} {{ locale === 'zh-CN' ? previous.title : '' }}</span></RouterLink><RouterLink v-if="next" class="is-next" :to="`/components/${next.slug}`"><span>{{ next.name }} {{ locale === 'zh-CN' ? next.title : '' }}</span><Icon name="arrowRight" /></RouterLink></footer>
      </main>
      <aside class="docs-toc" :aria-label="label('本页目录', 'On this page')"><div class="docs-toc__title">{{ label('本页目录', 'On this page') }}</div><a v-for="heading in headings" :key="heading.id" :href="`#${route.path}#${heading.id}`" :class="{ 'is-nested': heading.level === 3 }" @click.prevent="jumpTo(heading.id)">{{ heading.title }}</a></aside>
    </div>
    <Drawer v-model="menuOpen" :title="label('文档导航', 'Documentation')" position="left" :size="300" destroy-on-close><DocsNavigation v-model:query="query" v-model:platform="platform" @navigate="menuOpen = false" /></Drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from './components/BrandLogo.vue'
import DocsNavigation from './components/DocsNavigation.vue'
import Icon from '../../src/components/Icon/Icon.vue'
import Drawer from '../../src/components/Drawer/Drawer.vue'
import ConfigProvider from '../../src/components/ConfigProvider/ConfigProvider.vue'
import { componentDocs, docGroups } from './docs/catalog'
import { version } from '../../package.json'
import { locale as currentLocale, setLocale, t } from './i18n'

const locale = computed(() => currentLocale.value)
const route = useRoute()
const router = useRouter()
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const query = ref('')
const platform = ref<'all' | 'pc' | 'mobile'>('all')
const menuOpen = ref(false)
const mainRef = ref<HTMLElement>()
const headings = ref<{ id: string; title: string; level: number }[]>([])
const currentEntry = computed(() => componentDocs.find((entry) => route.path === `/components/${entry.slug}`))
const orderedEntries = computed(() => docGroups.flatMap((group) => componentDocs.filter((entry) => entry.group === group.key)))
const currentIndex = computed(() => orderedEntries.value.findIndex((entry) => entry === currentEntry.value))
const previous = computed(() => currentIndex.value > 0 ? orderedEntries.value[currentIndex.value - 1] : undefined)
const next = computed(() => currentIndex.value >= 0 ? orderedEntries.value[currentIndex.value + 1] : undefined)
const groupTitle = computed(() => { const group = docGroups.find((entry) => entry.key === currentEntry.value?.group); return locale.value === 'zh-CN' ? group?.zh : group?.en })
const pageTitle = computed(() => currentEntry.value ? `${currentEntry.value.name}${locale.value === 'zh-CN' ? ` ${currentEntry.value.title}` : ''}` : t('app.quickStart'))
let observer: MutationObserver | undefined
const collectHeadings = () => {
  headings.value = Array.from(mainRef.value?.querySelectorAll<HTMLElement>('.doc-block h2, .doc-block h3') || []).filter((heading) => !heading.closest('.doc-example__demo')).map((heading, index) => {
    if (!heading.id) heading.id = `section-${index + 1}`
    return { id: heading.id, title: heading.textContent || '', level: Number(heading.tagName.slice(1)) }
  })
}
const jumpTo = (id: string) => {
  void router.replace({ path: route.path, hash: `#${id}` })
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}
watch(() => route.path, () => { menuOpen.value = false; void nextTick(collectHeadings) })
watch(pageTitle, (title) => { document.title = `${title} | SCQ VUE`; document.documentElement.lang = locale.value; void nextTick(collectHeadings) })
onMounted(() => {
  collectHeadings()
  document.title = `${pageTitle.value} | SCQ VUE`
  document.documentElement.lang = locale.value
  observer = new MutationObserver(collectHeadings)
  if (mainRef.value) observer.observe(mainRef.value, { childList: true, subtree: true })
})
onBeforeUnmount(() => observer?.disconnect())
</script>
