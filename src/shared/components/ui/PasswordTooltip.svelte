<script lang="ts">
	/**
	 * パスワード要件説明ツールチップ
	 * Melt UIのcreateTooltipビルダーを使用
	 */
	import { createTooltip, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { InfoIcon } from '@lucide/svelte';

	interface Props {
		content?: Snippet;
		placement?: 'top' | 'bottom' | 'left' | 'right';
		openDelay?: number;
		closeDelay?: number;
		class?: string;
		children?: Snippet;
	}

	const {
		content,
		placement = 'top',
		openDelay = 200,
		closeDelay = 100,
		class: className = '',
		children
	}: Props = $props();

	// Melt UI Tooltipビルダー
	const {
		elements: { trigger, content: tooltipContent, arrow },
		states: { open }
	} = createTooltip({
		positioning: {
			placement
		},
		openDelay,
		closeDelay,
		closeOnPointerDown: false,
		forceVisible: false
	});
</script>

<button
	use:melt={$trigger}
	type="button"
	class="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors {className}"
	aria-label="パスワード要件の説明"
>
	{#if children}
		{@render children()}
	{:else}
		<InfoIcon size={16} />
	{/if}
</button>

{#if $open}
	<div
		use:melt={$tooltipContent}
		transition:fade={{ duration: 100 }}
		class="z-50 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
	>
		<div use:melt={$arrow}></div>
		{#if content}
			{@render content()}
		{:else}
			<div class="space-y-1">
				<div class="font-semibold mb-2">パスワード要件:</div>
				<div>✓ 最小8文字以上</div>
				<div>✓ 大文字を1文字以上含む</div>
				<div>✓ 小文字を1文字以上含む</div>
				<div>✓ 数字を1文字以上含む</div>
				<div class="text-gray-300 mt-1">※ 特殊文字は任意</div>
			</div>
		{/if}
	</div>
{/if}
