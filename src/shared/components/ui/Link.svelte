<script lang="ts">
	/**
	 * 内部リンクコンポーネント
	 * SvelteKitのナビゲーションを使用したリンク
	 */
	import type { LinkProps } from '$shared/components/model/types';

	const { href, class: className = '', children, ...rest }: LinkProps = $props();
</script>

<a
	{href}
	class="text-blue-600 hover:text-blue-700 underline transition-colors {className}"
	{...rest}
>
	{@render children()}
</a>
