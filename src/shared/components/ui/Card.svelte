<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { CardProps } from '../model/types';
	import type { Snippet } from 'svelte';

	const {
		variant = 'default',
		padding = 'md',
		class: className = '',
		children
	}: CardProps & { children?: Snippet } = $props();

	const baseClasses = 'rounded-lg bg-white transition-all duration-200';

	const variantClasses = {
		default: '',
		bordered: 'border border-gray-200',
		elevated: 'shadow-lg hover:shadow-xl'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const cardClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;
</script>

<div 
	class={cardClasses}
	transition:fade={{ duration: 200 }}
	role="region"
>
	{@render children?.()}
</div>
