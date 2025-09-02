<script lang="ts">
	import type { InputProps } from '$shared/components/model/types';

	let {
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		error = false,
		required = false,
		autocomplete,
		id,
		name,
		class: className = '',
		...restProps
	}: InputProps = $props();

	const classes = $derived(`input ${error ? 'input-error' : ''} ${className}`);
</script>

<input
	{type}
	bind:value
	{placeholder}
	{disabled}
	{required}
	autocomplete={autocomplete as any}
	{id}
	{name}
	class={classes}
	aria-invalid={error}
	aria-required={required}
	{...restProps}
/>
