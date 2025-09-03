<script lang="ts">
	import type { LabelProps } from '$shared/components/model/types';

	const { for: forId, required = false, class: className = '', children }: LabelProps = $props();

	const classes = $derived(`form-label ${className}`);
</script>

<label for={forId} class={classes}>
	{@render children?.()}
	{#if required}
		<span class="text-red-500 ml-1" aria-label="必須">*</span>
	{/if}
</label>
