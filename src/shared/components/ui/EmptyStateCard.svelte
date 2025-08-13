<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import type { ComponentType } from 'svelte';

	interface Props {
		title: string;
		description: string;
		actionText: string;
		actionHref: string;
		icon?: ComponentType;
		iconClass?: string;
	}

	const {
		title,
		description,
		actionText,
		actionHref,
		icon,
		iconClass = 'text-blue-600 dark:text-blue-400'
	}: Props = $props();
</script>

<Card>
	<div class="p-8 text-center">
		{#if icon}
			{@const Icon = icon}
			<div class="mb-4 flex justify-center">
				<Icon size={48} class={iconClass} />
			</div>
		{/if}

		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
			{title}
		</h3>

		<p class="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
			{description}
		</p>

		<a href={actionHref} class="inline-block w-full sm:w-auto">
			<Button variant="primary" size="lg" class="w-full">
				{actionText}
			</Button>
		</a>
	</div>
</Card>
