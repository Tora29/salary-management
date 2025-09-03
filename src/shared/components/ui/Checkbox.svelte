<script lang="ts">
	/**
	 * 汎用チェックボックスコンポーネント
	 * シンプルなネイティブ実装
	 */
	import { Check } from '@lucide/svelte';

	import type { MeltCheckboxProps } from '$shared/components/model/melt-ui-common';

	let {
		checked = $bindable(false),
		disabled = false,
		label,
		class: className = '',
		onCheckedChange,
		ariaLabel = 'チェックボックス'
	}: MeltCheckboxProps = $props();

	function handleClick(): void {
		if (!disabled) {
			checked = !checked;
			if (onCheckedChange) {
				onCheckedChange(checked);
			}
		}
	}

	function handleKeyDown(e: KeyboardEvent): void {
		if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<div class="flex items-start {className}">
	<div class="flex items-center h-5">
		<button
			type="button"
			role="checkbox"
			aria-checked={checked}
			aria-label={ariaLabel}
			{disabled}
			onclick={handleClick}
			onkeydown={handleKeyDown}
			class="relative h-5 w-5 cursor-pointer rounded border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {checked
				? 'checkbox-checked'
				: 'checkbox-unchecked'}"
			style:--checkbox-primary-color="var(--color-primary-600)"
			style:--checkbox-border-color={checked ? 'var(--color-primary-600)' : '#d1d5db'}
			style:--checkbox-bg-color={checked ? 'var(--color-primary-600)' : 'transparent'}
		>
			{#if checked}
				<span class="absolute inset-0 flex items-center justify-center pointer-events-none">
					<Check size={14} strokeWidth={3} class="checkbox-icon" />
				</span>
			{/if}
		</button>
		<input type="checkbox" bind:checked {disabled} class="sr-only" tabindex="-1" />
	</div>
	{#if label}
		<div class="ml-3 text-sm">
			{@render label()}
		</div>
	{/if}
</div>

<style>
	.checkbox-unchecked {
		border-color: var(--checkbox-border-color);
		background-color: var(--checkbox-bg-color);
	}

	.checkbox-checked {
		border-color: var(--checkbox-primary-color);
		background-color: white;
	}

	.checkbox-checked:focus {
		--tw-ring-color: var(--checkbox-primary-color);
	}

	.checkbox-icon {
		color: var(--checkbox-primary-color);
	}
</style>
