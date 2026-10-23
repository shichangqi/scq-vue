<script setup lang="ts">
import { ref } from 'vue'
import ScqLink, { provideNavigationAdapter } from '../../../../src/components/Link'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqSpace from '../../../../src/components/Space'
import type { LinkExpose, NavigationAdapter } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const NAVIGATION_DELAY = 400
const current = ref('/overview')
const fail = ref(false)
const rejectNavigation = ref(false)
const failure = ref('')
const attempts = ref(0)
const replace = ref(false)
const loading = ref(false)
const navigation = ref('')
const link = ref<LinkExpose>()
const adapter: NavigationAdapter = {
  resolve: (to) => ({ href: `#${to}`, exactActive: current.value === to }),
  navigate: (to, { signal, replace }) => new Promise((resolve, reject) => {
    attempts.value += 1
    navigation.value = replace ? 'replace' : 'push'
    failure.value = ''
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      if (fail.value) { reject(new Error('导航失败 / Navigation failed')); return }
      if (rejectNavigation.value) { resolve(false); return }
      current.value = to
      resolve(true)
    }, NAVIGATION_DELAY)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  }),
}
provideNavigationAdapter(adapter)
const onError = (error: unknown) => { failure.value = error instanceof Error ? error.message : String(error) }
</script>

<template>
  <ExampleSection class="link-navigation-example" title="可取消的导航" subtitle="Isolated demo navigation" description="独立的示例导航状态，不修改文档站路由。">
    <template #controls><ScqCheckbox v-model="rejectNavigation">拒绝导航</ScqCheckbox><ScqCheckbox v-model="fail">模拟失败</ScqCheckbox><ScqCheckbox v-model="replace">替换导航</ScqCheckbox><ScqCheckbox v-model="loading">外部加载</ScqCheckbox></template>
    <ScqSpace>
      <ScqLink to="/overview" icon="home" exact @error="onError">Overview</ScqLink>
      <ScqLink ref="link" to="/reports" :adapter="adapter" :replace="replace" :loading="loading" suffix-icon="arrowRight" exact @navigate="navigation += ': accepted'" @error="onError"><template #loading>等待…</template>Reports</ScqLink>
      <ScqButton @click="link?.cancelPending()">取消等待</ScqButton>
    </ScqSpace>
    <p role="status">Current: {{ current }} · Attempts: {{ attempts }} · {{ navigation }}</p>
    <p v-if="failure" role="alert">{{ failure }}</p>
    <ScqLink href="https://example.com" target="_blank" external>原生外链 / Native external link</ScqLink>
    <p>普通点击使用适配器；Ctrl/⌘、中键、下载和新窗口保留原生行为。适配器应在提交前检查 signal；已经提交的导航不会自动回滚。</p>
  </ExampleSection>
</template>

<style scoped>
.link-navigation-example .scq-link { justify-self: start; }
</style>
