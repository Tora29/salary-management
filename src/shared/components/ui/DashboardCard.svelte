<script lang="ts">
	import Card from './Card.svelte';
	import Skeleton from './Skeleton.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		loading?: boolean;
		error?: string | null;
		class?: string;
		variant?: 'default' | 'bordered' | 'elevated';
		children?: Snippet;
	}

	const {
		title,
		loading = false,
		error = null,
		class: className = '',
		variant = 'default',
		children
	}: Props = $props();
</script>

<Card {variant} class={className}>
	<div class="p-6">
		<h3 class="text-sm font-medium text-tertiary mb-4">{title}</h3>

		{#if loading}
			<div class="space-y-3">
				<Skeleton height="32px" />
				<Skeleton height="16px" width="60%" />
				<Skeleton height="16px" width="80%" />
			</div>
		{:else if error}
			<div class="text-red-500 text-sm">{error}</div>
		{:else if children}
			{@render children()}
		{:else}
			<div class="text-tertiary text-sm">データがありません</div>
		{/if}
	</div>
</Card>
