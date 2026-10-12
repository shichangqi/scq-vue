<template>
	<div
		class="scq-input"
		:class="[
			`scq-input--${size}`,
			`scq-input--${status}`,
			{
				'is-disabled': disabled,
				'is-focus': isFocused,
				'is-textarea': isTextarea,
				'is-full-width': fullWidth,
			},
		]"
	>
		<div v-if="$slots.prepend" class="scq-input__group-prepend">
			<slot name="prepend" />
		</div>

		<div class="scq-input__wrapper">
			<span v-if="$slots.prefix || prefixIcon" class="scq-input__prefix">
				<slot name="prefix">
					<i :class="prefixIcon" />
				</slot>
			</span>

			<textarea
				v-if="isTextarea"
				ref="inputRef"
				class="scq-input__inner scq-textarea__inner"
				:class="[inputClass, { 'is-autosize': autosize }]"
				:style="mergedInputStyle"
				:value="innerValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:readonly="readonly"
				:maxlength="maxlength"
				:minlength="minlength"
				:name="name"
				:id="id"
				@input="handleInput"
				@change="handleChange"
				@focus="handleFocus"
				@blur="handleBlur"
				@keydown="(e) => emit('keydown', e)"
				@keyup="(e) => emit('keyup', e)"
				@compositionstart="(e) => emit('compositionstart', e)"
				@compositionupdate="(e) => emit('compositionupdate', e)"
				@compositionend="(e) => emit('compositionend', e)"
			/>

			<input
				v-else
				ref="inputRef"
				class="scq-input__inner"
				:class="inputClass"
				:style="mergedInputStyle"
				:type="passwordVisible ? 'text' : type"
				:value="innerValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:readonly="readonly"
				:maxlength="maxlength"
				:minlength="minlength"
				:autocomplete="autocomplete"
				:name="name"
				:id="id"
				@input="handleInput"
				@change="handleChange"
				@focus="handleFocus"
				@blur="handleBlur"
				@keydown="(e) => emit('keydown', e)"
				@keyup="(e) => emit('keyup', e)"
				@compositionstart="(e) => emit('compositionstart', e)"
				@compositionupdate="(e) => emit('compositionupdate', e)"
				@compositionend="(e) => emit('compositionend', e)"
			/>

			<button
				v-if="showClear"
				type="button"
				class="scq-input__clear"
				aria-label="Clear input"
				@mousedown.prevent
				@click="clearValue"
			>
				&times;
			</button>

			<button
				v-if="showPasswordIcon"
				type="button"
				class="scq-input__password"
				:aria-label="passwordVisible ? 'Hide password' : 'Show password'"
				:aria-pressed="passwordVisible ? 'true' : 'false'"
				@mousedown.prevent
				@click="togglePassword"
			>
				<Icon :name="passwordVisible ? 'eye-off' : 'eye'" />
			</button>

			<span v-if="$slots.suffix || suffixIcon" class="scq-input__suffix">
				<slot name="suffix">
					<i :class="suffixIcon" />
				</slot>
			</span>

			<span v-if="showWordLimitCounter" class="scq-input__count" aria-live="polite">
				{{ innerValue.length }}/{{ maxlength }}
			</span>
		</div>

		<div v-if="$slots.append" class="scq-input__group-append">
			<slot name="append" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import Icon from '../Icon/Icon.vue'

defineOptions({
	name: 'Input',
})

type InputType = 'text' | 'password' | 'textarea' | 'number' | 'email' | 'tel' | 'url' | 'search'
type InputSize = 'large' | 'default' | 'small'
type InputStatus = 'default' | 'success' | 'warning' | 'error'

const props = withDefaults(
	defineProps<{
		modelValue?: string | number
		type?: InputType
		size?: InputSize
		status?: InputStatus
		placeholder?: string
		disabled?: boolean
		readonly?: boolean
		fullWidth?: boolean
		clearable?: boolean
		showPassword?: boolean
		showWordLimit?: boolean
		autosize?: boolean
		prefixIcon?: string
		suffixIcon?: string
		maxlength?: number
		minlength?: number
		autocomplete?: string
		name?: string
		id?: string
		inputStyle?: string | Record<string, string> | CSSProperties
		inputClass?: string
	}>(),
	{
		modelValue: '',
		type: 'text',
		size: 'default',
		status: 'default',
		placeholder: '',
		disabled: false,
		readonly: false,
		fullWidth: true,
		clearable: false,
		showPassword: false,
		showWordLimit: false,
		autosize: false,
		prefixIcon: '',
		suffixIcon: '',
		autocomplete: 'off',
		name: '',
		id: '',
		inputStyle: '',
		inputClass: '',
	},
)

const emit = defineEmits<{
	(e: 'update:modelValue', value: string | number): void
	(e: 'input', value: string | number): void
	(e: 'change', value: string | number): void
	(e: 'focus', evt: FocusEvent): void
	(e: 'blur', evt: FocusEvent): void
	(e: 'clear'): void
	(e: 'keydown', evt: KeyboardEvent): void
	(e: 'keyup', evt: KeyboardEvent): void
	(e: 'compositionstart', evt: CompositionEvent): void
	(e: 'compositionupdate', evt: CompositionEvent): void
	(e: 'compositionend', evt: CompositionEvent): void
}>()

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()
const isFocused = ref(false)
const passwordVisible = ref(false)

const isTextarea = computed(() => props.type === 'textarea')
const innerValue = computed(() => String(props.modelValue ?? ''))
const textareaAutoStyle = ref<CSSProperties>({})

const mergedInputStyle = computed(() => {
	if (isTextarea.value && props.autosize) {
		return [props.inputStyle, textareaAutoStyle.value]
	}
	return props.inputStyle
})

const showClear = computed(
	() => props.clearable && !props.disabled && !props.readonly && isFocused.value && innerValue.value.length > 0,
)

const showPasswordIcon = computed(
	() => props.showPassword && !isTextarea.value && !props.disabled && !props.readonly,
)

const showWordLimitCounter = computed(
	() =>
		props.showWordLimit &&
		typeof props.maxlength === 'number' &&
		props.maxlength > 0 &&
		!props.disabled,
)

const normalizeValue = (value: string): string | number => {
	if (props.type !== 'number') {
		return value
	}
	if (value === '') {
		return ''
	}
	const parsed = Number(value)
	return Number.isNaN(parsed) ? value : parsed
}

const resizeTextarea = () => {
	if (!isTextarea.value || !props.autosize || typeof window === 'undefined') {
		return
	}
	const textarea = inputRef.value as HTMLTextAreaElement | undefined
	if (!textarea) {
		return
	}
	textarea.style.height = 'auto'
	textareaAutoStyle.value = {
		height: `${textarea.scrollHeight}px`,
	}
}

const handleInput = (event: Event) => {
	const rawValue = (event.target as HTMLInputElement | HTMLTextAreaElement).value
	const value = normalizeValue(rawValue)
	emit('update:modelValue', value)
	emit('input', value)
	nextTick(() => {
		resizeTextarea()
	})
}

const handleChange = (event: Event) => {
	const rawValue = (event.target as HTMLInputElement | HTMLTextAreaElement).value
	const value = normalizeValue(rawValue)
	emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
	isFocused.value = true
	emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
	isFocused.value = false
	emit('blur', event)
}

const clearValue = () => {
	const value = normalizeValue('')
	emit('update:modelValue', value)
	emit('input', value)
	emit('change', value)
	emit('clear')
	inputRef.value?.focus()
}

const togglePassword = () => {
	passwordVisible.value = !passwordVisible.value
	inputRef.value?.focus()
}

const focus = () => inputRef.value?.focus()
const blur = () => inputRef.value?.blur()
const select = () => {
	if (inputRef.value && 'select' in inputRef.value) {
		inputRef.value.select()
	}
}

watch(
	() => [innerValue.value, props.autosize, props.type],
	() => {
		nextTick(() => {
			resizeTextarea()
		})
	},
	{ immediate: true },
)

defineExpose({
	focus,
	blur,
	select,
	clear: clearValue,
})
</script>

<style scoped>
.scq-input {
	display: inline-flex;
	width: auto;
	min-width: 200px;
	color: var(--scq-text, #0f172a);
}

.scq-input.is-full-width {
	width: 100%;
}

.scq-input__wrapper {
	display: inline-flex;
	align-items: center;
	width: 100%;
	border: 1px solid var(--scq-border, #e2e8f0);
	border-radius: var(--scq-radius-md, 8px);
	background: var(--scq-surface, #ffffff);
	box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04);
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-input__wrapper:hover:not(.is-disabled) {
	border-color: var(--scq-border-hover, #cbd5e1);
}

.scq-input.is-focus .scq-input__wrapper {
	border-color: var(--scq-primary, #2563eb);
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}

.scq-input.scq-input--success .scq-input__wrapper {
	border-color: var(--scq-success, #10b981);
}
.scq-input.scq-input--success.is-focus .scq-input__wrapper {
	box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16);
}

.scq-input.scq-input--warning .scq-input__wrapper {
	border-color: var(--scq-warning, #f59e0b);
}
.scq-input.scq-input--warning.is-focus .scq-input__wrapper {
	box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.16);
}

.scq-input.scq-input--error .scq-input__wrapper {
	border-color: var(--scq-danger, #ef4444);
}
.scq-input.scq-input--error.is-focus .scq-input__wrapper {
	box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16);
}

.scq-input.is-disabled .scq-input__wrapper {
	background: var(--scq-fill, #f8fafc);
	border-color: var(--scq-border, #e2e8f0);
	box-shadow: none;
	cursor: not-allowed;
	opacity: 0.7;
}

.scq-input__inner {
	width: 100%;
	border: none;
	outline: none;
	background: transparent;
	color: inherit;
	padding: 8px 14px;
	font-size: 14px;
	line-height: 1.5;
}

.scq-input__inner::placeholder {
	color: var(--scq-muted, #94a3b8);
}

.scq-textarea__inner {
	resize: vertical;
	min-height: 80px;
	border-radius: var(--scq-radius-md, 8px);
}

.scq-textarea__inner.is-autosize {
	resize: none;
	overflow-y: hidden;
}

.scq-input--large .scq-input__inner {
	padding: 10px 16px;
	font-size: 15px;
}

.scq-input--large .scq-input__wrapper {
	border-radius: var(--scq-radius-lg, 10px);
}

.scq-input--small .scq-input__inner {
	padding: 5px 10px;
	font-size: 12px;
}

.scq-input--small .scq-input__wrapper {
	border-radius: var(--scq-radius-sm, 6px);
}

.scq-input__prefix,
.scq-input__suffix,
.scq-input__clear,
.scq-input__password {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: var(--scq-muted, #64748b);
	padding: 0 8px;
	user-select: none;
}

.scq-input__clear,
.scq-input__password {
	width: 32px;
	height: 100%;
	border: none;
	background: transparent;
	font: inherit;
	cursor: pointer;
	border-radius: var(--scq-radius-sm, 6px);
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-input__clear:hover,
.scq-input__password:hover {
	color: var(--scq-primary, #2563eb);
	background: rgba(37, 99, 235, 0.08);
}

.scq-input__clear:active,
.scq-input__password:active {
	transform: scale(0.92);
}

.scq-input__clear:focus-visible,
.scq-input__password:focus-visible {
	outline: none;
	color: var(--scq-primary, #2563eb);
}

.scq-input__group-prepend,
.scq-input__group-append {
	display: inline-flex;
	align-items: center;
	padding: 0 14px;
	border: 1px solid var(--scq-border, #e2e8f0);
	background: var(--scq-fill, #f8fafc);
	color: var(--scq-muted, #64748b);
	font-size: 14px;
	font-weight: 500;
}

.scq-input__group-prepend {
	border-right: none;
	border-radius: var(--scq-radius-md, 8px) 0 0 var(--scq-radius-md, 8px);
}

.scq-input__group-append {
	border-left: none;
	border-radius: 0 var(--scq-radius-md, 8px) var(--scq-radius-md, 8px) 0;
}

.scq-input__count {
	padding-right: 10px;
	font-size: 12px;
	line-height: 1;
	color: var(--scq-muted, #94a3b8);
	white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
	.scq-input__wrapper,
	.scq-input__clear,
	.scq-input__password {
		transition: none;
	}
}
</style>
