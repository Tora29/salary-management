<script lang="ts">
	import type { FormGridProps } from '../model/types';

	let { cols = 1, gap = 'md', children, class: className = '' }: FormGridProps = $props();

	const colClasses = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
	};

	const gapClasses = {
		sm: 'gap-4',
		md: 'gap-6',
		lg: 'gap-8'
	};

	const classes = $derived(
		['grid', colClasses[cols], gapClasses[gap], className].filter(Boolean).join(' ')
	);
</script>

<div class={classes}>
	{@render children?.()}
</div>
