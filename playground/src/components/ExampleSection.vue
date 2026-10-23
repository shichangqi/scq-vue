<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string; description?: string }>()
</script>

<template>
  <section class="example-section">
    <header v-if="title || $slots.controls" class="example-section__header">
      <div v-if="title" class="example-section__title">
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.controls" class="example-section__controls"><slot name="controls" /></div>
    </header>
    <p v-if="description" class="example-section__description">{{ description }}</p>
    <div class="example-section__body"><slot /></div>
  </section>
</template>

<style scoped>
.example-section {
  --example-space-xs: var(--scq-space-xs, 4px);
  --example-space-sm: var(--scq-space-sm, 8px);
  --example-space-md: var(--scq-space-md, 12px);
  --example-space-lg: var(--scq-space-lg, 16px);
  --example-space-xl: var(--scq-space-xl, 24px);
  --example-font-caption: 12px;
  --example-font-body: 14px;
  --example-font-heading: 16px;
  --example-line-height: 1.6;
  display: grid;
  gap: var(--example-space-lg);
  min-width: 0;
  padding: var(--example-space-lg);
  border: var(--scq-control-border-width) solid var(--scq-border);
  border-radius: var(--scq-radius-lg);
  background: var(--scq-surface);
  color: var(--scq-text);
  font-size: var(--example-font-body);
  line-height: var(--example-line-height);
}
.example-section__header, .example-section__controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--example-space-md); min-width: 0; }
.example-section__header { justify-content: space-between; }
.example-section__title { min-width: 0; }
.example-section__title h3 { margin: 0; font-size: var(--example-font-heading); font-weight: 600; overflow-wrap: anywhere; }
.example-section__title p { margin: var(--example-space-xs) 0 0; color: var(--scq-muted); font-size: var(--example-font-caption); overflow-wrap: anywhere; }
.example-section__description { margin: 0; color: var(--scq-muted); overflow-wrap: anywhere; }
.example-section__body { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--example-space-lg); min-width: 0; }
.example-section__body > :deep(*) { min-width: 0; max-width: 100%; }
.example-section__body > :deep(p), .example-section__body > :deep(output) { margin: 0; color: var(--scq-muted); overflow-wrap: anywhere; }
.example-section__body > :deep([role="alert"]) { color: var(--scq-danger); }
.example-section__body > :deep(.my-btn), .example-section__body > :deep(.scq-switch) { justify-self: start; }
.example-section__body > :deep(pre) { margin: 0; padding: var(--example-space-md); overflow: auto; border-radius: var(--scq-radius-sm); background: var(--scq-fill); font-size: var(--example-font-caption); }
</style>
