<script lang="ts">
	import { createLabel, melt } from '@melt-ui/svelte';
	import type { InputProps } from '../model/types';

	let {
		type = 'text',
		placeholder = '',
		disabled = false,
		readonly = false,
		required = false,
		error = '',
		label = '',
		id = '',
		name = '',
		value = $bindable(''),
		class: className = '',
		icon = undefined,
		onblur
	}: InputProps = $props();

	const {
		elements: { root: labelElement }
	} = createLabel();

	const baseClasses =
		'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

	const errorClasses = error
		? 'border-red-500 focus-visible:ring-red-500'
		: 'border-gray-300 focus-visible:ring-blue-600';

	const paddingWithIcon = icon ? 'pl-10' : '';
	const inputClasses = `${baseClasses} ${errorClasses} ${paddingWithIcon} ${className}`;
</script>

<div class="space-y-2">
	{#if label}
		<label use:melt={$labelElement} for={id} class="text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		{#if icon}
			{@const Icon = icon}
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<Icon class="h-5 w-5 text-gray-400" />
			</div>
		{/if}
		<input
			{id}
			{name}
			{type}
			{placeholder}
			{disabled}
			{readonly}
			{required}
			bind:value
			class={inputClasses}
			{onblur}
			aria-invalid={!!error}
			aria-describedby={error ? `${id}-error` : undefined}
		/>
	</div>

	{#if error}
		<p id={`${id}-error`} class="text-sm text-red-600" role="alert">
			{error}
		</p>
	{/if}
</div>
