<script lang="ts">
	import { createLabel, melt } from '@melt-ui/svelte';
	import type { FormFieldProps } from '../model/types';
	import type { Snippet } from 'svelte';

	const {
		label = '',
		error = '',
		required = false,
		id = '',
		class: className = '',
		children
	}: FormFieldProps & { children?: Snippet } = $props();

	const {
		elements: { root: labelElement }
	} = createLabel();
</script>

<div class={`space-y-2 ${className}`}>
	{#if label}
		<label 
			use:melt={$labelElement}
			for={id} 
			class="text-sm font-medium text-gray-700 block"
		>
			{label}
			{#if required}
				<span class="text-red-500" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	{@render children?.()}

	{#if error}
		<p 
			class="text-sm text-red-600 mt-1" 
			role="alert"
			id={`${id}-error`}
		>
			{error}
		</p>
	{/if}
</div>
