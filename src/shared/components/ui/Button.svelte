<script lang="ts">
	import type { ButtonProps } from '$shared/components/model/types';

	const {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		class: className = '',
		onclick,
		children,
		...restProps
	}: ButtonProps = $props();

	const variantClasses = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		danger: 'btn-danger'
	};

	const sizeClasses = {
		sm: 'btn-size-sm',
		md: 'btn-size-md',
		lg: 'btn-size-lg'
	};

	const isDisabled = $derived(disabled || loading);
	const classes = $derived(`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`);
</script>

<button {type} class={classes} disabled={isDisabled} {onclick} aria-busy={loading} {...restProps}>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{/if}
	{@render children?.()}
</button>
