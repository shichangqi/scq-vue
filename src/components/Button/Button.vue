<template>
  <button
    :class="[
      'my-btn',
      `my-btn--${type}`,
      `my-btn--${size}`,
      {
        'is-disabled': isDisabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle,
        'is-text': text,
        'is-link': link,
        'is-bg': bg
      }
    ]"
    :disabled="isDisabled"
    :type="nativeType"
    :autofocus="autofocus"
    :aria-disabled="isDisabled ? 'true' : 'false'"
    :aria-busy="loading ? 'true' : 'false'"
    @click="handleClick"
  >
    <span v-if="loading" class="my-btn__loading" aria-hidden="true">
      <svg viewBox="0 0 50 50" class="my-btn__loading-svg">
        <circle class="my-btn__loading-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </span>
    <span class="my-btn__content" :class="{ 'is-hidden': loading && circle }">
      <template v-if="loading && loadingText && !circle">
        {{ loadingText }}
      </template>
      <slot v-else></slot>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'Button'
})

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => {
      return ['default', 'primary', 'success', 'warning', 'info', 'danger'].includes(value)
    }
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => {
      return ['large', 'default', 'small'].includes(value)
    }
  },
  plain: {
    type: Boolean,
    default: false
  },
  round: {
    type: Boolean,
    default: false
  },
  circle: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: ''
  },
  text: {
    type: Boolean,
    default: false
  },
  bg: {
    type: Boolean,
    default: false
  },
  link: {
    type: Boolean,
    default: false
  },
  nativeType: {
    type: String,
    default: 'button',
    validator: (value) => {
      return ['button', 'submit', 'reset'].includes(value)
    }
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const isDisabled = computed(() => props.disabled || props.loading)

const handleClick = (event) => {
  if (!isDisabled.value) {
    emit('click', event)
  }
}
</script>

<style scoped>
.my-btn {
  --btn-default-text-color: var(--scq-text, #0f172a);
  --btn-default-bg-color: var(--scq-surface, #ffffff);
  --btn-default-border-color: var(--scq-border, #e2e8f0);
  --btn-primary-color: var(--scq-color-primary, #2563eb);
  --btn-primary-hover-color: var(--scq-color-primary-hover, #3b82f6);
  --btn-primary-active-color: var(--scq-color-primary-active, #1d4ed8);
  --btn-primary-soft-border: var(--scq-color-primary-soft-border, #bfdbfe);
  --btn-primary-soft-bg: var(--scq-color-primary-soft-bg, #eff6ff);
  --btn-success-color: var(--scq-color-success, #10b981);
  --btn-success-hover-color: var(--scq-color-success-hover, #34d399);
  --btn-success-active-color: var(--scq-color-success-active, #059669);
  --btn-success-soft-border: var(--scq-color-success-soft-border, #a7f3d0);
  --btn-success-soft-bg: var(--scq-color-success-soft-bg, #ecfdf5);
  --btn-warning-color: var(--scq-color-warning, #f59e0b);
  --btn-warning-hover-color: var(--scq-color-warning-hover, #fbbf24);
  --btn-warning-active-color: var(--scq-color-warning-active, #d97706);
  --btn-warning-soft-border: var(--scq-color-warning-soft-border, #fde68a);
  --btn-warning-soft-bg: var(--scq-color-warning-soft-bg, #fffbeb);
  --btn-danger-color: var(--scq-color-danger, #ef4444);
  --btn-danger-hover-color: var(--scq-color-danger-hover, #f87171);
  --btn-danger-active-color: var(--scq-color-danger-active, #dc2626);
  --btn-danger-soft-border: var(--scq-color-danger-soft-border, #fecaca);
  --btn-danger-soft-bg: var(--scq-color-danger-soft-bg, #fef2f2);
  --btn-info-color: var(--scq-color-info, #64748b);
  --btn-info-hover-color: var(--scq-color-info-hover, #94a3b8);
  --btn-info-active-color: var(--scq-color-info-active, #475569);
  --btn-info-soft-border: var(--scq-color-info-soft-border, #cbd5e1);
  --btn-info-soft-bg: var(--scq-color-info-soft-bg, #f8fafc);
  --btn-type-color: var(--btn-primary-color);
  --btn-type-hover-color: var(--btn-primary-hover-color);
  --btn-type-active-color: var(--btn-primary-active-color);
  --btn-type-soft-border: var(--btn-primary-soft-border);
  --btn-type-soft-bg: var(--btn-primary-soft-bg);
  --btn-hover-text-color: var(--scq-primary, #2563eb);
  --btn-hover-bg-color: var(--scq-fill, #f8fafc);
  --btn-hover-border-color: var(--scq-primary-hover, #93c5fd);
  --btn-active-bg-color: var(--scq-fill-hover, #f1f5f9);
  --btn-active-border-color: var(--scq-primary-active, #2563eb);
  --btn-focus-ring-color: rgba(37, 99, 235, 0.22);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  font-family: inherit;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  user-select: none;
  vertical-align: middle;
  -webkit-appearance: none;
  appearance: none;
  padding: 8px 18px;
  height: 36px;
  font-size: 14px;
  color: var(--btn-default-text-color);
  border: 1px solid var(--btn-default-border-color);
  border-radius: var(--scq-radius-md, 8px);
  background-color: var(--btn-default-bg-color);
  box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.my-btn:not(.is-disabled):not(.is-loading):hover {
  color: var(--btn-hover-text-color);
  border-color: var(--btn-hover-border-color);
  background-color: var(--btn-hover-bg-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.my-btn:not(.is-disabled):not(.is-loading):active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.my-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--btn-focus-ring-color);
}

.my-btn--primary {
  --btn-type-color: var(--btn-primary-color);
  --btn-type-hover-color: var(--btn-primary-hover-color);
  --btn-type-active-color: var(--btn-primary-active-color);
  --btn-type-soft-border: var(--btn-primary-soft-border);
  --btn-type-soft-bg: var(--btn-primary-soft-bg);
  --btn-focus-ring-color: rgba(37, 99, 235, 0.26);
}

.my-btn--success {
  --btn-type-color: var(--btn-success-color);
  --btn-type-hover-color: var(--btn-success-hover-color);
  --btn-type-active-color: var(--btn-success-active-color);
  --btn-type-soft-border: var(--btn-success-soft-border);
  --btn-type-soft-bg: var(--btn-success-soft-bg);
  --btn-focus-ring-color: rgba(16, 185, 129, 0.26);
}

.my-btn--warning {
  --btn-type-color: var(--btn-warning-color);
  --btn-type-hover-color: var(--btn-warning-hover-color);
  --btn-type-active-color: var(--btn-warning-active-color);
  --btn-type-soft-border: var(--btn-warning-soft-border);
  --btn-type-soft-bg: var(--btn-warning-soft-bg);
  --btn-focus-ring-color: rgba(245, 158, 11, 0.26);
}

.my-btn--info {
  --btn-type-color: var(--btn-info-color);
  --btn-type-hover-color: var(--btn-info-hover-color);
  --btn-type-active-color: var(--btn-info-active-color);
  --btn-type-soft-border: var(--btn-info-soft-border);
  --btn-type-soft-bg: var(--btn-info-soft-bg);
  --btn-focus-ring-color: rgba(100, 116, 139, 0.26);
}

.my-btn--danger {
  --btn-type-color: var(--btn-danger-color);
  --btn-type-hover-color: var(--btn-danger-hover-color);
  --btn-type-active-color: var(--btn-danger-active-color);
  --btn-type-soft-border: var(--btn-danger-soft-border);
  --btn-type-soft-bg: var(--btn-danger-soft-bg);
  --btn-focus-ring-color: rgba(239, 68, 68, 0.26);
}

.my-btn--primary:not(.is-plain):not(.is-text):not(.is-link),
.my-btn--success:not(.is-plain):not(.is-text):not(.is-link),
.my-btn--warning:not(.is-plain):not(.is-text):not(.is-link),
.my-btn--info:not(.is-plain):not(.is-text):not(.is-link),
.my-btn--danger:not(.is-plain):not(.is-text):not(.is-link) {
  color: #ffffff;
  border-color: var(--btn-type-color);
  background-color: var(--btn-type-color);
}

.my-btn--primary:not(.is-plain):not(.is-text):not(.is-link):hover,
.my-btn--success:not(.is-plain):not(.is-text):not(.is-link):hover,
.my-btn--warning:not(.is-plain):not(.is-text):not(.is-link):hover,
.my-btn--info:not(.is-plain):not(.is-text):not(.is-link):hover,
.my-btn--danger:not(.is-plain):not(.is-text):not(.is-link):hover {
  color: #ffffff;
  border-color: var(--btn-type-hover-color);
  background-color: var(--btn-type-hover-color);
}

.my-btn--primary:not(.is-plain):not(.is-text):not(.is-link):active,
.my-btn--success:not(.is-plain):not(.is-text):not(.is-link):active,
.my-btn--warning:not(.is-plain):not(.is-text):not(.is-link):active,
.my-btn--info:not(.is-plain):not(.is-text):not(.is-link):active,
.my-btn--danger:not(.is-plain):not(.is-text):not(.is-link):active {
  color: #ffffff;
  border-color: var(--btn-type-active-color);
  background-color: var(--btn-type-active-color);
}

.my-btn.is-plain {
  background-color: var(--scq-surface, #ffffff);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.my-btn--primary.is-plain,
.my-btn--success.is-plain,
.my-btn--warning.is-plain,
.my-btn--info.is-plain,
.my-btn--danger.is-plain {
  color: var(--btn-type-color);
  border-color: var(--btn-type-soft-border);
  background-color: var(--btn-type-soft-bg);
}

.my-btn--primary.is-plain:hover,
.my-btn--success.is-plain:hover,
.my-btn--warning.is-plain:hover,
.my-btn--info.is-plain:hover,
.my-btn--danger.is-plain:hover {
  color: #ffffff;
  border-color: var(--btn-type-color);
  background-color: var(--btn-type-color);
}

.my-btn--large {
  height: 42px;
  padding: 10px 22px;
  font-size: 15px;
  border-radius: var(--scq-radius-lg, 10px);
}

.my-btn--default {
  height: 36px;
  padding: 8px 18px;
  font-size: 14px;
}

.my-btn--small {
  height: 28px;
  padding: 4px 12px;
  font-size: 12px;
  border-radius: var(--scq-radius-sm, 6px);
}

.my-btn.is-round {
  border-radius: 9999px;
}

.my-btn.is-circle {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
}

.my-btn--large.is-circle {
  width: 42px;
  height: 42px;
  padding: 0;
}

.my-btn--small.is-circle {
  width: 28px;
  height: 28px;
  padding: 0;
}

.my-btn.is-text,
.my-btn.is-link {
  border-color: transparent;
  background-color: transparent;
  box-shadow: none;
  padding-left: 8px;
  padding-right: 8px;
}

.my-btn.is-text {
  color: var(--scq-text, #0f172a);
}

.my-btn.is-text:hover {
  background-color: var(--scq-fill, #f8fafc);
  color: var(--scq-primary, #2563eb);
}

.my-btn--primary.is-text,
.my-btn--primary.is-link,
.my-btn--success.is-text,
.my-btn--success.is-link,
.my-btn--warning.is-text,
.my-btn--warning.is-link,
.my-btn--info.is-text,
.my-btn--info.is-link,
.my-btn--danger.is-text,
.my-btn--danger.is-link {
  color: var(--btn-type-color);
}

.my-btn.is-text.is-bg {
  border-radius: var(--scq-radius-sm, 6px);
  background-color: var(--scq-fill, #f1f5f9);
}

.my-btn.is-link {
  color: var(--btn-type-color);
}

.my-btn.is-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.my-btn.is-text.is-bg:hover {
  background-color: var(--btn-type-soft-bg);
}

.my-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none !important;
  transform: none !important;
}

.my-btn.is-loading {
  cursor: wait;
}

.my-btn__content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.my-btn__content.is-hidden {
  display: none;
}

.my-btn__loading {
  display: inline-flex;
  width: 14px;
  height: 14px;
}

.my-btn__loading-svg {
  animation: btn-spin 0.9s linear infinite;
  width: 14px;
  height: 14px;
}

.my-btn__loading-path {
  stroke: currentColor;
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0.9;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .my-btn,
  .my-btn__loading-svg {
    transition: none;
    animation: none;
  }

  .my-btn:not(.is-disabled):not(.is-loading):hover,
  .my-btn:active {
    transform: none;
    box-shadow: none;
  }
}
</style>
