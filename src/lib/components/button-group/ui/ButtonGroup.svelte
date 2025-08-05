<script lang="ts">
	import type { ButtonGroupProps } from '../model/types';

	let { align = 'end', gap = 'md', children, class: className = '' }: ButtonGroupProps = $props();

	const alignClasses = {
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end',
		between: 'justify-between'
	};

	const gapClasses = {
		sm: 'gap-2',
		md: 'gap-3',
		lg: 'gap-4'
	};

	const classes = $derived(
		['flex', 'items-center', alignClasses[align], gapClasses[gap], className]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class={classes}>
	{@render children?.()}
</div>
