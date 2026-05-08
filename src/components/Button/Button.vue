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
  --btn-default-text-color: #606266;
  --btn-default-bg-color: #ffffff;
  --btn-default-border-color: #dcdfe6;
  --btn-primary-color: var(--scq-color-primary, #409eff);
  --btn-primary-hover-color: var(--scq-color-primary-hover, #66b1ff);
  --btn-primary-active-color: var(--scq-color-primary-active, #3a8ee6);
  --btn-primary-soft-border: var(--scq-color-primary-soft-border, #a0cfff);
  --btn-primary-soft-bg: var(--scq-color-primary-soft-bg, #ecf5ff);
  --btn-success-color: var(--scq-color-success, #67c23a);
  --btn-success-hover-color: var(--scq-color-success-hover, #85ce61);
  --btn-success-active-color: var(--scq-color-success-active, #5daf34);
  --btn-success-soft-border: var(--scq-color-success-soft-border, #b3e19d);
  --btn-success-soft-bg: var(--scq-color-success-soft-bg, #f0f9eb);
  --btn-warning-color: var(--scq-color-warning, #e6a23c);
  --btn-warning-hover-color: var(--scq-color-warning-hover, #ebb563);
  --btn-warning-active-color: var(--scq-color-warning-active, #cf9236);
  --btn-warning-soft-border: var(--scq-color-warning-soft-border, #f3d19e);
  --btn-warning-soft-bg: var(--scq-color-warning-soft-bg, #fdf6ec);
  --btn-danger-color: var(--scq-color-danger, #f56c6c);
  --btn-danger-hover-color: var(--scq-color-danger-hover, #f78989);
  --btn-danger-active-color: var(--scq-color-danger-active, #dd6161);
  --btn-danger-soft-border: var(--scq-color-danger-soft-border, #fab6b6);
  --btn-danger-soft-bg: var(--scq-color-danger-soft-bg, #fef0f0);
  --btn-info-color: var(--scq-color-info, #909399);
  --btn-info-hover-color: var(--scq-color-info-hover, #a6a9ad);
  --btn-info-active-color: var(--scq-color-info-active, #82848a);
  --btn-info-soft-border: var(--scq-color-info-soft-border, #c8c9cc);
  --btn-info-soft-bg: var(--scq-color-info-soft-bg, #f4f4f5);
  --btn-type-color: var(--btn-primary-color);
  --btn-type-hover-color: var(--btn-primary-hover-color);
  --btn-type-active-color: var(--btn-primary-active-color);
  --btn-type-soft-border: var(--btn-primary-soft-border);
  --btn-type-soft-bg: var(--btn-primary-soft-bg);
  --btn-hover-text-color: #409eff;
  --btn-hover-bg-color: #ecf5ff;
  --btn-hover-border-color: #c6e2ff;
  --btn-active-bg-color: #3a8ee6;
  --btn-active-border-color: #3a8ee6;
  --btn-focus-ring-color: rgba(64, 158, 255, 0.2);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  user-select: none;
  vertical-align: middle;
  -webkit-appearance: none;
  appearance: none;
  padding: 8px 16px;
  height: 32px;
  color: var(--btn-default-text-color);
  border: 1px solid var(--btn-default-border-color);
  border-radius: 4px;
  background-color: var(--btn-default-bg-color);
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s, transform 0.12s;
}

.my-btn:not(.is-disabled):not(.is-loading):hover {
  color: var(--btn-hover-text-color);
  border-color: var(--btn-hover-border-color);
  background-color: var(--btn-hover-bg-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
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

.my-btn:active {
  border-color: var(--btn-active-border-color);
  background-color: var(--btn-active-bg-color);
  color: var(--btn-active-text-color, #ffffff);
  transform: translateY(0);
  box-shadow: none;
}

.my-btn:focus-visible {
  box-shadow: 0 0 0 2px var(--btn-focus-ring-color);
}

.my-btn--primary {
  --btn-type-color: var(--btn-primary-color);
  --btn-type-hover-color: var(--btn-primary-hover-color);
  --btn-type-active-color: var(--btn-primary-active-color);
  --btn-type-soft-border: var(--btn-primary-soft-border);
  --btn-type-soft-bg: var(--btn-primary-soft-bg);
  --btn-hover-text-color: #ffffff;
  --btn-hover-border-color: var(--btn-type-hover-color);
  --btn-hover-bg-color: var(--btn-type-hover-color);
  --btn-active-border-color: var(--btn-type-active-color);
  --btn-active-bg-color: var(--btn-type-active-color);
  --btn-focus-ring-color: rgba(64, 158, 255, 0.26);
}

.my-btn--success {
  --btn-type-color: var(--btn-success-color);
  --btn-type-hover-color: var(--btn-success-hover-color);
  --btn-type-active-color: var(--btn-success-active-color);
  --btn-type-soft-border: var(--btn-success-soft-border);
  --btn-type-soft-bg: var(--btn-success-soft-bg);
  --btn-hover-text-color: #ffffff;
  --btn-hover-border-color: var(--btn-type-hover-color);
  --btn-hover-bg-color: var(--btn-type-hover-color);
  --btn-active-border-color: var(--btn-type-active-color);
  --btn-active-bg-color: var(--btn-type-active-color);
  --btn-focus-ring-color: rgba(103, 194, 58, 0.24);
}

.my-btn--warning {
  --btn-type-color: var(--btn-warning-color);
  --btn-type-hover-color: var(--btn-warning-hover-color);
  --btn-type-active-color: var(--btn-warning-active-color);
  --btn-type-soft-border: var(--btn-warning-soft-border);
  --btn-type-soft-bg: var(--btn-warning-soft-bg);
  --btn-hover-text-color: #ffffff;
  --btn-hover-border-color: var(--btn-type-hover-color);
  --btn-hover-bg-color: var(--btn-type-hover-color);
  --btn-active-border-color: var(--btn-type-active-color);
  --btn-active-bg-color: var(--btn-type-active-color);
  --btn-focus-ring-color: rgba(230, 162, 60, 0.24);
}

.my-btn--info {
  --btn-type-color: var(--btn-info-color);
  --btn-type-hover-color: var(--btn-info-hover-color);
  --btn-type-active-color: var(--btn-info-active-color);
  --btn-type-soft-border: var(--btn-info-soft-border);
  --btn-type-soft-bg: var(--btn-info-soft-bg);
  --btn-hover-text-color: #ffffff;
  --btn-hover-border-color: var(--btn-type-hover-color);
  --btn-hover-bg-color: var(--btn-type-hover-color);
  --btn-active-border-color: var(--btn-type-active-color);
  --btn-active-bg-color: var(--btn-type-active-color);
  --btn-focus-ring-color: rgba(144, 147, 153, 0.24);
}

.my-btn--danger {
  --btn-type-color: var(--btn-danger-color);
  --btn-type-hover-color: var(--btn-danger-hover-color);
  --btn-type-active-color: var(--btn-danger-active-color);
  --btn-type-soft-border: var(--btn-danger-soft-border);
  --btn-type-soft-bg: var(--btn-danger-soft-bg);
  --btn-hover-text-color: #ffffff;
  --btn-hover-border-color: var(--btn-type-hover-color);
  --btn-hover-bg-color: var(--btn-type-hover-color);
  --btn-active-border-color: var(--btn-type-active-color);
  --btn-active-bg-color: var(--btn-type-active-color);
  --btn-focus-ring-color: rgba(245, 108, 108, 0.24);
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

.my-btn.is-plain {
  background-color: #ffffff;
}

.my-btn--primary.is-plain,
.my-btn--success.is-plain,
.my-btn--warning.is-plain,
.my-btn--info.is-plain,
.my-btn--danger.is-plain {
  --btn-hover-text-color: #ffffff;
  --btn-hover-border-color: var(--btn-type-color);
  --btn-hover-bg-color: var(--btn-type-color);
  --btn-active-border-color: var(--btn-type-active-color);
  --btn-active-bg-color: var(--btn-type-active-color);
  color: var(--btn-type-color);
  border-color: var(--btn-type-soft-border);
  background-color: var(--btn-type-soft-bg);
}

.my-btn--large {
  height: 40px;
  padding: 12px 20px;
  font-size: 14px;
}

.my-btn--default {
  height: 32px;
  padding: 8px 16px;
  font-size: 14px;
}

.my-btn--small {
  height: 24px;
  padding: 5px 11px;
  font-size: 12px;
}

.my-btn.is-round {
  border-radius: 20px;
}

.my-btn.is-circle {
  width: 32px;
  padding: 8px;
  border-radius: 50%;
}

.my-btn--large.is-circle {
  width: 40px;
  padding: 12px;
}

.my-btn--small.is-circle {
  width: 24px;
  padding: 5px;
}

.my-btn.is-text,
.my-btn.is-link {
  border-color: transparent;
  background-color: transparent;
  padding-left: 4px;
  padding-right: 4px;
}

.my-btn.is-text {
  color: #606266;
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
  --btn-hover-text-color: var(--btn-type-hover-color);
  --btn-hover-border-color: transparent;
  --btn-hover-bg-color: transparent;
  --btn-active-text-color: var(--btn-type-active-color);
  --btn-active-border-color: transparent;
  --btn-active-bg-color: transparent;
  color: var(--btn-type-color);
}

.my-btn.is-text.is-bg {
  border-radius: 4px;
  background-color: #f5f7fa;
}

.my-btn.is-link {
  color: var(--btn-type-color);
}

.my-btn.is-text.is-bg:hover {
  background-color: var(--btn-type-soft-bg);
}

.my-btn.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

.my-btn.is-loading {
  cursor: wait;
}

.my-btn__content {
  display: inline-flex;
  align-items: center;
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
