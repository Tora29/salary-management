<script lang="ts">
	import type { ButtonProps } from '../model/types';

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		children,
		class: className = '',
		...rest
	}: ButtonProps = $props();

	const variantClasses = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
		outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
		ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg'
	};

	const disabledClasses = 'opacity-50 cursor-not-allowed';

	const classes = $derived(
		[
			'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
			variantClasses[variant],
			sizeClasses[size],
			disabled && disabledClasses,
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<button class={classes} {disabled} {...rest}>
	{@render children?.()}
</button>
