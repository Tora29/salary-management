<script lang="ts">
	import type { FormFieldGroupProps } from '../model/types';

	const { children, helpText }: FormFieldGroupProps = $props();
</script>

<div>
	{@render children()}
	{#if helpText}
		<p class="mt-1 text-xs text-gray-500">{helpText}</p>
	{/if}
</div>
