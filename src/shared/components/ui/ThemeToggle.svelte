<script lang="ts">
	import { themeStore } from '$shared/stores/theme.svelte';
	import { onMount } from 'svelte';
	import { Sun, Moon } from '@lucide/svelte';
	import { fade, scale } from 'svelte/transition';
	import { createToggle, melt } from '@melt-ui/svelte';

	// Svelte 5のリアクティビティ - storeの値を直接参照
	const isDark = $derived(themeStore.isDark);

	// Melt UI toggle の作成
	const {
		elements: { root },
		states: { pressed }
	} = createToggle({
		defaultPressed: false
	});

	// SSR対応のため、onMountで初期化
	let mounted = $state(false);

	onMount(() => {
		themeStore.init();
		mounted = true;
		// 初期状態を設定
		pressed.set(themeStore.isDark);
	});

	// テーマ切り替え処理
	function handleToggle(): void {
		themeStore.toggle();
		// Melt UIの状態も更新
		pressed.set(themeStore.isDark);
	}

	// アクセシビリティ用のラベル
	const ariaLabel = $derived(isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
</script>

<button
	use:melt={$root}
	onclick={handleToggle}
	class="relative flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gray-300 bg-transparent transition-all duration-200 hover:border-gray-500 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:scale-95 dark:border-gray-600 dark:hover:border-gray-400 dark:hover:bg-gray-700"
	aria-label={ariaLabel}
	title={ariaLabel}
>
	{#if mounted}
		<div class="relative h-5 w-5">
			{#if isDark}
				<div
					class="absolute inset-0 flex items-center justify-center text-gray-300"
					in:scale={{ duration: 200, start: 0.8 }}
					out:fade={{ duration: 150 }}
				>
					<Moon size={20} />
				</div>
			{:else}
				<div
					class="absolute inset-0 flex items-center justify-center text-gray-700"
					in:scale={{ duration: 200, start: 0.8 }}
					out:fade={{ duration: 150 }}
				>
					<Sun size={20} />
				</div>
			{/if}
		</div>
	{:else}
		<!-- Loading state -->
		<div class="h-5 w-5 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></div>
	{/if}
</button>
