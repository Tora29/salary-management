<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		fallback?: Snippet;
	}

	const { children, fallback }: Props = $props();

	let hasError = $state(false);
	let error = $state<Error | null>(null);

	onMount(() => {
		const handleError = (event: ErrorEvent): void => {
			hasError = true;
			error = event.error;
			event.preventDefault();
		};

		window.addEventListener('error', handleError);

		return () => {
			window.removeEventListener('error', handleError);
		};
	});
</script>

{#if hasError && fallback}
	{@render fallback()}
{:else if hasError}
	<div
		class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
	>
		<h2 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">エラーが発生しました</h2>
		<p class="text-sm text-red-700 dark:text-red-300">
			{error?.message || '予期しないエラーが発生しました'}
		</p>
	</div>
{:else}
	{@render children()}
{/if}
