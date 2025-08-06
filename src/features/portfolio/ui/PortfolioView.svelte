<script lang="ts">
	import { CardWrapper } from '$lib/components/card';
	import { showToast } from '$lib/components/toast/model/store';

	import type { PortfolioViewProps, StockFormData } from '../model';
	import { portfolioService } from '../services';
	import StockForm from './StockForm.svelte';
	import StockList from './StockList.svelte';

	import type { Stock } from '$entities/dashboard/model';

	let { initialStocks = [], error: initialError = null }: PortfolioViewProps = $props();

	let stocks = $state<Stock[]>(initialStocks);
	let editingStock = $state<Stock | undefined>(undefined);
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let error = $state<string | null>(initialError);

	/**
	 * 株式データを再読み込み（必要に応じて）
	 */
	async function reloadStocks() {
		isLoading = true;
		try {
			const data = await portfolioService.getStocks();
			stocks = data;
			error = null;
		} catch (err) {
			console.error('Failed to reload stocks:', err);
			error = '株式データの再読み込みに失敗しました';
			showToast({
				type: 'error',
				title: 'エラー',
				message: '株式データの再読み込みに失敗しました'
			});
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 株式を追加または更新する
	 */
	async function handleSubmit(data: StockFormData) {
		isSubmitting = true;
		try {
			if (editingStock) {
				// 更新
				const updatedStock = await portfolioService.updateStock(editingStock.symbol, data);
				stocks = stocks.map((s) => (s.symbol === updatedStock.symbol ? updatedStock : s));
				showToast({
					type: 'success',
					title: '成功',
					message: '株式情報を更新しました'
				});
				editingStock = undefined;
			} else {
				// 新規追加
				const newStock = await portfolioService.addStock(data);
				stocks = [...stocks, newStock];
				showToast({
					type: 'success',
					title: '成功',
					message: '株式を追加しました'
				});
			}
		} catch (error) {
			console.error('Failed to save stock:', error);
			showToast({
				type: 'error',
				title: 'エラー',
				message: editingStock ? '株式の更新に失敗しました' : '株式の追加に失敗しました'
			});
		} finally {
			isSubmitting = false;
		}
	}

	/**
	 * 株式を削除する
	 */
	async function handleDelete(symbol: string) {
		try {
			await portfolioService.deleteStock(symbol);
			stocks = stocks.filter((s) => s.symbol !== symbol);
			showToast({
				type: 'success',
				title: '成功',
				message: '株式を削除しました'
			});
		} catch (error) {
			console.error('Failed to delete stock:', error);
			showToast({
				type: 'error',
				title: 'エラー',
				message: '株式の削除に失敗しました'
			});
		}
	}

	/**
	 * 編集モードに切り替える
	 */
	function handleEdit(stock: Stock) {
		editingStock = stock;
		// フォームエリアにスクロール
		const formSection = document.getElementById('stock-form-section');
		formSection?.scrollIntoView({ behavior: 'smooth' });
	}

	/**
	 * 株価更新後の処理
	 */
	function handlePricesUpdate(updatedStocks: Stock[]) {
		stocks = updatedStocks;
		// 更新されたデータをサーバーに保存
		updatedStocks.forEach(async (stock) => {
			try {
				await portfolioService.updateStock(stock.symbol, {
					symbol: stock.symbol,
					quantity: stock.quantity,
					purchasePrice: stock.purchasePrice
				});
			} catch (error) {
				console.error(`Failed to save updated price for ${stock.symbol}:`, error);
			}
		});
	}

	// propsから受け取った初期データを設定
	$effect(() => {
		stocks = initialStocks;
		error = initialError;
	});
</script>

<div class="space-y-8">
	<!-- エラー表示 -->
	{#if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-700">
			<p class="font-semibold">エラーが発生しました</p>
			<p class="text-sm">{error}</p>
			<button onclick={reloadStocks} class="mt-2 text-sm text-red-600 underline hover:text-red-800">
				再読み込み
			</button>
		</div>
	{/if}
	<!-- 株式入力フォーム -->
	<section id="stock-form-section">
		<CardWrapper>
			<div class="p-6">
				<h2 class="mb-6 text-xl font-semibold text-gray-900">
					{editingStock ? '株式情報を編集' : '新規株式を追加'}
				</h2>
				<StockForm onSubmit={handleSubmit} stock={editingStock} {isSubmitting} />
				{#if editingStock}
					<div class="mt-4">
						<button
							onclick={() => (editingStock = undefined)}
							class="text-sm text-gray-600 hover:text-gray-800"
						>
							編集をキャンセル
						</button>
					</div>
				{/if}
			</div>
		</CardWrapper>
	</section>

	<!-- 株式リスト -->
	<section>
		<h2 class="mb-4 text-xl font-semibold text-gray-900">保有株式一覧</h2>
		{#if isLoading}
			<CardWrapper>
				<div class="flex items-center justify-center py-12">
					<div class="text-center">
						<div class="mb-2">
							<svg class="mx-auto h-8 w-8 animate-spin text-gray-400" viewBox="0 0 24 24">
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
						</div>
						<p class="text-gray-500">読み込み中...</p>
					</div>
				</div>
			</CardWrapper>
		{:else}
			<StockList
				{stocks}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onPricesUpdate={handlePricesUpdate}
			/>
		{/if}
	</section>
</div>
