<script lang="ts">
	/**
	 * 内部リンクコンポーネント
	 * SvelteKitのナビゲーションを使用したリンク
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		class?: string;
		children: Snippet;
		target?: string;
		'aria-label'?: string;
	}

	const { href, class: className = '', children, ...rest }: Props = $props();
</script>

<a
	{href}
	class="text-blue-600 hover:text-blue-700 underline transition-colors {className}"
	{...rest}
>
	{@render children()}
</a>
