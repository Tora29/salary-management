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

<div class="auth-card-container">
	{#if title || subtitle}
		<div class="auth-card-header">
			{#if title}
				<h2 class="auth-card-title">{title}</h2>
			{/if}
			{#if subtitle}
				<p class="auth-card-subtitle">{subtitle}</p>
			{/if}
		</div>
	{/if}

	<Card variant="bordered" padding="lg">
		{@render children()}
	</Card>
</div>

<style>
	.auth-card-container {
		width: 100%;
		max-width: 28rem;
	}

	.auth-card-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-card-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.5rem;
	}

	.auth-card-subtitle {
		font-size: 0.875rem;
		color: #6b7280;
	}
</style>
