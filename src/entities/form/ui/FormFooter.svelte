<script lang="ts">
	import type { FormFooterProps } from '../model/types';

	const { children, align = 'center' }: FormFooterProps = $props();

	const alignClasses = {
		left: 'flex justify-start',
		center: 'text-center',
		right: 'flex justify-end',
		between: 'flex items-center justify-between'
	};

	const footerClass = alignClasses[align];
</script>

<div class={footerClass}>
	{@render children()}
</div>
