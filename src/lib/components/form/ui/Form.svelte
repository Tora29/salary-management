<script lang="ts">
	import type { FormProps } from '../model/types';

	let { onSubmit, children, gap = 'md', class: className = '', ...rest }: FormProps = $props();

	const gapClasses = {
		sm: 'space-y-4',
		md: 'space-y-6',
		lg: 'space-y-8'
	};

	const classes = $derived([gapClasses[gap], className].filter(Boolean).join(' '));

	function handleSubmit(event: Event) {
		if (onSubmit) {
			onSubmit(event);
		}
	}
</script>

<form class={classes} onsubmit={handleSubmit} {...rest}>
	{@render children?.()}
</form>
