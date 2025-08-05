<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { showToast } from '$lib/components/toast/model/store';
	import type { StockPriceResponse } from '$entities/stock-price/model';
	import type { StockPriceUpdaterProps } from '$features/stock-price/model';

	let { stocks, onPricesUpdate, updateInterval = 60000 }: StockPriceUpdaterProps = $props();

	let isUpdating = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	/**
	 * 株価を更新する
	 */
	async function updateStockPrices() {
		if (stocks.length === 0 || isUpdating) return;

		isUpdating = true;
		const symbols = stocks.map((stock) => stock.symbol);

		try {
			const response = await fetch('/api/stock-prices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ symbols })
			});

			if (!response.ok) {
				throw new Error('株価の取得に失敗しました');
			}

			const data: StockPriceResponse = await response.json();

			// エラーがある場合は通知
			if (data.errors.length > 0) {
				const errorSymbols = data.errors.map((e) => e.symbol).join(', ');
				showToast({
					type: 'error',
					title: 'エラー',
					message: `一部の株価取得に失敗: ${errorSymbols}`
				});
			}

			// 取得できた株価で更新
			if (data.quotes.length > 0) {
				const updatedStocks = stocks.map((stock) => {
					const quote = data.quotes.find((q) => q.symbol === stock.symbol);
					if (quote) {
						return {
							...stock,
							currentPrice: quote.regularMarketPrice,
							value: stock.quantity * quote.regularMarketPrice
						};
					}
					return stock;
				});

				onPricesUpdate(updatedStocks);

				const updateCount = data.quotes.length;
				showToast({
					type: 'success',
					title: '成功',
					message: `${updateCount}銘柄の株価を更新しました`
				});
			}
		} catch (error) {
			console.error('Failed to update stock prices:', error);
			showToast({
				type: 'error',
				title: 'エラー',
				message: '株価の更新に失敗しました'
			});
		} finally {
			isUpdating = false;
		}
	}

	// 初回実行と定期実行の設定
	onMount(() => {
		// 初回実行
		updateStockPrices();

		// 定期実行
		if (updateInterval > 0) {
			intervalId = setInterval(updateStockPrices, updateInterval);
		}
	});

	// クリーンアップ
	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});
</script>

<div class="flex items-center gap-2 text-sm text-gray-600">
	{#if isUpdating}
		<div class="flex items-center gap-2">
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
					fill="none"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<span>株価を更新中...</span>
		</div>
	{:else}
		<button
			onclick={updateStockPrices}
			class="flex items-center gap-2 rounded px-3 py-1 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				></path>
			</svg>
			<span>株価を更新</span>
		</button>
		<span class="text-gray-500">
			{updateInterval > 0 ? `${updateInterval / 1000}秒ごとに自動更新` : '手動更新のみ'}
		</span>
	{/if}
</div>
