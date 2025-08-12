<script lang="ts">
	import type { FormLinkProps } from '../model/types';

	const { href, children, variant = 'primary', size = 'md' }: FormLinkProps = $props();

	const variantClasses = {
		primary: 'text-blue-600 hover:text-blue-500',
		secondary: 'text-gray-600'
	};

	const sizeClasses = {
		sm: 'text-sm',
		md: 'text-base'
	};

	const linkClass = `${variantClasses[variant]} ${sizeClasses[size]}`;
</script>

<a {href} class={linkClass}>
	{@render children()}
</a>
