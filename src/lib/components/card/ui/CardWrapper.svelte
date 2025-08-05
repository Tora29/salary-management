<script lang="ts">
	import type { Snippet } from 'svelte';

	interface CardWrapperProps {
		/** 子要素 */
		children?: Snippet;
		/** 追加のクラス名 */
		class?: string;
	}

	let { children, class: className = '' }: CardWrapperProps = $props();

	const classes = ['rounded-lg bg-white shadow-md', className].filter(Boolean).join(' ');
</script>

<div class={classes}>
	{@render children?.()}
</div>
