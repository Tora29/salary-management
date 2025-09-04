<script lang="ts">
	/**
	 * 汎用ツールチップコンポーネント
	 * Melt UIのcreateTooltipビルダーを使用
	 */
	import { createTooltip, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';

	import type { TooltipProps } from '$shared/components/model/types';

	const {
		content,
		placement = 'top',
		openDelay = 200,
		closeDelay = 100,
		class: className = '',
		children
	}: TooltipProps = $props();

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

<span use:melt={$trigger} class={className}>
	{#if children}
		{@render children()}
	{/if}
</span>

{#if $open && content}
	<div
		use:melt={$tooltipContent}
		transition:fade={{ duration: 100 }}
		class="z-50 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg max-w-xs"
	>
		<div use:melt={$arrow}></div>
		{@render content()}
	</div>
{/if}
