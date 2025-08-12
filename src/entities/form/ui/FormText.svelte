<script lang="ts">
	import type { FormTextProps } from '../model/types';

	const { children, variant = 'default', size = 'sm', align = 'left' }: FormTextProps = $props();

	const variantClasses = {
		default: 'text-gray-900',
		muted: 'text-gray-600',
		error: 'text-red-600'
	};

	const sizeClasses = {
		xs: 'text-xs',
		sm: 'text-sm',
		md: 'text-base'
	};

	const alignClasses = {
		left: 'text-left',
		center: 'text-center',
		right: 'text-right'
	};

	const textClass = `${variantClasses[variant]} ${sizeClasses[size]} ${alignClasses[align]}`;
</script>

<div class={textClass}>
	{@render children()}
</div>
