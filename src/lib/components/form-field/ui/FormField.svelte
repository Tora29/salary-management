<script lang="ts">
	import type { FormFieldProps } from '../model/types';
	import { Label } from '$lib/components/label';
	import { Input } from '$lib/components/input';

	let { label, required = false, error, id, children, ...inputProps }: FormFieldProps = $props();
</script>

<div>
	<Label for={id} {required}>{label}</Label>
	{#if children}
		{@render children()}
	{:else}
		<Input {id} {error} {...inputProps} />
	{/if}
</div>
