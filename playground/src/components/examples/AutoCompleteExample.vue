<script setup lang="ts">
import { ref } from 'vue'
import { ScqAutoComplete, type AutoCompleteOption } from '../../../../src/index'

const query = ref('')
const selected = ref('')
const people: AutoCompleteOption[] = [
  { label: '林一', value: 'lin@example.com' }, { label: 'Ada Lovelace', value: 'ada@example.com' },
  { label: 'Grace Hopper', value: 'grace@example.com' }, { label: '停用账户', value: 'inactive@example.com', disabled: true },
]
const search = (value: string, signal: AbortSignal) => new Promise<AutoCompleteOption[]>((resolve, reject) => {
  const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', abort)
    resolve(people.filter((person) => `${person.label} ${person.value}`.toLowerCase().includes(value.toLowerCase())))
  }, 250)
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
})
</script>

<template>
  <div class="autocomplete-example"><label>邀请成员<ScqAutoComplete v-model="query" :fetch-suggestions="search" placeholder="姓名或邮箱" aria-label="邀请成员" highlight-first-item @select="option => selected = option.value"><template #default="{ option }"><span class="autocomplete-example__option"><strong>{{ option.label }}</strong><small>{{ option.value }}</small></span></template></ScqAutoComplete></label><output>{{ selected || '尚未选择成员' }}</output></div>
</template>

<style scoped>
.autocomplete-example { display: grid; gap: 16px; }
.autocomplete-example > label { display: grid; gap: 8px; font-size: 13px; color: var(--scq-text); }
.autocomplete-example output { color: var(--scq-muted); font-size: 13px; overflow-wrap: anywhere; }
.autocomplete-example__option { display: grid; gap: 4px; }
.autocomplete-example__option strong { font-size: 14px; font-weight: 500; }
.autocomplete-example__option small { font-size: 12px; color: var(--scq-muted); }
</style>