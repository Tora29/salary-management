<script lang="ts">
	import { CardWrapper } from '$lib/components/card';
	import { formatCurrency } from '$lib/utils/format';

	import type { StockListProps } from '../model';
	import StockPriceUpdater from './StockPriceUpdater.svelte';

	import { Edit2, Trash2 } from '@lucide/svelte';

	let { stocks, onEdit, onDelete, onPricesUpdate }: StockListProps = $props();

	/**
	 * 合計評価額を計算
	 */
	let totalValue = $derived(stocks.reduce((sum, stock) => sum + stock.value, 0));

	/**
	 * 合計損益を計算
	 */
	let totalProfitLoss = $derived(
		stocks.reduce((sum, stock) => {
			const profitLoss = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
			return sum + profitLoss;
		}, 0)
	);

	/**
	 * 削除確認
	 */
	function handleDelete(symbol: string, name: string) {
		if (confirm(`${name}（${symbol}）を削除してもよろしいですか？`)) {
			onDelete(symbol);
		}
	}
</script>

<div class="space-y-6">
	<!-- 株価更新ボタン -->
	{#if stocks.length > 0}
		<div class="flex justify-end">
			<StockPriceUpdater {stocks} {onPricesUpdate} updateInterval={0} />
		</div>
	{/if}

	<!-- 株式リスト -->
	{#if stocks.length === 0}
		<CardWrapper>
			<div class="py-12 text-center">
				<p class="text-gray-500">保有株式がありません</p>
				<p class="mt-2 text-sm text-gray-400">上のフォームから株式を追加してください</p>
			</div>
		</CardWrapper>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							銘柄
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							数量
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							購入単価
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							現在価格
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							評価額
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							損益
						</th>
						<th class="relative px-6 py-3">
							<span class="sr-only">操作</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each stocks as stock (stock.symbol)}
						{@const profitLoss = (stock.currentPrice - stock.purchasePrice) * stock.quantity}
						{@const profitLossPercent = (
							(stock.currentPrice / stock.purchasePrice - 1) *
							100
						).toFixed(2)}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap">
								<div>
									<div class="text-sm font-medium text-gray-900">{stock.name}</div>
									<div class="text-sm text-gray-500">{stock.symbol}</div>
								</div>
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
								{stock.quantity.toLocaleString()}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
								{formatCurrency(stock.purchasePrice)}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
								{formatCurrency(stock.currentPrice)}
							</td>
							<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-gray-900">
								{formatCurrency(stock.value)}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap">
								<div class={profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
									<div class="font-medium">{formatCurrency(profitLoss)}</div>
									<div class="text-xs">({profitLoss >= 0 ? '+' : ''}{profitLossPercent}%)</div>
								</div>
							</td>
							<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
								<div class="flex items-center justify-end gap-2">
									<button
										onclick={() => onEdit(stock)}
										class="text-blue-600 hover:text-blue-800"
										title="編集"
									>
										<Edit2 size={16} />
									</button>
									<button
										onclick={() => handleDelete(stock.symbol, stock.name)}
										class="text-red-600 hover:text-red-800"
										title="削除"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="bg-gray-50">
						<td colspan="4" class="px-6 py-4 text-sm font-medium text-gray-900">合計</td>
						<td class="px-6 py-4 text-right text-sm font-bold whitespace-nowrap text-gray-900">
							{formatCurrency(totalValue)}
						</td>
						<td class="px-6 py-4 text-right text-sm font-bold whitespace-nowrap">
							<div class={totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
								{formatCurrency(totalProfitLoss)}
							</div>
						</td>
						<td></td>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</div>
