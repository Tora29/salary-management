<script lang="ts">
	import type { ButtonProps } from '../model/types';
	import { Loader2 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	const {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		class: className = '',
		children,
		onclick
	}: ButtonProps & {
		children?: Snippet;
		onclick?: (e: MouseEvent) => void;
	} = $props();

	// Melt UIのbuilderを使用
	const isDisabled = $derived(disabled || loading);

	const baseClasses =
		'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variantClasses = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
		secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
		ghost: 'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500'
	};

	const sizeClasses = {
		sm: 'h-8 px-3 text-sm rounded-md',
		md: 'h-10 px-4 text-base rounded-md',
		lg: 'h-12 px-6 text-lg rounded-md'
	};

	const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
</script>

<button {type} class={buttonClasses} disabled={isDisabled} {onclick} aria-busy={loading}>
	{#if loading}
		<Loader2 class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
	{/if}
	{@render children?.()}
</button>
