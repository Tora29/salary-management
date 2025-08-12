<script lang="ts">
	import type { FormCheckboxProps } from '../model/types';

	let {
		children,
		id,
		name,
		checked = $bindable(false),
		required = false,
		disabled = false,
		error
	}: FormCheckboxProps = $props();
</script>

<div class="flex items-start">
	<div class="flex items-center h-5">
		<input
			type="checkbox"
			{id}
			{name}
			bind:checked
			{required}
			{disabled}
			class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
		/>
	</div>
	<div class="ml-3 text-sm">
		<label for={id} class="text-gray-700">
			{@render children()}
		</label>
		{#if error}
			<p class="mt-1 text-xs text-red-600">{error}</p>
		{/if}
	</div>
</div>
