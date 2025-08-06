<script lang="ts">
	import type { InputProps } from '../model/types';

	let {
		error,
		value = $bindable(),
		disabled = false,
		class: className = '',
		...rest
	}: InputProps = $props();

	const classes = $derived(
		[
			'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm',
			error
				? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
				: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
			disabled && 'bg-gray-100 cursor-not-allowed text-gray-500',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div>
	<input bind:value class={classes} {disabled} {...rest} />
	{#if error}
		<p class="mt-2 text-sm text-red-600">{error}</p>
	{/if}
</div>
