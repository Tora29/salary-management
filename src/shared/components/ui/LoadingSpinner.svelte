<script lang="ts">
	import { Loader2 } from '@lucide/svelte';

	const {
		size = 'md',
		class: className = '',
		label = 'Loading...'
	}: {
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		label?: string;
	} = $props();

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};

	const spinnerClasses = `animate-spin ${sizeClasses[size]} ${className}`;
</script>

<div class="inline-flex items-center justify-center">
	<Loader2 class={spinnerClasses} aria-hidden="true" />
	<span class="sr-only">{label}</span>
</div>
