<script lang="ts">
	import type { CardProps } from '$shared/components/model/types';

	const {
		class: className = '',
		padding = 'md',
		shadow = 'md',
		children,
		...restProps
	}: CardProps = $props();

	const paddingClasses = {
		sm: 'card-padding-sm',
		md: 'card-padding-md',
		lg: 'card-padding-lg',
		xl: 'card-padding-xl'
	};

	const shadowClasses = {
		none: 'card-shadow-none',
		sm: 'card-shadow-sm',
		md: 'card-shadow-md',
		lg: 'card-shadow-lg',
		xl: 'card-shadow-xl'
	};

	const classes = $derived(`card ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`);
</script>

<div class={classes} {...restProps}>
	{@render children?.()}
</div>
