<template>
	<div
		v-bind="field.rootAttrs.value"
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
				v-model="composition.model.value"
				:placeholder="placeholder"
				:disabled="disabled"
				:readonly="readonly"
				:maxlength="maxlength"
				:minlength="minlength"
				:name="name"
				:id="id"
				v-bind="field.attrs.value"
				@change="handleChange"
				@focus="handleFocus"
				@blur="handleBlur"
				@keydown="(e) => emit('keydown', e)"
				@keyup="(e) => emit('keyup', e)"
				@compositionstart="(e) => { composition.start(); emit('compositionstart', e) }"
				@compositionupdate="(e) => emit('compositionupdate', e)"
				@compositionend="(e) => { composition.end(e); emit('compositionend', e) }"
			/>

			<input
				v-else
				ref="inputRef"
				class="scq-input__inner"
				:class="inputClass"
				:style="mergedInputStyle"
				:type="passwordVisible ? 'text' : type"
				v-model="composition.model.value"
				:placeholder="placeholder"
				:disabled="disabled"
				:readonly="readonly"
				:maxlength="maxlength"
				:minlength="minlength"
				:autocomplete="autocomplete"
				:name="name"
				:id="id"
				v-bind="field.attrs.value"
				@change="handleChange"
				@focus="handleFocus"
				@blur="handleBlur"
				@keydown="(e) => emit('keydown', e)"
				@keyup="(e) => emit('keyup', e)"
				@compositionstart="(e) => { composition.start(); emit('compositionstart', e) }"
				@compositionupdate="(e) => emit('compositionupdate', e)"
				@compositionend="(e) => { composition.end(e); emit('compositionend', e) }"
			/>

			<button
				v-if="showClear"
				type="button"
				class="scq-input__clear"
				:aria-label="text('clearInput')"
				@mousedown.prevent
				@click="clearValue"
			>
				&times;
			</button>

			<button
				v-if="showPasswordIcon"
				type="button"
				class="scq-input__password"
				:aria-label="text(passwordVisible ? 'hidePassword' : 'showPassword')"
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
import { useConfig, useLocale, type ComponentSize } from '../ConfigProvider/context'
import { useFormControl } from '../Form/useFormControl'
import { useCompositionModel } from '../../utils/composition'

defineOptions({
	name: 'Input',
	inheritAttrs: false,
})

type InputType = 'text' | 'password' | 'textarea' | 'number' | 'email' | 'tel' | 'url' | 'search'
type InputStatus = 'default' | 'success' | 'warning' | 'error'

const props = withDefaults(
	defineProps<{
		modelValue?: string | number
		type?: InputType
		size?: ComponentSize
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
		status: 'default',
		placeholder: '',
		disabled: undefined,
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

const config = useConfig()
const text = useLocale()
const size = computed(() => props.size ?? config.value.size)
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()
const field = useFormControl({ element: () => inputRef.value, id: () => props.id, disabled: () => props.disabled })
const disabled = field.disabled
const isFocused = ref(false)
const passwordVisible = ref(false)

const isTextarea = computed(() => props.type === 'textarea')
const innerValue = computed(() => String(props.modelValue ?? ''))
let lastInputValue = innerValue.value
const textareaAutoStyle = ref<CSSProperties>({})

const mergedInputStyle = computed(() => {
	if (isTextarea.value && props.autosize) {
		return [props.inputStyle, textareaAutoStyle.value]
	}
	return props.inputStyle
})

const showClear = computed(
	() => props.clearable && !disabled.value && !props.readonly && isFocused.value && innerValue.value.length > 0,
)

const showPasswordIcon = computed(
	() => props.showPassword && !isTextarea.value && !disabled.value && !props.readonly,
)

const showWordLimitCounter = computed(
	() =>
		props.showWordLimit &&
		typeof props.maxlength === 'number' &&
		props.maxlength > 0 &&
		!disabled.value,
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

const handleInput = (rawValue: string) => {
	if (disabled.value || props.readonly) { composition.cancel(inputRef.value); return }
	const value = normalizeValue(rawValue)
	lastInputValue = String(value)
	emit('update:modelValue', value)
	emit('input', value)
	nextTick(() => {
		resizeTextarea()
	})
}
const composition = useCompositionModel(() => innerValue.value, handleInput)
watch([disabled, () => props.readonly], ([locked, readonly]) => { if (locked || readonly) composition.cancel(inputRef.value) }, { flush: 'sync' })
watch(innerValue, (value) => {
	if (composition.composing.value || value !== lastInputValue) composition.cancel(inputRef.value, value)
	lastInputValue = value
}, { flush: 'sync' })
watch(() => props.type, () => composition.cancel(inputRef.value), { flush: 'sync' })
watch([() => props.type, () => props.showPassword, disabled, () => props.readonly], () => { passwordVisible.value = false })

const handleChange = (event: Event) => {
	if (disabled.value || props.readonly) { composition.cancel(inputRef.value); return }
	if (composition.composing.value) return
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
	field.touch(event)
	emit('blur', event)
}

const clearValue = () => {
	composition.cancel(inputRef.value, '')
	const value = normalizeValue('')
	emit('update:modelValue', value)
	emit('input', value)
	emit('change', value)
	emit('clear')
	inputRef.value?.focus()
}

const togglePassword = () => {
	if (disabled.value) return
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
	--scq-input-border-width: var(--scq-control-border-width, 1px);
	--scq-input-border-radius: var(--scq-control-radius, 4px);
	display: inline-flex;
	width: auto;
	min-width: min(200px, 100%);
	max-width: 100%;
	color: var(--scq-text, #0f172a);
}

.scq-input.is-full-width {
	width: 100%;
	min-width: 0;
}

.scq-input__wrapper {
	--scq-input-border-color: var(--scq-border, #dcdfe6);
	display: inline-flex;
	align-items: center;
	width: 100%;
	min-width: 0;
	border: none;
	padding: var(--scq-input-border-width);
	border-radius: var(--scq-input-border-radius);
	background: var(--scq-surface, #ffffff);
	box-shadow: 0 0 0 var(--scq-input-border-width) var(--scq-input-border-color) inset;
	transition: box-shadow var(--scq-transition-fast, 0.2s ease), background-color var(--scq-transition-fast, 0.2s ease);
}

.scq-input__wrapper:hover {
	--scq-input-border-color: var(--scq-border-hover, #a8abb2);
}

.scq-input.is-focus .scq-input__wrapper {
	--scq-input-border-color: var(--scq-primary, #409eff);
}

.scq-input.scq-input--success .scq-input__wrapper {
	--scq-input-border-color: var(--scq-success, #10b981);
}

.scq-input.scq-input--warning .scq-input__wrapper {
	--scq-input-border-color: var(--scq-warning, #f59e0b);
}

.scq-input.scq-input--error .scq-input__wrapper {
	--scq-input-border-color: var(--scq-danger, #ef4444);
}

.scq-input.is-disabled .scq-input__wrapper {
	--scq-input-border-color: var(--scq-border, #dcdfe6);
	background: var(--scq-fill, #f8fafc);
	cursor: not-allowed;
	opacity: 0.7;
}

.scq-input__inner {
	width: 100%;
	min-width: 0;
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
	border-radius: inherit;
}

.scq-textarea__inner.is-autosize {
	resize: none;
	overflow-y: hidden;
}

.scq-input--large .scq-input__inner {
	padding: 10px 16px;
	font-size: 15px;
}

.scq-input--small .scq-input__inner {
	padding: 5px 10px;
	font-size: 12px;
}

.scq-input__prefix,
.scq-input__suffix,
.scq-input__clear,
.scq-input__password {
	display: inline-flex;
	flex-shrink: 0;
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
	border-radius: var(--scq-input-border-radius) 0 0 var(--scq-input-border-radius);
}

.scq-input__group-append {
	border-left: none;
	border-radius: 0 var(--scq-input-border-radius) var(--scq-input-border-radius) 0;
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
