<script lang="ts">
	import type { LabelProps } from '../model/types';

	let { required = false, children, class: className = '', ...rest }: LabelProps = $props();

	const classes = $derived(
		['block text-sm font-medium text-gray-700 mb-1', className].filter(Boolean).join(' ')
	);
</script>

<label class={classes} {...rest}>
	{@render children?.()}
	{#if required}
		<span class="ml-1 text-red-500">*</span>
	{/if}
</label>
