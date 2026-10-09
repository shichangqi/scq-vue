<template>
  <div class="scq-auto-complete">
    <Popover v-model="opened" :disabled="isDisabled || readonly" :teleport="teleport" placement="bottom-start" :width="width" :aria-label="ariaLabel || text('suggestions')">
      <template #reference><span class="scq-field" :class="[`scq-field--${size || config.size}`, { 'is-disabled': isDisabled }]"><input :id="id || undefined" ref="inputRef" type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-haspopup="listbox" :aria-expanded="opened" :aria-controls="listId" :aria-activedescendant="opened && active >= 0 ? `${listId}-${active}` : undefined" :aria-label="ariaLabel || placeholder || text('search')" :value="query" :name="name || undefined" :placeholder="placeholder" :disabled="isDisabled" :readonly="readonly" @input="input" @compositionstart="composing = true" @compositionend="compositionEnd" @focus="focus" @blur="blur" @keydown="keydown" @click.stop /><button v-if="clearable && query && !isDisabled && !readonly" class="scq-field__clear" type="button" :aria-label="text('clear')" @mousedown.prevent @click.stop="clear"><Icon name="close" :size="14" /></button></span></template>
      <div v-if="loading" class="scq-auto-complete__status" role="status">{{ text('loading') }}</div>
      <div v-else-if="failed" class="scq-auto-complete__status" role="alert"><button type="button" @mousedown.prevent @click="request">{{ text('retry') }}</button></div>
      <ul v-else :id="listId" class="scq-auto-complete__options" role="listbox" :aria-label="ariaLabel || text('suggestions')"><li v-for="(option, index) in candidates" :id="`${listId}-${index}`" :key="`${option.value}-${index}`" role="option" :aria-selected="index === active" :aria-disabled="option.disabled" @mousedown.prevent @mouseenter="active = option.disabled ? -1 : index" @click="select(option)"><slot :option="option" :index="index">{{ option.label || option.value }}</slot></li><li v-if="!candidates.length" class="scq-auto-complete__status" role="presentation"><slot name="empty">{{ text('empty') }}</slot></li></ul>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Popover from '../Popover/Popover.vue'
import Icon from '../Icon/Icon.vue'
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { useComponentId } from '../../utils/id'

export interface AutoCompleteOption { value: string; label?: string; disabled?: boolean; [key: string]: unknown }
defineOptions({ name: 'AutoComplete' })
const props = withDefaults(defineProps<{ modelValue?: string; options?: AutoCompleteOption[]; fetchSuggestions?: (query: string, signal: AbortSignal) => Promise<AutoCompleteOption[]> | AutoCompleteOption[]; debounce?: number; showOnFocus?: boolean; highlightFirstItem?: boolean; disabled?: boolean; readonly?: boolean; clearable?: boolean; placeholder?: string; ariaLabel?: string; id?: string; name?: string; size?: ComponentSize; width?: string | number; teleport?: boolean | string }>(), { modelValue: '', options: () => [], debounce: 150, showOnFocus: true, highlightFirstItem: false, disabled: undefined, readonly: false, clearable: true, placeholder: '', ariaLabel: '', id: '', name: '', width: 'min(320px, calc(100vw - 24px))', teleport: true })
const emit = defineEmits<{
  (event: 'update:modelValue' | 'input' | 'change', value: string): void
  (event: 'select', value: AutoCompleteOption): void
  (event: 'clear'): void
  (event: 'focus' | 'blur', value: FocusEvent): void
  (event: 'error', error: unknown): void
}>()
const config = useConfig()
const text = useLocale()
const isDisabled = computed(() => props.disabled ?? config.value.disabled)
const inputRef = ref<HTMLInputElement>()
const listId = useComponentId('scq-suggestions')
const query = ref(props.modelValue)
const opened = ref(false)
const composing = ref(false)
const active = ref(-1)
const loading = ref(false)
const failed = ref(false)
const remote = ref<AutoCompleteOption[]>([])
const candidates = computed(() => props.fetchSuggestions ? remote.value : props.options.filter((option) => (option.label || option.value).toLocaleLowerCase().includes(query.value.toLocaleLowerCase())))
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let sequence = 0
const cancel = () => { sequence += 1; controller?.abort(); controller = undefined; if (timer !== undefined) clearTimeout(timer); timer = undefined; loading.value = false }
const highlight = () => { active.value = props.highlightFirstItem ? candidates.value.findIndex((option) => !option.disabled) : -1 }
const request = () => {
  cancel()
  failed.value = false
  if (isDisabled.value || props.readonly || composing.value) return
  opened.value = true
  active.value = -1
  if (!props.fetchSuggestions) { highlight(); return }
  remote.value = []
  loading.value = true
  const current = sequence
  controller = new AbortController()
  const signal = controller.signal
  timer = setTimeout(async () => {
    try {
      const result = await props.fetchSuggestions!(query.value, signal)
      if (current !== sequence || signal.aborted) return
      remote.value = result
      highlight()
    } catch (error) { if (current === sequence && !signal.aborted) { failed.value = true; emit('error', error) } }
    finally { if (current === sequence) loading.value = false }
  }, Math.max(0, props.debounce))
}
const update = (value: string) => {
  if (isDisabled.value || props.readonly || value === query.value) return
  query.value = value
  emit('update:modelValue', value)
  emit('input', value)
  request()
}
const input = (event: Event) => { if (!composing.value && !(event as InputEvent).isComposing) update((event.target as HTMLInputElement).value) }
const compositionEnd = (event: CompositionEvent) => { composing.value = false; update((event.target as HTMLInputElement).value) }
const focus = (event: FocusEvent) => { emit('focus', event); if (props.showOnFocus) request() }
const blur = (event: FocusEvent) => { opened.value = false; cancel(); emit('blur', event); emit('change', query.value) }
const select = (option: AutoCompleteOption) => {
  if (isDisabled.value || props.readonly || option.disabled) return
  cancel()
  query.value = option.value
  opened.value = false
  emit('update:modelValue', option.value)
  emit('change', option.value)
  emit('select', option)
  inputRef.value?.focus()
}
const clear = () => { update(''); emit('clear'); inputRef.value?.focus() }
const keydown = async (event: KeyboardEvent) => {
  if (composing.value || event.isComposing || isDisabled.value || props.readonly) return
  if (event.key === 'Escape') { opened.value = false; cancel(); return }
  if (event.key === 'Enter' && opened.value && candidates.value[active.value]) { event.preventDefault(); select(candidates.value[active.value]); return }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
  event.preventDefault()
  if (!opened.value) { request(); return }
  const indexes = candidates.value.flatMap((option, index) => option.disabled ? [] : [index])
  const current = indexes.indexOf(active.value)
  const next = event.key === 'ArrowDown' ? (current + 1) % indexes.length : (current < 0 ? indexes.length - 1 : (current - 1 + indexes.length) % indexes.length)
  active.value = indexes[next] ?? -1
  await nextTick()
  document.getElementById(`${listId}-${active.value}`)?.scrollIntoView?.({ block: 'nearest' })
}
watch(() => props.modelValue, (value) => { if (value !== query.value) { query.value = value; if (opened.value) request() } })
watch(isDisabled, (value) => { if (value) { opened.value = false; cancel() } })
watch(() => props.options, highlight)
onBeforeUnmount(cancel)
defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), close: () => { opened.value = false; cancel() } })
</script>