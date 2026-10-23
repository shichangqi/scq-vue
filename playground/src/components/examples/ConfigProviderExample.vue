<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import ScqButton from '../../../../src/components/Button'
import ScqCheckbox from '../../../../src/components/Checkbox'
import ScqCheckboxGroup from '../../../../src/components/CheckboxGroup'
import ScqConfigProvider from '../../../../src/components/ConfigProvider'
import ScqInput from '../../../../src/components/Input'
import ScqRadio from '../../../../src/components/Radio'
import ScqRadioGroup from '../../../../src/components/RadioGroup'
import ScqSelect from '../../../../src/components/Select'
import { useDialog } from '../../../../src/components/Dialog'
import { useModal } from '../../../../src/components/Modal'
import { useMessage } from '../../../../src/components/Message'
import { useToast } from '../../../../src/components/Toast'
import { useNotification } from '../../../../src/components/Notification'
import type { CheckboxValue, ComponentLocale, ComponentSize, RadioValue, SelectValue } from '../../../../src/index'
import ExampleSection from '../ExampleSection.vue'

const SIZES: ComponentSize[] = ['small', 'default', 'large']
const LANGUAGES: ComponentLocale[] = ['zh-CN', 'en-US']
const THEMES = ['light', 'dark'] as const
const ACCENTS = { green: '#15803d', purple: '#7c3aed' }
const INNER_TOKENS = { primary: '#0284c7' }
const OPTIONS = [{ label: 'Alpha', value: 'alpha' }, { label: 'Beta', value: 'beta' }]
const PERSISTENT_DURATION = 0
const COPY = {
  'zh-CN': { language: '语言', theme: '主题', size: '尺寸', accent: '主色', disabled: '禁用控件', inheritAccent: '内层继承主色', inherited: '继承配置', nested: '固定的内层配置', input: '输入内容', clear: '清理本作用域浮层', hint: '打开提示后切换语言、主题或主色。默认文案与主题实时同步；内层可通过 undefined 恢复主色继承，其他覆盖保持独立。', message: '来自当前配置作用域', explicit: '显式启用 · small' },
  'en-US': { language: 'Language', theme: 'Theme', size: 'Size', accent: 'Accent', disabled: 'Disable controls', inheritAccent: 'Inner inherits accent', inherited: 'Inherited configuration', nested: 'Isolated inner configuration', input: 'Enter text', clear: 'Clear scoped overlays', hint: 'Open feedback, then change locale, theme or accent. The inner scope can restore accent inheritance with undefined while keeping its other overrides isolated.', message: 'From the current configuration scope', explicit: 'Explicitly enabled · small' },
} as const
const language = ref<ComponentLocale>('en-US')
const theme = ref<'light' | 'dark'>('dark')
const size = ref<ComponentSize>('large')
const accent = ref<keyof typeof ACCENTS>('green')
const disabled = ref(false)
const inheritAccent = ref(false)
const value = ref<string | number>('')
const selected = ref<string | number | null>(null)
const nestedSelected = ref<string | number | null>(null)
const radio = ref<RadioValue>('alpha')
const checked = ref<CheckboxValue[]>([])
const copy = computed(() => COPY[language.value])
const tokens = computed(() => ({ primary: ACCENTS[accent.value] }))
const innerTokens = computed(() => ({ primary: inheritAccent.value ? undefined : INNER_TOKENS.primary }))
const accentNames = Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]
const selectSetting = <T extends string>(options: readonly T[], value: SelectValue | SelectValue[] | null): T => {
  const selected = options.find(option => option === value)
  if (selected === undefined) throw new RangeError('Unknown example configuration option.')
  return selected
}

const FeedbackActions = defineComponent({
  setup() {
    // Capture configuration in a descendant of ConfigProvider.
    const dialog = useDialog()
    const modal = useModal()
    const message = useMessage()
    const toast = useToast()
    const notification = useNotification()
    const actions = [
      { name: 'Dialog', run: () => dialog.info({ message: copy.value.message, showFooter: true, showConfirmButton: true }) },
      { name: 'Modal', run: () => modal.confirm({ message: copy.value.message, showClose: true, showFooter: true, showConfirmButton: true }) },
      { name: 'Message', run: () => message.success({ message: copy.value.message, closable: true, duration: PERSISTENT_DURATION }) },
      { name: 'Toast', run: () => toast.loading({ position: 'bottom', duration: PERSISTENT_DURATION }) },
      { name: 'Notification', run: () => notification.info({ message: copy.value.message, duration: PERSISTENT_DURATION }) },
    ]
    const clear = () => {
      dialog.destroyAll()
      modal.destroyAll()
      message.destroyAll()
      toast.destroyAll()
      notification.destroyAll()
    }
    return () => h('div', { class: 'config-example__actions' }, [
      ...actions.map((action) => h(ScqButton, { key: action.name, disabled: false, onClick: action.run }, () => action.name)),
      h(ScqButton, { disabled: false, onClick: clear }, () => copy.value.clear),
    ])
  },
})
</script>

<template>
  <ExampleSection class="config-example" title="配置作用域" subtitle="Theme, locale &amp; inherited settings">
    <div class="config-example__controls">
      <label>{{ copy.language }}<ScqSelect :model-value="language" :options="LANGUAGES.map(value => ({ label: value, value }))" :clearable="false" aria-label="Scope locale" @update:model-value="language = selectSetting(LANGUAGES, $event)" /></label>
      <label>{{ copy.theme }}<ScqSelect :model-value="theme" :options="THEMES.map(value => ({ label: value, value }))" :clearable="false" aria-label="Scope theme" @update:model-value="theme = selectSetting(THEMES, $event)" /></label>
      <label>{{ copy.size }}<ScqSelect :model-value="size" :options="SIZES.map(value => ({ label: value, value }))" :clearable="false" aria-label="Scope size" @update:model-value="size = selectSetting(SIZES, $event)" /></label>
      <label>{{ copy.accent }}<ScqSelect :model-value="accent" :options="accentNames.map(value => ({ label: value, value }))" :clearable="false" aria-label="Scope accent" @update:model-value="accent = selectSetting(accentNames, $event)" /></label>
    </div>
    <div class="config-example__toggles">
      <ScqCheckbox v-model="disabled" aria-label="Disable scoped controls">{{ copy.disabled }}</ScqCheckbox>
      <ScqCheckbox v-model="inheritAccent" aria-label="Inherit inner accent">{{ copy.inheritAccent }}</ScqCheckbox>
    </div>
    <ScqConfigProvider :locale="language" :theme="theme" :size="size" :disabled="disabled" :tokens="tokens" class="config-example__scope">
      <h3>{{ copy.inherited }}</h3>
      <div class="config-example__fields">
        <ScqInput v-model="value" :placeholder="copy.input" clearable />
        <ScqSelect v-model="selected" :options="OPTIONS" />
        <ScqButton type="primary">{{ copy.inherited }}</ScqButton>
        <ScqButton size="small" :disabled="false">{{ copy.explicit }}</ScqButton>
        <ScqRadioGroup v-model="radio"><ScqRadio v-for="item in OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</ScqRadio></ScqRadioGroup>
        <ScqCheckboxGroup v-model="checked"><ScqCheckbox v-for="item in OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</ScqCheckbox></ScqCheckboxGroup>
      </div>
      <FeedbackActions />
      <ScqConfigProvider locale="zh-CN" theme="light" size="small" :disabled="false" :tokens="innerTokens" class="config-example__scope config-example__nested">
        <h3>{{ copy.nested }} · zh-CN / light / small</h3>
        <ScqSelect v-model="nestedSelected" :options="OPTIONS" />
      </ScqConfigProvider>
    </ScqConfigProvider>
    <p class="config-example__hint">{{ copy.hint }}</p>
  </ExampleSection>
</template>

<style scoped>
.config-example { --config-example-gap: var(--example-space-md); --config-example-control-width: 140px; min-width: 0; }
.config-example__controls, .config-example__toggles, .config-example__fields, .config-example__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--config-example-gap); }
.config-example__controls > label { flex: 1 1 var(--config-example-control-width); display: grid; min-width: 0; gap: var(--example-space-sm); font-size: var(--example-font-body); }
.config-example__controls .scq-select { width: 100%; min-width: 0; }
.config-example__scope { padding: var(--config-example-gap); background: var(--scq-surface); border: 1px solid var(--scq-border); border-radius: var(--scq-radius); }
.config-example__scope h3 { margin: 0 0 var(--config-example-gap); font-size: 14px; overflow-wrap: anywhere; }
.config-example__fields > * { max-width: 100%; }
.config-example__fields > .scq-input { width: 220px; }
.config-example__actions, .config-example__nested { margin-top: var(--config-example-gap); }
.config-example__hint { color: var(--scq-muted); font-size: 13px; line-height: 1.7; }
</style>
