<script lang="ts">
	import Card from '$shared/components/ui/Card.svelte';
	import type { Snippet } from 'svelte';

	const {
		children,
		title = '',
		subtitle = ''
	}: {
		children: Snippet;
		title?: string;
		subtitle?: string;
	} = $props();
</script>

<div class="w-full max-w-md">
	{#if title || subtitle}
		<div class="text-center mb-8">
			{#if title}
				<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
			{/if}
			{#if subtitle}
				<p class="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
			{/if}
		</div>
	{/if}

	<Card variant="bordered" padding="lg">
		{@render children()}
	</Card>
</div>
