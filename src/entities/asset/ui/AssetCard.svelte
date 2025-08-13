<script lang="ts">
	import Card from '$shared/components/ui/Card.svelte';
	import { TrendingUp, TrendingDown } from '@lucide/svelte';
	import type { TotalAssetsData } from '../model/types';

	interface Props {
		title: string;
		assetsData: TotalAssetsData | null;
		loading?: boolean;
		error?: string | null;
		showBreakdown?: boolean;
	}

	const {
		title,
		assetsData,
		loading = false,
		error = null,
		showBreakdown = true
	}: Props = $props();

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(amount);
	}

	function formatPercentage(value: number): string {
		const sign = value >= 0 ? '+' : '';
		return `${sign}${value.toFixed(1)}%`;
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
		{:else if assetsData}
			<div class="mt-2">
				<div class="text-2xl font-bold text-gray-900 dark:text-white">
					{formatCurrency(assetsData.total)}
				</div>

				{#if assetsData.previousMonthComparison}
					{@const comparison = assetsData.previousMonthComparison}
					<div class="mt-2 flex items-center text-sm">
						<span
							class={comparison.changePercentage >= 0
								? 'text-green-600 dark:text-green-400'
								: 'text-red-600 dark:text-red-400'}
						>
							{#if comparison.changePercentage >= 0}
								<TrendingUp size={16} class="inline-block mr-1" />
							{:else}
								<TrendingDown size={16} class="inline-block mr-1" />
							{/if}
							{formatPercentage(comparison.changePercentage)}
						</span>
						<span class="ml-2 text-gray-500 dark:text-gray-400">前月比</span>
					</div>
				{/if}

				{#if showBreakdown}
					<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-gray-500 dark:text-gray-400">現金</span>
							<span class="font-medium text-gray-900 dark:text-white">
								{formatCurrency(assetsData.cash)}
							</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-500 dark:text-gray-400">株式</span>
							<span class="font-medium text-gray-900 dark:text-white">
								{formatCurrency(assetsData.stocks)}
							</span>
						</div>
						{#if assetsData.bonds > 0}
							<div class="flex justify-between text-sm">
								<span class="text-gray-500 dark:text-gray-400">債券</span>
								<span class="font-medium text-gray-900 dark:text-white">
									{formatCurrency(assetsData.bonds)}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="mt-2 space-y-4">
				<div class="text-gray-500 dark:text-gray-400 text-sm">データがありません</div>
				<div class="pt-2">
					<a
						href="/stocks/add"
						class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 5v14" />
							<path d="m19 12-7 7-7-7" />
						</svg>
						株式を登録
					</a>
				</div>
			</div>
		{/if}
	</div>
</Card>
