<script lang="ts">
	import Card from '$shared/components/ui/Card.svelte';
	import { TrendingUp, TrendingDown } from '@lucide/svelte';
	import type { Portfolio } from '../model/types';

	interface Props {
		title: string;
		portfolio: Portfolio | null;
		loading?: boolean;
		error?: string | null;
		showTopHoldings?: boolean;
	}

	const {
		title,
		portfolio,
		loading = false,
		error = null,
		showTopHoldings = true
	}: Props = $props();

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(amount);
	}

	function formatPercentage(value: number): string {
		const sign = value >= 0 ? '+' : '';
		return `${sign}${value.toFixed(2)}%`;
	}
</script>

<Card>
	<div class="p-6">
		<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>

		{#if loading}
			<div class="mt-2 space-y-2">
				<div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
			</div>
		{:else if error}
			<div class="mt-2 text-red-500 text-sm">{error}</div>
		{:else if portfolio}
			<div class="mt-2">
				<div class="text-2xl font-bold text-gray-900 dark:text-white">
					{formatCurrency(portfolio.totalValue)}
				</div>

				{#if portfolio.dailyChange}
					<div class="mt-2 flex items-center text-sm">
						<span
							class={portfolio.dailyChange.percentage >= 0
								? 'text-green-600 dark:text-green-400'
								: 'text-red-600 dark:text-red-400'}
						>
							{#if portfolio.dailyChange.percentage >= 0}
								<TrendingUp size={16} class="inline-block mr-1" />
							{:else}
								<TrendingDown size={16} class="inline-block mr-1" />
							{/if}
							{formatCurrency(portfolio.dailyChange.amount)}
							({formatPercentage(portfolio.dailyChange.percentage)})
						</span>
						<span class="ml-2 text-gray-500 dark:text-gray-400">本日の損益</span>
					</div>
				{/if}

				{#if showTopHoldings && portfolio.topHoldings && portfolio.topHoldings.length > 0}
					<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
						<h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">保有銘柄TOP5</h4>
						<div class="space-y-2">
							{#each portfolio.topHoldings.slice(0, 5) as holding (holding.id)}
								<div class="flex justify-between items-center text-sm">
									<div class="flex-1">
										<span class="font-medium text-gray-900 dark:text-white">
											{holding.symbol}
										</span>
										<span class="ml-2 text-gray-500 dark:text-gray-400 text-xs">
											{holding.name}
										</span>
									</div>
									<div class="text-right">
										<div class="font-medium text-gray-900 dark:text-white">
											{formatCurrency(holding.value)}
										</div>
										<div
											class={holding.changePercentage >= 0
												? 'text-green-600 dark:text-green-400 text-xs'
												: 'text-red-600 dark:text-red-400 text-xs'}
										>
											{formatPercentage(holding.changePercentage)}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="mt-2 text-gray-500 dark:text-gray-400 text-sm">データがありません</div>
		{/if}
	</div>
</Card>
