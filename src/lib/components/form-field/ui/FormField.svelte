<script lang="ts">
	import { Input } from '$lib/components/input';
	import { Label } from '$lib/components/label';

	import type { FormFieldProps } from '../model/types';

	let {
		label,
		required = false,
		error,
		id,
		children,
		value = $bindable(),
		type,
		placeholder,
		disabled,
		min,
		max,
		step,
		oninput,
		onblur
	}: FormFieldProps = $props();
</script>

<div>
	<Label for={id} {required}>{label}</Label>
	{#if children}
		{@render children()}
	{:else}
		<Input
			{id}
			{error}
			{type}
			{placeholder}
			disabled={disabled ?? false}
			{min}
			{max}
			{step}
			{oninput}
			{onblur}
			bind:value
		/>
	{/if}
</div>
